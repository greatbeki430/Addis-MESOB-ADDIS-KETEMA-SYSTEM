// backend/src/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const Notification = require("../models/Notification");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  getUnreadCount,
} = require("../services/notificationService");

// Get all notifications for the current user
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, includeRead = true } = req.query;
    const result = await getNotifications(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeRead: includeRead === "true",
    });
    res.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

// Mark a notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/read-all", protect, async (req, res) => {
  try {
    await markAllAsRead(req.user._id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// Dismiss a notification
router.delete("/:id/dismiss", protect, async (req, res) => {
  try {
    const notification = await dismissNotification(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification dismissed" });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    res.status(500).json({ message: "Failed to dismiss notification" });
  }
});

module.exports = router;
