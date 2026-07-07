// backend/src/routes/telegramRoutes.js
const express = require("express");
const router = express.Router();
const {
  postPresenterAnnouncement,
  testTelegramConnection,
} = require("../services/telegramService");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const { authenticate } = require("../middleware/auth");

/**
 * Test Telegram connection
 * GET /api/telegram/test
 */
router.get("/test", async (req, res) => {
  try {
    const result = await testTelegramConnection();
    res.json({
      success: result,
      message: result ? "Bot is connected!" : "Bot connection failed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Post a specific session to Telegram
 * POST /api/telegram/post/:sessionId
 */
router.post("/post/:sessionId", authenticate, async (req, res) => {
  try {
    const session = await GoldenMondaySession.findById(
      req.params.sessionId,
    ).populate("presenter", "name email department profilePhotoUrl");

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const result = await postPresenterAnnouncement(session);

    // Update session with Telegram post info
    if (result.postId) {
      session.telegramPostId = result.postId;
      session.telegramPostedAt = new Date();
      session.telegramMessageUrl = result.messageUrl;
      await session.save();
    }

    res.json({
      success: true,
      result,
      message: result.postId
        ? "Posted to Telegram!"
        : "Failed to post to Telegram",
    });
  } catch (error) {
    console.error("Error posting to Telegram:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Post a test announcement to Telegram
 * POST /api/telegram/test-post
 */
router.post("/test-post", authenticate, async (req, res) => {
  try {
    const testSession = {
      date: new Date(),
      presentationTitle: "🧪 Test Announcement",
      presentationDescription:
        "This is a test message to verify Telegram integration is working properly.",
      presenter: {
        name: "Addis MESOB Team",
        department: "Digital Services",
      },
      suggestedTopics: [
        "System Testing",
        "Telegram Integration",
        "Golden Monday Automation",
      ],
    };

    const result = await postPresenterAnnouncement(testSession);
    res.json({
      success: true,
      result,
      message: result.postId
        ? "Test post sent to Telegram!"
        : "Failed to send test post",
    });
  } catch (error) {
    console.error("Error sending test post:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
