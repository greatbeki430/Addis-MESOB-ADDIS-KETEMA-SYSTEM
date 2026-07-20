// backend/src/services/aiService.js
// Core AI Service — internal staff tool for Addis MESOB
// Supports: Gemini (primary) → Groq (fallback 1) → Cohere (fallback 2) → DeepSeek (fallback 3)
// SDK: @google/genai, groq-sdk, cohere-ai (v2 chat API), DeepSeek via plain fetch (OpenAI-compatible)

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
  DEEPSEEK: "deepseek",
};

// ============================================================
// SMALL UTILITY — hard timeout wrapper
// Used so a slow/hanging provider call fails fast with a proper
// JSON error response instead of hanging until the platform's own
// proxy kills the connection with zero response bytes (which shows
// up in the browser as a misleading "CORS blocked" error).
// ============================================================
const withTimeout = (promise, ms, label = "AI request") => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = "AI_TIMEOUT";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() =>
    clearTimeout(timeoutId),
  );
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
// llama-3.1-70b-versatile was decommissioned Jan 2025.
// llama-3.3-70b-versatile (its replacement) was ALSO deprecated by
// Groq on June 17, 2026. openai/gpt-oss-120b is Groq's official
// recommended replacement for both — see console.groq.com/docs/deprecations
const GROQ_MODEL = "openai/gpt-oss-120b";
// Vision-capable Groq model, used ONLY as a fallback for document image
// analysis (analyzeDocumentImage). GROQ_MODEL above is text-only and
// cannot be used for image input.
// NOTE: verify this model ID is still current at console.groq.com/docs/models
// before relying on it — Groq deprecates model IDs over time (see note above).
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

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

// ─── DeepSeek ──────────────────────────────────────────────────
// DeepSeek's API is OpenAI-compatible, so we call it with plain fetch
// (Node 18+ has fetch built in) instead of pulling in another SDK.
// NOTE: DeepSeek is NOT free — it's pay-as-you-go, though very cheap.
// Check current pricing at https://platform.deepseek.com before relying
// on it heavily in production.
let deepseekInitialized = false;
const DEEPSEEK_KEY = (process.env.DEEPSEEK_API_KEY || "").trim();
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

if (!DEEPSEEK_KEY) {
  console.warn(
    "[aiService] ⚠️ DEEPSEEK_API_KEY is not set. DeepSeek fallback disabled.",
  );
} else {
  deepseekInitialized = true;
  console.log(
    `[aiService] ✅ DeepSeek configured (${DEEPSEEK_KEY.slice(0, 6)}...)`,
  );
}

