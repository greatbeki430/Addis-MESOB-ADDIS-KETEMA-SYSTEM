// backend/src/services/goldenMondayNotificationService.js
//
// Everything that needs to happen once a presenter is assigned to a
// Golden Monday session, beyond the assignment record itself:
//   1. Post the announcement to the public Telegram channel.
//   2. Notify the presenter directly (Telegram DM, with SMS as a
//      secondary/optional channel) so they don't find out by accident.
//   3. Send timed reminders as the date approaches (day-before, morning-of).
//
// Kept separate from goldenMondayRotationService.js on purpose — that
// service is pure assignment logic (who presents, why), this one is the
// "and then tell people about it" side effects. Callers (the manual
// /rotation/assign route and the Monday auto-assign cron job) both call
// notifyAndAnnouncePresenter() right after a successful assignment.

const User = require("../models/User");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const { sendMessage, postPresenterAnnouncement } = require("./telegramService");
const { sendSms } = require("./smsService");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";

// ============================================================
// Post the assignment to the public Telegram channel, unless this
// session has already been posted (avoids duplicate channel posts if
// notifyAndAnnouncePresenter is ever called twice for the same week —
// e.g. a manual re-trigger after the auto-assign cron already ran).
// ============================================================
const autoPostAssignmentToTelegram = async (session) => {
  if (session.telegramPostId) {
    console.log(
      `[goldenMondayNotification] Session ${session._id} already posted to Telegram (${session.telegramMessageUrl}) — skipping.`,
    );
    return {
      postId: session.telegramPostId,
      messageUrl: session.telegramMessageUrl,
    };
  }

  const populated = await GoldenMondaySession.findById(session._id).populate(
    "presenter",
    "name email department profilePhotoUrl",
  );

  const result = await postPresenterAnnouncement(populated);

  if (result.postId) {
    populated.telegramPostId = result.postId;
    populated.telegramPostedAt = new Date();
    populated.telegramMessageUrl = result.messageUrl;
    await populated.save();
    console.log(
      `✅ [goldenMondayNotification] Auto-posted assignment to Telegram: ${result.messageUrl}`,
    );
  } else if (result.error) {
    console.warn(
      `⚠️ [goldenMondayNotification] Telegram auto-post failed: ${result.error}`,
    );
  }

  return result;
};

// ============================================================
// Notify the presenter that they've been assigned. Telegram DM is the
// primary channel (works today, zero extra cost — telegramChatId is
// already captured when someone registers via the bot). SMS is a
// secondary channel: sent in addition when the presenter has a phone
// number on file AND an SMS gateway is configured (see smsService.js);
// harmless no-op otherwise.
// ============================================================
const notifyPresenterAssigned = async (session) => {
  if (!session.presenter) return { telegram: false, sms: false };

  const user = await User.findById(session.presenter).select(
    "name phone telegramChatId",
  );
  if (!user) {
    console.warn(
      `[goldenMondayNotification] Presenter user ${session.presenter} not found — cannot notify.`,
    );
    return { telegram: false, sms: false };
  }

  const dateFormatted = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const telegramText =
    `🌅 *You're presenting at Golden Monday!*\n\n` +
    `📅 Date: ${dateFormatted}\n` +
    `🕒 Time: 2:00 - 2:50 PM\n` +
    `📍 Location: Addis MESOB Conference Hall\n\n` +
    (session.suggestedTopics?.length
      ? `💡 A few topic ideas to get you started:\n` +
        session.suggestedTopics.map((t, i) => `   ${i + 1}. ${t}`).join("\n") +
        `\n\n`
      : "") +
    `Set your topic title here: ${FRONTEND_URL}/golden-monday\n\n` +
    `Congratulations, and good luck! 🎉`;

  const smsText =
    `Addis MESOB: You've been selected to present at Golden Monday on ${dateFormatted}, 2:00 PM. ` +
    `Set your topic at ${FRONTEND_URL}/golden-monday`;

  const results = { telegram: false, sms: false };

  if (user.telegramChatId) {
    const sent = await sendMessage(user.telegramChatId, telegramText, {
      parse_mode: "Markdown",
    });
    results.telegram = Boolean(sent?.ok);
  } else {
    console.log(
      `[goldenMondayNotification] Presenter ${user.name} has no telegramChatId — cannot DM. Falling back to SMS if available.`,
    );
  }

  // Send SMS in addition whenever a phone number is on file — belt and
  // braces for the "must be notified on time" requirement, since Telegram
  // delivery isn't guaranteed to be seen quickly by everyone.
  if (user.phone) {
    const smsResult = await sendSms(user.phone, smsText);
    results.sms = smsResult.success;
  }

  return results;
};

// ============================================================
// Single entry point called right after a successful assignment
// (manual admin trigger or the Monday auto-assign cron). Runs both
// side effects and never throws — a Telegram/SMS hiccup should never
// fail the assignment itself, since the assignment already succeeded
// and was saved before this runs.
// ============================================================
const notifyAndAnnouncePresenter = async (session) => {
  const outcome = { posted: null, notified: null };

  try {
    outcome.posted = await autoPostAssignmentToTelegram(session);
  } catch (err) {
    console.error(
      "[goldenMondayNotification] Auto-post to Telegram threw:",
      err.message,
    );
  }

  try {
    outcome.notified = await notifyPresenterAssigned(session);
  } catch (err) {
    console.error(
      "[goldenMondayNotification] Presenter notification threw:",
      err.message,
    );
  }

  return outcome;
};

// ============================================================
// Timed reminders as the date approaches. `label` controls the wording
// only — callers (the scheduler's cron jobs) decide *when* to call this.
// ============================================================
const sendPresenterReminder = async (session, label = "tomorrow") => {
  if (!session.presenter) return { telegram: false, sms: false };

  const user = await User.findById(session.presenter).select(
    "name phone telegramChatId",
  );
  if (!user) return { telegram: false, sms: false };

  const wording =
    label === "today"
      ? "📢 *Reminder: You're presenting TODAY at Golden Monday, 2:00 PM!*"
      : "📢 *Reminder: You're presenting at Golden Monday tomorrow, 2:00 PM!*";

  const telegramText =
    `${wording}\n\n` +
    (session.presentationTitle
      ? `📖 Your topic: "${session.presentationTitle}"\n\n`
      : `⚠️ You haven't set a topic title yet — do that here: ${FRONTEND_URL}/golden-monday\n\n`) +
    `📍 Addis MESOB Conference Hall`;

  const smsText =
    label === "today"
      ? `Addis MESOB reminder: You present at Golden Monday TODAY, 2:00 PM.`
      : `Addis MESOB reminder: You present at Golden Monday tomorrow, 2:00 PM.`;

  const results = { telegram: false, sms: false };

  if (user.telegramChatId) {
    const sent = await sendMessage(user.telegramChatId, telegramText, {
      parse_mode: "Markdown",
    });
    results.telegram = Boolean(sent?.ok);
  }

  if (user.phone) {
    const smsResult = await sendSms(user.phone, smsText);
    results.sms = smsResult.success;
  }

  return results;
};

module.exports = {
  autoPostAssignmentToTelegram,
  notifyPresenterAssigned,
  notifyAndAnnouncePresenter,
  sendPresenterReminder,
};
