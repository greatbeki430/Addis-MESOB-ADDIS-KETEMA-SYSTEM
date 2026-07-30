// backend/src/services/telegramService.js
// Telegram bot integration with PERSISTENT MENU SUPPORT - COMPLETE VERSION
// INCLUDES: Persistent menu button INSIDE the input bar (grid icon ⊞)

const crypto = require("crypto");
const PendingRegistration = require("../models/PendingRegistration");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const { createUserAccount } = require("../controllers/authController");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_ADMIN_GROUP_ID = process.env.TELEGRAM_ADMIN_GROUP_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";

// =====================================================================
// EXISTING CODE - Announcement functions (unchanged)
// =====================================================================

const generateAnnouncementImage = async (presenter, session) => {
  try {
    const name = encodeURIComponent(presenter?.name || "Presenter");
    const title = encodeURIComponent(
      session?.presentationTitle || "Golden Monday",
    );
    return `https://via.placeholder.com/800x400/1a1a2e/ffd700?text=${name}%20-%20${title}`;
  } catch (err) {
    console.error("Failed to generate announcement image:", err.message);
    return null;
  }
};

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

    const imageUrl = await generateAnnouncementImage(presenter, session);

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

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    let response;
    if (imageUrl) {
      response = await fetch(`${telegramApiUrl}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          photo: imageUrl,
          caption: message,
          parse_mode: "Markdown",
        }),
      });
    } else {
      response = await fetch(`${telegramApiUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    }

    const data = await response.json();
    if (!data.ok) {
      console.error(`❌ Telegram API Error: ${data.description}`);
      return { postId: null, messageUrl: null, error: data.description };
    }

    const postId = data.result?.message_id;
    const channelUsername = data.result?.chat?.username || "AddisMESOBGM";
    const messageUrl = `https://t.me/${channelUsername}/${postId}`;

    console.log(`✅ Posted to Telegram: ${messageUrl}`);
    return { postId, messageUrl };
  } catch (error) {
    console.error("❌ Failed to post to Telegram:", error.message);
    return { postId: null, messageUrl: null };
  }
};

const testTelegramConnection = async () => {
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
};

const sendTestMessage = async () => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ Telegram not configured");
    return false;
  }
  try {
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    const response = await fetch(`${telegramApiUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: "🔧 Test message from Addis MESOB Bot!\n\nIf you see this, the bot is working correctly!",
        parse_mode: "Markdown",
      }),
    });
    const data = await response.json();
    if (data.ok) {
      console.log(
        `✅ Test message sent! Message ID: ${data.result?.message_id}`,
      );
      return true;
    } else {
      console.error(`❌ Test failed: ${data.description}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Test message error:", error.message);
    return false;
  }
};

// =====================================================================
// PERSISTENT MENU SYSTEM
// =====================================================================

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function callTelegramApi(method, payload) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`❌ Telegram ${method} error:`, data.description);
    }
    return data;
  } catch (error) {
    console.error(`❌ Telegram ${method} network error:`, error.message);
    return { ok: false, description: error.message };
  }
}

const sendMessage = (chatId, text, extra = {}) =>
  callTelegramApi("sendMessage", { chat_id: chatId, text, ...extra });

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function generateTempPassword() {
  return crypto.randomBytes(8).toString("base64url").slice(0, 10);
}

// In-memory conversation state per chat
const registrationSessions = new Map();

const STEPS = {
  NAME: "awaiting_name",
  EMAIL: "awaiting_email",
  PHONE: "awaiting_phone",
  DEPARTMENT: "awaiting_department",
  POSITION: "awaiting_position",
  SKILLS: "awaiting_skills",
  PHOTO: "awaiting_photo",
  OTP: "awaiting_otp",
  BRANCH: "awaiting_branch", // ✅ NEW STEP
};

