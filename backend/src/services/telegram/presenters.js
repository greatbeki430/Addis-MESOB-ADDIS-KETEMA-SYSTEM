// backend/src/services/telegram/presenters.js
// undici's FormData is worth importing explicitly because globalThis.FormData
// has had subtle incompatibilities across Node versions. But Blob is stable
// as a global since Node 18, so just use the native one. Destructuring both
// from undici caused 'Blob is not a constructor' on the current Node 26
// runtime — undici's Blob export is undefined in the resolved version.
const GoldenMondaySession = require("../../models/GoldenMondaySession");
const { formatDate, sendMessage, callTelegramApi } = require("./utils");
const {
  LABELS,
  formatDateForLang,
  buildPresenterHashtag,
  translateDynamicStrings,
} = require("./trilingual");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_ADMIN_GROUP_ID = process.env.TELEGRAM_ADMIN_GROUP_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Telegram caps message bodies at 4096 characters. Leave a small
// headroom because `sendPhoto` uses part of the limit for the caption.
const TELEGRAM_MAX_BODY = 4000;

// ─── PENDING CONFIRMATIONS ──────────────────────────────────────
const pendingPresenterConfirmations = new Map();

// ─── GENERATE ANNOUNCEMENT IMAGE ────────────────────────────────
async function generateAnnouncementImage(presenter, session) {
  try {
    if (
      presenter?.profilePhotoUrl &&
      /^https?:\/\//i.test(presenter.profilePhotoUrl)
    ) {
      return presenter.profilePhotoUrl;
    }
    return null;
  } catch (err) {
    console.error("Failed to generate announcement image:", err.message);
    return null;
  }
}

// ─── BUILD TRILINGUAL MESSAGE BODY ──────────────────────────────
// Assembles the three language sections in the order:
//   Amharic → English → Afaan Oromoo
// Fixed labels come from the LABELS map; dynamic strings (title,
// description, suggested topics) are translated via the AI service
// with per-string fallback to the original on any failure.
async function buildTrilingualAnnouncement(session) {
  const presenter = session.presenter;

  const title = session.presentationTitle || "";
  const description = session.presentationDescription || "";
  const topics = Array.isArray(session.suggestedTopics)
    ? session.suggestedTopics
    : [];

  // Kick off all translation calls in parallel.
  const [[titleAm], [titleOm], [descAm], [descOm], topicsAm, topicsOm] =
    await Promise.all([
      translateDynamicStrings([title], "am"),
      translateDynamicStrings([title], "om"),
      translateDynamicStrings([description], "am"),
      translateDynamicStrings([description], "om"),
      translateDynamicStrings(topics, "am"),
      translateDynamicStrings(topics, "om"),
    ]);

  const buildSection = (lang, dynamic) => {
    const L = LABELS[lang];
    const dateStr = formatDateForLang(session.date, lang);
    const presenterName = presenter?.name || "TBD";
    const presenterHashtag = buildPresenterHashtag(presenterName);

    const lines = [];
    lines.push(`🎯 *${L.header} — ${dateStr}*`);
    lines.push("");
    lines.push(`👤 *${L.presenter}:* ${presenterName}`);
    if (presenter?.department) {
      lines.push(`🏛️ *${L.department}:* ${presenter.department}`);
    }
    if (dynamic.title) {
      lines.push(`📖 *${L.topic}:* "${dynamic.title}"`);
    }
    if (dynamic.description) {
      lines.push(`📝 *${L.description}:* ${dynamic.description}`);
    }
    lines.push("");
    lines.push(`🕒 *${L.time}:* ${L.timeValue}`);
    lines.push(`📍 *${L.location}:* ${L.locationValue}`);
    if (dynamic.topics.length > 0) {
      lines.push("");
      lines.push(`💡 *${L.aiTopics}:*`);
      dynamic.topics.forEach((topic, i) => {
        lines.push(`   ${i + 1}. ${topic}`);
      });
    }
    lines.push("");
    lines.push(`${L.hashtags.join(" ")} ${presenterHashtag}`);
    return lines.join("\n");
  };

  const sectionAm = buildSection("am", {
    title: titleAm || title,
    description: descAm || description,
    topics: topicsAm.length ? topicsAm : topics,
  });

  const sectionEn = buildSection("en", {
    title,
    description,
    topics,
  });

  const sectionOm = buildSection("om", {
    title: titleOm || title,
    description: descOm || description,
    topics: topicsOm.length ? topicsOm : topics,
  });

  const divider = "\n\n━━━━━━━━━━━━━━━━━━\n\n";
  return sectionAm + divider + sectionEn + divider + sectionOm;
}

