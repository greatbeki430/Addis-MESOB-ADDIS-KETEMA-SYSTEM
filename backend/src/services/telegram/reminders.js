// backend/src/services/telegram/reminders.js
const GoldenMondaySession = require("../../models/GoldenMondaySession");
const { sendMessage, formatDate } = require("./utils");
const { createSessionReminderNotification } = require("./notifications");

async function sendPresenterReminders() {
  try {
    const upcomingSessions = await GoldenMondaySession.find({
      date: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      status: { $in: ["scheduled", "upcoming"] },
    }).populate("presenter", "name email department telegramChatId");

    const results = [];

    for (const session of upcomingSessions) {
      const presenter = session.presenter;
      if (!presenter || !presenter.telegramChatId) continue;

      const chatId = presenter.telegramChatId.toString();
      const daysUntil = Math.ceil(
        (new Date(session.date) - new Date()) / (1000 * 60 * 60 * 24),
      );

      // ✅ FIXED: Only send if reminder hasn't been sent yet
      if (daysUntil > 7) continue;
      if (daysUntil > 3 && daysUntil <= 7 && session.reminder7DaySent) continue;
      if (daysUntil > 1 && daysUntil <= 3 && session.reminder3DaySent) continue;
      if (daysUntil <= 1 && session.reminder1DaySent) continue;

      let reminderMessage;
      let urgency = "";

      if (daysUntil <= 1) {
        urgency = "⚠️ *URGENT: Golden Monday Tomorrow!* ⚠️";
        session.reminder1DaySent = true;
      } else if (daysUntil <= 3) {
        urgency = `🔔 *Golden Monday in ${daysUntil} days*`;
        session.reminder3DaySent = true;
      } else {
        urgency = `🔔 *Golden Monday Reminder*`;
        session.reminder7DaySent = true;
      }

      reminderMessage =
        `${urgency}\n\n` +
        `Dear ${presenter.name},\n\n` +
        `📅 *Date:* ${formatDate(session.date)}\n` +
        `📖 *Topic:* ${session.presentationTitle || "Not set yet"}\n` +
        `🕒 *Time:* 2:00 - 2:50 PM\n` +
        `📍 *Location:* Addis MESOB Conference Hall\n\n`;

      if (daysUntil <= 1) {
        reminderMessage +=
          `⚠️ *Please make sure you're fully prepared:*\n` +
          `• Review your presentation\n` +
          `• Arrive 15 minutes early\n` +
          `• Test your equipment\n\n`;
      }

      reminderMessage += `📌 Click the ⊞ in your input bar to see all options.`;

      await sendMessage(chatId, reminderMessage, { parse_mode: "Markdown" });
      await session.save();

      await createSessionReminderNotification(
        presenter._id,
        session,
        daysUntil,
      );

      results.push({
        sessionId: session._id,
        presenter: presenter.name,
        daysUntil,
        sent: true,
      });

      console.log(
        `📨 Reminder sent to ${presenter.name} (${daysUntil} days until session)`,
      );
    }

    return results;
  } catch (error) {
    console.error("❌ Failed to send reminders:", error.message);
    return [];
  }
}

module.exports = {
  sendPresenterReminders,
};
