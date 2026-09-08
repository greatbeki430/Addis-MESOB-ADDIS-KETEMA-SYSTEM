// backend/src/services/telegramService.js
// Telegram bot integration - Entry point
// Re-exports all functionality from the modular telegram folder

const {
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

  // Utils - ✅ ADDED setWebhook and getWebhookInfo
  sendMessage,
  callTelegramApi,
  generateOtp,
  otpExpiry,
  generateTempPassword,
  parseSkills,
  formatDate,
  mondayOf,
  setWebhook,
  getWebhookInfo,
  testTelegramConnection,

  // Constants
  BRANCHES,
  STEPS,
  NOTIFICATION_TYPES,
  PRIORITY,

  // Test functions
  sendTestMessage,
} = require("./telegram");

// ─── LEGACY SUPPORT ──────────────────────────────────────────────
// These are kept for backward compatibility with existing routes
const postPresenterAnnouncement = postPresenterAnnouncementToChannel;
const generateAnnouncementImage =
  require("./telegram/presenters").generateAnnouncementImage;

const setChatMenuButton = async (chatId) => {
  const result = await callTelegramApi("setChatMenuButton", {
    chat_id: chatId,
    menu_button: { type: "default" },
  });
  return result;
};

const setBotCommands = async () => {
  const commands = [
    { command: "start", description: "🚀 Start the bot" },
    { command: "menu", description: "⊞ Open main menu" },
    { command: "register", description: "📝 Register as employee" },
    { command: "status", description: "👤 Check registration status" },
    { command: "about", description: "📖 About Golden Monday" },
    { command: "help", description: "ℹ️ Get help" },
    { command: "contact", description: "📞 Contact admin" },
    { command: "website", description: "🌐 Visit website" },
  ];
  return callTelegramApi("setMyCommands", {
    commands,
    scope: { type: "all_private_chats" },
  });
};

// ─── EXPORTS ────────────────────────────────────────────────────
module.exports = {
  // Main handlers
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

  // Presenters
  pendingPresenterConfirmations,
  postNextPresenterAnnouncement,
  postPresenterAnnouncementToChannel,
  postPresenterAnnouncement, // Legacy alias
  requestPresenterAvailability,
  handlePresenterAvailability,
  handlePresenterUnavailableReason,
  generateAnnouncementImage,

  // Notifications
  createNotification,
  createPresenterAssignedNotification,
  createSessionReminderNotification,
  createTitleReminderNotification,

  // Reminders
  sendPresenterReminders,

  // Utils - ✅ Includes setWebhook and getWebhookInfo
  sendMessage,
  callTelegramApi,
  generateOtp,
  otpExpiry,
  generateTempPassword,
  parseSkills,
  formatDate,
  mondayOf,
  setWebhook,
  getWebhookInfo,
  testTelegramConnection,

  // Constants
  BRANCHES,
  STEPS,
  NOTIFICATION_TYPES,
  PRIORITY,

  // Test functions
  sendTestMessage,

  // Legacy
  setChatMenuButton,
  setBotCommands,

  // Deprecated
  startRegistrationPolling: () => {
    console.warn(
      "⚠️ startRegistrationPolling is deprecated. Use webhook instead.",
    );
  },
  stopRegistrationPolling: () => {
    console.warn(
      "⚠️ stopRegistrationPolling is deprecated. Use webhook instead.",
    );
  },
};
