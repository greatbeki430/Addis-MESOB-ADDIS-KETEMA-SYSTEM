// backend/src/routes/employeeRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const PendingRegistration = require("../models/PendingRegistration");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");
const { notifyEmployeeDeletion } = require("../services/telegramService");

/**
 * DELETE /api/employees/:userId - Delete an employee and notify via Telegram
 */
router.delete("/:userId", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // ✅ Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // ✅ Prevent deleting the last Super Admin
    if (user.role === "superadmin") {
      const superAdminCount = await User.countDocuments({ role: "superadmin" });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          error: "Cannot delete the last Super Admin",
        });
      }
    }

    // ✅ Store employee info before deletion for the notification
    const employeeInfo = {
      userId: user._id,
      employeeName: user.name,
      email: user.email,
      reason: reason || "No specific reason provided.",
      deletedBy: req.user._id,
      deletedByName: req.user.name,
    };

    // ✅ Check if user has Telegram chat ID
    const hasTelegram = !!user.telegramChatId;

    // ✅ Send Telegram notification BEFORE deleting (if they have Telegram)
    let notificationResult = { success: false };
    if (hasTelegram) {
      notificationResult = await notifyEmployeeDeletion(employeeInfo);
    }

    // ✅ Delete from Golden Monday roster
    await GoldenMondayPresenter.deleteOne({ user: userId });

    // ✅ Delete pending registrations
    await PendingRegistration.deleteMany({ email: user.email });

    // ✅ Delete the user account
    await User.findByIdAndDelete(userId);

    // ✅ Log the deletion
    console.log(
      `🗑️ Employee deleted: ${user.name} (${user.email}) by ${req.user.name}`,
    );

    res.json({
      success: true,
      message: "Employee deleted successfully.",
      notificationSent: notificationResult.success || false,
      hasTelegram: hasTelegram,
      ...(hasTelegram &&
        !notificationResult.success && {
          warning:
            "Employee deleted but Telegram notification failed. Check bot configuration.",
        }),
    });
  } catch (error) {
    console.error("❌ Error deleting employee:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
