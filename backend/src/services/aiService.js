// backend/src/services/aiService.js
// Core AI Service — Addis MESOB Digital Management System
// SDK: @google/genai (active, not deprecated)
// Model: gemini-2.5-flash (current free-tier model as of mid-2026)

const { GoogleGenAI } = require("@google/genai");

// ============================================================
// CLIENT INITIALIZATION + KEY VALIDATION
// ============================================================
const RAW_KEY = (process.env.GEMINI_API_KEY || "").trim();

// Gemini keys from AI Studio always start with "AIza".
// Keys starting with "AQ." are OAuth access tokens — they look like API keys
// but are rejected with 401 by every Gemini endpoint. If you see this warning
// on startup, go to https://aistudio.google.com/app/apikey, create a fresh
// API key (it will start with "AIza"), and update GEMINI_API_KEY in Railway.
const looksValid = /^AIza[0-9A-Za-z_-]{20,}$/.test(RAW_KEY);

let client = null;
let clientInitialized = false;

if (!RAW_KEY) {
  console.error(
    "[aiService] ❌ GEMINI_API_KEY is not set. All AI endpoints will return errors.",
  );
} else if (!looksValid) {
  console.warn(
    `[aiService] ⚠️  GEMINI_API_KEY does not look like a valid Gemini API key.\n` +
      `  Current key prefix: "${RAW_KEY.slice(0, 6)}..."\n` +
      `  Valid Gemini keys start with "AIza". Keys starting with "AQ." are OAuth tokens, not API keys.\n` +
      `  Fix: go to https://aistudio.google.com/app/apikey → Create API key → copy the AIza... value → update Railway Variables.`,
  );
  // Still try to initialize — in case Google changes their key format in future
  try {
    client = new GoogleGenAI({ apiKey: RAW_KEY });
    clientInitialized = true;
  } catch (e) {
    console.error("[aiService] ❌ Client init failed:", e.message);
  }
} else {
  try {
    client = new GoogleGenAI({ apiKey: RAW_KEY });
    clientInitialized = true;
    console.log(
      "[aiService] ✅ Gemini AI client initialized (key looks valid).",
    );
  } catch (e) {
    console.error("[aiService] ❌ Client init failed:", e.message);
  }
}

// gemini-2.5-flash is the current recommended free-tier model.
// gemini-2.0-flash also works but is an older generation.
// Do NOT use gemini-1.5-flash — it was deprecated and returns 404.
const MODEL = "gemini-2.5-flash";

// ============================================================
// ERROR NORMALIZER
// Every SDK call goes through this so callers always get a structured
// error with a machine-readable `code` and a human-readable `message`
// that actually explains what went wrong (instead of generic "AI error").
// ============================================================
const normalizeAIError = (err) => {
  const status = err?.status ?? err?.response?.status ?? null;
  const raw = err?.message ?? String(err);

  let code = "AI_UNKNOWN_ERROR";
  let message = raw;

  if (
    status === 401 ||
    status === 403 ||
    /API_KEY_INVALID|unauthe|invalid.*key|api.?key.*invalid/i.test(raw)
  ) {
    code = "AI_AUTH_ERROR";
    message =
      "Gemini API rejected the request: authentication failed. " +
      "The GEMINI_API_KEY in Railway is likely an OAuth token (starts with AQ.) instead of a real API key (starts with AIza). " +
      "Go to https://aistudio.google.com/app/apikey, generate a new API key, and update the Railway variable.";
  } else if (
    status === 429 ||
    /RESOURCE_EXHAUSTED|rate.?limit|quota/i.test(raw)
  ) {
    code = "AI_RATE_LIMIT";
    message =
      "Gemini API rate limit or quota exceeded. Wait a moment then try again.";
  } else if (status === 404 || /model.*not.*found|404/i.test(raw)) {
    code = "AI_MODEL_NOT_FOUND";
    message = `Gemini model "${MODEL}" not found. The model name may have changed — update MODEL in aiService.js.`;
  } else if (/network|ECONNRESET|ENOTFOUND|ETIMEDOUT|fetch.?fail/i.test(raw)) {
    code = "AI_NETWORK_ERROR";
    message =
      "Could not reach the Gemini API. Check Railway's internet access or Gemini status at https://status.cloud.google.com.";
  }

  const normalized = new Error(message);
  normalized.code = code;
  normalized.status = status;
  normalized.cause = err;
  return normalized;
};