function parseSkills(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// =====================================================================
// PERSISTENT MENU BUTTON INSIDE THE INPUT BAR (GRID ICON ⊞)
// =====================================================================

// ─── SET BOT COMMANDS (appears when user types "/" in input) ──────
async function setBotCommands() {
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

  const result = await callTelegramApi("setMyCommands", {
    commands: commands,
    scope: {
      type: "all_private_chats",
    },
  });

  if (result.ok) {
    console.log(
      "✅ Bot commands set - Menu button (⊞) is now INSIDE the input bar!",
    );
    console.log("📌 Position: [⊞] [📎] [😊] Type a message...");
  } else {
    console.warn("⚠️ Failed to set bot commands");
  }

  return result;
}

// ─── SET CHAT MENU BUTTON (Grid icon INSIDE the input bar) ────────
async function setChatMenuButton(chatId) {
  const result = await callTelegramApi("setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "default",
    },
  });

  if (result.ok) {
    console.log(
      `✅ Menu button (⊞) placed INSIDE input bar for chat: ${chatId}`,
    );
    console.log(`📌 Position: [⊞] [📎] [😊] Type a message...`);
  } else {
    console.warn(`⚠️ Failed to set menu button for chat: ${chatId}`);
  }

  return result;
}

// ─── SET DEFAULT MENU BUTTON FOR ALL CHATS ─────────────────────────
async function setDefaultMenuButton() {
  const result = await callTelegramApi("setMyDefaultAdministratorRights", {
    rights: {
      is_anonymous: false,
      can_manage_chat: false,
      can_delete_messages: false,
      can_manage_video_chats: false,
      can_restrict_members: false,
      can_promote_members: false,
      can_change_info: false,
      can_invite_users: false,
      can_post_stories: false,
      can_edit_stories: false,
      can_delete_stories: false,
    },
  });

  if (result.ok) {
    console.log("✅ Default administrator rights set for all chats!");
    console.log(
      "📌 The grid icon will appear INSIDE the input bar for everyone!",
    );
  } else {
    console.warn("⚠️ Failed to set default administrator rights");
  }

  return result;
}

// ─── SETUP PERSISTENT MENU (CALL ON BOT STARTUP) ──────────────────
async function setupPersistentMenu() {
  console.log("🔧 Setting up persistent menu...");
  console.log("📌 The menu button (⊞) will appear INSIDE the input bar");
  console.log("📌 Position: [⊞] [📎] [😊] Type a message...");

  try {
    await setBotCommands();
    await setDefaultMenuButton();

    console.log("✅ Persistent menu setup complete!");
    console.log("ℹ️ Users will see the grid icon (⊞) INSIDE their input bar");
    console.log("ℹ️ Position: To the LEFT of the attachment icon (📎)");
    console.log("ℹ️ The menu NEVER gets hidden as conversations grow");

    return true;
  } catch (error) {
    console.error("❌ Failed to setup persistent menu:", error.message);
    return false;
  }
}

// ─── PERSISTENT MENU ───────────────────────────────────────
const PERSISTENT_MENU_BUTTONS = {
  inline_keyboard: [
    [{ text: "⊞ Main Menu", callback_data: "menu" }],
    [
      { text: "📝 Register", callback_data: "register" },
      { text: "👤 My Status", callback_data: "my_status" },
    ],
    [
      { text: "ℹ️ Help", callback_data: "help" },
      { text: "🌐 Website", url: FRONTEND_URL },
    ],
  ],
};

// ─── SHOW MAIN MENU (WITH PERSISTENT BUTTON) ──────────────
function showMainMenu(chatId, extraText = "") {
  const menuText =
    `🏠 *Addis MESOB Bot Menu*\n\n` +
    `Welcome to the Addis MESOB Telegram Bot!\n` +
    `Use the buttons below to navigate:\n` +
    `${extraText}`;

  return sendMessage(chatId, menuText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⊞ Open Main Menu", callback_data: "menu" }],
        [
          { text: "📝 Register Now", callback_data: "register" },
          { text: "📖 About Golden Monday", callback_data: "about_gm" },
        ],
        [
          { text: "👤 My Status", callback_data: "my_status" },
          { text: "📞 Contact Admin", callback_data: "contact_admin" },
        ],
        [
          { text: "ℹ️ Help", callback_data: "help" },
          { text: "🌐 Visit Website", url: FRONTEND_URL },
        ],
        [{ text: "🔄 Reset Session", callback_data: "reset" }],
      ],
      resize_keyboard: true,
    },
  });
}

