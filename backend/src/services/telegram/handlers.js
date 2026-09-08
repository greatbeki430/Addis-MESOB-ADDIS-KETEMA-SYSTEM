// backend/src/services/telegram/handlers.js
// Main webhook and menu handlers

const {
  registrationSessions,
  handleStartRegistration,
  handleRegistrationMessage,
  handleBranchSelection,
  approveRegistration,
  rejectRegistration,
  // ✅ NEW IMPORTS
  handleAppealDeletion,
  handleAppealReason,
} = require("./registration");

const {
  pendingPresenterConfirmations,
  handlePresenterAvailability,
  handlePresenterUnavailableReason,
} = require("./presenters");

const { sendMessage, callTelegramApi } = require("./utils");

const TELEGRAM_ADMIN_GROUP_ID = process.env.TELEGRAM_ADMIN_GROUP_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";

// ─── IMPORT MODELS ──────────────────────────────────────────────
const GoldenMondaySession = require("../../models/GoldenMondaySession");

async function showMainMenu(chatId) {
  const message =
    `🏠 *Addis MESOB Bot Menu*\n\n` +
    `Welcome to the Addis MESOB Telegram Bot!\n` +
    `Use the buttons below or type commands:\n\n` +
    `📝 /register - Start employee registration\n` +
    `👤 /status - Check registration status\n` +
    `📖 /about - About Golden Monday\n` +
    `ℹ️ /help - Get help\n` +
    `📞 /contact - Contact admin\n` +
    `🌐 /website - Visit website\n\n` +
    `📌 The ⊞ in your input bar gives you instant access!`;

  return sendMessage(chatId, message, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📝 Register Now", callback_data: "register" }],
        [
          { text: "📖 About Golden Monday", callback_data: "about_gm" },
          { text: "👤 My Status", callback_data: "my_status" },
        ],
        [
          { text: "📞 Contact Admin", callback_data: "contact_admin" },
          { text: "ℹ️ Help", callback_data: "help" },
        ],
        [
          {
            text: "🌐 Visit Website",
            url: FRONTEND_URL,
          },
        ],
      ],
      resize_keyboard: true,
    },
  });
}

async function setupPersistentMenu() {
  console.log("🔧 Setting up persistent menu...");
  try {
    await callTelegramApi("setMyCommands", {
      commands: [
        { command: "start", description: "🚀 Start the bot" },
        { command: "menu", description: "⊞ Open main menu" },
        { command: "register", description: "📝 Register as employee" },
        { command: "status", description: "👤 Check registration status" },
        { command: "about", description: "📖 About Golden Monday" },
        { command: "help", description: "ℹ️ Get help" },
        { command: "contact", description: "📞 Contact admin" },
        { command: "website", description: "🌐 Visit website" },
      ],
      scope: { type: "all_private_chats" },
    });
    console.log("✅ Persistent menu setup complete!");
    return true;
  } catch (error) {
    console.error("❌ Failed to setup persistent menu:", error.message);
    return false;
  }
}

// ─── HANDLE TOPIC SUGGESTION ──────────────────────────────────
async function handleSuggestTopic(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const [, sessionId] = callbackQuery.data.split(":");

  const session = await GoldenMondaySession.findById(sessionId);
  if (!session) {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "❌ Session not found",
    });
    return;
  }

  let sessionData = registrationSessions.get(chatId.toString()) || {};
  sessionData.suggestingTopic = { sessionId, awaitingTopic: true };
  registrationSessions.set(chatId.toString(), sessionData);

  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQuery.id,
    text: "📝 Please type your topic suggestion...",
  });

  await callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: `📝 *Suggest a Topic*\n\nPlease type your topic suggestion for the Golden Monday session.\n\nExamples:\n• Advanced Excel Tips\n• Customer Service Excellence\n• Project Management Best Practices\n\nType your suggestion below:`,
    parse_mode: "Markdown",
  });
}

