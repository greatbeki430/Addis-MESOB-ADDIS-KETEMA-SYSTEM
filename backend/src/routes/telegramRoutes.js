// backend/src/routes/telegramRoutes.js
const express = require("express");
const router = express.Router();
const {
  postPresenterAnnouncement,
  testTelegramConnection,
  sendTestMessage,
  handleWebhookUpdate,
  setWebhook,
  getWebhookInfo,
} = require("../services/telegramService");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");

/**
 * TELEGRAM WEBHOOK - Receives updates from Telegram
 * POST /api/telegram/webhook
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("📨 Webhook POST received");
    await handleWebhookUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.sendStatus(200);
  }
});

/**
 * Set the webhook URL with Telegram
 * POST /api/telegram/set-webhook
 */
router.post("/set-webhook", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Missing 'url' in request body",
      });
    }
    const result = await setWebhook(url);
    res.json({
      success: result,
      message: result ? "Webhook set successfully" : "Failed to set webhook",
      url: url,
    });
  } catch (error) {
    console.error("Error setting webhook:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get current webhook status
 * GET /api/telegram/webhook-info
 */
router.get("/webhook-info", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const info = await getWebhookInfo();
    res.json({
      success: true,
      info,
    });
  } catch (error) {
    console.error("Error getting webhook info:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

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
      botToken: process.env.TELEGRAM_BOT_TOKEN ? "✅ Set" : "❌ Missing",
      channelId: process.env.TELEGRAM_CHANNEL_ID ? "✅ Set" : "❌ Missing",
      adminGroupId: process.env.TELEGRAM_ADMIN_GROUP_ID ? "✅ Set" : "❌ Missing",
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Send a simple test message (for debugging)
 * GET /api/telegram/test-message
 */
router.get("/test-message", async (req, res) => {
  try {
    const result = await sendTestMessage();
    res.json({
      success: result,
      message: result ? "Test message sent!" : "Test message failed",
    });
  } catch (error) {
    console.error("Test message error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Post a specific session to Telegram
 * POST /api/telegram/post/:sessionId
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
          : `Failed to post to Telegram: ${result.error || "Unknown error"}`,
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
        : `Failed to send test post: ${result.error || "Unknown error"}`,
    });
  } catch (error) {
    console.error("Error sending test post:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
