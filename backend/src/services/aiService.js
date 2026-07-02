// backend/src/services/aiService.js
// Core AI Service — Addis MESOB Digital Management System
// Supports: Gemini (primary) → Groq (fallback 1) → Cohere (fallback 2)
// SDK: @google/genai, groq-sdk, cohere-ai (v2 chat API)

const { GoogleGenAI } = require("@google/genai");
const { Groq } = require("groq-sdk");
const { CohereClientV2 } = require("cohere-ai");

// ============================================================
// PROVIDER CONFIGURATION
// ============================================================
const PROVIDERS = {
  GEMINI: "gemini",
  GROQ: "groq",
  COHERE: "cohere",
};

// ============================================================
// CLIENT INITIALIZATION
// ============================================================

// ─── Gemini ────────────────────────────────────────────────────
let geminiClient = null;
let geminiInitialized = false;
const GEMINI_KEY = (process.env.GEMINI_API_KEY || "").trim();

if (!GEMINI_KEY) {
  console.error("[aiService] ❌ GEMINI_API_KEY is not set.");
} else {
  try {
    geminiClient = new GoogleGenAI({ apiKey: GEMINI_KEY });
    geminiInitialized = true;
    console.log(
      `[aiService] ✅ Gemini client initialized (${GEMINI_KEY.slice(0, 6)}...)`,
    );
  } catch (e) {
    console.error("[aiService] ❌ Gemini init failed:", e.message);
  }
}
const GEMINI_MODEL = "gemini-2.0-flash";

// ─── Groq ──────────────────────────────────────────────────────
let groqClient = null;
let groqInitialized = false;
const GROQ_KEY = (process.env.GROQ_API_KEY || "").trim();

if (!GROQ_KEY) {
  console.warn(
    "[aiService] ⚠️ GROQ_API_KEY is not set. Groq fallback disabled.",
  );
} else {
  try {
    groqClient = new Groq({ apiKey: GROQ_KEY });
    groqInitialized = true;
    console.log(
      `[aiService] ✅ Groq client initialized (${GROQ_KEY.slice(0, 6)}...)`,
    );
  } catch (e) {
    console.error("[aiService] ❌ Groq init failed:", e.message);
  }
}
// Updated to use the current stable Groq model
// llama-3.3-70b-versatile is DEPRECATED as of July 2026
const GROQ_MODEL = "llama-3.1-70b-versatile";

// ─── Cohere ────────────────────────────────────────────────────
// Cohere's Generate API (co.generate()) was retired Aug 26, 2025.
// We use the v2 Chat API via CohereClientV2 instead.
let cohereClient = null;
let cohereInitialized = false;
const COHERE_KEY = (process.env.COHERE_API_KEY || "").trim();

if (!COHERE_KEY) {
  console.warn(
    "[aiService] ⚠️ COHERE_API_KEY is not set. Cohere fallback disabled.",
  );
} else {
  try {
    cohereClient = new CohereClientV2({ token: COHERE_KEY });
    cohereInitialized = true;
    console.log(
      `[aiService] ✅ Cohere client initialized (${COHERE_KEY.slice(0, 6)}...)`,
    );
  } catch (e) {
    console.error("[aiService] ❌ Cohere init failed:", e.message);
  }
}
const COHERE_MODEL = "command-r-08-2024";