// ============================================================
// SYSTEM CONTEXT — identity + domain knowledge for every prompt
// ============================================================
const SYSTEM_CONTEXT = `You are an AI assistant embedded in the Addis MESOB Digital Management System,
a government service management platform for Addis Ketema Sub-City administration in Addis Ababa, Ethiopia.

The system manages these CRRSA (Civil Registration and Residency Service Agency) departments:
Revenue (ገቢዎች), Civil Registry (ሲቪል ምዝገባ), Labor & Skills (ስራና ክህሎት),
Housing (ቤቶች), Traffic (ትራፊክ), Transport (አሽ/ተሽ), Investment (ኢንቨስትመንት),
Construction (ግንባታ), Land (መሬት), Planning (ፕላን).

Users include: employees, team leaders, admins, and superadmins.
The system tracks daily service reports, team evaluations, peer forum meetings, and civil registration documents.
Always respond in the same language the user writes in (Amharic or English).
Be concise, professional, and helpful. For Amharic, use proper Ethiopic script.`;

// ============================================================
// HELPER — single-turn text generation with error normalization
// ============================================================
const generateText = async (prompt, systemInstruction = SYSTEM_CONTEXT) => {
  if (!clientInitialized || !client) {
    const err = new Error(
      "AI service is not configured (missing or invalid GEMINI_API_KEY). Contact system administrator.",
    );
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction },
    });
    return response.text;
  } catch (err) {
    const normalized = normalizeAIError(err);
    console.error(
      `[aiService] generateText failed [${normalized.code}]:`,
      normalized.message,
    );
    throw normalized;
  }
};

// ============================================================
// 1. DAILY REPORT INSIGHT
// POST /api/ai/daily-insight
// ============================================================
const generateDailyInsight = async (reportData) => {
  const { date, entries, grandTotal, teamName } = reportData;

  const prompt = `Analyze this daily service report from ${teamName || "the team"} for ${date}:

Total customers served: ${grandTotal}
Service breakdown:
${entries.map((e) => `- ${e.dept} / ${e.service}: ${e.total} (${e.male}M / ${e.female}F)${e.notes ? ` — Note: ${e.notes}` : ""}`).join("\n")}

Provide:
1. 2-sentence executive summary of the day's performance
2. Top performing service/department
3. Any notable pattern or concern (flag if grandTotal < 10 as low activity)
4. One actionable recommendation for tomorrow

Under 150 words, plain text only.`;

  return generateText(prompt);
};

// ============================================================
// 2. EVALUATION NARRATIVE
// POST /api/ai/evaluation-summary
// ============================================================
const generateEvaluationSummary = async (evaluationData) => {
  const { teamName, members, totalScores, comments, evaluatedBy, period } =
    evaluationData;
  const topScorer = totalScores?.reduce(
    (best, m) => (m.total > (best?.total || 0) ? m : best),
    null,
  );

  const prompt = `Write a professional performance evaluation narrative:
Team: ${teamName}
Period: ${period || "current period"}
Evaluated By: ${evaluatedBy}
Members: ${members?.join(", ") || "N/A"}
Best Performer: ${topScorer?.member || topScorer?.name || "N/A"} (${topScorer?.total || "N/A"} pts)

Scores:
${totalScores?.map((m) => `${m.member || m.name}: ${m.total} points`).join("\n") || "No scores"}

Comments:
${
  Object.entries(comments || {})
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n") || "No comments"
}

Write 3 paragraphs:
1. Overall team performance overview
2. Strengths and best performer recognition
3. Areas for improvement and recommendations

Under 200 words. Professional government report tone.`;

  return generateText(prompt);
};

