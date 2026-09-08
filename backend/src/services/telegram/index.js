// backend/src/services/telegram/index.js
// Main entry point - re-exports all modules

const {
  setupPersistentMenu,
  handleWebhookUpdate,
  showMainMenu,
} = require("./handlers");

const {
  registrationSessions,
  handleStartRegistration,
  handleRegistrationMessage,
  handleBranchSelection,
  approveRegistration,
  rejectRegistration,
  sendLoginCredentials,
  showBranchSelection,
  // ✅ NEW EXPORTS
  notifyEmployeeDeletion,
  handleAppealDeletion,
  handleAppealReason,
} = require("./registration");

const {
  pendingPresenterConfirmations,
  postNextPresenterAnnouncement,
  postPresenterAnnouncementToChannel,
  requestPresenterAvailability,
  handlePresenterAvailability,
  handlePresenterUnavailableReason,
} = require("./presenters");

const {
  createNotification,
  createPresenterAssignedNotification,
  createSessionReminderNotification,
  createTitleReminderNotification,
} = require("./notifications");

const { sendPresenterReminders } = require("./reminders");

const {
  sendMessage,
  callTelegramApi,
  generateOtp,
  otpExpiry,
  generateTempPassword,
  parseSkills,
  formatDate,
  mondayOf,
} = require("./utils");

const {
  BRANCHES,
  STEPS,
  NOTIFICATION_TYPES,
  PRIORITY,
} = require("./constants");

// ─── TEST FUNCTIONS ──────────────────────────────────────────────
async function testTelegramConnection() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not configured");
    return false;
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
    );
    const data = await response.json();
    console.log(`✅ Bot connected: @${data.result?.username}`);
    return true;
  } catch (error) {
    console.error("❌ Bot connection failed:", error.message);
    return false;
  }
}

async function sendTestMessage() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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

// ─── EXPORTS ────────────────────────────────────────────────────
module.exports = {
  // Handlers
  setupPersistentMenu,
  handleWebhookUpdate,
  showMainMenu,

  // Registration
  registrationSessions,
  handleStartRegistration,
  handleRegistrationMessage,
  handleBranchSelection,
  approveRegistration,
  rejectRegistration,
  sendLoginCredentials,
  showBranchSelection,
  // ✅ NEW EXPORTS
  notifyEmployeeDeletion,
  handleAppealDeletion,
  handleAppealReason,

  // Presenters
  pendingPresenterConfirmations,
  postNextPresenterAnnouncement,
  postPresenterAnnouncementToChannel,
  requestPresenterAvailability,
  handlePresenterAvailability,
  handlePresenterUnavailableReason,

  // Notifications
  createNotification,
  createPresenterAssignedNotification,
  createSessionReminderNotification,
  createTitleReminderNotification,

  // Reminders
  sendPresenterReminders,

  // Utils
  sendMessage,
  callTelegramApi,
  generateOtp,
  otpExpiry,
  generateTempPassword,
  parseSkills,
  formatDate,
  mondayOf,

  // Constants
  BRANCHES,
  STEPS,
  NOTIFICATION_TYPES,
  PRIORITY,

  // Test functions
  testTelegramConnection,
  sendTestMessage,
};