// ============================================================
// ERROR NORMALIZER
// ============================================================
const normalizeAIError = (err, provider = "unknown") => {
  const status =
    err?.status ?? err?.response?.status ?? err?.statusCode ?? null;
  const raw = err?.message ?? String(err);

  let code = "AI_UNKNOWN_ERROR";
  let message = raw;

  if (
    status === 401 ||
    status === 403 ||
    /API_KEY_INVALID|unauthe|invalid.*key|api.?key.*invalid|access.*denied/i.test(
      raw,
    )
  ) {
    code = "AI_AUTH_ERROR";
    message = `Authentication failed for ${provider}. Check your API key.`;
  } else if (
    status === 429 ||
    /RESOURCE_EXHAUSTED|rate.?limit|quota|too many requests/i.test(raw)
  ) {
    code = "AI_RATE_LIMIT";
    message = `Rate limit or quota exceeded for ${provider}.`;
  } else if (status === 404 || /model.*not.*found|404/i.test(raw)) {
    code = "AI_MODEL_NOT_FOUND";
    message = `Model not found for ${provider}.`;
  } else if (/network|ECONNRESET|ENOTFOUND|ETIMEDOUT|fetch.?fail/i.test(raw)) {
    code = "AI_NETWORK_ERROR";
    message = `Network error connecting to ${provider}.`;
  }

  const normalized = new Error(message);
  normalized.code = code;
  normalized.status = status;
  normalized.provider = provider;
  normalized.cause = err;
  return normalized;
};

// ============================================================
// SYSTEM CONTEXT
// ============================================================
const SYSTEM_CONTEXT = `You are an AI assistant embedded in an internal staff management tool used by
Addis MESOB -- the one-stop citizen service center for Addis Ketema Sub-City administration
in Addis Ababa, Ethiopia. Addis MESOB itself is the physical government service center (the
organization); the software you live inside is a separate internal tool its staff use to log
and manage that work. Do not describe the software itself as "Addis MESOB" -- refer to it as
"this system" / "the platform" unless the user has told you its actual product name.

If someone asks what Addis MESOB is, answer about the organization/service center itself
(a consolidated one-stop-shop where citizens handle multiple government services in one place),
not about this internal software. If someone asks what this system/platform/tool is, answer
about the software: an internal staff tool for logging daily service reports, team evaluations,
peer forum meetings, and civil registration documents. Keep the two answers clearly separate.

The tool manages these CRRSA (Civil Registration and Residency Service Agency) departments:
Revenue (ገቢዎች), Civil Registry (ሲቪል ምዝገባ), Labor & Skills (ስራና ክህሎት),
Housing (ቤቶች), Traffic (ትራፊክ), Transport (አሽ/ተሽ), Investment (ኢንቨስትመንት),
Construction (ግንባታ), Land (መሬት), Planning (ፕላን).

Users include: employees, team leaders, admins, and superadmins.
Always respond in the same language the user writes in (Amharic or English).
Be concise, professional, and helpful. For Amharic, use proper Ethiopic script.`;

// ============================================================
// PROVIDER CALLERS
// ============================================================

// ─── Gemini Caller ────────────────────────────────────────────
const callGemini = async (
  prompt,
  systemInstruction = SYSTEM_CONTEXT,
  history = [],
) => {
  if (!geminiInitialized || !geminiClient) {
    throw new Error("Gemini client not initialized");
  }

  try {
    const geminiHistory = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = geminiClient.chats.create({
      model: GEMINI_MODEL,
      config: { systemInstruction },
      history: geminiHistory,
    });

    const response = await chat.sendMessage({ message: prompt });
    return { text: response.text, provider: PROVIDERS.GEMINI };
  } catch (err) {
    throw normalizeAIError(err, PROVIDERS.GEMINI);
  }
};

// ─── Groq Caller ──────────────────────────────────────────────
const callGroq = async (
  prompt,
  systemInstruction = SYSTEM_CONTEXT,
  history = [],
) => {
  if (!groqInitialized || !groqClient) {
    throw new Error("Groq client not initialized");
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        ...history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });
    return {
      text: response.choices[0]?.message?.content || "",
      provider: PROVIDERS.GROQ,
    };
  } catch (err) {
    throw normalizeAIError(err, PROVIDERS.GROQ);
  }
};

