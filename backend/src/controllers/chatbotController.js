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

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ message: "Message text is required" });
    }

    if (message.length > 1000) {
      return res
        .status(400)
        .json({ message: "Message too long (max 1000 characters)" });
    }

    // Find or create session for this user
    let session = await ChatSession.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!session) {
      session = new ChatSession({ user: req.user._id, messages: [] });
    }

    // Build conversation history for Claude (last 20 messages for context)
    const recentMessages = session.messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // User context for personalized responses
    const userContext = {
      name: req.user.name,
      role: req.user.role,
      team: req.user.team?.toString() || null,
    };

    // Get AI reply
    const reply = await handleChatMessage(
      recentMessages,
      message.trim(),
      userContext,
    );

    // Save both messages to session
    session.messages.push({ role: "user", content: message.trim() });
    session.messages.push({ role: "assistant", content: reply });
    await session.save();

    res.json({
      reply,
      sessionId: session._id,
      messageCount: session.messages.length,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res
      .status(500)
      .json({ message: "Chatbot service error", error: error.message });
  }
};

// ============================================================
// GET /api/chatbot/history
// Returns last 30 messages for the current user's active session
// Auth: any authenticated user
// ============================================================
const getChatHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.json({ messages: [], sessionId: null });
    }

    // Return last 30 messages
    const messages = session.messages.slice(-30);
    res.json({ messages, sessionId: session._id });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// DELETE /api/chatbot/clear
// Clears the user's current chat session (starts fresh)
// Auth: any authenticated user
// ============================================================
const clearChatSession = async (req, res) => {
  try {
    await ChatSession.findOneAndUpdate(
      { user: req.user._id, isActive: true },
      { isActive: false },
    );
    res.json({ message: "Chat session cleared" });
  } catch (error) {
    console.error("Clear chat session error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getChatHistory, clearChatSession };
