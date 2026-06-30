// backend/src/models/ChatSession.js
// Stores chatbot conversation history per user

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [messageSchema],
    // Cap at 50 messages per session — older messages are trimmed automatically
    isActive: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Auto-update lastActivity when messages are added
chatSessionSchema.pre("save", function (next) {
  this.lastActivity = new Date();
  // Keep only the last 50 messages to control context window size
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-50);
  }
  next();
});

module.exports = mongoose.model("ChatSession", chatSessionSchema);
