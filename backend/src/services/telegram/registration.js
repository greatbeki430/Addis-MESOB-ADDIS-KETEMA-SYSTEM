// backend/src/services/telegram/registration.js
const PendingRegistration = require("../../models/PendingRegistration");
const GoldenMondayPresenter = require("../../models/GoldenMondayPresenter");
const User = require("../../models/User");
const { createUserAccount } = require("../../controllers/authController");
const {
  generateOtp,
  otpExpiry,
  generateTempPassword,
  parseSkills,
  sendMessage,
  callTelegramApi,
} = require("./utils");
const { BRANCHES, STEPS } = require("./constants");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";
const TELEGRAM_ADMIN_GROUP_ID = process.env.TELEGRAM_ADMIN_GROUP_ID;

const registrationSessions = new Map();

// ─── SHOW BRANCH SELECTION ──────────────────────────────────────
function showBranchSelection(chatId) {
  const branchButtons = [];
  for (let i = 0; i < BRANCHES.length; i += 3) {
    const row = [];
    for (let j = i; j < Math.min(i + 3, BRANCHES.length); j++) {
      const branch = BRANCHES[j];
      row.push({
        text: `📍 ${branch}`,
        callback_data: `branch:${branch.replace(/\s/g, "_")}`,
      });
    }
    branchButtons.push(row);
  }
  branchButtons.push([
    { text: "⏭️ Skip (Default: Addis Ketema)", callback_data: "branch:skip" },
  ]);

  return sendMessage(chatId, "📍 Please select your branch location:", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: branchButtons,
      resize_keyboard: true,
    },
  });
}

