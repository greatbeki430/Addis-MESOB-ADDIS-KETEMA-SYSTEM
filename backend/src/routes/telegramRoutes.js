// backend/src/routes/telegramRoutes.js
const express = require("express");
const router = express.Router();
const {
  postPresenterAnnouncement,
  testTelegramConnection,
} = require("../services/telegramService");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");

/**
 * Test Telegram connection
 * GET /api/telegram/test
 * Public - no auth required for testing
 */
router.get("/test", async (req, res) => {
  try {
    const result = await testTelegramConnection();
    res.json({
      success: result,
      message: result ? "Bot is connected!" : "Bot connection failed",
      botToken: process.env.TELEGRAM_BOT_TOKEN ? "✅ Set" : "❌ Missing",
      channelId: process.env.TELEGRAM_CHANNEL_ID ? "✅ Set" : "❌ Missing",
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * Post a specific session to Telegram
 * POST /api/telegram/post/:sessionId
 * Requires authentication and admin/superadmin role
 */
router.post(
  "/post/:sessionId",
  protect,
  adminOrSuperAdmin,
  async (req, res) => {
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
  },
);

/**
 * Post a test announcement to Telegram
 * POST /api/telegram/test-post
 * Requires authentication and admin/superadmin role
 */
router.post("/test-post", protect, adminOrSuperAdmin, async (req, res) => {
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
