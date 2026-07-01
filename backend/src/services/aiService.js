// backend/src/services/aiService.js
// Core AI Service — wraps Google Gemini API for all AI features in Addis MESOB System
// Used by: aiController.js, chatbotController.js, documentService.js
//
// ⚠️ Uses @google/genai (the actively maintained Google GenAI SDK), NOT the
// deprecated @google/generative-ai package. The deprecated SDK does not reliably
// support the newer "AQ." format API keys issued by AI Studio since mid-2026.

const { GoogleGenAI } = require("@google/genai");

// ✅ Better error handling for client initialization
let client;
let clientInitialized = false;

try {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY environment variable is NOT set!");
  } else {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    clientInitialized = true;
    console.log("✅ Gemini AI client initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize Gemini AI client:", error.message);
}

// ✅ Use a model with better free tier quotas
const MODEL = "gemini-2.0-flash-exp"; // Better free tier limits than gemini-2.5-flash

// ============================================================
// SYSTEM CONTEXT — tells Gemini what this system is
// ============================================================
const SYSTEM_CONTEXT = `You are an AI assistant embedded in the Addis MESOB Digital Management System,
a government service management platform for Addis Ababa city administration.

The system manages these CRRSA (Civil Registration and Residency Service Agency) departments:
Revenue (ገቢዎች), Civil Registry (ሲቪል ምዝገባ), Labor & Skills (ስራና ክህሎት),
Housing (ቤቶች), Traffic (ትራፊክ), Transport (አሽ/ተሽ), Investment (ኢንቨስትመንት),
Construction (ግንባታ), Land (መሬት), Planning (ፕላን).

Users include: employees, team leaders, admins, and superadmins.
The system tracks daily service reports, team evaluations, forum meetings, and documents.
You must respond in the same language the user writes in (Amharic or English).
Be concise, professional, and helpful.`;

// ============================================================
// HELPER — calls Gemini with a system instruction + single prompt
// ============================================================
const generateText = async (prompt, systemInstruction = SYSTEM_CONTEXT) => {
  // ✅ Check if client is initialized
  if (!clientInitialized || !client) {
    console.error("❌ Gemini client not available. Check GEMINI_API_KEY.");
    throw new Error(
      "AI service is not configured. Please contact system administrator.",
    );
  }

  try {
    console.log(`🤖 Calling Gemini API with model: ${MODEL}`);

    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction },
    });

    console.log("✅ Gemini API response received");
    return response.text;
  } catch (error) {
    console.error("❌ Gemini API error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details || "No additional details",
    });

    // ✅ Throw a more specific error with status code
    const apiError = new Error(error.message);
    apiError.status = error.status || 500;

    if (error.message?.includes("API key")) {
      apiError.message =
        "Invalid or missing Gemini API key. Please check your configuration.";
    } else if (error.status === 429) {
      apiError.message = "Gemini API quota exceeded. Please try again later.";
    } else if (error.status === 500) {
      apiError.message = "Gemini API service error. Please try again later.";
    }

    throw apiError;
  }
};

// ============================================================
// 1. GENERATE DAILY REPORT INSIGHT
// Called by: aiController → POST /api/ai/daily-insight
// ============================================================
const generateDailyInsight = async (reportData) => {
  const { date, entries, grandTotal, teamName } = reportData;

  const prompt = `Analyze this daily service report from ${teamName || "the team"} for ${date}:

Total customers served: ${grandTotal}
Service breakdown:
${entries.map((e) => `- ${e.dept} / ${e.service}: ${e.total} (${e.male}M / ${e.female}F)${e.notes ? ` — Note: ${e.notes}` : ""}`).join("\n")}

Please provide:
1. A 2-sentence executive summary of the day's performance
2. Top performing service/department
3. Any notable pattern or concern (if grandTotal is below 10, flag as low activity)
4. One actionable recommendation

Keep your response under 150 words and use plain text (no markdown).`;

  return generateText(prompt);
};