// ============================================================
// 3. DASHBOARD DIGEST
// POST /api/ai/dashboard-digest
// ============================================================
const generateDashboardDigest = async (stats) => {
  const prompt = `Generate a concise executive digest for Addis MESOB system dashboard.

Stats:
- Total users: ${stats.totalUsers || 0}
- Active teams: ${stats.activeTeams || 0}
- Services logged: ${stats.totalServicesLogged || 0}
- Evaluations completed: ${stats.evaluationsCompleted || 0}
- Top department: ${stats.topDepartment || "N/A"}
- Period: ${stats.period || "this week"}

Write 2-3 sentences (under 80 words) as a digest paragraph.
Sound like a city government performance update. Plain text only.`;

  return generateText(prompt);
};

// ============================================================
// 4. MEETING MINUTES
// POST /api/ai/meeting-minutes
// ============================================================
const generateMeetingMinutes = async (meetingData) => {
  const { title, date, attendees, agenda, notes } = meetingData;

  const prompt = `Format these raw meeting notes into official meeting minutes:

Meeting: ${title}
Date: ${date}
Attendees: ${attendees?.join(", ") || "Not specified"}
Agenda: ${agenda || "Not provided"}
Raw notes: ${notes}

Format as:
MEETING MINUTES
Date: [date]
Attendees: [list]
---
AGENDA ITEMS & DECISIONS:
[bullet points]
---
ACTION ITEMS:
[tasks/deadlines]
---
NEXT MEETING: [if mentioned]

Professional tone. Under 300 words.`;

  return generateText(prompt);
};

// ============================================================
// 5. CHATBOT CONVERSATION HANDLER
// POST /api/chatbot/message
// Returns a friendly string on error (never throws) so the chatbot
// always gives the user a response rather than a blank error.
// ============================================================
const handleChatMessage = async (
  conversationHistory,
  userMessage,
  userContext,
) => {
  if (!clientInitialized || !client) {
    return "I'm currently unable to connect to the AI service. Please try again later or contact your system administrator.";
  }

  const chatSystemPrompt = `${SYSTEM_CONTEXT}

You are the user-facing assistant chatbot. Current user:
Name: ${userContext.name || "User"}
Role: ${userContext.role || "Employee"}
Team: ${userContext.team || "No team assigned"}

You can help with:
- Explaining how to use any part of the system (Dashboard, Daily Reports, Evaluation, Forum, Services, Document Vault)
- Describing CRRSA departments and their services in detail
- Guiding navigation: tell the user exactly which menu item or path to use
- Answering questions about evaluations, reports, daily logs, and documents
- Explaining what each evaluation criterion means
- Answering in Amharic or English — always match the user's language
- Providing tips and best practices for government service delivery

System pages:
- /dashboard: Overview stats, AI digest, department performance charts
- /forum: Peer Forum Report — fill attendance, topics, agreements, gaps
- /evaluation: Score team members on 5 criteria, view rankings, export PDF
- /report: Daily Report — log daily services per department
- /services: Browse all CRRSA service catalogue
- /analytics: Generate Excel/PDF/Word reports by period
- /documents: CRRSA Document Vault — upload, search, download official documents
- /users: User management (admin only)
- /teams: Team management (superadmin only)

If asked about live data, guide them to the correct page. Keep responses under 200 words.`;

  try {
    const history = conversationHistory.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = client.chats.create({
      model: MODEL,
      config: { systemInstruction: chatSystemPrompt },
      history,
    });

    const response = await chat.sendMessage({ message: userMessage });
    return response.text;
  } catch (err) {
    const normalized = normalizeAIError(err);
    console.error(
      `[aiService] chatbot failed [${normalized.code}]:`,
      normalized.message,
    );

    // Return a user-friendly string so the chatbot always shows something
    if (normalized.code === "AI_AUTH_ERROR") {
      return "I'm unable to process requests right now due to an authentication issue with the AI service. Please contact your system administrator.";
    }
    if (normalized.code === "AI_RATE_LIMIT") {
      return "The AI service is currently busy. Please try again in a few minutes.";
    }
    if (normalized.code === "AI_MODEL_NOT_FOUND") {
      return "AI model configuration error. Please contact your system administrator.";
    }
    return "I'm having trouble processing your request. Please try again.";
  }
};

