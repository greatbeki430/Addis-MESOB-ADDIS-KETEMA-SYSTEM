// backend/src/services/notificationService.js
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Create a notification for a single user
 */
const notifyUser = async (
  userId,
  type,
  title,
  message,
  link = null,
  metadata = {},
) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      metadata,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

/**
 * Create notifications for multiple users
 */
const notifyUsers = async (
  userIds,
  type,
  title,
  message,
  link = null,
  metadata = {},
) => {
  try {
    const notifications = await Notification.insertMany(
      userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        link,
        metadata,
        isRead: false,
      })),
    );
    return notifications;
  } catch (error) {
    console.error("Failed to create notifications:", error);
    return [];
  }
};

/**
 * Notify all admins and super admins
 */
const notifyAdmins = async (
  type,
  title,
  message,
  link = null,
  metadata = {},
) => {
  try {
    // Find all users with admin or superadmin role
    const admins = await User.find({
      role: { $in: ["admin", "superadmin"] },
    }).select("_id");

    if (admins.length === 0) {
      console.warn("No admins found to notify");
      return [];
    }

    const adminIds = admins.map((admin) => admin._id);

    const notifications = await Notification.insertMany(
      adminIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        link,
        metadata,
        isRead: false,
      })),
    );

    console.log(`📨 Notified ${adminIds.length} admins about: ${title}`);
    return notifications;
  } catch (error) {
    console.error("Failed to notify admins:", error);
    return [];
  }
};

/**
 * Get unread notification count for a user
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      dismissed: false,
    });
    return count;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    return notification;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return null;
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return true;
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return false;
  }
};

/**
 * Dismiss (delete) a notification
 */
const dismissNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });
    return notification;
  } catch (error) {
    console.error("Failed to dismiss notification:", error);
    return null;
  }
};

/**
 * Get notifications for a user with pagination
 */
const getNotifications = async (
  userId,
  { page = 1, limit = 20, includeRead = true } = {},
) => {
  try {
    const skip = (page - 1) * limit;

    const filter = { userId, dismissed: false };
    if (!includeRead) {
      filter.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount: await getUnreadCount(userId),
    };
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return { notifications: [], total: 0, page: 1, pages: 0, unreadCount: 0 };
  }
};

module.exports = {
  notifyUser,
  notifyUsers,
  notifyAdmins,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  getNotifications,
};
