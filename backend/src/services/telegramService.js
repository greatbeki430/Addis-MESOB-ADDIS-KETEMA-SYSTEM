// backend/src/services/telegramService.js
// Telegram bot integration for Golden Monday announcements
// + Employee self-registration (webhook version) - FULL VERSION

const crypto = require("crypto");
const PendingRegistration = require("../models/PendingRegistration");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const { createUserAccount } = require("../controllers/authController");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_ADMIN_GROUP_ID = process.env.TELEGRAM_ADMIN_GROUP_ID;
// Use environment variable or fallback to your actual frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";

// =====================================================================
// EXISTING CODE - Announcement functions (unchanged)
// =====================================================================

/**
 * Generate an announcement image (placeholder until AI service is ready)
 */
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

    console.log(`📤 Sending to Telegram:`);
    console.log(`   Chat ID: ${TELEGRAM_CHANNEL_ID}`);
    console.log(`   Message: ${message.substring(0, 100)}...`);

    let response;
    if (imageUrl) {
      response = await fetch(`${telegramApiUrl}/sendPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    }

    const data = await response.json();

    console.log(`📥 Telegram Response:`, JSON.stringify(data, null, 2));

    if (!data.ok) {
      console.error(`❌ Telegram API Error: ${data.description}`);
      return {
        postId: null,
        messageUrl: null,
        error: data.description,
      };
    }

    const postId = data.result?.message_id;

    if (!postId) {
      console.error(`❌ No message_id in response:`, data);
      return { postId: null, messageUrl: null };
    }

    const channelUsername = data.result?.chat?.username || "AddisMESOBGM";
    const messageUrl = `https://t.me/${channelUsername}/${postId}`;

    console.log(`✅ Posted to Telegram: ${messageUrl}`);
    return { postId, messageUrl };
  } catch (error) {
    console.error("❌ Failed to post to Telegram:", error.message);
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

/**
 * Send a test message directly (for debugging)
 */
const sendTestMessage = async () => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ Telegram not configured");
    return false;
  }

  try {
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    const response = await fetch(`${telegramApiUrl}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: "🔧 Test message from Addis MESOB Bot!\n\nIf you see this, the bot is working correctly!",
        parse_mode: "Markdown",
      }),
    });

    const data = await response.json();
    console.log(`📥 Test response:`, JSON.stringify(data, null, 2));

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
// REGISTRATION CODE - Webhook version with FULL EMPLOYEE DATA
// =====================================================================

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function callTelegramApi(method, payload) {
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
  HIRE_DATE: "awaiting_hire_date",
  PHOTO: "awaiting_photo",
  EMERGENCY_CONTACT: "awaiting_emergency_contact",
  OTP: "awaiting_otp",
};

// Helper: Parse skills from comma-separated string
function parseSkills(input) {
  return input
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function handleStart(msg) {
  const chatId = msg.chat.id.toString();

  const existingPending = await PendingRegistration.findOne({
    telegramChatId: chatId,
  }).sort({ createdAt: -1 });

  if (existingPending) {
    if (existingPending.status === "approved") {
      return sendMessage(
        chatId,
        `You're already registered ✅\nYou can log in with the email you registered with.`
      );
    }
    if (existingPending.status === "pending_approval") {
      return sendMessage(
        chatId,
        "Your registration is already submitted and awaiting admin approval. We'll message you here once it's reviewed."
      );
    }
    // pending_otp / rejected -> fall through, let them start a fresh one
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
    "Please provide the following information to register.\n" +
    "You can type 'skip' for optional fields.\n\n" +
    "📝 What is your full name?"
  );
}

