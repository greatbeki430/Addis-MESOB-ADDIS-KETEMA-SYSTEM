// backend/src/services/telegram/presenters.js
const GoldenMondaySession = require("../../models/GoldenMondaySession");
const { formatDate, sendMessage, callTelegramApi } = require("./utils");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_ADMIN_GROUP_ID = process.env.TELEGRAM_ADMIN_GROUP_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ─── PENDING CONFIRMATIONS ──────────────────────────────────────
const pendingPresenterConfirmations = new Map();

// ─── GENERATE ANNOUNCEMENT IMAGE ────────────────────────────────
async function generateAnnouncementImage(presenter, session) {
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
}

// ─── POST TO CHANNEL ─────────────────────────────────────────────
async function postPresenterAnnouncementToChannel(session) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ Telegram not configured - skipping post");
    return { postId: null, messageUrl: null };
  }

  try {
    const presenter = session.presenter;
    const dateFormatted = formatDate(session.date);

    const imageUrl = await generateAnnouncementImage(presenter, session);

    let message = `🎯 *Golden Monday - ${dateFormatted}*\n\n`;
    message += `👤 *Presenter:* ${presenter?.name || "TBD"}\n`;
    if (presenter?.department) {
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

    const presenterName = (presenter?.name || "GM").replace(/\s/g, "");
    message += `\n#GoldenMonday #AddisMESOB #${presenterName}`;

    let response;
    if (imageUrl) {
      response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
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
      response = await fetch(`${TELEGRAM_API}/sendMessage`, {
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

    console.log(`✅ Posted presenter announcement to channel: ${messageUrl}`);
    return { postId, messageUrl };
  } catch (error) {
    console.error("❌ Failed to post to Telegram channel:", error.message);
    return { postId: null, messageUrl: null };
  }
}

// ─── REQUEST PRESENTER AVAILABILITY ─────────────────────────────
async function requestPresenterAvailability(session) {
  const presenter = session.presenter;
  if (!presenter || !presenter.telegramChatId) {
    console.warn(`⚠️ Presenter ${presenter?.name} has no Telegram chat ID`);
    return;
  }

  const chatId = presenter.telegramChatId.toString();
  const sessionId = session._id.toString();

  const message =
    `🎯 *Golden Monday - ${formatDate(session.date)}*\n\n` +
    `Dear ${presenter.name},\n\n` +
    `You have been selected as the presenter for the upcoming Golden Monday session.\n\n` +
    `📖 *Topic:* ${session.presentationTitle || "Your choice"}\n` +
    `🕒 *Time:* 2:00 - 2:50 PM\n` +
    `📍 *Location:* Addis MESOB Conference Hall\n\n` +
    `Please confirm your availability within 48 hours:\n\n` +
    `✅ *I'm Available* - Click to confirm\n` +
    `❌ *Not Available* - Click and provide a reason\n\n` +
    `⚠️ If you don't respond within 48 hours, a replacement will be assigned.`;

  pendingPresenterConfirmations.set(sessionId, {
    sessionId,
    presenterId: presenter._id,
    chatId,
    requestedAt: new Date(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  try {
    await sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ I'm Available",
              callback_data: `presenter_available:${sessionId}`,
            },
            {
              text: "❌ Not Available",
              callback_data: `presenter_unavailable:${sessionId}`,
            },
          ],
          [
            {
              text: "📝 Suggest Topic",
              callback_data: `suggest_topic:${sessionId}`,
            },
          ],
          [{ text: "📞 Contact Admin", callback_data: "contact_admin" }],
        ],
        resize_keyboard: true,
      },
    });

    console.log(`📨 Availability request sent to ${presenter.name}`);

    if (TELEGRAM_ADMIN_GROUP_ID) {
      await sendMessage(
        TELEGRAM_ADMIN_GROUP_ID,
        `📨 *Presenter Availability Request Sent*\n\n` +
          `👤 Presenter: ${presenter.name}\n` +
          `📧 Email: ${presenter.email}\n` +
          `📅 Session: ${formatDate(session.date)}\n` +
          `📖 Topic: ${session.presentationTitle || "TBD"}\n\n` +
          `⏳ Waiting for response...\n` +
          `⏰ Expires: ${new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString()}`,
        { parse_mode: "Markdown" },
      );
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Failed to request presenter availability:",
      error.message,
    );
    return false;
  }
}