// ============================================================
// 2. GENERATE EVALUATION NARRATIVE
// Called by: aiController → POST /api/ai/evaluation-summary
// ============================================================
const generateEvaluationSummary = async (evaluationData) => {
  const { teamName, members, totalScores, comments, evaluatedBy, period } =
    evaluationData;

  const topScorer = totalScores?.reduce(
    (best, m) => (m.total > (best?.total || 0) ? m : best),
    null,
  );

  const prompt = `Generate a professional performance evaluation narrative for:
Team: ${teamName}
Evaluation Period: ${period || "current period"}
Evaluated By: ${evaluatedBy}
Members: ${members?.join(", ") || "N/A"}
Best Performer: ${topScorer?.member || "N/A"} (score: ${topScorer?.total || "N/A"})

Score summary:
${totalScores?.map((m) => `${m.member}: ${m.total} points`).join("\n") || "No scores provided"}

Comments summary:
${
  Object.entries(comments || {})
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n") || "No comments"
}

Write a 3-paragraph professional evaluation narrative:
1. Overall team performance overview
2. Strengths and best performer recognition
3. Areas for improvement and recommendations

Keep it under 200 words. Use professional government report tone.`;

  return generateText(prompt);
};

// ============================================================
// 3. GENERATE WEEKLY/MONTHLY DASHBOARD DIGEST
// Called by: aiController → POST /api/ai/dashboard-digest
// ============================================================
const generateDashboardDigest = async (stats) => {
  console.log("📊 Generating dashboard digest with stats:", stats);

  const prompt = `Generate a concise executive digest for the Addis MESOB system dashboard.

Stats summary:
- Total users: ${stats.totalUsers || 0}
- Active teams: ${stats.activeTeams || 0}
- Services logged this period: ${stats.totalServicesLogged || 0}
- Evaluations completed: ${stats.evaluationsCompleted || 0}
- Top department: ${stats.topDepartment || "N/A"}
- Period: ${stats.period || "this week"}

Write 2-3 short sentences (under 80 words) as a digest paragraph for the dashboard header.
Make it sound like a city government performance update. Plain text only.`;

  return generateText(prompt);
};

// ============================================================
// 4. GENERATE FORUM/MEETING MINUTES DRAFT
// Called by: aiController → POST /api/ai/meeting-minutes
// ============================================================
const generateMeetingMinutes = async (meetingData) => {
  const { title, date, attendees, agenda, notes } = meetingData;

  const prompt = `Format these raw meeting notes into official meeting minutes:

Meeting: ${title}
Date: ${date}
Attendees: ${attendees?.join(", ") || "Not specified"}
Agenda items: ${agenda || "Not provided"}
Raw notes: ${notes}

Format as:
MEETING MINUTES
Date: [date]
Attendees: [list]
---
AGENDA ITEMS & DECISIONS:
[bullet points from notes]
---
ACTION ITEMS:
[extract any tasks/deadlines mentioned]
---
NEXT MEETING: [if mentioned]

Keep it professional. Under 300 words.`;

  return generateText(prompt);
};

// ============================================================
// 5. CHATBOT CONVERSATION HANDLER
// Called by: chatbotController → POST /api/chatbot/message
// Input: Full conversation history + user message
// ============================================================
const handleChatMessage = async (
  conversationHistory,
  userMessage,
  userContext,
) => {
  // ✅ Check if client is initialized
  if (!clientInitialized || !client) {
    console.error("❌ Gemini client not available. Check GEMINI_API_KEY.");
    return "AI service is currently unavailable. Please contact your system administrator.";
  }

  const chatSystemPrompt = `${SYSTEM_CONTEXT}

You are the user-facing chatbot for this system. The current user is:
Name: ${userContext.name}
Role: ${userContext.role}
Team: ${userContext.team || "No team assigned"}

You can help with:
- Explaining how to use any part of the system
- Describing CRRSA services (give service name, department, and typical process)
- Answering questions about evaluations, reports, and daily logs
- Guiding navigation (e.g., "go to /services > Revenue to find TIN Registration")
- Answering in Amharic or English based on what the user writes

If asked about live data (e.g., "what are my scores?"), say you don't have real-time access but guide them to the right page.
Keep responses under 150 words. Be friendly and professional.`;

  try {
    // Build Gemini chat history — Gemini uses "model" instead of "assistant"
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
  } catch (error) {
    console.error("❌ Chatbot error:", error);
    return "I'm having trouble processing your request. Please try again later or contact support if the issue persists.";
  }
};