// ─── START REGISTRATION ─────────────────────────────────────────
async function handleStartRegistration(msg) {
  const chatId = msg.chat.id.toString();

  console.log(`📝 Starting registration for chat: ${chatId}`);

  const existingPending = await PendingRegistration.findOne({
    telegramChatId: chatId,
  }).sort({ createdAt: -1 });

  if (existingPending) {
    if (existingPending.status === "approved") {
      return sendMessage(
        chatId,
        `✅ You're already registered!\n📧 Email: ${existingPending.email}\n🔗 Login: ${FRONTEND_URL}/login`,
      );
    }
    if (existingPending.status === "pending_approval") {
      return sendMessage(
        chatId,
        "⏳ Your registration is awaiting admin approval.\nYou'll receive a notification once approved.",
      );
    }
  }

  const user = await GoldenMondayPresenter.findOne({ telegramChatId: chatId });
  if (user) {
    return sendMessage(
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

  return sendMessage(
    chatId,
    "👋 Welcome to Addis MESOB employee registration!\n\n" +
      "Please provide the following information to register.\n\n" +
      "📝 What is your full name?\n\n" +
      "🔹 You can always click the ⊞ menu button in your input bar.\n" +
      "🔹 Or type /menu to return to the main menu.",
    { parse_mode: "Markdown" },
  );
}

// ─── HANDLE REGISTRATION MESSAGE ───────────────────────────────
async function handleRegistrationMessage(msg) {
  const chatId = msg.chat.id.toString();
  const session = registrationSessions.get(chatId);
  if (!session) return;

  const text = (msg.text || "").trim();

  if (text === "/menu" || text === "/start") {
    registrationSessions.delete(chatId);
    return sendMessage(
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
          "❌ Please enter a valid name (at least 2 characters).\n\nType /menu to cancel.",
        );
      }
      session.data.name = text;
      session.step = STEPS.EMAIL;
      return sendMessage(
        chatId,
        "📧 What is your email address?\n\nThis will be your login email.\n\nType /menu to cancel.",
        { parse_mode: "Markdown" },
      );

    case STEPS.EMAIL: {
      const email = text.toLowerCase();
      if (!email.includes("@") || !email.includes(".")) {
        return sendMessage(
          chatId,
          "❌ Please enter a valid email address (e.g., name@domain.com).\n\nType /menu to cancel.",
        );
      }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendMessage(
          chatId,
          "❌ That email is already registered. Please send a different email.\n\nType /menu to cancel.",
        );
      }
      session.data.email = email;
      session.step = STEPS.PHONE;
      return sendMessage(
        chatId,
        "📱 What is your phone number?\n\nFormat: +251 9XX XXX XXX\nOr type 'skip' to skip\n\nType /menu to cancel.",
        { parse_mode: "Markdown" },
      );
    }

    case STEPS.PHONE: {
      session.data.phone = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.BRANCH;
      return showBranchSelection(chatId);
    }

    case STEPS.DEPARTMENT: {
      session.data.department = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.POSITION;
      return sendMessage(
        chatId,
        "💼 What is your position/title?\n\nExamples: Team Leader, Developer, Manager\nOr type 'skip' to skip\n\nType /menu to cancel.",
        { parse_mode: "Markdown" },
      );
    }

    case STEPS.POSITION: {
      session.data.position = text.toLowerCase() === "skip" ? "" : text;
      session.step = STEPS.SKILLS;
      return sendMessage(
        chatId,
        "🛠️ What are your skills?\n\nComma-separated: JavaScript, React, MongoDB\nOr type 'skip' to skip\n\nType /menu to cancel.",
        { parse_mode: "Markdown" },
      );
    }

    case STEPS.SKILLS: {
      if (text.toLowerCase() === "skip") {
        session.data.skills = [];
      } else {
        session.data.skills = parseSkills(text);
      }
      session.step = STEPS.PHOTO;
      return sendMessage(
        chatId,
        "📸 Upload your profile photo\n\nClick the attachment icon (📎) and select a photo.\nOr type 'skip' to skip\n\nType /menu to cancel.",
        { parse_mode: "Markdown" },
      );
    }

    case STEPS.PHOTO: {
      if (text.toLowerCase() === "skip") {
        session.data.photoUrl = "";
        await completeRegistration(chatId, session);
      } else {
        return sendMessage(
          chatId,
          "📸 Please upload a photo using the attachment button (📎) or type 'skip'\n\nType /menu to cancel.",
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

// ─── PHOTO UPLOAD ──────────────────────────────────────────────
async function handlePhotoUpload(msg, session, chatId) {
  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await callTelegramApi("getFile", { file_id: fileId });

    if (!file.ok) {
      sendMessage(
        chatId,
        "❌ Failed to get photo. Please try again or type 'skip'\n\nType /menu to cancel.",
      );
      return;
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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
      "❌ Failed to upload photo. Please type 'skip' to continue.\n\nType /menu to cancel.",
    );
  }
}

// ─── COMPLETE REGISTRATION ─────────────────────────────────────
async function completeRegistration(chatId, session) {
  const otpCode = generateOtp();
  const pending = await PendingRegistration.create({
    telegramChatId: chatId,
    telegramUsername: session.data.telegramUsername,
    name: session.data.name,
    email: session.data.email,
    phone: session.data.phone || "",
    branch: session.data.branch || "Addis Ketema",
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

  return sendMessage(
    chatId,
    `✅ Registration almost complete!\n\nYour verification code is: *${otpCode}*\n\nReply with this code to confirm (valid for 10 minutes).\n\nType /menu to cancel.`,
    { parse_mode: "Markdown" },
  );
}

// ─── OTP VERIFICATION ──────────────────────────────────────────
async function handleOtpVerification(chatId, session, text) {
  const pending = await PendingRegistration.findById(session.pendingId).select(
    "+otpCode +otpExpiresAt",
  );

  if (!pending) {
    registrationSessions.delete(chatId);
    return sendMessage(chatId, "❌ Something went wrong. Please try again.");
  }

  if (!pending.otpExpiresAt || pending.otpExpiresAt < new Date()) {
    registrationSessions.delete(chatId);
    return sendMessage(chatId, "❌ That code expired. Please try again.");
  }

  if (text !== pending.otpCode) {
    return sendMessage(
      chatId,
      "❌ That code doesn't match — please check and try again.\n\nType /menu to cancel.",
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
    "✅ Registration Complete!\nYour registration has been sent for admin approval.\nYou'll receive a notification once approved.",
  );

  await notifyAdminsForApproval(pending);
}

// ─── ADMIN NOTIFICATION ────────────────────────────────────────
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
    `📍 Branch: ${pending.branch || "Addis Ketema"}\n` +
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

// ─── APPROVE REGISTRATION ──────────────────────────────────────
async function approveRegistration(pendingId, reviewer) {
  const pending = await PendingRegistration.findById(pendingId);
  if (!pending) throw new Error("Registration not found");
  if (pending.status !== "pending_approval") {
    throw new Error(`Cannot approve from status "${pending.status}"`);
  }

  // ✅ Generate temporary password
  const tempPassword = generateTempPassword();

  // ✅ DEBUG: Log the password
  console.log(`🔑 Generated password for ${pending.email}: "${tempPassword}"`);

  // ✅ Create user account with ALL fields
  const user = await createUserAccount({
    name: pending.name,
    email: pending.email,
    password: tempPassword,
    role: "employee",
    phone: pending.phone,
    telegramChatId: pending.telegramChatId,
    profilePhotoUrl: pending.profilePhotoUrl || "",
    branch: pending.branch || "Addis Ketema",
    position: pending.position || "", // ✅ ADDED
  });

  // ✅ Verify user was created correctly
  const savedUser = await User.findById(user._id);
  console.log(`✅ User created: ${savedUser.email}`);
  console.log(`✅ Password hashed: ${savedUser.password.startsWith("$2b$")}`);

  // Add to Golden Monday roster
  const existingPresenter = await GoldenMondayPresenter.findOne({
    user: user._id,
  });
  if (!existingPresenter) {
    await GoldenMondayPresenter.create({
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
  }

  pending.status = "approved";
  pending.createdUser = user._id;
  pending.reviewedBy = reviewer?._id || undefined;
  pending.reviewedByName = reviewer?.name || "unknown";
  pending.reviewedAt = new Date();
  await pending.save();

  // Send login credentials to the user
  await sendLoginCredentials(pending.telegramChatId, {
    email: pending.email,
    password: tempPassword,
    name: pending.name,
    department: pending.department || "",
    position: pending.position || "",
    phone: pending.phone || "",
    branch: pending.branch || "Addis Ketema",
  });

  return { pending, user };
}

// ─── REJECT REGISTRATION ──────────────────────────────────────
async function rejectRegistration(pendingId, reviewer, reason) {
  const pending = await PendingRegistration.findById(pendingId);
  if (!pending) throw new Error("Registration not found");

  pending.status = "rejected";
  pending.rejectionReason = reason || "";
  pending.reviewedBy = reviewer?._id || undefined;
  pending.reviewedByName = reviewer?.name || "unknown";
  pending.reviewedAt = new Date();
  await pending.save();

  sendMessage(
    pending.telegramChatId,
    "❌ Your registration could not be approved.\nPlease contact HR/admin for details.",
  );

  return pending;
}

// ─── SEND LOGIN CREDENTIALS ────────────────────────────────────
async function sendLoginCredentials(chatId, userData) {
  const { email, password, name, department, position, phone, branch } =
    userData;

  // ✅ DEBUG: Log the password being sent
  console.log(`📤 Sending credentials to ${email}: password = "${password}"`);

  const message =
    `✅ *Account Approved!* 🎉\n\n` +
    `📋 *Your Account Details:*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Name:* ${name}\n` +
    `📧 *Email:* ${email}\n` +
    `🔑 *Password:* ${password}\n` +
    `🏛️ *Department:* ${department || "Not set"}\n` +
    `💼 *Position:* ${position || "Not set"}\n` +
    `📱 *Phone:* ${phone || "Not set"}\n` +
    `📍 *Branch:* ${branch || "Addis Ketema"}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🔗 Login: ${FRONTEND_URL}/login\n\n` +
    `⚠️ *Please change your password after logging in.*\n\n` +
    `📌 Click the ⊞ in your input bar to see all options.`;

  try {
    await sendMessage(chatId, message, { parse_mode: "Markdown" });
    console.log(`✅ Login credentials sent to ${chatId}`);
  } catch (error) {
    console.error("❌ Failed to send credentials:", error.message);
  }
}

// ─── HANDLE BRANCH SELECTION ──────────────────────────────────
async function handleBranchSelection(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const branchValue = data.replace("branch:", "");
  const session = registrationSessions.get(chatId.toString());

  if (!session) {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "❌ Session expired. Please start over.",
    });
    return;
  }

  if (branchValue === "skip") {
    session.data.branch = "Addis Ketema";
  } else {
    const branchName = branchValue.replace(/_/g, " ");
    const matchedBranch = BRANCHES.find(
      (b) => b.toLowerCase() === branchName.toLowerCase(),
    );
    session.data.branch = matchedBranch || branchName;
  }

  session.step = STEPS.DEPARTMENT;

  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQuery.id,
    text: `✅ Branch selected: ${session.data.branch}`,
  });

  await callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: `✅ Branch selected: ${session.data.branch}\n\n🏛️ What is your department?\n\nExamples: IT, HR, Finance, Customer Service\nOr type 'skip' to skip\n\nType /menu to cancel.`,
    parse_mode: "Markdown",
  });
}

module.exports = {
  registrationSessions,
  handleStartRegistration,
  handleRegistrationMessage,
  handleBranchSelection,
  handlePhotoUpload,
  completeRegistration,
  handleOtpVerification,
  approveRegistration,
  rejectRegistration,
  sendLoginCredentials,
  showBranchSelection,
};