async function handleRegistrationMessage(msg) {
  const chatId = msg.chat.id.toString();
  const session = registrationSessions.get(chatId);
  if (!session) return;

  const text = (msg.text || "").trim();

  // Handle photo uploads (special case)
  if (msg.photo && session.step === STEPS.PHOTO) {
    await handlePhotoUpload(msg, session, chatId);
    return;
  }

  switch (session.step) {
    case STEPS.NAME:
      session.data.name = text;
      session.step = STEPS.EMAIL;
      sendMessage(
        chatId,
        "📧 What is your email address? (this will be your login)"
      );
      break;

    case STEPS.EMAIL: {
      const email = text.toLowerCase();
      const User = require("../models/User");
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendMessage(
          chatId,
          "❌ That email is already registered. Please send a different email, or contact an admin if this is your account."
        );
      }
      session.data.email = email;
      session.step = STEPS.PHONE;
      sendMessage(chatId, '📱 What is your phone number? (or type "skip")');
      break;
    }

    case STEPS.PHONE: {
      session.data.phone = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.DEPARTMENT;
      sendMessage(
        chatId,
        "🏛️ What is your department? (e.g., IT, HR, Finance)\n" +
        "Or type 'skip' to skip this step"
      );
      break;
    }

    case STEPS.DEPARTMENT: {
      session.data.department = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.POSITION;
      sendMessage(
        chatId,
        "💼 What is your position/title? (e.g., Team Leader, Developer)\n" +
        "Or type 'skip' to skip this step"
      );
      break;
    }

    case STEPS.POSITION: {
      session.data.position = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.SKILLS;
      sendMessage(
        chatId,
        "🛠️ What are your skills? (comma-separated, e.g., JavaScript, React, MongoDB)\n" +
        "Or type 'skip' to skip this step"
      );
      break;
    }

    case STEPS.SKILLS: {
      if (text.toLowerCase() === "skip") {
        session.data.skills = [];
      } else {
        session.data.skills = parseSkills(text);
      }
      session.step = STEPS.HIRE_DATE;
      sendMessage(
        chatId,
        "📅 When was your hire date? (format: YYYY-MM-DD, e.g., 2024-01-15)\n" +
        "Or type 'skip' to skip this step"
      );
      break;
    }

    case STEPS.HIRE_DATE: {
      if (text.toLowerCase() === "skip") {
        session.data.hireDate = null;
      } else {
        try {
          const date = new Date(text);
          if (isNaN(date.getTime())) {
            return sendMessage(
              chatId,
              "❌ Invalid date format. Please use YYYY-MM-DD (e.g., 2024-01-15) or type 'skip'"
            );
          }
          session.data.hireDate = date;
        } catch {
          return sendMessage(
            chatId,
            "❌ Invalid date format. Please use YYYY-MM-DD or type 'skip'"
          );
        }
      }
      session.step = STEPS.PHOTO;
      sendMessage(
        chatId,
        "📸 Upload your profile photo (optional).\n" +
        "Click the attachment icon (📎) and select a photo.\n" +
        "Or type 'skip' to skip this step"
      );
      break;
    }

    case STEPS.PHOTO: {
      // Photo upload is handled separately in handlePhotoUpload
      // This case is for text responses (skip)
      if (text.toLowerCase() === "skip") {
        session.data.photoUrl = "";
        session.step = STEPS.EMERGENCY_CONTACT;
        sendMessage(
          chatId,
          "👤 What is your emergency contact? (name and phone number)\n" +
          "Or type 'skip' to skip this step"
        );
      } else {
        sendMessage(
          chatId,
          "📸 Please upload a photo using the attachment button (📎) or type 'skip'"
        );
      }
      break;
    }

    case STEPS.EMERGENCY_CONTACT: {
      session.data.emergencyContact = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.OTP;
      
      const otpCode = generateOtp();
      const pending = await PendingRegistration.create({
        telegramChatId: chatId,
        telegramUsername: session.data.telegramUsername,
        name: session.data.name,
        email: session.data.email,
        phone: session.data.phone,
        department: session.data.department || "",
        position: session.data.position || "",
        skills: session.data.skills || [],
        hireDate: session.data.hireDate || null,
        profilePhotoUrl: session.data.photoUrl || "",
        emergencyContact: session.data.emergencyContact || "",
        status: "pending_otp",
        otpCode,
        otpExpiresAt: otpExpiry(10),
      });

      session.pendingId = pending._id.toString();
      sendMessage(
        chatId,
        `✅ Thanks! Your verification code is: *${otpCode}*\n\n` +
        `Reply with this code to confirm (valid for 10 minutes).`
      );
      break;
    }

    case STEPS.OTP: {
      const pending = await PendingRegistration.findById(
        session.pendingId,
      ).select("+otpCode +otpExpiresAt");
      
      if (!pending) {
        registrationSessions.delete(chatId);
        return sendMessage(
          chatId,
          "❌ Something went wrong — please send /start to try again."
        );
      }
      
      if (!pending.otpExpiresAt || pending.otpExpiresAt < new Date()) {
        registrationSessions.delete(chatId);
        return sendMessage(
          chatId,
          "❌ That code expired. Please send /start to try again."
        );
      }
      
      if (text !== pending.otpCode) {
        return sendMessage(
          chatId,
          "❌ That code doesn't match — please check and try again."
        );
      }

      pending.otpVerified = true;
      pending.status = "pending_approval";
      pending.otpCode = undefined;
      pending.otpExpiresAt = undefined;
      await pending.save();

      registrationSessions.delete(chatId);
      sendMessage(
        chatId,
        "✅ Verified! Your registration has been sent for admin approval.\n\n" +
        "We'll message you here once it's reviewed."
      );

      notifyAdminsForApproval(pending);
      break;
    }
  }
}

