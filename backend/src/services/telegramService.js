// backend/src/services/telegramService.js
// Telegram bot integration for Golden Monday announcements

const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

/**
 * Generate an announcement image (placeholder until AI service is ready)
 */
const generateAnnouncementImage = async (presenter, session) => {
  try {
    // If you have an AI image generation service, use it here
    // For now, we'll use a simple placeholder
    const name = encodeURIComponent(presenter?.name || "Presenter");
    const title = encodeURIComponent(
      session?.presentationTitle || "Golden Monday",
    );

    // This is a placeholder - you can replace with actual image generation
    return `https://via.placeholder.com/800x400/1a1a2e/ffd700?text=${name}%20-%20${title}`;
  } catch (err) {
    console.error("Failed to generate announcement image:", err.message);
    return null;
  }
};

/**
 * Post presenter announcement to Telegram channel
 */
const postPresenterAnnouncement = async (session) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ Telegram not configured - skipping post");
    return { postId: null, messageUrl: null };
  }

  try {
    const presenter = session.presenter || session;
    const dateFormatted = new Date(session.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Generate image for the announcement
    const imageUrl = await generateAnnouncementImage(presenter, session);

    // Prepare the message
    let message = `🎯 *Golden Monday - ${dateFormatted}*\n\n`;
    message += `👤 *Presenter:* ${presenter.name || "TBD"}\n`;
    if (presenter.department) {
      message += `🏛️ *Department:* ${presenter.department}\n`;
    }
    if (session.presentationTitle) {
      message += `📖 *Topic:* "${session.presentationTitle}"\n`;
    }
    if (session.presentationDescription) {
      message += `📝 *Description:* ${session.presentationDescription}\n`;
    }
    message += `\n🕒 *Time:* 2:00 - 2:50 PM\n`;
    message += `📍 *Location:* Addis MESOB Conference Hall\n\n`;

    if (session.suggestedTopics && session.suggestedTopics.length > 0) {
      message += `💡 *AI Suggested Topics:*\n`;
      session.suggestedTopics.forEach((topic, i) => {
        message += `   ${i + 1}. ${topic}\n`;
      });
    }

    const presenterName = (presenter.name || "GM").replace(/\s/g, "");
    message += `\n#GoldenMonday #AddisMESOB #${presenterName}`;

    // Send message via Telegram API
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    let response;
    if (imageUrl) {
      // Send with image
      response = await axios.post(`${telegramApiUrl}/sendPhoto`, {
        chat_id: TELEGRAM_CHANNEL_ID,
        photo: imageUrl,
        caption: message,
        parse_mode: "Markdown",
      });
    } else {
      // Send text only
      response = await axios.post(`${telegramApiUrl}/sendMessage`, {
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      });
    }

    const postId = response.data.result.message_id;
    const channelIdClean = TELEGRAM_CHANNEL_ID.replace("@", "").replace(
      "-100",
      "",
    );
    const messageUrl = `https://t.me/${channelIdClean}/${postId}`;

    console.log(`✅ Posted to Telegram: ${messageUrl}`);
    return { postId, messageUrl };
  } catch (error) {
    console.error("❌ Failed to post to Telegram:", error.message);
    if (error.response) {
      console.error("Telegram API Error:", error.response.data);
    }
    return { postId: null, messageUrl: null };
  }
};

/**
 * Test the bot connection
 */
const testTelegramConnection = async () => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
    );
    console.log(`✅ Bot connected: @${response.data.result.username}`);
    return true;
  } catch (error) {
    console.error("❌ Bot connection failed:", error.message);
    return false;
  }
};

module.exports = {
  postPresenterAnnouncement,
  generateAnnouncementImage,
  testTelegramConnection,
};