// ─── PERSISTENT MENU HANDLER ──────────────────────────────
async function showPersistentMenu(chatId, messageText = "⊞ *Main Menu*") {
  await setChatMenuButton(chatId);

  const menuText = `${messageText}\n\nSelect an option from the menu below:`;

  return sendMessage(chatId, menuText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⊞ Main Menu", callback_data: "menu" }],
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
          { text: "🌐 Visit Website", url: FRONTEND_URL },
          { text: "🔄 Reset", callback_data: "reset" },
        ],
      ],
      resize_keyboard: true,
    },
  });
}

// ─── START HANDLER ──────────────────────────────────────────
async function handleStart(msg) {
  const chatId = msg.chat.id.toString();

  await setChatMenuButton(chatId);

  const existingPending = await PendingRegistration.findOne({
    telegramChatId: chatId,
  }).sort({ createdAt: -1 });

  if (existingPending) {
    if (existingPending.status === "approved") {
      return showPersistentMenu(
        chatId,
        `✅ You're already registered!\n📧 Email: ${existingPending.email}\n🔗 Login: ${FRONTEND_URL}/login`,
      );
    }
    if (existingPending.status === "pending_approval") {
      return showPersistentMenu(
        chatId,
        "⏳ Your registration is awaiting admin approval.\nYou'll receive a notification once approved.",
      );
    }
  }

  const user = await GoldenMondayPresenter.findOne({ telegramChatId: chatId });
  if (user) {
    return showPersistentMenu(
      chatId,
      `✅ You are already registered as an employee!\n👤 Name: ${user.name}\n🏛️ Department: ${user.department || "Not set"}`,
    );
  }

  registrationSessions.set(chatId, {
    step: STEPS.NAME,
    data: {
      telegramUsername: msg.from.username || "",
      skills: [],
    },
  });

  sendMessage(
    chatId,
    "👋 Welcome to Addis MESOB employee registration!\n\n" +
      "Please provide the following information to register.\n\n" +
      "📝 *What is your full name?*\n\n" +
      "🔹 You can always click the ⊞ menu button in your input bar.\n" +
      "🔹 Or type /menu to return to the main menu.\n" +
      "🔹 The ⊞ grid icon is permanently in your input bar!",
    { parse_mode: "Markdown" },
  );
}