// ─── HANDLE TOPIC SUGGESTION TEXT ─────────────────────────────
async function handleTopicSuggestionText(msg) {
  const chatId = msg.chat.id.toString();
  const text = (msg.text || "").trim();

  const sessionData = registrationSessions.get(chatId);
  if (
    !sessionData ||
    !sessionData.suggestingTopic ||
    !sessionData.suggestingTopic.awaitingTopic
  ) {
    return;
  }

  const { sessionId } = sessionData.suggestingTopic;

  if (!text || text.length < 3) {
    await sendMessage(
      chatId,
      "❌ Please provide a valid topic suggestion (at least 3 characters).",
    );
    return;
  }

  const session = await GoldenMondaySession.findById(sessionId);
  if (!session) {
    await sendMessage(chatId, "❌ Session not found.");
    return;
  }

  if (!session.suggestedTopics) {
    session.suggestedTopics = [];
  }
  session.suggestedTopics.push(text);
  await session.save();

  sessionData.suggestingTopic = null;
  registrationSessions.set(chatId, sessionData);

  await sendMessage(
    chatId,
    `✅ Your topic suggestion has been submitted!\n\n` +
      `📝 *Suggestion:* ${text}\n\n` +
      `Thank you for contributing to Golden Monday! 🎉\n\n` +
      `📌 Click the ⊞ in your input bar to see all options.`,
    { parse_mode: "Markdown" },
  );

  if (TELEGRAM_ADMIN_GROUP_ID) {
    await sendMessage(
      TELEGRAM_ADMIN_GROUP_ID,
      `📝 *New Topic Suggestion*\n\n` +
        `👤 Suggested by: @${msg.from.username || "anonymous"}\n` +
        `📅 Session: ${new Date(session.date).toLocaleDateString()}\n\n` +
        `💡 *Suggestion:*\n${text}`,
      { parse_mode: "Markdown" },
    );
  }
}

