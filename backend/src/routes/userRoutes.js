// backend/src/routes/userRoutes.js
//
// PATCH: replace the existing DELETE /:id handler with this version.
// Everything else in userRoutes.js (GET /, GET /:id, the golden-monday-
// admin toggle, PUT /:id) is unrelated and should stay as-is.
//
// Add this import near the top of the file, alongside the other requires:
//   const { deleteEmployeeAccount } = require("../services/employeeDeletionService");
//
// Then replace the whole "🗑️ DELETE USER" block with:

// ──────────────────────────────────────────────────────────────
// 🗑️ DELETE USER - SuperAdmin/Admin only
//
// ✅ FIXED: This used to only delete the User document and pull them
// from their Team — it never cleaned up GoldenMondayPresenter or
// PendingRegistration, and never sent the Telegram deletion notice
// that employeeRoutes.js's delete path sends. Deleting a user from
// THIS page (User Management) instead of the Employee Management page
// left orphaned GoldenMondayPresenter rows (later silently removed by
// getRoster()'s self-healing cleanup) and PendingRegistration records
// stuck forever at status:"approved" pointing at a User that no
// longer existed. Now both delete entry points share one
// implementation (services/employeeDeletionService.js) so they can't
// diverge again.
// ──────────────────────────────────────────────────────────────
router.delete("/:id", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const result = await deleteEmployeeAccount({
      userId: req.params.id,
      actor: { _id: req.user._id, name: req.user.name },
      reason: req.body?.reason,
    });

    res.json({
      message: "User deleted successfully",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);

    const statusByCode = {
      USER_NOT_FOUND: 404,
      SELF_DELETE: 400,
      LAST_SUPERADMIN: 400,
    };
    const status = statusByCode[error.code] || 500;

    res.status(status).json({ message: error.message });
  }
});