async function handlePhotoUpload(msg, session, chatId) {
  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await callTelegramApi("getFile", { file_id: fileId });
    
    if (!file.ok) {
      sendMessage(chatId, "❌ Failed to get photo. Please try again or type 'skip'");
      return;
    }

    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.result.file_path}`;
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    
    // Store as base64 for now (you can implement Cloudinary upload later)
    const base64Photo = Buffer.from(buffer).toString("base64");
    session.data.photoUrl = `data:image/jpeg;base64,${base64Photo}`;
    
    sendMessage(chatId, "✅ Photo uploaded successfully!");
    session.step = STEPS.EMERGENCY_CONTACT;
    sendMessage(
      chatId,
      "👤 What is your emergency contact? (name and phone number)\n" +
      "Or type 'skip' to skip this step"
    );
  } catch (error) {
    console.error("❌ Photo upload error:", error.message);
    sendMessage(chatId, "❌ Failed to upload photo. Please type 'skip' to continue.");
  }
}

async function notifyAdminsForApproval(pending) {
  if (!TELEGRAM_ADMIN_GROUP_ID) {
    console.warn(
      "[telegramService] TELEGRAM_ADMIN_GROUP_ID not set — cannot notify admins."
    );
    return;
  }

  const text =
    `📋 *New Employee Registration*\n\n` +
    `👤 *Name:* ${pending.name}\n` +
    `📧 *Email:* ${pending.email}\n` +
    `📱 *Phone:* ${pending.phone || "Not provided"}\n` +
    `🏛️ *Department:* ${pending.department || "Not provided"}\n` +
    `💼 *Position:* ${pending.position || "Not provided"}\n` +
    `🛠️ *Skills:* ${pending.skills?.length ? pending.skills.join(", ") : "Not provided"}\n` +
    `📅 *Hire Date:* ${pending.hireDate ? new Date(pending.hireDate).toLocaleDateString() : "Not provided"}\n` +
    `👤 *Telegram:* @${pending.telegramUsername || "n/a"}\n` +
    `🖼️ *Photo:* ${pending.profilePhotoUrl ? "✅ Uploaded" : "❌ Not uploaded"}`;

  await sendMessage(TELEGRAM_ADMIN_GROUP_ID, text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve:${pending._id}` },
          { text: "❌ Reject", callback_data: `reject:${pending._id}` },
        ],
      ],
    },
  });
}

// =====================================================================
// NEW FUNCTIONS: Send Login Link and Deletion Notification
// =====================================================================

/**
 * Send login link to a user after approval
 * @param {string} chatId - Telegram chat ID
 * @param {string} email - User's email
 * @param {string} tempPassword - Temporary password
 */
async function sendLoginLink(chatId, email, tempPassword) {
  const loginUrl = FRONTEND_URL;
  
  const message = 
    `✅ **Your account has been approved!**\n\n` +
    `🔗 **Login Link:** ${loginUrl}/login\n\n` +
    `📧 **Email:** ${email}\n` +
    `🔑 **Temporary Password:** ${tempPassword}\n\n` +
    `⚠️ Please log in and change your password immediately.\n\n` +
    `If you have any issues, please contact your administrator.`;

  await sendMessage(chatId, message);
}

/**
 * Send employee deletion notification
 * @param {string} chatId - Telegram chat ID
 * @param {string} name - Employee name
 * @param {string} reason - Reason for deletion
 */
async function sendDeletionNotification(chatId, name, reason = "Your account has been removed by an administrator.") {
  const loginUrl = FRONTEND_URL;
  
  const message = 
    `⚠️ **Account Deletion Notification**\n\n` +
    `Dear ${name},\n\n` +
    `${reason}\n\n` +
    `If you believe this is a mistake, please contact your administrator.\n\n` +
    `To re-register, please send /start to this bot again.\n\n` +
    `🔄 **Register Here:** https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'addis_mesob_gm_bot'}\n\n` +
    `🔗 **Login URL:** ${loginUrl}`;

  await sendMessage(chatId, message);
}

