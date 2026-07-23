// backend/src/routes/employeeRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const PendingRegistration = require("../models/PendingRegistration");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");
const { sendDeletionNotification } = require("../services/telegramService");

/**
 * DELETE /api/employees/:userId - Delete an employee and notify via Telegram
 */
router.delete("/:userId", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    if (user.role === "superadmin") {
      const superAdminCount = await User.countDocuments({ role: "superadmin" });
      if (superAdminCount <= 1) {
        return res.status(400).json({ 
          error: "Cannot delete the last Super Admin" 
        });
      }
    }

    const userName = user.name;
    const telegramChatId = user.telegramChatId;
    const userEmail = user.email;

    await GoldenMondayPresenter.deleteOne({ user: userId });
    await PendingRegistration.deleteOne({ email: userEmail });
    await User.findByIdAndDelete(userId);

    if (telegramChatId) {
      const deletionReason = reason || 
        `Your account has been removed from the system by ${req.user.name} (${req.user.email}).\n\n` +
        `To re-register, please send /start to this bot: @${process.env.TELEGRAM_BOT_USERNAME || 'addis_mesob_gm_bot'}`;
      
      await sendDeletionNotification(telegramChatId, userName, deletionReason);
    }

    res.json({ 
      success: true, 
      message: "Employee deleted successfully. Telegram notification sent." 
    });

  } catch (error) {
    console.error("❌ Error deleting employee:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
