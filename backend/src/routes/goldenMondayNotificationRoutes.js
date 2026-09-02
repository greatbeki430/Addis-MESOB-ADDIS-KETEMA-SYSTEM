// backend/src/routes/goldenMondayNotificationRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const GoldenMondayNotification = require("../models/GoldenMondayNotification");

// ─── GET user's notifications ──────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { limit = 50, page = 1, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (unreadOnly === "true") {
      filter.isRead = false;
      filter.isDismissed = false;
    }

    const [notifications, total] = await Promise.all([
      GoldenMondayNotification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      GoldenMondayNotification.countDocuments(filter),
    ]);

    const unreadCount = await GoldenMondayNotification.countDocuments({
      user: req.user._id,
      isRead: false,
      isDismissed: false,
    });

    res.json({
      success: true,
      notifications,
      total,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── MARK notification as read ─────────────────────────────────
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await GoldenMondayNotification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, error: "Notification not found" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── MARK ALL notifications as read ────────────────────────────
router.put("/read-all", protect, async (req, res) => {
  try {
    await GoldenMondayNotification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── DISMISS notification ──────────────────────────────────────
router.put("/:id/dismiss", protect, async (req, res) => {
  try {
    const notification = await GoldenMondayNotification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, error: "Notification not found" });
    }

    notification.isDismissed = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── CREATE notification (internal use) ────────────────────────
const createNotification = async (data) => {
  try {
    const notification = new GoldenMondayNotification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

module.exports = { router, createNotification };