// =====================================================================
// Shared approval logic - FIXED with error handling and roster creation
// =====================================================================

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
    
    const user = await createUserAccount({
      name: pending.name,
      email: pending.email,
      password: tempPassword,
      role: "employee",
      phone: pending.phone,
      telegramChatId: pending.telegramChatId,
    });

    console.log("✅ User created with ID:", user._id);

    // 🆕 ADD TO GOLDEN MONDAY ROSTER WITH ALL FIELDS
    console.log("📋 Adding user to Golden Monday roster...");
    try {
      const existingPresenter = await GoldenMondayPresenter.findOne({ user: user._id });
      if (!existingPresenter) {
        const presenter = await GoldenMondayPresenter.create({
          user: user._id,
          name: pending.name,
          email: pending.email,
          department: pending.department || "",
          position: pending.position || "",
          phone: pending.phone || "",
          profilePhotoUrl: pending.profilePhotoUrl || "",
          hireDate: pending.hireDate || null,
          skills: pending.skills || [],
          emergencyContact: pending.emergencyContact || "",
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
      console.error("⚠️ Failed to add to Golden Monday roster:", rosterError.message);
      // Don't fail the whole approval, just log the error
    }

    pending.status = "approved";
    pending.createdUser = user._id;
    pending.reviewedBy = reviewer?._id || undefined;
    pending.reviewedByName = reviewer?.name || "unknown";
    pending.reviewedAt = new Date();
    await pending.save();

    // 🆕 SEND LOGIN LINK WITH PASSWORD
    console.log("📤 Sending login link to:", pending.telegramChatId);
    await sendLoginLink(pending.telegramChatId, pending.email, tempPassword);

    return { pending, user };
  } catch (error) {
    console.error("❌ Approval error:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // Send error to admin group
    if (TELEGRAM_ADMIN_GROUP_ID) {
      await sendMessage(
        TELEGRAM_ADMIN_GROUP_ID,
        `❌ Approval failed for ${pending.email}:\n${error.message}`
      );
    }
    throw error;
  }
}

async function rejectRegistration(pendingId, reviewer, reason) {
  const pending = await PendingRegistration.findById(pendingId);
  if (!pending) throw new Error("Registration not found");

  pending.status = "rejected";
  pending.rejectionReason = reason || "";
  pending.reviewedBy = reviewer?._id || undefined;
  pending.reviewedByName = reviewer?.name || "unknown";
  pending.reviewedAt = new Date();
  await pending.save();

  await sendMessage(
    pending.telegramChatId,
    "Your registration could not be approved. Please contact HR/admin for details."
  );

  return pending;
}

async function handleCallbackQuery(query) {
  const [action, pendingId] = query.data.split(":");
  
  // 🔍 Check if registration already has a status
  const pending = await PendingRegistration.findById(pendingId);
  
  // If already approved, update the message and remove buttons
  if (pending && pending.status === "approved") {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "This registration is already approved!",
    });
    await callTelegramApi("editMessageText", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n✅ **Already Approved** (via admin panel)`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [] // Remove buttons
      }
    });
    return;
  }

  // If already rejected, update the message and remove buttons
  if (pending && pending.status === "rejected") {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: query.id,
      text: "This registration is already rejected!",
    });
    await callTelegramApi("editMessageText", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n❌ **Already Rejected** (via admin panel)`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [] // Remove buttons
      }
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
        text: "Approved",
      });
      await callTelegramApi("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: `${query.message.text}\n\n✅ Approved by ${reviewer.name}`,
      });
    } else if (action === "reject") {
      await rejectRegistration(pendingId, reviewer);
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: query.id,
        text: "Rejected",
      });
      await callTelegramApi("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
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

/**
 * WEBHOOK HANDLER - Replaces pollLoop()
 * This gets called by Telegram via POST /api/telegram/webhook
 */
async function handleWebhookUpdate(update) {
  try {
    console.log(`📨 Webhook update received:`, JSON.stringify(update, null, 2));

    if (update.message) {
      const msg = update.message;
      if (msg.text?.startsWith("/start")) {
        await handleStart(msg);
      } else {
        await handleRegistrationMessage(msg);
      }
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (err) {
    console.error("❌ Error handling webhook update:", err.message);
  }
}

/**
 * Set the webhook URL with Telegram
 * Call this once after deployment
 */
async function setWebhook(webhookUrl) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
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

/**
 * Get current webhook status
 */
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

// =====================================================================
// EXPORTS - Updated to webhook version
// =====================================================================

module.exports = {
  // Existing exports
  postPresenterAnnouncement,
  generateAnnouncementImage,
  testTelegramConnection,
  sendTestMessage,

  // New webhook exports (replaces polling exports)
  handleWebhookUpdate,
  setWebhook,
  getWebhookInfo,

  // Registration management
  approveRegistration,
  rejectRegistration,
  sendMessage,

  // 🆕 New functions
  sendLoginLink,
  sendDeletionNotification,

  // Deprecated - kept for backward compatibility but does nothing
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
