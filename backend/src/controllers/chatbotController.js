// backend/src/controllers/chatbotController.js
// Manages the user-facing AI chatbot for Addis MESOB System
// Routes: POST /api/chatbot/message, GET /api/chatbot/history, DELETE /api/chatbot/clear

const ChatSession = require("../models/ChatSession");
const { handleChatMessage } = require("../services/aiService");

// ============================================================
// POST /api/chatbot/message
// Body: { message: "user text" }
// Auth: any authenticated user
// Returns: { reply, sessionId }
// ============================================================
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // ✅ Validate input
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        message: "Message text is required",
        code: "MESSAGE_REQUIRED",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        message: "Message too long (max 1000 characters)",
        code: "MESSAGE_TOO_LONG",
      });
    }

    // ✅ Find or create session for this user
    let session = await ChatSession.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!session) {
      session = new ChatSession({
        user: req.user._id,
        messages: [],
        isActive: true,
      });
    }

    // ✅ Build conversation history for AI (last 20 messages for context)
    const recentMessages = session.messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // ✅ User context for personalized responses
    const userContext = {
      name: req.user.name || "User",
      role: req.user.role || "Employee",
      team: req.user.team?.toString() || null,
    };

    console.log(
      `🤖 Chatbot: User ${userContext.name} asked: "${message.trim().substring(0, 50)}..."`,
    );

    // ✅ Get AI reply with error handling
    let reply;
    try {
      reply = await handleChatMessage(
        recentMessages,
        message.trim(),
        userContext,
      );
    } catch (aiError) {
      console.error("❌ AI service error:", {
        message: aiError.message,
        status: aiError.status,
        code: aiError.code,
      });

      // ✅ Return friendly error messages based on error type
      if (
        aiError.status === 429 ||
        aiError.message?.includes("quota") ||
        aiError.message?.includes("rate limit")
      ) {
        reply =
          "The AI service is currently busy due to high demand. Please try again in a few minutes. If you need immediate help, please contact your team leader.";
      } else if (
        aiError.message?.includes("API key") ||
        aiError.message?.includes("invalid") ||
        aiError.message?.includes("not found")
      ) {
        reply =
          "I'm having trouble connecting to the AI service. Please contact your system administrator.";
      } else if (aiError.status === 404) {
        reply =
          "The AI service is currently unavailable. Please contact your system administrator.";
      } else if (aiError.status === 500) {
        reply =
          "The AI service is temporarily unavailable. Please try again later or contact support if the issue persists.";
      } else {
        reply =
          "I'm having trouble processing your request. Please try again later or contact support if the issue persists.";
      }
    }

    // ✅ Save both messages to session
    session.messages.push({ role: "user", content: message.trim() });
    session.messages.push({ role: "assistant", content: reply });
    await session.save();

    res.json({
      reply,
      sessionId: session._id,
      messageCount: session.messages.length,
    });
  } catch (error) {
    console.error("❌ Chatbot controller error:", error);
    res.status(500).json({
      message: "Chatbot service error",
      error: error.message,
      code: "CHATBOT_ERROR",
    });
  }
};

// ============================================================
// GET /api/chatbot/history
// Returns messages ONLY from the active session
// Auth: any authenticated user
// ============================================================
const getChatHistory = async (req, res) => {
  try {
    // ✅ Only find ACTIVE sessions - this is the fix!
    // When a session is cleared, isActive becomes false, so it won't show old messages
    const session = await ChatSession.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!session) {
      // ✅ Return empty messages array for new sessions
      return res.json({
        messages: [],
        sessionId: null,
        messageCount: 0,
        isNewSession: true,
      });
    }

    // ✅ Return messages from active session only
    const messages = session.messages.slice(-30);
    res.json({
      messages,
      sessionId: session._id,
      messageCount: session.messages.length,
      isNewSession: false,
    });
  } catch (error) {
    console.error("❌ Get chat history error:", error);
    res.status(500).json({
      message: error.message,
      code: "HISTORY_ERROR",
    });
  }
};

// ============================================================
// DELETE /api/chatbot/clear
// Completely clears the user's chat session
// Auth: any authenticated user
// ============================================================
const clearChatSession = async (req, res) => {
  try {
    // ✅ Mark the old session as inactive
    const oldSession = await ChatSession.findOneAndUpdate(
      { user: req.user._id, isActive: true },
      {
        isActive: false,
        // ✅ Keep messages for audit but mark as inactive
      },
      { new: true },
    );

    // ✅ Create a brand new active session with no messages
    const newSession = new ChatSession({
      user: req.user._id,
      messages: [], // ✅ Empty messages array
      isActive: true,
    });
    await newSession.save();

    console.log(
      `🧹 Chat cleared for user ${req.user._id}: old session ${oldSession?._id} closed, new session ${newSession._id} created`,
    );

    res.json({
      message: "Chat session cleared successfully",
      sessionId: newSession._id,
      isNewSession: true,
    });
  } catch (error) {
    console.error("❌ Clear chat session error:", error);
    res.status(500).json({
      message: error.message,
      code: "CLEAR_ERROR",
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatSession,
};
