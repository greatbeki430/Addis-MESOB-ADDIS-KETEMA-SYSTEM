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

// ✅ Use a valid Gemini model - gemini-1.5-flash is widely available
const MODEL = "gemini-1.5-flash"; // Available and supported for generateContent

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
    } else if (error.status === 404) {
      apiError.message = `Model "${MODEL}" not found. Please check the model name.`;
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
    return "I'm currently unable to connect to the AI service. Please try again later or contact your system administrator.";
  }

  const chatSystemPrompt = `${SYSTEM_CONTEXT}

You are the user-facing chatbot for this system. The current user is:
Name: ${userContext.name || "User"}
Role: ${userContext.role || "Employee"}
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
    console.log(
      `🤖 Chatbot: Processing message from ${userContext.name}: "${userMessage.substring(0, 50)}..."`,
    );

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
    const reply = response.text;

    console.log(`✅ Chatbot: Response sent (${reply.length} chars)`);
    return reply;
  } catch (error) {
    console.error("❌ Chatbot error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details || "No additional details",
    });

    // ✅ Check for specific error types and return appropriate messages
    if (
      error.message?.includes("API key") ||
      error.message?.includes("invalid")
    ) {
      return "I'm having trouble connecting to the AI service. Please contact your system administrator.";
    }

    if (
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes("rate limit")
    ) {
      return "The AI service is currently busy due to high demand. Please try again in a few minutes. If you need immediate help, please contact your team leader.";
    }

    if (error.status === 404) {
      return `The AI service is currently unavailable. Please contact your system administrator. (Model configuration issue)`;
    }

    if (error.status === 500) {
      return "The AI service is temporarily unavailable. Please try again later or contact support if the issue persists.";
    }

    // Generic fallback
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

  const prompt = `You are an AI assistant for the Ethiopian CRRSA (Civil Registration and Residency Service Agency) document management system.

Analyze this document image carefully. It is likely an Ethiopian government document (CRRSA document) such as:
- Birth Certificate (የልደት ምስክር ወረቀት)
- Death Certificate (የሞት ምስክር ወረቀት)
- Marriage Certificate (የጋብቻ ምስክር ወረቀት)
- Divorce Certificate (የፍቺ ምስክር ወረቀት)
- Residence ID (የኑሮ መታወቂያ)
- Name Change Certificate (የስም ለውጥ ምስክር ወረቀት)
- Registration Book (የምዝገባ መዝገብ)
- Circular (ክብ ደብዳቤ)
- Directive (መመሪያ)
- Correspondence (ደብዳቤ)
- Application Form (ማመልከቻ ቅጽ)

IMPORTANT RULES:
1. If this document is NOT a government/CRRSA document (e.g., business card, promotional material, personal photo, receipt, or any non-official document), you MUST:
   - Set documentType to "other"
   - Set confidence to "low"
   - Add a note explaining what the document appears to be (e.g., "This appears to be a business card for a digital solutions provider")

2. If this IS a CRRSA document, extract the following fields carefully from the text visible in the image:
   - Look for official stamps, seals, or government headers
   - Look for document numbers or reference numbers
   - Look for citizen names (both English and Amharic)
   - Look for dates (look for ዓ.ም. for Ethiopian calendar or Gregorian dates)
   - Look for issuing officer names and departments

Return ONLY a valid JSON object, no other text, no markdown fences, in exactly this shape:
{
  "documentType": "one of the document types listed above, or 'other'",
  "title": "a short descriptive title based on document content",
  "citizenName": "full name in English/Latin script if visible, else null",
  "citizenNameAmharic": "full name in Amharic/Ge'ez script if visible, else null",
  "issueDate": "date in YYYY-MM-DD format if found, else null",
  "issuingOfficer": "name or title of the issuing official if visible, else null",
  "issuingDepartment": "the department or office name if visible, else 'Civil Registry'",
  "nationalId": "any ID number or reference number visible, else null",
  "tags": ["relevant", "keywords", "from", "the", "document"],
  "notes": "one sentence describing what the document is, or why it's not recognized",
  "confidence": "high" | "medium" | "low"
}

BE HONEST about what you can see. If you're unsure, set confidence to "low".
Do not invent information that is not visible in the image.`;

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
      if (!jsonMatch) {
        return {
          confidence: "low",
          notes: "Could not parse AI response. Please fill in manually.",
          documentType: "other",
        };
      }
      const result = JSON.parse(jsonMatch[0]);

      // ✅ Ensure we always have a notes field
      if (!result.notes) {
        result.notes =
          result.documentType === "other"
            ? "Document type not recognized. Please verify."
            : "CRRSA document detected. Please review extracted fields.";
      }

      // ✅ Ensure confidence is set
      if (!result.confidence) {
        result.confidence = "low";
      }

      return result;
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError);
      return {
        confidence: "low",
        notes: "AI returned unparseable output. Please fill in manually.",
        documentType: "other",
      };
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
