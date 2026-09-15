// backend/src/routes/employeeRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOrSuperAdmin } = require("../middleware/auth");
const {
  deleteEmployeeAccount,
} = require("../services/employeeDeletionService");

/**
 * DELETE /api/employees/:userId - Delete an employee and notify via Telegram
 *
 * ✅ FIXED: now delegates to the shared deleteEmployeeAccount() service
 * (see services/employeeDeletionService.js) instead of doing its own
 * ad-hoc cleanup. This is the same function userRoutes.js's DELETE /:id
 * now uses, so both delete-employee entry points in the app behave
 * identically and can't drift out of sync again.
 */
router.delete("/:userId", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const result = await deleteEmployeeAccount({
      userId,
      actor: { _id: req.user._id, name: req.user.name },
      reason,
    });

    res.json({
      message: "Employee deleted successfully.",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error deleting employee:", error);

    const statusByCode = {
      USER_NOT_FOUND: 404,
      SELF_DELETE: 400,
      LAST_SUPERADMIN: 400,
    };
    const status = statusByCode[error.code] || 500;

    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
