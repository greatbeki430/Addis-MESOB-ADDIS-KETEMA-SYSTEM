// backend/src/routes/chatbotRoutes.js

const express = require("express");
const router = express.Router();
const { protect, anyRole } = require("../middleware/auth");
const {
  sendMessage,
  getChatHistory,
  clearChatSession,
} = require("../controllers/chatbotController");

// POST /api/chatbot/message    — send a message, get AI reply
router.post("/message", protect, anyRole, sendMessage);

// GET  /api/chatbot/history    — get current session history
router.get("/history", protect, anyRole, getChatHistory);

// DELETE /api/chatbot/clear    — clear the session
router.delete("/clear", protect, anyRole, clearChatSession);

module.exports = router;