// ─── Cohere Caller (v2 Chat API) ───────────────────────────────
const callCohere = async (
  prompt,
  systemInstruction = SYSTEM_CONTEXT,
  history = [],
) => {
  if (!cohereInitialized || !cohereClient) {
    throw new Error("Cohere client not initialized");
  }

  try {
    const response = await cohereClient.chat({
      model: COHERE_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        ...history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: prompt },
      ],
    });
    const text = response?.message?.content?.[0]?.text || "";
    return { text, provider: PROVIDERS.COHERE };
  } catch (err) {
    throw normalizeAIError(err, PROVIDERS.COHERE);
  }
};

// ============================================================
// MAIN GENERATE TEXT — Auto-fallback chain
// ============================================================
const generateText = async (
  prompt,
  systemInstruction = SYSTEM_CONTEXT,
  history = [],
) => {
  const callers = [
    {
      name: PROVIDERS.GEMINI,
      ready: geminiInitialized && geminiClient,
      fn: callGemini,
    },
    {
      name: PROVIDERS.GROQ,
      ready: groqInitialized && groqClient,
      fn: callGroq,
    },
    {
      name: PROVIDERS.COHERE,
      ready: cohereInitialized && cohereClient,
      fn: callCohere,
    },
  ];

  const errors = [];
  let lastError = null;

  for (const provider of callers) {
    if (!provider.ready) continue;

    try {
      const result = await provider.fn(prompt, systemInstruction, history);
      if (errors.length > 0) {
        console.log(
          `[aiService] ✅ Used ${result.provider} (fallback after ${errors.length} failure(s))`,
        );
      } else {
        console.log(`[aiService] ✅ Used ${result.provider}`);
      }
      return result.text;
    } catch (err) {
      console.warn(
        `[aiService] ⚠️ ${provider.name} failed: ${err.code || "unknown"} - ${err.message}`,
      );
      errors.push({ provider: provider.name, error: err });
      lastError = err;
    }
  }

  console.error(
    "[aiService] ❌ All providers failed. Errors:",
    errors.map((e) => `${e.provider}:${e.error.code}`),
  );
  const finalError = new Error(
    `All AI providers failed. Last error: ${lastError?.message || "Unknown"}`,
  );
  finalError.code = "ALL_PROVIDERS_FAILED";
  finalError.errors = errors;
  throw finalError;
};

// ============================================================
// 1. DAILY REPORT INSIGHT
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
// ============================================================
const handleChatMessage = async (
  conversationHistory,
  userMessage,
  userContext,
) => {
  if (!geminiInitialized && !groqInitialized && !cohereInitialized) {
    return "I'm currently unable to connect to any AI service. Please try again later or contact your system administrator.";
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
    const history = (conversationHistory || []).slice(-10).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const result = await generateText(userMessage, chatSystemPrompt, history);
    return result;
  } catch (err) {
    console.error("[aiService] chatbot failed:", err.message);

    if (err.code === "AI_AUTH_ERROR") {
      return "I'm unable to process requests right now due to an authentication issue. Please contact your system administrator.";
    }
    if (err.code === "AI_RATE_LIMIT") {
      return "The AI service is currently busy. Please try again in a few minutes.";
    }
    if (err.code === "ALL_PROVIDERS_FAILED") {
      return "All AI services are currently unavailable. Please try again later or contact support.";
    }
    return "I'm having trouble processing your request. Please try again.";
  }
};

