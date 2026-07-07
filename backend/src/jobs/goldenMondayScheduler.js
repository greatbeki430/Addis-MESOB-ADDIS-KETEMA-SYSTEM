// backend/src/jobs/goldenMondayScheduler.js
//
// Two lightweight cron jobs (node-cron — no Redis/queue infra needed):
//
// 1. Auto-assign — every Monday at 06:00 (Ethiopia time), if next
//    Monday's session doesn't already have a presenter (e.g. no admin
//    manually assigned one during the week), the rotation algorithm
//    assigns one automatically so there's never a week with nobody
//    scheduled.
//
// 2. Recording sweep — once a day, expired recordings are deleted from
//    Cloudinary and cleared from the DB (see goldenMondayRecordingService
//    for why recordings are temporary).
//
// Both jobs call the same service functions the API routes use, so
// behavior is identical whether triggered by a person or by the clock.

const cron = require("node-cron");
const User = require("../models/User");
const rotation = require("../services/goldenMondayRotationService");
const {
  sweepExpiredRecordings,
} = require("../services/goldenMondayRecordingService");

const TIMEZONE = "Africa/Addis_Ababa";

const startGoldenMondayScheduler = () => {
  // Every Monday at 06:00 Addis Ababa time — well before the 8:00 slot.
  cron.schedule(
    "0 6 * * 1",
    async () => {
      try {
        // A system user context for logging/audit purposes only.
        const systemActor =
          (await User.findOne({ role: "superadmin" })) ||
          (await User.findOne({ role: "admin" }));
        if (!systemActor) {
          console.warn(
            "[goldenMondayScheduler] No admin/superadmin user found to attribute auto-assignment to — skipping.",
          );
          return;
        }

        const result = await rotation.assignNextPresenter({
          actorUser: systemActor,
        });
        if (result.alreadyAssigned) {
          console.log(
            "[goldenMondayScheduler] This week's presenter was already assigned — nothing to do.",
          );
        } else {
          console.log(
            `[goldenMondayScheduler] ✅ Auto-assigned ${result.session.presenterName} for ${result.session.weekOf.toDateString()}`,
          );
        }
      } catch (err) {
        console.error(
          "[goldenMondayScheduler] ❌ Auto-assignment failed:",
          err.message,
        );
      }
    },
    { timezone: TIMEZONE },
  );

  // Daily at 03:00 — quiet hours, low traffic.
  cron.schedule(
    "0 3 * * *",
    async () => {
      try {
        await sweepExpiredRecordings();
      } catch (err) {
        console.error(
          "[goldenMondayScheduler] ❌ Recording sweep failed:",
          err.message,
        );
      }
    },
    { timezone: TIMEZONE },
  );

  console.log(
    "[goldenMondayScheduler] 🗓️  Scheduled: Monday 06:00 auto-assign, daily 03:00 recording sweep (Africa/Addis_Ababa)",
  );
};

module.exports = { startGoldenMondayScheduler };