// ============================================================
// ERROR NORMALIZER
// ============================================================
const normalizeAIError = (err, provider = "unknown") => {
  const status =
    err?.status ?? err?.response?.status ?? err?.statusCode ?? null;
  const raw = err?.message ?? String(err);

  let code = "AI_UNKNOWN_ERROR";
  let message = raw;

  if (err?.code === "AI_TIMEOUT") {
    code = "AI_TIMEOUT";
    message = raw;
  } else if (
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
// ============================================================
// SYSTEM CONTEXT - UPDATED WITH CORRECT INFORMATION
// ============================================================
const SYSTEM_CONTEXT = `You are MESOB Assistant, an AI assistant embedded in the internal staff management platform for Addis MESOB (Addis Ketema Sub-City Administration).

IMPORTANT - CORRECT SYSTEM INFORMATION:

1. DEVELOPERS: This system was developed by Gezahegn Bekele and Bayisa Bekele from the Addis Ketema Branch Addis MESOB IT Department. There is NO external vendor.

2. SCOPE: This platform is for ALL Addis MESOB employees across ALL branches:
   - Employees, Team Leaders, Managers, Admins, Super Admins

3. PURPOSE: The system streamlines daily reporting, evaluations, peer-forum documentation, and general organizational management - NOT just CRRSA documents.

4. BRANCHES: Currently deployed at Addis Ketema Branch, but designed to be distributed to all Addis MESOB branches.

5. TECH STACK (actual):
   - Frontend: React.js with Material-UI, Amharic/English localization
   - Backend: Node.js (Express) + TypeScript
   - Database: PostgreSQL
   - Hosting: Render.com

6. DEPARTMENTS MANAGED (CRRSA departments):
   - Revenue (ገቢዎች) - Tax collection, business licensing, fee payments
   - Civil Registry (ሲቪል ምዝገባ) - Birth/death certificates, marriage, family cards, ID
   - Labor & Skills (ስራና ክህሎት) - Work permits, vocational training, unemployment benefits
   - Housing (ቤቶች) - Home ownership, rental contracts, housing subsidies
   - Traffic (ትራፊክ) - Traffic fines, driver-license renewal, vehicle registration
   - Transport (አሽ/ተሽ) - Public-transport licensing, fleet management, logistics
   - Investment (ኢንቨስትመንት) - Investment permits, business-incubation, foreign investment
   - Construction (ግንባታ) - Building permits, safety inspections, zoning
   - Land (መሬት) - Land title registration, cadastral mapping, land-use certificates
   - Planning (ፕላን) - Urban development, zoning regulations, master plans

7. SYSTEM PAGES:
   - /dashboard: Overview stats, AI digest, department charts
   - /forum: Peer Forum Report - attendance, topics, agreements, gaps
   - /evaluation: Score team members on 5 criteria, rankings, PDF export
   - /report: Daily Report - log services per department
   - /services: Browse CRRSA service catalogue
   - /analytics: Generate Excel/PDF/Word reports
   - /documents: Document Vault - upload, search, download
   - /users: User management (admin only)
   - /teams: Team management (superadmin only)

CONTACT: For technical inquiries, contact the Addis Ketema Branch IT Department directly.

Always respond in the same language the user writes in (Amharic or English). Be concise, professional, and helpful. For Amharic, use proper Ethiopic script. Never invent vendor names, contacts, or technical details.`;

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

// ─── Gemini Vision Caller (extracted so it can be one link in a chain) ─
const callGeminiVision = async (base64Data, mimeType, prompt) => {
  if (!geminiInitialized || !geminiClient) {
    throw new Error("Gemini client not initialized");
  }
  try {
    const response = await withTimeout(
      geminiClient.models.generateContent({
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
      }),
      GEMINI_VISION_TIMEOUT_MS,
      "Gemini vision",
    );
    return { text: response.text, provider: PROVIDERS.GEMINI };
  } catch (err) {
    throw normalizeAIError(err, PROVIDERS.GEMINI);
  }
};

// ─── Groq Vision Caller (fallback for document image analysis) ────────
const callGroqVision = async (base64Data, mimeType, prompt) => {
  if (!groqInitialized || !groqClient) {
    throw new Error("Groq client not initialized");
  }
  try {
    const response = await withTimeout(
      groqClient.chat.completions.create({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
      GEMINI_VISION_TIMEOUT_MS,
      "Groq vision",
    );
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

// ─── DeepSeek Caller (OpenAI-compatible REST) ──────────────────
const callDeepSeek = async (
  prompt,
  systemInstruction = SYSTEM_CONTEXT,
  history = [],
) => {
  if (!deepseekInitialized) {
    throw new Error("DeepSeek client not initialized");
  }

  try {
    const res = await fetch(DEEPSEEK_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
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
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const err = new Error(
        `DeepSeek API error ${res.status}: ${errBody.slice(0, 300)}`,
      );
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return { text, provider: PROVIDERS.DEEPSEEK };
  } catch (err) {
    throw normalizeAIError(err, PROVIDERS.DEEPSEEK);
  }
};

// ============================================================
// MAIN GENERATE TEXT — Auto-fallback chain
// Order: Gemini -> Groq -> Cohere -> DeepSeek
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
    {
      name: PROVIDERS.DEEPSEEK,
      ready: deepseekInitialized,
      fn: callDeepSeek,
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
// Cached for DIGEST_CACHE_TTL_MS so a burst of dashboard loads
// (or a frontend polling loop) doesn't re-trigger a fresh AI call
// -- and burn through free-tier quota -- on every single request.
// The digest text only needs to change when the underlying stats
// actually change, not every few seconds.
// ============================================================
const digestCache = { key: null, text: null, expiresAt: 0 };
const DIGEST_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const generateDashboardDigest = async (stats) => {
  const cacheKey = JSON.stringify({
    u: stats.totalUsers || 0,
    t: stats.activeTeams || 0,
    s: stats.totalServicesLogged || 0,
    e: stats.evaluationsCompleted || 0,
    d: stats.topDepartment || "N/A",
    p: stats.period || "this week",
  });

  const now = Date.now();
  if (digestCache.key === cacheKey && digestCache.expiresAt > now) {
    console.log("[aiService] 🗂️ Dashboard digest served from cache");
    return digestCache.text;
  }

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

  const text = await generateText(prompt);

  digestCache.key = cacheKey;
  digestCache.text = text;
  digestCache.expiresAt = now + DIGEST_CACHE_TTL_MS;

  return text;
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
  if (
    !geminiInitialized &&
    !groqInitialized &&
    !cohereInitialized &&
    !deepseekInitialized
  ) {
    return "I'm currently unable to connect to any AI service. Please try again later or contact your system administrator.";
  }

  const chatSystemPrompt = `${SYSTEM_CONTEXT}

You are the user-facing assistant chatbot. Current user:
Name: ${userContext.name || "User"}
Role: ${userContext.role || "Employee"}
Team: ${userContext.team || "No team assigned"}

You can help with:
- Explaining how to use any part of the system (Dashboard, Daily Reports, Evaluation, Forum, Services, Document Vault)
- Describing departments and their services in detail
- Guiding navigation: tell the user exactly which menu item or path to use
- Answering questions about evaluations, reports, daily logs, and documents
- Explaining what each evaluation criterion means
- Answering in Amharic or English — always match the user's language
- Providing tips and best practices for government service delivery

IMPORTANT - If asked "who developed this system", always say:
"This system was developed by Gezahegn Bekele and Bayisa Bekele from the Addis Ketema Branch Addis MESOB IT Department."

If asked about vendors or external contacts, politely explain that the system was built in-house by the Addis MESOB IT team.

System pages:
- /dashboard: Overview stats, AI digest, department performance charts
- /forum: Peer Forum Report — fill attendance, topics, agreements, gaps
- /evaluation: Score team members on 5 criteria, view rankings, export PDF
- /report: Daily Report — log daily services per department
- /services: Browse all CRRSA service catalogue
- /analytics: Generate Excel/PDF/Word reports by period
- /documents: Document Vault — upload, search, download official documents
- /users: User management (admin only)
- /teams: Team management (superadmin only)

Keep responses under 200 words.`;

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
  if (
    !geminiInitialized &&
    !groqInitialized &&
    !cohereInitialized &&
    !deepseekInitialized
  ) {
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
// Wrapped with a 25s hard timeout so a hanging Gemini call fails
// fast with a real JSON response (carries CORS headers, since the
// cors() middleware already ran) instead of hanging until the
// platform's own proxy kills the connection with zero response
// bytes -- which the browser then misreports as a CORS error.
//
// Vision fallback chain: Gemini first, Groq vision (Llama 4 Scout)
// if Gemini fails for any reason (quota, rate limit, timeout, etc).
// Cohere/DeepSeek are text-only and are NOT part of this chain.
// ============================================================
const GEMINI_VISION_TIMEOUT_MS = 15000;

const analyzeDocumentImage = async (base64File, mimeType) => {
  if (!geminiInitialized && !groqInitialized) {
    console.error(
      "[aiService] ❌ No vision-capable provider initialized (Gemini and Groq both unavailable)",
    );
    return {
      confidence: "low",
      notes:
        "AI vision service is not available. Please fill in the fields manually.",
      documentType: "other",
    };
  }

  try {
    const base64Data = base64File.includes(",")
      ? base64File.split(",")[1]
      : base64File;

    // ✅ Check if we have valid data
    if (!base64Data || base64Data.length < 100) {
      console.error("[aiService] ❌ Invalid or empty image data");
      return {
        confidence: "low",
        notes:
          "The image appears to be empty or invalid. Please try again with a different file.",
        documentType: "other",
      };
    }

    // ✅ Log file size for debugging
    const fileSizeKB = Math.round((base64Data.length * 0.75) / 1024);
    console.log(
      `[aiService] 📄 Analyzing document (${fileSizeKB}KB, ${mimeType})`,
    );

    // ✅ Simplified, faster prompt
    const prompt = `Analyze this document image for Ethiopian CRRSA government document detection.

IMPORTANT: This is an ETHIOPIAN government document.
Look for these Ethiopian government markers:
- "በኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ" (Federal Democratic Republic of Ethiopia)
- "የልደት ምስክር ወረቀት" (Birth Certificate)

For Birth Certificates, look for:
- Child's name (የህፃኑ ስም / Child's Name)
- Father's name (የአባት ስም / Father's Name)  
- Mother's name (የእናት ስም / Mother's Name)
- Date of Birth (የትውልድ ቀን)
- Registration number (AABI No / ተ.ቁ)

Return ONLY this JSON (no other text):
{
  "documentType": "birth_certificate|death_certificate|marriage_certificate|divorce_certificate|residence_id|name_change|other",
  "title": "descriptive title",
  "citizenName": "person's name in English or null",
  "citizenNameAmharic": "name in Amharic or null",
  "issueDate": "YYYY-MM-DD or null",
  "issuingOfficer": "officer name or null",
  "issuingDepartment": "Civil Registry",
  "nationalId": "document number or null",
  "tags": ["ethiopian", "document"],
  "notes": "brief description",
  "confidence": "high|medium|low"
}`;

    // ✅ Vision fallback chain: Gemini first, Groq vision if Gemini fails.
    // Unlike generateText()'s 4-provider chain, only 2 providers here can
    // actually accept image input — Cohere/DeepSeek are text-only and are
    // deliberately excluded from this chain.
    const visionCallers = [
      {
        name: PROVIDERS.GEMINI,
        ready: geminiInitialized && geminiClient,
        fn: callGeminiVision,
      },
      {
        name: PROVIDERS.GROQ,
        ready: groqInitialized && groqClient,
        fn: callGroqVision,
      },
    ];

    let text = null;
    let usedProvider = null;
    const visionErrors = [];

    for (const provider of visionCallers) {
      if (!provider.ready) continue;
      try {
        console.log(
          `[aiService] 🤖 Sending vision request to ${provider.name}...`,
        );
        const result = await provider.fn(base64Data, mimeType, prompt);
        text = result.text;
        usedProvider = result.provider;
        console.log(
          `[aiService] ✅ Vision response received from ${usedProvider}`,
        );
        break;
      } catch (err) {
        console.warn(
          `[aiService] ⚠️ ${provider.name} vision failed: ${err.code || "unknown"} - ${err.message}`,
        );
        visionErrors.push({ provider: provider.name, error: err });
      }
    }

    if (text === null) {
      const lastErr = visionErrors[visionErrors.length - 1]?.error;
      const normalized = lastErr || new Error("All vision providers failed");
      normalized.code = normalized.code || "ALL_VISION_PROVIDERS_FAILED";
      normalized.provider = normalized.provider || "vision-chain";
      throw normalized;
    }

    console.log(`[aiService] 📝 Response length: ${text.length} chars`);

    // ✅ Try to extract JSON
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(
        "[aiService] ⚠️ No JSON found in response:",
        text.substring(0, 200),
      );
      return {
        confidence: "low",
        notes:
          "AI could not parse the document. Please fill in the fields manually.",
        documentType: "other",
      };
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("[aiService] ❌ JSON parse error:", parseError.message);
      return {
        confidence: "low",
        notes:
          "AI returned unparseable data. Please fill in the fields manually.",
        documentType: "other",
      };
    }

    // ✅ Ensure all fields exist
    result.documentType = result.documentType || "other";
    result.confidence = result.confidence || "low";
    result.notes = result.notes || "Document analyzed.";
    result.tags = result.tags || ["ethiopian", "document"];

    // ✅ If it's a birth certificate, set high confidence
    if (result.documentType === "birth_certificate") {
      result.confidence = "high";
    }

    console.log(
      `[aiService] ✅ Analysis complete: ${result.documentType} (${result.confidence} confidence, via ${usedProvider})`,
    );
    return result;
  } catch (err) {
    const normalized =
      err.code && err.provider ? err : normalizeAIError(err, PROVIDERS.GEMINI);
    console.error(
      `[aiService] ❌ Vision analysis error [${normalized.code}]:`,
      normalized.message,
    );

    // ✅ Return user-friendly error messages
    let notes = "AI analysis failed. Please fill in the fields manually.";
    if (normalized.code === "AI_TIMEOUT") {
      notes =
        "AI analysis is taking too long. Please fill in the fields manually.";
    } else if (normalized.code === "AI_RATE_LIMIT") {
      notes =
        "AI service is currently busy. Please fill in the fields manually and try again later.";
    } else if (normalized.code === "ALL_VISION_PROVIDERS_FAILED") {
      notes =
        "AI vision services are currently unavailable. Please fill in the fields manually.";
    }

    return {
      confidence: "low",
      notes: notes,
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

// ============================================================
// 13. GOLDEN MONDAY — SESSION RECAP (bilingual)
// NOTE: this fixes a pre-existing bug — goldenMondayController.js
// imported generateGoldenMondayRecap / generateGoldenMondayTopics from
// this file, but neither was ever defined here, so every recap/topic
// request was throwing "generateGoldenMondayRecap is not a function".
// ============================================================
const generateGoldenMondayRecap = async ({
  title,
  date,
  organization,
  speaker,
  rawNotes,
}) => {
  const prompt = `You are writing the official recap for a "Golden Monday" staff
capacity-building session at ${organization || "Addis MESOB"}.

Session: ${title}
Date: ${date || new Date().toISOString().slice(0, 10)}
Speaker/Presenter: ${speaker || "Staff Member"}

Raw notes taken during the session:
"""
${rawNotes}
"""

Return ONLY valid JSON (no markdown fences):
{
  "recapEn": "3-5 sentence professional English recap of what was covered and why it matters",
  "recapAm": "same recap translated into natural, formal Amharic (አማርኛ)",
  "keyTakeaway": "one single-sentence key takeaway staff should remember",
  "suggestedTags": ["3-5 short topic tags"]
}`;

  const text = await generateText(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      recapEn: text.slice(0, 600),
      recapAm: "",
      keyTakeaway: "",
      suggestedTags: [],
    };
  }
  return JSON.parse(jsonMatch[0]);
};

// ============================================================
// 14. GOLDEN MONDAY — TOPIC SUGGESTIONS FOR UPCOMING SESSIONS
// ============================================================
const generateGoldenMondayTopics = async (recentSessions = []) => {
  const history =
    recentSessions
      .map((s) => `- ${s.title} (${new Date(s.date).toDateString()})`)
      .join("\n") || "No prior sessions recorded yet.";

  const prompt = `Golden Monday is a weekly staff capacity-building session for
Addis MESOB (Addis Ababa City Administration). Recent session history:
${history}

Suggest 6 NEW topics for upcoming sessions that have NOT already been covered,
spanning a mix of: good governance, anti-corruption, service delivery
improvement, QMS standards, exemplary work showcases, problem-solving, team
collaboration, and digital/technology literacy.

Return ONLY valid JSON (no markdown fences):
{
  "topics": [
    {"title": "Topic title", "reason": "one sentence on why it's timely", "category": "one of the themes above"}
  ]
}`;

  const text = await generateText(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.topics || [];
};

// ============================================================
// 15. GOLDEN MONDAY — PERSONAL PRESENTATION TOPIC IDEAS
// Used when a presenter is auto-assigned via the rotation, to give
// them a running start. They can still title their own presentation.
// ============================================================
const generatePresentationTopicIdeas = async ({
  presenterName,
  department,
  recentTitles = [],
}) => {
  const history =
    recentTitles.length > 0
      ? recentTitles.map((t) => `- ${t}`).join("\n")
      : "No prior presentation titles recorded yet.";

  const prompt = `${presenterName} from the ${department || "their"} department
at Addis MESOB has just been assigned to present at the next Golden Monday
session (a 50-minute peer-led staff training slot).

Titles already presented recently (avoid close repeats):
${history}

Suggest 5 short, concrete presentation title ideas they could choose from —
relevant to a city-administration office worker, covering a mix of their
likely department expertise and general professional development
(communication, service delivery, digital tools, problem-solving,
governance). Titles only, no descriptions.

Return ONLY valid JSON (no markdown fences):
{ "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"] }`;

  const text = await generateText(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.titles || [];
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
  generateGoldenMondayRecap,
  generateGoldenMondayTopics,
  generatePresentationTopicIdeas,
};