// ─── MAIN WEBHOOK HANDLER ──────────────────────────────────────
async function handleWebhookUpdate(update) {
  try {
    console.log(`📨 Webhook update received`);

    // ─── HANDLE MESSAGE ──────────────────────────────────────────
    if (update.message) {
      const msg = update.message;
      const text = msg.text || "";
      const chatId = msg.chat.id.toString();

      console.log(`📩 Message from ${chatId}: "${text}"`);

      // ✅ Check if this is a topic suggestion
      const sessionData = registrationSessions.get(chatId);
      if (
        sessionData &&
        sessionData.suggestingTopic &&
        sessionData.suggestingTopic.awaitingTopic
      ) {
        await handleTopicSuggestionText(msg);
        return;
      }

      // ✅ NEW: Check if this is an appeal reason
      if (sessionData && sessionData.step === "awaiting_appeal_reason") {
        await handleAppealReason(msg);
        return;
      }

      // Check if this is a presenter unavailable reason
      if (text && !text.startsWith("/")) {
        await handlePresenterUnavailableReason(msg);
      }

      // ─── COMMAND HANDLERS ────────────────────────────────────
      if (text === "/menu" || text === "⊞ Main Menu") {
        return showMainMenu(chatId);
      }

      if (text.startsWith("/start")) {
        return handleStartRegistration(msg);
      }

      if (text === "/register") {
        return handleStartRegistration(msg);
      }

      if (text === "/status") {
        const PendingRegistration = require("../../models/PendingRegistration");
        const pending = await PendingRegistration.findOne({
          telegramChatId: chatId,
        }).sort({ createdAt: -1 });

        if (!pending) {
          return sendMessage(
            chatId,
            "You don't have an active registration.\n\nUse /register to get started!",
          );
        }

        const statusMap = {
          pending_otp: "⏳ Awaiting OTP verification",
          pending_approval: "⏳ Awaiting admin approval",
          approved: "✅ Approved! You can log in now.",
          rejected: "❌ Rejected. Please contact admin.",
        };

        return sendMessage(
          chatId,
          `*Your Registration Status*\n\n` +
            `Status: ${statusMap[pending.status] || pending.status}\n` +
            `Name: ${pending.name}\n` +
            `Email: ${pending.email}\n` +
            `📍 Branch: ${pending.branch || "Addis Ketema"}\n` +
            `🏛️ Department: ${pending.department || "Not set"}`,
          { parse_mode: "Markdown" },
        );
      }

      if (text === "/about") {
        return sendMessage(
          chatId,
          `📖 *About Golden Monday*\n\n` +
            `Golden Monday is Addis MESOB's weekly capacity-building program.\n\n` +
            `• Every Monday, 2:00 - 2:50 PM\n` +
            `• One employee presents on a topic of their choice\n` +
            `• Topics range from tech skills to service excellence\n` +
            `• All employees are encouraged to participate\n\n` +
            `Want to present? Complete your registration!`,
          { parse_mode: "Markdown" },
        );
      }

      if (text === "/help") {
        return sendMessage(
          chatId,
          `ℹ️ *Help & Support*\n\n` +
            `Available commands:\n` +
            `• /start - Start the bot\n` +
            `• /menu - Show main menu\n` +
            `• /register - Begin registration\n` +
            `• /status - Check registration status\n` +
            `• /about - About Golden Monday\n` +
            `• /help - Show this help\n` +
            `• /contact - Contact admin\n` +
            `• /website - Visit the web platform\n\n` +
            `💡 The ⊞ grid icon in your input bar gives you instant access!`,
          { parse_mode: "Markdown" },
        );
      }

      if (text === "/contact") {
        return sendMessage(
          chatId,
          `📞 *Contact Admin*\n\n` +
            `For support, please:\n` +
            `• Email: admin@addismesob.example\n` +
            `• Visit: ${FRONTEND_URL}/support\n` +
            `• Or ask in the office directly`,
          { parse_mode: "Markdown" },
        );
      }

      if (text === "/website") {
        return sendMessage(chatId, `🌐 Visit our website: ${FRONTEND_URL}`, {
          parse_mode: "Markdown",
        });
      }

      // Handle registration messages
      if (msg.text || msg.photo) {
        await handleRegistrationMessage(msg);
      }
    }

    // ─── HANDLE CALLBACK QUERY ──────────────────────────────────
    else if (update.callback_query) {
      const query = update.callback_query;
      const data = query.data;
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;

      console.log(`📨 Callback query: "${data}" from ${chatId}`);

      // ✅ ANSWER THE CALLBACK IMMEDIATELY
      try {
        await callTelegramApi("answerCallbackQuery", {
          callback_query_id: query.id,
        });
      } catch (err) {
        console.warn("⚠️ Could not answer callback query:", err.message);
      }

      // ─── ✅ NEW: APPEAL DELETION ──────────────────────────────
      if (data.startsWith("appeal_deletion:")) {
        await handleAppealDeletion(query);
        return;
      }

      // ─── BRANCH SELECTION ────────────────────────────────────
      if (data.startsWith("branch:")) {
        await handleBranchSelection(query);
        return;
      }

      // ─── PRESENTER AVAILABILITY ─────────────────────────────
      if (data.startsWith("presenter_")) {
        await handlePresenterAvailability(query);
        return;
      }

      // ─── TOPIC SUGGESTION ────────────────────────────────────
      if (data.startsWith("suggest_topic:")) {
        await handleSuggestTopic(query);
        return;
      }

      // ─── MENU ACTIONS ────────────────────────────────────────
      if (data === "menu") {
        await showMainMenu(chatId);
        return;
      }

      if (data === "register") {
        await handleStartRegistration({
          chat: { id: chatId },
          from: { username: "" },
        });
        return;
      }

      if (data === "about_gm") {
        await sendMessage(
          chatId,
          `📖 *About Golden Monday*\n\n` +
            `Golden Monday is Addis MESOB's weekly capacity-building program.\n\n` +
            `• Every Monday, 2:00 - 2:50 PM\n` +
            `• One employee presents on a topic of their choice\n` +
            `• Topics range from tech skills to service excellence\n` +
            `• All employees are encouraged to participate`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      if (data === "my_status") {
        const PendingRegistration = require("../../models/PendingRegistration");
        const pending = await PendingRegistration.findOne({
          telegramChatId: chatId,
        }).sort({ createdAt: -1 });

        if (!pending) {
          await sendMessage(
            chatId,
            "You don't have an active registration.\n\nUse the 'Register Now' button to get started!",
          );
        } else {
          const statusMap = {
            pending_otp: "⏳ Awaiting OTP verification",
            pending_approval: "⏳ Awaiting admin approval",
            approved: "✅ Approved! You can log in now.",
            rejected: "❌ Rejected. Please contact admin.",
          };
          await sendMessage(
            chatId,
            `*Your Registration Status*\n\n` +
              `Status: ${statusMap[pending.status] || pending.status}\n` +
              `Name: ${pending.name}\n` +
              `Email: ${pending.email}\n` +
              `📍 Branch: ${pending.branch || "Addis Ketema"}\n` +
              `🏛️ Department: ${pending.department || "Not set"}`,
            { parse_mode: "Markdown" },
          );
        }
        return;
      }

      if (data === "help") {
        await sendMessage(
          chatId,
          `ℹ️ *Help & Support*\n\n` +
            `Available commands:\n` +
            `• /start - Start the bot\n` +
            `• /menu - Show main menu\n` +
            `• /register - Begin registration\n` +
            `• /status - Check registration status\n` +
            `• /about - About Golden Monday\n` +
            `• /help - Show this help\n` +
            `• /contact - Contact admin\n` +
            `• /website - Visit the web platform\n\n` +
            `💡 The ⊞ grid icon in your input bar gives you instant access!`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      if (data === "contact_admin") {
        await sendMessage(
          chatId,
          `📞 *Contact Admin*\n\n` +
            `For support, please:\n` +
            `• Email: admin@addismesob.example\n` +
            `• Visit: ${FRONTEND_URL}/support\n` +
            `• Or ask in the office directly`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      // ─── APPROVE/REJECT REGISTRATION ────────────────────────
      if (data.startsWith("approve:") || data.startsWith("reject:")) {
        const [action, pendingId] = data.split(":");
        const reviewer = {
          _id: null,
          name: query.from.username || query.from.first_name || "Admin",
        };

        try {
          let statusText = "";
          if (action === "approve") {
            await approveRegistration(pendingId, reviewer);
            statusText = `✅ *Approved* by @${reviewer.name}`;
          } else if (action === "reject") {
            await rejectRegistration(pendingId, reviewer);
            statusText = `❌ *Rejected* by @${reviewer.name}`;
          }

          await callTelegramApi("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `${query.message.text}\n\n${statusText}`,
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [] },
          });

          await callTelegramApi("answerCallbackQuery", {
            callback_query_id: query.id,
            text: action === "approve" ? "✅ Approved!" : "❌ Rejected!",
          });
        } catch (err) {
          console.error("❌ Error handling approval callback:", err.message);
          await callTelegramApi("answerCallbackQuery", {
            callback_query_id: query.id,
            text: `Error: ${err.message}`,
          });
        }
        return;
      }

      // ─── PRESENTER BACK ──────────────────────────────────────
      if (data.startsWith("presenter_back:")) {
        const [, sessionId] = data.split(":");
        const pending = pendingPresenterConfirmations.get(sessionId);
        if (pending) {
          pending.step = null;
          pendingPresenterConfirmations.set(sessionId, pending);
        }
        await showMainMenu(chatId);
        return;
      }
    }
  } catch (err) {
    console.error("❌ Error handling webhook update:", err.message);
    console.error(err.stack);
  }
}

module.exports = {
  setupPersistentMenu,
  handleWebhookUpdate,
  showMainMenu,
  handleSuggestTopic,
  handleTopicSuggestionText,
};