// ============================================================
// 6. DOCUMENT OCR SUMMARY
// Called after Cloudinary upload
// ============================================================
const summarizeDocumentContent = async (documentText, documentType) => {
  if (!clientInitialized || !client) {
    return {
      summary: "Document uploaded. AI analysis unavailable.",
      extractedAt: new Date(),
    };
  }

  const prompt = `Review this scanned government document of type: "${documentType}".
Extracted text: ${documentText.substring(0, 2000)}

Return ONLY valid JSON (no markdown):
{
  "referenceNumber": "...",
  "citizenName": "...",
  "documentDate": "...",
  "summary": "one sentence"
}
Use null for missing fields.`;

  try {
    const text = await generateText(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? { ...JSON.parse(jsonMatch[0]), extractedAt: new Date() }
      : { summary: text, extractedAt: new Date() };
  } catch {
    return {
      summary: "Document uploaded. AI analysis unavailable.",
      extractedAt: new Date(),
    };
  }
};

// ============================================================
// 7. DOCUMENT VISION ANALYSIS (auto-fill upload form)
// POST /api/documents/analyze
// ============================================================
const analyzeDocumentImage = async (base64File, mimeType) => {
  if (!clientInitialized || !client) {
    return {
      confidence: "low",
      notes: "AI analysis unavailable. Fill fields manually.",
      documentType: "other",
    };
  }

  const base64Data = base64File.includes(",")
    ? base64File.split(",")[1]
    : base64File;

  const prompt = `You are analyzing an Ethiopian CRRSA government document.

Look at this document image carefully. It may be:
- Birth/Death/Marriage/Divorce Certificate
- Residence ID, Name Change, Registration Book
- Circular, Directive, Correspondence, Application Form

Extract all visible information and return ONLY valid JSON (no markdown fences):
{
  "documentType": "birth_certificate|death_certificate|marriage_certificate|divorce_certificate|residence_id|name_change|registration_book|circular|directive|correspondence|application_form|other",
  "title": "descriptive title",
  "citizenName": "English name or null",
  "citizenNameAmharic": "Amharic name or null",
  "issueDate": "YYYY-MM-DD or null",
  "issuingOfficer": "officer name or null",
  "issuingDepartment": "department name or Civil Registry",
  "nationalId": "ID number or null",
  "tags": ["keyword1", "keyword2"],
  "notes": "one sentence describing the document",
  "confidence": "high|medium|low"
}

If not recognizable: set documentType to "other", uncertain fields to null, confidence to "low".`;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
      config: { systemInstruction: SYSTEM_CONTEXT },
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      return {
        confidence: "low",
        notes: "Could not parse AI response.",
        documentType: "other",
      };

    const result = JSON.parse(jsonMatch[0]);
    if (!result.notes)
      result.notes =
        result.documentType === "other"
          ? "Document type not recognized."
          : "CRRSA document detected.";
    if (!result.confidence) result.confidence = "low";
    return result;
  } catch (err) {
    const normalized = normalizeAIError(err);
    console.error(
      `[aiService] analyzeDocumentImage failed [${normalized.code}]:`,
      normalized.message,
    );
    return {
      confidence: "low",
      notes: "AI analysis failed. Please fill fields manually.",
      documentType: "other",
    };
  }
};

// ============================================================
// 8. SMART SERVICE RECOMMENDATIONS
// POST /api/ai/service-recommendations
// ============================================================
const generateServiceRecommendations = async (query, availableServices) => {
  const serviceList = availableServices
    .slice(0, 50)
    .map((s) => `- ${s.nameEn || s.name} (${s.deptEn || s.dept})`)
    .join("\n");

  const prompt = `A citizen is asking: "${query}"

Available CRRSA services:
${serviceList || "- No services currently in database"}

Recommend the most relevant 3-5 services for this citizen.
Return ONLY valid JSON (no markdown):
{
  "recommendations": [
    {
      "serviceName": "exact service name from the list",
      "department": "department name",
      "reason": "one sentence why this service is relevant",
      "priority": "high|medium|low"
    }
  ],
  "summary": "one sentence guidance for the citizen"
}`;

  return generateText(prompt);
};

