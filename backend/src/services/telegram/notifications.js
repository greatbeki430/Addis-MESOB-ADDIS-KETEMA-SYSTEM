// backend/src/services/telegram/notifications.js
const GoldenMondayNotification = require("../../models/GoldenMondayNotification");
const { NOTIFICATION_TYPES, PRIORITY } = require("./constants");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";

async function createNotification(data) {
  try {
    const notification = new GoldenMondayNotification({
      user: data.user,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || "",
      priority: data.priority || PRIORITY.MEDIUM,
      data: data.metadata || {},
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("❌ Failed to create notification:", error.message);
    return null;
  }
}

async function createPresenterAssignedNotification(userId, session) {
  const dateFormatted = new Date(session.date).toLocaleDateString();
  return createNotification({
    user: userId,
    type: NOTIFICATION_TYPES.PRESENTER_ASSIGNED,
    title: "🎯 You're the Golden Monday Presenter!",
    message: `You have been selected as the presenter for "${session.title || "Golden Monday"}" on ${dateFormatted}. Please confirm your availability.`,
    link: `${FRONTEND_URL}/golden-monday`,
    priority: PRIORITY.HIGH,
    metadata: { sessionId: session._id },
  });
}

async function createSessionReminderNotification(userId, session, daysUntil) {
  const dateFormatted = new Date(session.date).toLocaleDateString();
  const urgency = daysUntil <= 1 ? "⚠️ TOMORROW!" : `in ${daysUntil} days`;

  return createNotification({
    user: userId,
    type: NOTIFICATION_TYPES.SESSION_REMINDER,
    title: `🔔 Golden Monday ${urgency}`,
    message: `Your Golden Monday presentation "${session.title || "Golden Monday"}" is on ${dateFormatted}. Please prepare your materials.`,
    link: `${FRONTEND_URL}/golden-monday/${session._id}`,
    priority: daysUntil <= 1 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
    metadata: { sessionId: session._id, daysUntil },
  });
}

async function createTitleReminderNotification(userId, session) {
  return createNotification({
    user: userId,
    type: NOTIFICATION_TYPES.TITLE_REMINDER,
    title: "📝 Please set your presentation title",
    message: `Please set your presentation title for Golden Monday on ${new Date(session.date).toLocaleDateString()}.`,
    link: `${FRONTEND_URL}/golden-monday/${session._id}`,
    priority: PRIORITY.MEDIUM,
    metadata: { sessionId: session._id },
  });
}

module.exports = {
  createNotification,
  createPresenterAssignedNotification,
  createSessionReminderNotification,
  createTitleReminderNotification,
};