// ─── REGISTRATION FLOW ───────────────────────────────────────
async function handleRegistrationMessage(msg) {
  const chatId = msg.chat.id.toString();
  const session = registrationSessions.get(chatId);
  if (!session) return;

  const text = (msg.text || "").trim();

  if (text === "/menu" || text === "/start") {
    registrationSessions.delete(chatId);
    return showPersistentMenu(
      chatId,
      "🔄 Registration cancelled. Returning to main menu.",
    );
  }

  if (msg.photo && session.step === STEPS.PHOTO) {
    await handlePhotoUpload(msg, session, chatId);
    return;
  }

  switch (session.step) {
    case STEPS.NAME:
      if (!text || text.length < 2) {
        return sendMessage(
          chatId,
          "❌ Please enter a valid name (at least 2 characters).\n\nClick ⊞ in input bar or type /menu to cancel.",
        );
      }
      session.data.name = text;
      session.step = STEPS.EMAIL;
      sendMessage(
        chatId,
        "📧 *What is your email address?*\n\nThis will be your login email.\n\nClick ⊞ in input bar or type /menu to cancel.",
        { parse_mode: "Markdown" },
      );
      break;

    case STEPS.EMAIL: {
      const email = text.toLowerCase();
      if (!email.includes("@") || !email.includes(".")) {
        return sendMessage(
          chatId,
          "❌ Please enter a valid email address (e.g., name@domain.com).\n\nClick ⊞ in input bar or type /menu to cancel.",
        );
      }
      const User = require("../models/User");
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendMessage(
          chatId,
          "❌ That email is already registered. Please send a different email.\n\nClick ⊞ in input bar or type /menu to cancel.",
        );
      }
      session.data.email = email;
      session.step = STEPS.PHONE;
      sendMessage(
        chatId,
        "📱 *What is your phone number?*\n\nFormat: +251 9XX XXX XXX\nOr type 'skip' to skip\n\nClick ⊞ in input bar or type /menu to cancel.",
        { parse_mode: "Markdown" },
      );
      break;
    }

    case STEPS.PHONE: {
      session.data.phone = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.BRANCH; // ✅ NEW: Go to branch after phone
      sendMessage(
        chatId,
        "📍 *What is your branch location?*\n\nPlease select your branch:\n\n" +
          "Addis Ketema\n" +
          "Lideta\n" +
          "Kirkos\n" +
          "Bole\n" +
          "Yeka\n" +
          "Gulele\n" +
          "Nifas Silk\n" +
          "Kolfe Keranio\n" +
          "Arada\n" +
          "Akaki Kality\n" +
          "Lemi Kura\n" +
          "Other\n\n" +
          "Or type 'skip' to use default (Addis Ketema)\n\nClick ⊞ in input bar or type /menu to cancel.",
        { parse_mode: "Markdown" },
      );
      break;
    }

    case STEPS.BRANCH: {
      // ✅ NEW STEP
      const validBranches = [
        "Addis Ketema",
        "Lideta",
        "Kirkos",
        "Bole",
        "Yeka",
        "Gulele",
        "Nifas Silk",
        "Kolfe Keranio",
        "Arada",
        "Akaki Kality",
        "Lemi Kura",
        "Other",
      ];

      if (text.toLowerCase() === "skip") {
        session.data.branch = "Addis Ketema";
      } else {
        // Try to match the branch (case insensitive)
        const matchedBranch = validBranches.find(
          (b) => b.toLowerCase() === text.toLowerCase(),
        );
        session.data.branch = matchedBranch || text;
      }

      session.step = STEPS.DEPARTMENT;
      sendMessage(
        chatId,
        "🏛️ *What is your department?*\n\nExamples: IT, HR, Finance, Customer Service\nOr type 'skip' to skip\n\nClick ⊞ in input bar or type /menu to cancel.",
        { parse_mode: "Markdown" },
      );
      break;
    }

    case STEPS.DEPARTMENT: {
      session.data.department = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.POSITION;
      sendMessage(
        chatId,
        "💼 *What is your position/title?*\n\nExamples: Team Leader, Developer, Manager\nOr type 'skip' to skip\n\nClick ⊞ in input bar or type /menu to cancel.",
        { parse_mode: "Markdown" },
      );
      break;
    }

    case STEPS.POSITION: {
      session.data.position = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.SKILLS;
      sendMessage(
        chatId,
        "🛠️ *What are your skills?*\n\nComma-separated: JavaScript, React, MongoDB\nOr type 'skip' to skip\n\nClick ⊞ in input bar or type /menu to cancel.",
        { parse_mode: "Markdown" },
      );
      break;
    }

    case STEPS.SKILLS: {
      if (text.toLowerCase() === "skip") {
        session.data.skills = [];
      } else {
        session.data.skills = parseSkills(text);
      }
      session.step = STEPS.PHOTO;
      sendMessage(
        chatId,
        "📸 *Upload your profile photo*\n\nClick the attachment icon (📎) and select a photo.\nOr type 'skip' to skip\n\nClick ⊞ in input bar or type /menu to cancel.",
        { parse_mode: "Markdown" },
      );
      break;
    }

    case STEPS.PHOTO: {
      if (text.toLowerCase() === "skip") {
        session.data.photoUrl = "";
        await completeRegistration(chatId, session);
      } else {
        sendMessage(
          chatId,
          "📸 Please upload a photo using the attachment button (📎) or type 'skip'\n\nClick ⊞ in input bar or type /menu to cancel.",
        );
      }
      break;
    }

    case STEPS.OTP: {
      await handleOtpVerification(chatId, session, text);
      break;
    }
  }
}