// ─── POST TO CHANNEL ─────────────────────────────────────────────
async function postPresenterAnnouncementToChannel(session) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ Telegram not configured - skipping post");
    return { postId: null, messageUrl: null };
  }

  try {
    const presenter = session.presenter;
    const imageUrl = await generateAnnouncementImage(presenter, session);

    // Build the trilingual body. Falls back to per-string originals
    // on any translation failure — never throws.
    let message = await buildTrilingualAnnouncement(session);

    // Safety trim: Telegram rejects bodies over 4096 characters. The
    // announcement can approach that with a long description + many
    // topics in three languages.
    if (message.length > TELEGRAM_MAX_BODY) {
      console.warn(
        `[presenters] trilingual message is ${message.length} chars, trimming to ${TELEGRAM_MAX_BODY}`,
      );
      message =
        message.slice(0, TELEGRAM_MAX_BODY - 40).trimEnd() +
        "\n\n_… (truncated)_";
    }

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

      const photoResult = await response.clone().json();
      if (!photoResult.ok) {
        console.warn(
          `⚠️ sendPhoto failed (${photoResult.description}), falling back to text`,
        );
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
// Accepts `{ force }`. Also hydrates a bare ObjectId presenter.
async function requestPresenterAvailability(session, { force = false } = {}) {
  // Hydrate presenter if it's just an ObjectId
  let presenter = session.presenter;
  if (presenter && !presenter.name) {
    const User = require("../../models/User");
    presenter = await User.findById(presenter);
    if (!presenter) {
      console.warn(`⚠️ Presenter ${session.presenter} not found`);
      return false;
    }
  }

  if (!presenter) {
    console.warn(`⚠️ No presenter on session ${session._id}`);
    return false;
  }

  const sessionId = session._id.toString();

  // On force, drop any stale entry so the deadline resets
  if (force) {
    pendingPresenterConfirmations.delete(sessionId);
  }

  const messageBody =
    `🎯 Golden Monday - ${formatDate(session.date)}\n\n` +
    `Dear ${presenter.name},\n\n` +
    `You have been selected as the presenter for the upcoming Golden Monday session.\n\n` +
    `📖 Topic: ${session.presentationTitle || "Your choice"}\n` +
    `🕒 Time: 2:00 - 2:50 PM\n` +
    `📍 Location: Addis MESOB Conference Hall\n\n` +
    `Please confirm your availability within 48 hours:\n\n` +
    `✅ I'm Available - Click to confirm\n` +
    `❌ Not Available - Click and provide a reason\n\n` +
    `⚠️ If you don't respond within 48 hours, a replacement will be assigned.`;

  if (presenter.telegramChatId) {
    try {
      const chatId = presenter.telegramChatId.toString();

      pendingPresenterConfirmations.set(sessionId, {
        sessionId,
        presenterId: presenter._id,
        chatId,
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      await sendMessage(chatId, messageBody, {
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

      console.log(
        `📨 Availability request sent to ${presenter.name} via Telegram${
          force ? " (forced re-send)" : ""
        }`,
      );

      if (TELEGRAM_ADMIN_GROUP_ID) {
        await sendMessage(
          TELEGRAM_ADMIN_GROUP_ID,
          `📨 Presenter Availability Request Sent\n\n` +
            `👤 Presenter: ${presenter.name}\n` +
            `📧 Email: ${presenter.email}\n` +
            `📱 Channel: ✅ Telegram\n` +
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
        `❌ Failed to send Telegram DM to ${presenter.name}:`,
        error.message,
      );
    }
  } else {
    console.warn(
      `⚠️ Presenter ${presenter.name} has no Telegram chat ID — notifying admin group for manual contact`,
    );
  }

  if (TELEGRAM_ADMIN_GROUP_ID) {
    const reason = presenter.telegramChatId
      ? "Telegram DM failed to send (user may have blocked the bot)"
      : "Presenter has not registered with the Telegram bot";

    await sendMessage(
      TELEGRAM_ADMIN_GROUP_ID,
      `🚨 Presenter Cannot Be Reached Automatically\n\n` +
        `👤 Presenter: ${presenter.name}\n` +
        `📧 Email: ${presenter.email || "Not provided"}\n` +
        `📱 Phone: ${presenter.phone || "Not provided"}\n` +
        `📅 Session: ${formatDate(session.date)}\n` +
        `📖 Topic: ${session.presentationTitle || "TBD"}\n\n` +
        `⚠️ ${reason}\n\n` +
        `🔹 Please contact them manually to confirm availability.\n\n` +
        `💡 To enable automatic notifications, ask them to register at:\n` +
        `https://t.me/addis_mesob_gm_bot`,
      { parse_mode: "Markdown" },
    );
  }

  return false;
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
      text: `${callbackQuery.message.text}\n\n✅ You have confirmed your availability!\n\nThank you for presenting at Golden Monday! 🎉`,
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
        `✅ Presenter Confirmed\n\n` +
          `👤 Presenter: ${session.presenter?.name || "Unknown"}\n` +
          `📅 Session: ${formatDate(session.date)}\n` +
          `📖 Topic: ${session.presentationTitle || "TBD"}`,
        { parse_mode: "Markdown" },
      );
    }

    await sendMessage(
      chatId,
      `🎯 Golden Monday - Preparation Tips\n\n` +
        `Here are some tips to help you prepare:\n\n` +
        `📝 Prepare your presentation:\n` +
        `• Keep it engaging and interactive\n` +
        `• Duration: 45-50 minutes\n` +
        `• Use visuals if possible\n\n` +
        `💡 Topic Suggestions:\n` +
        `• Share your expertise\n` +
        `• Focus on practical knowledge\n` +
        `• Encourage participation\n\n` +
        `📎 Resources:\n` +
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
      text: `${callbackQuery.message.text}\n\n❌ You indicated you're not available.\n\nPlease type your reason for not being able to present.\n\n⚠️ A valid reason is required and will be reviewed.`,
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
      `📝 Reason: ${text}\n\n` +
      `An administrator will review this and follow up with you.`,
    { parse_mode: "Markdown" },
  );

  if (TELEGRAM_ADMIN_GROUP_ID) {
    await sendMessage(
      TELEGRAM_ADMIN_GROUP_ID,
      `⚠️ Presenter Declined\n\n` +
        `👤 Presenter: ${session.presenter?.name || "Unknown"}\n` +
        `📧 Email: ${session.presenter?.email || "Unknown"}\n` +
        `📅 Session: ${formatDate(session.date)}\n` +
        `📖 Topic: ${session.presentationTitle || "TBD"}\n\n` +
        `📝 Reason given:\n${text}\n\n` +
        `🔹 Please find a replacement presenter.`,
      { parse_mode: "Markdown" },
    );
  }
}

// ════════════════════════════════════════════════════════════════
// FORCE ACTIONS
// ════════════════════════════════════════════════════════════════

// ─── FORCE RE-POST ANNOUNCEMENT TO CHANNEL ──────────────────────
async function forceRepostToChannel(sessionId) {
  const session = await GoldenMondaySession.findById(sessionId).populate(
    "presenter",
    "name email department profilePhotoUrl telegramChatId phone",
  );
  if (!session) throw new Error("Session not found");

  const result = await postPresenterAnnouncementToChannel(session);
  if (result.postId) {
    session.announcementSent = true;
    session.announcementMessageId = String(result.postId);
    session.telegramPostId = String(result.postId);
    session.telegramPostedAt = new Date();
    session.telegramMessageUrl = result.messageUrl || "";
    await session.save();
  }
  return result;
}

// ─── FORCE RE-SEND PRESENTER AVAILABILITY DM ────────────────────
async function forceRenotifyPresenter(sessionId) {
  const session = await GoldenMondaySession.findById(sessionId).populate(
    "presenter",
    "name email department profilePhotoUrl telegramChatId phone",
  );
  if (!session) throw new Error("Session not found");
  if (!session.presenter) throw new Error("No presenter assigned");

  const ok = await requestPresenterAvailability(session, { force: true });
  if (ok) {
    session.availabilityRequestSentAt = new Date();
    session.availabilityResponseDeadline = new Date(
      Date.now() + 48 * 60 * 60 * 1000,
    );
    await session.save();
  }
  return { success: ok };
}

// ─── POST WITH A CUSTOM UPLOADED PHOTO ──────────────────────────
// Like postPresenterAnnouncementToChannel, but uses a coordinator-
// rendered poster (base64 data URL) instead of the presenter's
// profile photo. Used by the Poster Studio.
async function postPresenterAnnouncementWithPhoto(session, options = {}) {
  // Note: `options.overrides` is accepted by the controller but not
  // currently applied to the trilingual caption. If a future iteration
  // wants coordinator-edited title/date to override the caption, plumb
  // it into buildTrilingualAnnouncement.
  const { photoDataUrl } = options;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ Telegram not configured - skipping post");
    return { postId: null, messageUrl: null };
  }

  if (!photoDataUrl) {
    console.warn("⚠️ No photoDataUrl supplied, falling back to text");
    return postPresenterAnnouncementToChannel(session);
  }

  try {
    // Build the same trilingual caption as the regular channel post.
    let caption = await buildTrilingualAnnouncement(session);
    if (caption.length > TELEGRAM_MAX_BODY) {
      caption =
        caption.slice(0, TELEGRAM_MAX_BODY - 40).trimEnd() +
        "\n\n_… (truncated)_";
    }

    // Parse the data URL to get the MIME type and bytes.
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(photoDataUrl);
    if (!match) {
      throw new Error("Invalid poster data URL format");
    }
    const mimeType = match[1];
    const base64Body = match[2];
    const buffer = Buffer.from(base64Body, "base64");

    console.log(
      `[postWithPoster] uploading ${buffer.length} bytes as ${mimeType}`,
    );

    // ─── Manual multipart/form-data construction ──────────────
    // We build the multipart body by hand instead of relying on
    // undici's FormData. undici's FormData checks `instanceof File`
    // against ITS OWN File class, which differs from the native
    // globalThis.File — so when we pass a native File, undici
    // serializes it as a plain field, Telegram sees no `photo` part,
    // and rejects with "there is no photo in the request". Manual
    // construction sidesteps this entirely and works identically on
    // every Node version.
    const boundary =
      "----GoldenMondayPosterBoundary" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2);

    // Each part is: --<boundary>\r\n<headers>\r\n\r\n<body>\r\n
    // The body ends with: --<boundary>--\r\n
    const CRLF = "\r\n";
    const parts = [];

    const addTextField = (name, value) => {
      parts.push(
        Buffer.from(
          `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
            `${value}${CRLF}`,
          "utf8",
        ),
      );
    };

    const addFileField = (name, filename, contentType, data) => {
      parts.push(
        Buffer.from(
          `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="${name}"; filename="${filename}"${CRLF}` +
            `Content-Type: ${contentType}${CRLF}${CRLF}`,
          "utf8",
        ),
      );
      parts.push(data);
      parts.push(Buffer.from(CRLF, "utf8"));
    };

    addTextField("chat_id", TELEGRAM_CHANNEL_ID);
    addTextField("caption", caption);
    addTextField("parse_mode", "Markdown");
    addFileField("photo", "golden-monday-poster.png", mimeType, buffer);

    // Closing boundary
    parts.push(Buffer.from(`--${boundary}--${CRLF}`, "utf8"));

    const bodyBuffer = Buffer.concat(parts);

    console.log(
      `[postWithPoster] multipart body: ${bodyBuffer.length} bytes, boundary=${boundary}`,
    );

    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(bodyBuffer.length),
      },
      body: bodyBuffer,
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(
        `❌ Telegram sendPhoto (poster) failed: ${data.description}`,
      );
      return {
        postId: null,
        messageUrl: null,
        error: data.description,
      };
    }

    const postId = data.result?.message_id;
    const channelUsername = data.result?.chat?.username || "AddisMESOBGM";
    const messageUrl = `https://t.me/${channelUsername}/${postId}`;

    console.log(`✅ Posted coordinator poster to channel: ${messageUrl}`);
    return { postId, messageUrl };
  } catch (error) {
    console.error("❌ Failed to post poster to Telegram:", error.message);
    return { postId: null, messageUrl: null, error: error.message };
  }
}

module.exports = {
  postNextPresenterAnnouncement,
  postPresenterAnnouncementToChannel,
  requestPresenterAvailability,
  handlePresenterAvailability,
  handlePresenterUnavailableReason,
  pendingPresenterConfirmations,
  generateAnnouncementImage,
  forceRepostToChannel,
  forceRenotifyPresenter,
  postPresenterAnnouncementWithPhoto,
};
