// backend/src/services/employeeDeletionService.js
//
// Single source of truth for "delete an employee account" — used by
// BOTH userRoutes.js (User Management page) and employeeRoutes.js
// (Employee Management / Golden Monday roster page).
//
// WHY THIS FILE EXISTS:
// There used to be two independent delete-user code paths. Only one of
// them (employeeRoutes.js) cleaned up GoldenMondayPresenter and
// PendingRegistration and sent a Telegram notice. The other
// (userRoutes.js) just deleted the User document. That mismatch is
// exactly how a user got deleted from `users` while a stale
// GoldenMondayPresenter row (later silently self-healed away by
// getRoster()) and an orphaned PendingRegistration{status:"approved"}
// were left behind forever. See the Sept 2026 "phantom user" incident.
//
// Both routes should call deleteEmployeeAccount() instead of writing
// their own deletion logic, so there is exactly one place this can go
// wrong.

const User = require("../models/User");
const Team = require("../models/Team");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const PendingRegistration = require("../models/PendingRegistration");
const { notifyEmployeeDeletion } = require("./telegram/registration");

/**
 * Fully deletes a user and every record that references them.
 *
 * @param {Object} opts
 * @param {string} opts.userId - the User._id to delete
 * @param {Object} opts.actor - { _id, name } of the admin performing the deletion
 * @param {string} [opts.reason] - free-text reason, shown to the employee & logged
 * @returns {Promise<{ success: boolean, notificationSent: boolean, hasTelegram: boolean, warning?: string }>}
 * @throws if the user doesn't exist, is the caller themself, or is the last superadmin
 */
async function deleteEmployeeAccount({ userId, actor, reason }) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (actor?._id && user._id.toString() === actor._id.toString()) {
    const err = new Error("Cannot delete your own account");
    err.code = "SELF_DELETE";
    throw err;
  }

  if (user.role === "superadmin") {
    const superAdminCount = await User.countDocuments({ role: "superadmin" });
    if (superAdminCount <= 1) {
      const err = new Error("Cannot delete the last Super Admin");
      err.code = "LAST_SUPERADMIN";
      throw err;
    }
  }

  const reasonText = reason || "No specific reason provided.";
  const hasTelegram = !!user.telegramChatId;

  // ── 1. Notify the employee BEFORE anything is deleted ──
  let notificationResult = { success: false };
  if (hasTelegram) {
    notificationResult = await notifyEmployeeDeletion({
      userId: user._id,
      employeeName: user.name,
      email: user.email,
      reason: reasonText,
      deletedBy: actor?._id,
      deletedByName: actor?.name || "Administrator",
    });
  }

  // ── 2. Remove from their Team ──
  if (user.team) {
    await Team.findByIdAndUpdate(user.team, { $pull: { members: user._id } });
  }

  // ── 3. Remove the Golden Monday roster entry ──
  await GoldenMondayPresenter.deleteOne({ user: user._id });

  // ── 4. Clean up any PendingRegistration tied to this account ──
  // Match by createdUser FIRST (the durable, case-insensitive link) and
  // fall back to email only for legacy rows that predate the
  // createdUser field ever being set. Matching by email alone is
  // fragile: User.email has no `lowercase` schema transform, so an
  // admin-edited email could silently stop matching
  // PendingRegistration.email (which IS always lowercased) and leave
  // an orphaned "approved" row behind — which is exactly how this bug
  // class was born the first time.
  await PendingRegistration.deleteMany({
    $or: [{ createdUser: user._id }, { email: user.email }],
  });

  // ── 5. Finally, delete the User itself ──
  await User.findByIdAndDelete(user._id);

  console.log(
    `🗑️ Employee deleted: ${user.name} (${user.email}) by ${actor?.name || "unknown"}${
      reason ? ` — reason: ${reasonText}` : ""
    }`,
  );

  return {
    success: true,
    notificationSent: notificationResult.success || false,
    hasTelegram,
    ...(hasTelegram &&
      !notificationResult.success && {
        warning:
          "Employee deleted but Telegram notification failed. Check bot configuration.",
      }),
  };
}

module.exports = { deleteEmployeeAccount };