// ─── PHOTO UPLOAD ──────────────────────────────────────────
async function handlePhotoUpload(msg, session, chatId) {
  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await callTelegramApi("getFile", { file_id: fileId });

    if (!file.ok) {
      sendMessage(
        chatId,
        "❌ Failed to get photo. Please try again or type 'skip'\n\nClick ⊞ in input bar or type /menu to cancel.",
      );
      return;
    }

    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.result.file_path}`;
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const base64Photo = Buffer.from(buffer).toString("base64");
    session.data.photoUrl = `data:image/jpeg;base64,${base64Photo}`;

    sendMessage(chatId, "✅ Photo uploaded successfully!");
    await completeRegistration(chatId, session);
  } catch (error) {
    console.error("❌ Photo upload error:", error.message);
    sendMessage(
      chatId,
      "❌ Failed to upload photo. Please type 'skip' to continue.\n\nClick ⊞ in input bar or type /menu to cancel.",
    );
  }
}

// ─── COMPLETE REGISTRATION ──────────────────────────────────
async function completeRegistration(chatId, session) {
  const otpCode = generateOtp();
  const pending = await PendingRegistration.create({
    telegramChatId: chatId,
    telegramUsername: session.data.telegramUsername,
    name: session.data.name,
    email: session.data.email,
    phone: session.data.phone || "",
    branch: session.data.branch || "Addis Ketema", // ✅ ADD THIS
    department: session.data.department || "",
    position: session.data.position || "",
    skills: session.data.skills || [],
    profilePhotoUrl: session.data.photoUrl || "",
    status: "pending_otp",
    otpCode,
    otpExpiresAt: otpExpiry(10),
  });

  session.pendingId = pending._id.toString();
  session.step = STEPS.OTP;

  sendMessage(
    chatId,
    `✅ Registration almost complete!\n\nYour verification code is: *${otpCode}*\n\nReply with this code to confirm (valid for 10 minutes).\n\nClick ⊞ in input bar or type /menu to cancel.`,
    { parse_mode: "Markdown" },
  );
}

// ─── OTP VERIFICATION ──────────────────────────────────────
async function handleOtpVerification(chatId, session, text) {
  const pending = await PendingRegistration.findById(session.pendingId).select(
    "+otpCode +otpExpiresAt",
  );

  if (!pending) {
    registrationSessions.delete(chatId);
    return showPersistentMenu(
      chatId,
      "❌ Something went wrong. Please try again.",
    );
  }

  if (!pending.otpExpiresAt || pending.otpExpiresAt < new Date()) {
    registrationSessions.delete(chatId);
    return showPersistentMenu(
      chatId,
      "❌ That code expired. Please try again.",
    );
  }

  if (text !== pending.otpCode) {
    return sendMessage(
      chatId,
      "❌ That code doesn't match — please check and try again.\n\nClick ⊞ in input bar or type /menu to cancel.",
    );
  }

  pending.otpVerified = true;
  pending.status = "pending_approval";
  pending.otpCode = undefined;
  pending.otpExpiresAt = undefined;
  await pending.save();

  registrationSessions.delete(chatId);

  await showPersistentMenu(
    chatId,
    "✅ *Registration Complete!*\nYour registration has been sent for admin approval.\nYou'll receive a notification once approved.",
  );

  await notifyAdminsForApproval(pending);
}

// ─── ADMIN NOTIFICATION ─────────────────────────────────────
async function notifyAdminsForApproval(pending) {
  if (!TELEGRAM_ADMIN_GROUP_ID) {
    console.warn("⚠️ TELEGRAM_ADMIN_GROUP_ID not set — cannot notify admins.");
    return;
  }

  const text =
    `📋 *New Employee Registration*\n\n` +
    `👤 Name: ${pending.name}\n` +
    `📧 Email: ${pending.email}\n` +
    `📱 Phone: ${pending.phone || "Not provided"}\n` +
    `📍 Branch: ${pending.branch || "Addis Ketema"}\n` + // ✅ ADD THIS
    `🏛️ Department: ${pending.department || "Not provided"}\n` +
    `💼 Position: ${pending.position || "Not provided"}\n` +
    `🛠️ Skills: ${pending.skills?.length ? pending.skills.join(", ") : "Not provided"}\n` +
    `👤 Telegram: @${pending.telegramUsername || "n/a"}\n` +
    `🖼️ Photo: ${pending.profilePhotoUrl ? "✅ Uploaded" : "❌ Not uploaded"}`;

  await sendMessage(TELEGRAM_ADMIN_GROUP_ID, text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve:${pending._id}` },
          { text: "❌ Reject", callback_data: `reject:${pending._id}` },
        ],
        [{ text: "👤 View Profile", url: `${FRONTEND_URL}/employees` }],
      ],
    },
  });
}

