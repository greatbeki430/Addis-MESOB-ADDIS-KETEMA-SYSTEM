// backend/src/services/telegram/utils.js
const crypto = require("crypto");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

// ✅ SIMPLIFIED: Generate a clean alphanumeric password
function generateTempPassword() {
  // Use only alphanumeric characters - no special chars
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function parseSkills(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ✅ Unified callTelegramApi function
async function callTelegramApi(method, params = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN not configured");
    return { ok: false, description: "Bot token not configured" };
  }

  try {
    let url = `${TELEGRAM_API}/${method}`;

    // Handle methods that already have query parameters
    if (method.includes("?")) {
      url = `${TELEGRAM_API}/${method}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Telegram API call failed (${method}):`, error.message);
    return { ok: false, description: error.message };
  }
}

// ✅ Send message function
async function sendMessage(chatId, text, options = {}) {
  if (!chatId) {
    console.error("❌ sendMessage: chatId is required");
    return { ok: false, description: "chatId is required" };
  }

  const params = {
    chat_id: chatId,
    text: text,
    parse_mode: options.parse_mode || "Markdown",
    ...(options.reply_markup && { reply_markup: options.reply_markup }),
  };

  return callTelegramApi("sendMessage", params);
}

// ✅ Set webhook
async function setWebhook(webhookUrl) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const result = await callTelegramApi("setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    });

    if (result.ok) {
      console.log(`✅ Webhook set to: ${webhookUrl}`);
      return true;
    } else {
      console.error(`❌ Failed to set webhook: ${result.description}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error setting webhook:", error.message);
    return false;
  }
}

// ✅ Get webhook info
async function getWebhookInfo() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN not configured");
    return null;
  }

  try {
    const result = await callTelegramApi("getWebhookInfo");
    return result.ok ? result.result : null;
  } catch (error) {
    console.error("❌ Error getting webhook info:", error.message);
    return null;
  }
}

// ✅ Test connection
async function testTelegramConnection() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/getMe`);
    const data = await response.json();
    console.log(`✅ Bot connected: @${data.result?.username}`);
    return data.ok;
  } catch (error) {
    console.error("❌ Bot connection failed:", error.message);
    return false;
  }
}

// ✅ Send test message
async function sendTestMessage() {
  const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ Telegram not configured");
    return false;
  }
  try {
    const result = await sendMessage(
      TELEGRAM_CHANNEL_ID,
      "🔧 Test message from Addis MESOB Bot!\n\nIf you see this, the bot is working correctly!",
      { parse_mode: "Markdown" },
    );
    return result && result.ok;
  } catch (error) {
    console.error("❌ Test message error:", error.message);
    return false;
  }
}

module.exports = {
  generateOtp,
  otpExpiry,
  generateTempPassword,
  parseSkills,
  mondayOf,
  formatDate,
  callTelegramApi,
  sendMessage,
  setWebhook,
  getWebhookInfo,
  testTelegramConnection,
  sendTestMessage,
  TELEGRAM_API,
  TELEGRAM_BOT_TOKEN,
};