// ============================================================
// 6. DOCUMENT OCR SUMMARY
// ============================================================
const summarizeDocumentContent = async (documentText, documentType) => {
  if (!geminiInitialized && !groqInitialized && !cohereInitialized) {
    return {
      summary: "Document uploaded. No AI service available.",
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
// 7. DOCUMENT VISION ANALYSIS (FIXED FOR ETHIOPIAN DOCUMENTS)
// ============================================================
const analyzeDocumentImage = async (base64File, mimeType) => {
  if (!geminiInitialized) {
    return {
      confidence: "low",
      notes: "AI vision analysis unavailable. Fill fields manually.",
      documentType: "other",
    };
  }

  const base64Data = base64File.includes(",")
    ? base64File.split(",")[1]
    : base64File;

  const prompt = `You are an AI assistant for the Ethiopian CRRSA (Civil Registration and Residency Service Agency) document management system.

You are analyzing an Ethiopian government document. This is likely a Vital Event Registration document from Ethiopia.

IMPORTANT: These are the types of documents you may see:
- Birth Certificate (የልደት ምስክር ወረቀት) — Look for "የልደት ምስክር ወረቀት" or "Birth Certificate"
- Death Certificate (የሞት ምስክር ወረቀት) — Look for "የሞት ምስክር ወረቀት" or "Death Certificate"
- Marriage Certificate (የጋብቻ ምስክር ወረቀት) — Look for "የጋብቻ ምስክር ወረቀት" or "Marriage Certificate"
- Residence ID (የኑሮ መታወቂያ) — Look for "የኑሮ መታወቂያ" or "Residence ID"

Look for these Ethiopian government document markers:
- "በኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ" (Federal Democratic Republic of Ethiopia)
- "የልደት ምስክር ወረቀት" (Birth Certificate)
- "የሞት ምስክር ወረቀት" (Death Certificate)
- "የጋብቻ ምስክር ወረቀት" (Marriage Certificate)
- "የኑሮ መታወቂያ" (Residence ID)
- Official stamps, seals, or government headers
- "AABI No" or "ተ.ቁ" (document number)

For Ethiopian Birth Certificates specifically, look for:
- Child's name (የህፃኑ ስም / Child's Name)
- Father's name (የአባት ስም / Father's Name)
- Mother's name (የእናት ስም / Mother's Name)
- Date of Birth (የትውልድ ቀን / Date of Birth)
- Place of Birth (የትውልድ ቦታ / Place of Birth)
- Registration number (AABI No / ተ.ቁ)

Extract all visible information and return ONLY valid JSON (no markdown fences):

{
  "documentType": "birth_certificate|death_certificate|marriage_certificate|divorce_certificate|residence_id|name_change|registration_book|circular|directive|correspondence|application_form|other",
  "title": "descriptive title",
  "citizenName": "Name of the person (look for Child's Name or Citizen Name in English)",
  "citizenNameAmharic": "Name in Amharic script if visible",
  "issueDate": "Date in YYYY-MM-DD format (look for Certificate issued date / የምስክር ወረቀት የተሰጠበት)",
  "issuingOfficer": "Name of issuing officer (look for Full Name of the Officer of Civil Status / የክብር መዝገብ ሽም መሉ ስም)",
  "issuingDepartment": "Civil Registry (ሲቪል ምዝገባ)",
  "nationalId": "Document number (look for AABI No / ተ.ቁ)",
  "tags": ["ethiopian", "vital", "registration", "crrsa", "document"],
  "notes": "one sentence describing the document",
  "confidence": "high|medium|low"
}

If this is clearly a birth certificate with the Ethiopian government header, set documentType to "birth_certificate" and confidence to "high" even if some fields are missing.
If you see "የልደት ምስክር ወረቀት" or "Birth Certificate" in the document, it's a birth certificate.
If not recognizable, set documentType to "other", uncertain fields to null, confidence to "low".`;

  try {
    const response = await geminiClient.models.generateContent({
      model: GEMINI_MODEL,
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

    // ✅ Ensure confidence is set
    if (!result.confidence) result.confidence = "low";

    // ✅ If it's a birth certificate, set confidence higher
    if (result.documentType === "birth_certificate") {
      result.confidence = "high";
      if (!result.notes) {
        result.notes = "Ethiopian Birth Certificate detected.";
      }
    }

    if (!result.notes)
      result.notes =
        result.documentType === "other"
          ? "Document type not recognized."
          : "CRRSA document detected.";

    return result;
  } catch (err) {
    const normalized = normalizeAIError(err, PROVIDERS.GEMINI);
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