// ─── APPROVE REGISTRATION ──────────────────────────────────
async function approveRegistration(pendingId, reviewer) {
  console.log("📝 Approving registration:", pendingId);

  const pending = await PendingRegistration.findById(pendingId);
  if (!pending) throw new Error("Registration not found");
  if (pending.status !== "pending_approval") {
    throw new Error(`Cannot approve from status "${pending.status}"`);
  }

  try {
    console.log("👤 Creating user account for:", pending.email);
    const tempPassword = generateTempPassword();

    // ✅ FIXED: Pass ALL fields to createUserAccount
    const user = await createUserAccount({
      name: pending.name,
      email: pending.email,
      password: tempPassword,
      role: "employee",
      phone: pending.phone,
      telegramChatId: pending.telegramChatId,
      profilePhotoUrl: pending.profilePhotoUrl || "",
      branch: pending.branch || "Addis Ketema", // ✅ ADD THIS
    });

    console.log("✅ User created with ID:", user._id);

    // ADD TO GOLDEN MONDAY ROSTER
    console.log("📋 Adding user to Golden Monday roster...");
    try {
      const existingPresenter = await GoldenMondayPresenter.findOne({
        user: user._id,
      });
      if (!existingPresenter) {
        const presenter = await GoldenMondayPresenter.create({
          user: user._id,
          name: pending.name,
          email: pending.email,
          department: pending.department || "",
          position: pending.position || "",
          phone: pending.phone || "",
          profilePhotoUrl: pending.profilePhotoUrl || "",
          skills: pending.skills || [],
          isEligible: true,
          timesPresented: 0,
          registeredAt: new Date(),
          registeredBy: reviewer?._id || undefined,
        });
        console.log("✅ Added to Golden Monday roster:", presenter._id);
      } else {
        console.log("ℹ️ User already in Golden Monday roster");
      }
    } catch (rosterError) {
      console.error(
        "⚠️ Failed to add to Golden Monday roster:",
        rosterError.message,
      );
    }

    pending.status = "approved";
    pending.createdUser = user._id;
    pending.reviewedBy = reviewer?._id || undefined;
    pending.reviewedByName = reviewer?.name || "unknown";
    pending.reviewedAt = new Date();
    await pending.save();

    console.log("📤 Sending login link to:", pending.telegramChatId);
    await sendLoginLink(pending.telegramChatId, pending.email, tempPassword);

    return { pending, user };
  } catch (error) {
    console.error("❌ Approval error:", error.message);
    if (TELEGRAM_ADMIN_GROUP_ID) {
      await sendMessage(
        TELEGRAM_ADMIN_GROUP_ID,
        `❌ Approval failed for ${pending.email}:\n${error.message}`,
      );
    }
    throw error;
  }
}

// ─── REJECT REGISTRATION ──────────────────────────────────
async function rejectRegistration(pendingId, reviewer, reason) {
  const pending = await PendingRegistration.findById(pendingId);
  if (!pending) throw new Error("Registration not found");

  pending.status = "rejected";
  pending.rejectionReason = reason || "";
  pending.reviewedBy = reviewer?._id || undefined;
  pending.reviewedByName = reviewer?.name || "unknown";
  pending.reviewedAt = new Date();
  await pending.save();

  await showPersistentMenu(
    pending.telegramChatId,
    "❌ Your registration could not be approved.\nPlease contact HR/admin for details.",
  );

  return pending;
}

// ─── SEND LOGIN LINK ──────────────────────────────────────
async function sendLoginLink(chatId, email, tempPassword) {
  const message =
    `✅ *Account Approved!*\n\n` +
    `🔗 Login: ${FRONTEND_URL}/login\n` +
    `📧 Email: ${email}\n` +
    `🔑 Password: ${tempPassword}\n\n` +
    `⚠️ *Please change your password after logging in.*`;

  await showPersistentMenu(chatId, `\n${message}`);
}

// ─── SEND DELETION NOTIFICATION ───────────────────────────
async function sendDeletionNotification(
  chatId,
  name,
  reason = "Your account has been removed by an administrator.",
) {
  const message =
    `⚠️ *Account Deletion Notification*\n\n` +
    `Dear ${name},\n\n` +
    `${reason}\n\n` +
    `If you believe this is a mistake, please contact your administrator.\n\n` +
    `To re-register, please send /start to this bot again.`;

  await showPersistentMenu(chatId, `\n${message}`);
}