// ─── POST NEXT PRESENTER ANNOUNCEMENT ──────────────────────────
async function postNextPresenterAnnouncement() {
  try {
    const nextSession = await GoldenMondaySession.findOne({
      status: { $in: ["scheduled", "upcoming"] },
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .populate(
        "presenter",
        "name email department profilePhotoUrl telegramChatId",
      );

    if (!nextSession) {
      console.log("📢 No upcoming sessions found to announce");
      return null;
    }

    if (!nextSession.presenter) {
      console.log("📢 Next session has no presenter assigned yet");
      return null;
    }

    if (nextSession.announcementSent) {
      console.log(`📢 Session ${nextSession._id} already announced`);
      return null;
    }

    const announcement = await postPresenterAnnouncementToChannel(nextSession);

    if (announcement && announcement.postId) {
      nextSession.announcementSent = true;
      nextSession.announcementMessageId = announcement.postId;
      nextSession.availabilityRequestSentAt = new Date();
      nextSession.availabilityResponseDeadline = new Date(
        Date.now() + 48 * 60 * 60 * 1000,
      );
      await nextSession.save();

      await requestPresenterAvailability(nextSession);

      return announcement;
    }

    return null;
  } catch (error) {
    console.error(
      "❌ Failed to post next presenter announcement:",
      error.message,
    );
    return null;
  }
}

// ─── HANDLE PRESENTER AVAILABILITY RESPONSE ─────────────────────
async function handlePresenterAvailability(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  const [action, sessionId] = data.split(":");

  if (!sessionId) {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "❌ Invalid request",
    });
    return;
  }

  const session = await GoldenMondaySession.findById(sessionId).populate(
    "presenter",
    "name email department",
  );

  if (!session) {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "❌ Session not found",
    });
    return;
  }

  const pending = pendingPresenterConfirmations.get(sessionId);

  if (!pending) {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "❌ This request has expired. Please contact admin.",
    });
    return;
  }

  if (pending.expiresAt < new Date()) {
    pendingPresenterConfirmations.delete(sessionId);
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "❌ This request has expired. Please contact admin.",
    });
    return;
  }

  if (action === "presenter_available") {
    session.presenterConfirmed = true;
    session.presenterConfirmedAt = new Date();
    session.presenterStatus = "confirmed";
    await session.save();

    pendingPresenterConfirmations.delete(sessionId);

    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "✅ Thank you! You're confirmed as the presenter.",
    });

    await callTelegramApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: `${callbackQuery.message.text}\n\n✅ *You have confirmed your availability!*\n\nThank you for presenting at Golden Monday! 🎉`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📝 Suggest Topic",
              callback_data: `suggest_topic:${sessionId}`,
            },
          ],
        ],
      },
    });

    if (TELEGRAM_ADMIN_GROUP_ID) {
      await sendMessage(
        TELEGRAM_ADMIN_GROUP_ID,
        `✅ *Presenter Confirmed*\n\n` +
          `👤 Presenter: ${session.presenter?.name || "Unknown"}\n` +
          `📅 Session: ${formatDate(session.date)}\n` +
          `📖 Topic: ${session.presentationTitle || "TBD"}`,
        { parse_mode: "Markdown" },
      );
    }

    // Send preparation tips
    await sendMessage(
      chatId,
      `🎯 *Golden Monday - Preparation Tips*\n\n` +
        `Here are some tips to help you prepare:\n\n` +
        `📝 *Prepare your presentation:*\n` +
        `• Keep it engaging and interactive\n` +
        `• Duration: 45-50 minutes\n` +
        `• Use visuals if possible\n\n` +
        `💡 *Topic Suggestions:*\n` +
        `• Share your expertise\n` +
        `• Focus on practical knowledge\n` +
        `• Encourage participation\n\n` +
        `📎 *Resources:*\n` +
        `• ${FRONTEND_URL}/golden-monday/resources\n` +
        `• Contact admin for support`,
      { parse_mode: "Markdown" },
    );
  } else if (action === "presenter_unavailable") {
    pendingPresenterConfirmations.set(sessionId, {
      ...pending,
      step: "awaiting_reason",
    });

    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "Please provide a reason for not being available.",
    });

    await callTelegramApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: `${callbackQuery.message.text}\n\n❌ *You indicated you're not available.*\n\nPlease type your reason for not being able to present.\n\n⚠️ A valid reason is required and will be reviewed.`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "↩️ Go Back",
              callback_data: `presenter_back:${sessionId}`,
            },
          ],
        ],
      },
    });
  }
}

// ─── HANDLE PRESENTER UNAVAILABLE REASON ──────────────────────
async function handlePresenterUnavailableReason(msg) {
  const chatId = msg.chat.id.toString();
  const text = (msg.text || "").trim();

  // Find the pending session with awaiting_reason
  let sessionId = null;
  for (const [key, value] of pendingPresenterConfirmations) {
    if (value.chatId === chatId && value.step === "awaiting_reason") {
      sessionId = key;
      break;
    }
  }

  if (!sessionId) return;

  const pending = pendingPresenterConfirmations.get(sessionId);
  if (!pending) return;

  if (!text || text.length < 10) {
    await sendMessage(
      chatId,
      "❌ Please provide a valid reason (at least 10 characters).\n\nWhy can't you present?",
    );
    return;
  }

  const session = await GoldenMondaySession.findById(sessionId).populate(
    "presenter",
    "name email department",
  );

  if (!session) {
    await sendMessage(chatId, "❌ Session not found.");
    return;
  }

  session.presenterStatus = "declined";
  session.presenterDeclineReason = text;
  session.presenterDeclinedAt = new Date();
  await session.save();

  pendingPresenterConfirmations.delete(sessionId);

  await sendMessage(
    chatId,
    `✅ Your reason has been recorded.\n\n` +
      `📝 *Reason:* ${text}\n\n` +
      `An administrator will review this and follow up with you.`,
    { parse_mode: "Markdown" },
  );

  if (TELEGRAM_ADMIN_GROUP_ID) {
    await sendMessage(
      TELEGRAM_ADMIN_GROUP_ID,
      `⚠️ *Presenter Declined*\n\n` +
        `👤 Presenter: ${session.presenter?.name || "Unknown"}\n` +
        `📧 Email: ${session.presenter?.email || "Unknown"}\n` +
        `📅 Session: ${formatDate(session.date)}\n` +
        `📖 Topic: ${session.presentationTitle || "TBD"}\n\n` +
        `📝 *Reason given:*\n${text}\n\n` +
        `🔹 Please find a replacement presenter.`,
      { parse_mode: "Markdown" },
    );
  }
}

module.exports = {
  postNextPresenterAnnouncement,
  postPresenterAnnouncementToChannel,
  requestPresenterAvailability,
  handlePresenterAvailability,
  handlePresenterUnavailableReason,
  pendingPresenterConfirmations,
};
