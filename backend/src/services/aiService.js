// backend/src/services/aiService.js
// Core AI Service — wraps Google Gemini API for all AI features in Addis MESOB System
// Used by: aiController.js, chatbotController.js, documentService.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = "gemini-1.5-flash"; // free tier; switch to "gemini-1.5-pro" for better quality

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
// HELPER — creates a Gemini model instance with system context
// ============================================================
const getModel = (systemInstruction = SYSTEM_CONTEXT) => {
  return client.getGenerativeModel({
    model: MODEL,
    systemInstruction,
  });
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

  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
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

  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ============================================================
// 3. GENERATE WEEKLY/MONTHLY DASHBOARD DIGEST
// Called by: aiController → POST /api/ai/dashboard-digest
// ============================================================
const generateDashboardDigest = async (stats) => {
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

  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
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

  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
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

  const model = getModel(chatSystemPrompt);

  // Build Gemini chat history — Gemini uses "model" instead of "assistant"
  const history = conversationHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
};

// ============================================================
// 6. DOCUMENT OCR TEXT EXTRACTION SUMMARY (for CRRSA vault)
// Called by: documentService → after Cloudinary upload
// ============================================================
const summarizeDocumentContent = async (documentText, documentType) => {
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

  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? { ...JSON.parse(jsonMatch[0]), extractedAt: new Date() }
      : { summary: text, extractedAt: new Date() };
  } catch {
    return { summary: text, extractedAt: new Date() };
  }
};

module.exports = {
  generateDailyInsight,
  generateEvaluationSummary,
  generateDashboardDigest,
  generateMeetingMinutes,
  handleChatMessage,
  summarizeDocumentContent,
};