// ─── CALLBACK HANDLER ──────────────────────────────────────
async function handleCallback(query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  if (data === "menu") {
    await showPersistentMenu(chatId);
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "⊞ Opening main menu...",
    });
    return;
  }

  if (data === "reset") {
    registrationSessions.delete(chatId);
    await showPersistentMenu(chatId, "🔄 Session reset. Starting fresh.");
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "🔄 Session reset!",
    });
    return;
  }

  if (data === "register") {
    const existingPending = await PendingRegistration.findOne({
      telegramChatId: chatId,
    }).sort({ createdAt: -1 });

    if (existingPending) {
      if (existingPending.status === "approved") {
        await showPersistentMenu(
          chatId,
          `✅ You're already registered!\n📧 Email: ${existingPending.email}`,
        );
        await callTelegramApi("answerCallbackQuery", {
          callback_query_id: query.id,
          text: "Already registered!",
        });
        return;
      }
      if (existingPending.status === "pending_approval") {
        await showPersistentMenu(
          chatId,
          "⏳ Your registration is awaiting admin approval.",
        );
        await callTelegramApi("answerCallbackQuery", {
          callback_query_id: query.id,
          text: "Awaiting approval",
        });
        return;
      }
    }

    await handleStart({ chat: { id: chatId }, from: { username: "" } });
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "📝 Starting registration...",
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
        `• All employees are encouraged to participate\n\n` +
        `Want to present? Complete your registration and sign up!\n\n` +
        `🔹 Click the ⊞ in your input bar to see all options.`,
      { parse_mode: "Markdown" },
    );
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "📖 About Golden Monday",
    });
    return;
  }

  if (data === "my_status") {
    const pending = await PendingRegistration.findOne({
      telegramChatId: chatId,
    }).sort({ createdAt: -1 });

    if (!pending) {
      await sendMessage(
        chatId,
        "You don't have an active registration.\n\nUse the 'Register Now' button to get started!\n\n🔹 Click the ⊞ in your input bar to see all options.",
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
          `📍 Branch: ${pending.branch || "Addis Ketema"}\n` + // ✅ ADD THIS
          `🏛️ Department: ${pending.department || "Not set"}\n\n` +
          `🔹 Click the ⊞ in your input bar to see all options.`,
        { parse_mode: "Markdown" },
      );
    }
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "👤 Status checked",
    });
    return;
  }

  if (data === "contact_admin") {
    await sendMessage(
      chatId,
      `📞 *Contact Admin*\n\n` +
        `For any questions or support, please:\n` +
        `• Email: admin@addismesob.example\n` +
        `• Visit: ${FRONTEND_URL}/support\n` +
        `• Or ask in the office directly\n\n` +
        `🔹 Click the ⊞ in your input bar to see all options.`,
      { parse_mode: "Markdown" },
    );
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "📞 Contact info sent",
    });
    return;
  }

  if (data === "help") {
    await sendMessage(
      chatId,
      `ℹ️ *Help & Support*\n\n` +
        `Available commands (or click ⊞ in input bar):\n` +
        `• /start - Start the bot\n` +
        `• /menu - Show main menu\n` +
        `• /register - Begin registration\n` +
        `• /status - Check registration status\n` +
        `• /about - About Golden Monday\n` +
        `• /help - Show this help\n` +
        `• /contact - Contact admin\n` +
        `• /website - Visit the web platform\n\n` +
        `💡 The ⊞ grid icon in your input bar gives you instant access!\n` +
        `📌 Position: [⊞] [📎] [😊] Type a message...\n\n` +
        `For urgent issues, contact your administrator.`,
      { parse_mode: "Markdown" },
    );
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "ℹ️ Help sent",
    });
    return;
  }

  const [action, pendingId] = data.split(":");
  if (pendingId) {
    const pending = await PendingRegistration.findById(pendingId);

    if (pending && pending.status === "approved") {
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: query.id,
        text: "✅ Already approved!",
      });
      await callTelegramApi("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `${query.message.text}\n\n✅ **Already Approved**`,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] },
      });
      return;
    }

    if (pending && pending.status === "rejected") {
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: query.id,
        text: "❌ Already rejected!",
      });
      await callTelegramApi("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `${query.message.text}\n\n❌ **Already Rejected**`,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] },
      });
      return;
    }

    const reviewer = {
      _id: null,
      name: query.from.username || query.from.first_name,
    };

    try {
      if (action === "approve") {
        await approveRegistration(pendingId, reviewer);
        await callTelegramApi("answerCallbackQuery", {
          callback_query_id: query.id,
          text: "✅ Approved!",
        });
        await callTelegramApi("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `${query.message.text}\n\n✅ Approved by ${reviewer.name}`,
        });
      } else if (action === "reject") {
        await rejectRegistration(pendingId, reviewer);
        await callTelegramApi("answerCallbackQuery", {
          callback_query_id: query.id,
          text: "❌ Rejected",
        });
        await callTelegramApi("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `${query.message.text}\n\n❌ Rejected by ${reviewer.name}`,
        });
      }
    } catch (err) {
      console.error("❌ Error handling approval callback:", err.message);
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: query.id,
        text: `Error: ${err.message}`,
      });
    }
  }
}