// ============================================================
// 6. DOCUMENT OCR TEXT EXTRACTION SUMMARY (for CRRSA vault)
// Called by: documentService → after Cloudinary upload
// ============================================================
const summarizeDocumentContent = async (documentText, documentType) => {
  // ✅ Check if client is initialized
  if (!clientInitialized || !client) {
    console.error("❌ Gemini client not available. Check GEMINI_API_KEY.");
    return {
      summary: "Document uploaded successfully. AI analysis unavailable.",
      extractedAt: new Date(),
    };
  }

  const prompt = `You are reviewing a scanned government document of type: "${documentType}".
Here is the extracted text content:

${documentText.substring(0, 2000)}

Please extract and return ONLY a JSON object with these fields:
1. referenceNumber — the document reference number (or null if not found)
2. citizenName — full name of the citizen/subject (or null if not found)
3. documentDate — date issued or date on document (or null if not found)
4. summary — key purpose or summary in 1 sentence

Return ONLY valid JSON like this, no other text:
{
  "referenceNumber": "...",
  "citizenName": "...",
  "documentDate": "...",
  "summary": "..."
}`;

  try {
    const text = await generateText(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? { ...JSON.parse(jsonMatch[0]), extractedAt: new Date() }
      : { summary: text, extractedAt: new Date() };
  } catch (error) {
    console.error("❌ Document summarization error:", error);
    return {
      summary: "Document uploaded successfully. AI analysis unavailable.",
      extractedAt: new Date(),
    };
  }
};

// ============================================================
// 7. ANALYZE DOCUMENT FILE (VISION) — for CRRSA vault upload form
// Called by: documentController → POST /api/documents/analyze
// Input: base64 file (image or PDF) + its mime type
// Reads the actual document using Gemini's vision capability and
// returns structured fields to auto-fill the upload form.
// ============================================================
const analyzeDocumentImage = async (base64File, mimeType) => {
  // ✅ Check if client is initialized
  if (!clientInitialized || !client) {
    console.error("❌ Gemini client not available. Check GEMINI_API_KEY.");
    return {
      confidence: "low",
      notes: "AI analysis unavailable. Please fill in the fields manually.",
      documentType: "other",
    };
  }

  const base64Data = base64File.includes(",")
    ? base64File.split(",")[1]
    : base64File;

  const prompt = `You are looking at a scanned government document (likely Ethiopian CRRSA — Civil
Registration and Residency Service Agency — paperwork, possibly in Amharic, English, or both).

Carefully read the document and extract the following fields. Use your best judgement based on
what's visually present — headers, stamps, handwriting, printed text, logos, etc.

Return ONLY a valid JSON object, no other text, no markdown fences, in exactly this shape:
{
  "documentType": one of ["birth_certificate","death_certificate","marriage_certificate","divorce_certificate","residence_id","name_change","registration_book","circular","directive","correspondence","application_form","other"],
  "title": "a short descriptive title, e.g. 'Birth Certificate – Abebe Kebede'",
  "citizenName": "full name in English/Latin script if present, else null",
  "citizenNameAmharic": "full name in Amharic script if present, else null",
  "issueDate": "date in YYYY-MM-DD format if found, else null",
  "issuingOfficer": "name or title of the issuing official if present, else null",
  "issuingDepartment": "the department or office name if present, else 'Civil Registry'",
  "nationalId": "any ID number visible, else null",
  "tags": ["short", "relevant", "keywords"],
  "notes": "one sentence describing the document's purpose or content",
  "confidence": "high" | "medium" | "low"
}

If the image is unclear, blank, or not a recognizable document, set documentType to "other",
leave uncertain fields as null, and set confidence to "low".`;

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

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { confidence: "low", notes: text };
      return JSON.parse(jsonMatch[0]);
    } catch {
      return { confidence: "low", notes: "AI returned unparseable output." };
    }
  } catch (error) {
    console.error("❌ Document analysis error:", error);
    return {
      confidence: "low",
      notes: "AI analysis failed. Please fill in the fields manually.",
      documentType: "other",
    };
  }
};

module.exports = {
  generateDailyInsight,
  generateEvaluationSummary,
  generateDashboardDigest,
  generateMeetingMinutes,
  handleChatMessage,
  summarizeDocumentContent,
  analyzeDocumentImage,
};