// ============================================================
// 9. PERFORMANCE TREND ANALYSIS
// POST /api/ai/performance-trend
// ============================================================
const generatePerformanceTrend = async (reportsArray, teamName) => {
  const reportSummary = reportsArray
    .slice(0, 30)
    .map(
      (r) =>
        `${r.date}: ${r.grandTotal} services, top dept: ${r.entries?.sort((a, b) => b.total - a.total)[0]?.dept || "N/A"}`,
    )
    .join("\n");

  const prompt = `Analyze performance trends for ${teamName || "this team"} over ${reportsArray.length} reports:

${reportSummary}

Provide:
1. Overall trend (improving/declining/stable) with specific evidence
2. Best and worst performing days/periods
3. Department or service that consistently leads
4. Any concerning patterns (e.g., consistent drops on certain days)
5. Three specific recommendations to improve performance

Under 250 words. Plain text, no markdown.`;

  return generateText(prompt);
};

// ============================================================
// 10. CITIZEN COMPLAINT CATEGORIZER
// POST /api/ai/categorize-complaint
// ============================================================
const categorizeComplaint = async (complaintText) => {
  const prompt = `A citizen submitted this complaint/feedback to Addis Ketema sub-city CRRSA office:

"${complaintText}"

Analyze and return ONLY valid JSON (no markdown):
{
  "category": "service_delay|staff_conduct|document_error|facility_issue|process_unclear|other",
  "severity": "high|medium|low",
  "department": "most likely responsible department or null",
  "suggestedResponse": "professional response draft in 2-3 sentences",
  "actionRequired": "specific action the office should take",
  "estimatedResolutionDays": 3
}`;

  const text = await generateText(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch
    ? JSON.parse(jsonMatch[0])
    : { category: "other", severity: "medium", suggestedResponse: text };
};

// ============================================================
// 11. AMHARIC / ENGLISH TRANSLATION
// POST /api/ai/translate
// ============================================================
const translateContent = async (text, targetLanguage) => {
  const prompt = `Translate the following text to ${targetLanguage === "am" ? "Amharic (አማርኛ)" : "English"}.
This is government/administrative content for Addis Ketema sub-city CRRSA services.
Maintain formal, professional tone appropriate for government documents.

Text to translate: "${text}"

Return ONLY the translated text, nothing else.`;

  return generateText(prompt);
};

// ============================================================
// 12. SMART REPORT TITLE GENERATOR
// POST /api/ai/generate-title
// ============================================================
const generateReportTitle = async (reportContext) => {
  const { type, period, teamName, highlights } = reportContext;

  const prompt = `Generate a professional government report title for:
Report Type: ${type}
Period: ${period}
Team: ${teamName || "Addis Ketema CRRSA"}
Key highlights: ${highlights || "standard performance report"}

Generate 3 title options in this JSON format (no markdown):
{
  "titles": [
    {"en": "English title", "am": "Amharic title"},
    {"en": "English title 2", "am": "Amharic title 2"},
    {"en": "English title 3", "am": "Amharic title 3"}
  ],
  "recommended": 0
}`;

  const text = await generateText(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch
    ? JSON.parse(jsonMatch[0])
    : {
        titles: [
          { en: `${type} Report — ${period}`, am: `${type} ሪፖርት — ${period}` },
        ],
        recommended: 0,
      };
};

module.exports = {
  generateDailyInsight,
  generateEvaluationSummary,
  generateDashboardDigest,
  generateMeetingMinutes,
  handleChatMessage,
  summarizeDocumentContent,
  analyzeDocumentImage,
  generateServiceRecommendations,
  generatePerformanceTrend,
  categorizeComplaint,
  translateContent,
  generateReportTitle,
};