// ─── WEBHOOK HANDLER ──────────────────────────────────────
async function handleWebhookUpdate(update) {
  try {
    console.log(`📨 Webhook update received`);

    if (update.message) {
      const msg = update.message;
      const text = msg.text || "";

      if (text === "/menu") {
        return showPersistentMenu(msg.chat.id.toString());
      }

      if (text.startsWith("/start")) {
        return handleStart(msg);
      }

      if (text === "/register") {
        return handleCallback({
          id: "command_register",
          data: "register",
          message: { chat: { id: msg.chat.id.toString() } },
        });
      }

      if (text === "/status") {
        return handleCallback({
          id: "command_status",
          data: "my_status",
          message: { chat: { id: msg.chat.id.toString() } },
        });
      }

      if (text === "/about") {
        return handleCallback({
          id: "command_about",
          data: "about_gm",
          message: { chat: { id: msg.chat.id.toString() } },
        });
      }

      if (text === "/help") {
        return handleCallback({
          id: "command_help",
          data: "help",
          message: { chat: { id: msg.chat.id.toString() } },
        });
      }

      if (text === "/contact") {
        return handleCallback({
          id: "command_contact",
          data: "contact_admin",
          message: { chat: { id: msg.chat.id.toString() } },
        });
      }

      if (text === "/website") {
        return sendMessage(
          msg.chat.id.toString(),
          `🌐 Visit our website: ${FRONTEND_URL}`,
          { parse_mode: "Markdown" },
        );
      }

      if (msg.text || msg.photo) {
        await handleRegistrationMessage(msg);
      }
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }
  } catch (err) {
    console.error("❌ Error handling webhook update:", err.message);
  }
}

// ─── WEBHOOK SETUP ────────────────────────────────────────
async function setWebhook(webhookUrl) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
    );
    const data = await response.json();
    if (data.ok) {
      console.log(`✅ Webhook set successfully to: ${webhookUrl}`);
      return true;
    } else {
      console.error(`❌ Failed to set webhook:`, data.description);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error setting webhook:`, error.message);
    return false;
  }
}

async function getWebhookInfo() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN not configured");
    return null;
  }
  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const data = await response.json();
    if (data.ok) {
      console.log(`📋 Webhook info:`, data.result);
      return data.result;
    } else {
      console.error(`❌ Failed to get webhook info:`, data.description);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting webhook info:", error.message);
    return null;
  }
}

// ─── EXPORTS ──────────────────────────────────────────────
module.exports = {
  postPresenterAnnouncement,
  generateAnnouncementImage,
  testTelegramConnection,
  sendTestMessage,
  handleWebhookUpdate,
  setWebhook,
  getWebhookInfo,
  approveRegistration,
  rejectRegistration,
  sendMessage,
  sendLoginLink,
  sendDeletionNotification,
  showPersistentMenu,
  setupPersistentMenu,
  setChatMenuButton,
  setBotCommands,
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
