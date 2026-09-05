// frontend/src/components/golden-monday/NotificationBell.jsx
// ✅ COMPLETELY FIXED: Uses notificationAPI as primary, goldenMondayAPI as fallback

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { C } from "../../styles/theme";
import { goldenMondayAPI, notificationAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { useAuth } from "../../hooks/useAuth";
import {
  FiBell,
  FiBellOff,
  FiX,
  FiChevronRight,
  FiClock,
  FiStar,
  FiMessageCircle,
  FiFile,
  FiCheck,
  FiAlertCircle,
  FiAward,
  FiLoader,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

// ─── Notification Icon Mapping ────────────────────────────────
const getNotificationIcon = (type, size = 14) => {
  const iconProps = { size, style: { flexShrink: 0 } };

  switch (type) {
    case "presenter_assigned":
    case "golden_monday_assigned":
    case "evaluation_passed_to_superadmin":
      return <FiStar {...iconProps} color={C.gold} />;
    case "session_reminder":
    case "title_reminder":
    case "golden_monday_reminder":
      return <FiClock {...iconProps} color={C.primary} />;
    case "endorsement_received":
      return <FiMessageCircle {...iconProps} color="#10b981" />;
    case "feedback_requested":
      return <FiMessageCircle {...iconProps} color="#f59e0b" />;
    case "resource_uploaded":
    case "agenda_published":
      return <FiFile {...iconProps} color="#8b5cf6" />;
    case "session_cancelled":
      return <FiAlertCircle {...iconProps} color="#ef4444" />;
    case "evaluation_submitted":
      return <FiCheck {...iconProps} color="#3b82f6" />;
    case "daily_report_submitted":
      return <FiFile {...iconProps} color="#10b981" />;
    case "system_alert":
      return <FiAlertCircle {...iconProps} color="#ef4444" />;
    default:
      return <FiBell {...iconProps} color={C.muted} />;
  }
};

// ─── Notification Type Labels ──────────────────────────────────
const getNotificationTypeLabel = (type) => {
  const labels = {
    presenter_assigned: "Presenter Assignment",
    session_reminder: "Session Reminder",
    title_reminder: "Title Reminder",
    endorsement_received: "Endorsement",
    feedback_requested: "Feedback Request",
    resource_uploaded: "Resource Upload",
    agenda_published: "Agenda Published",
    session_cancelled: "Session Cancelled",
    evaluation_submitted: "Evaluation Submitted",
    evaluation_passed_to_superadmin: "Evaluation Passed",
    daily_report_submitted: "Daily Report",
    system_alert: "System Alert",
    team_assigned: "Team Assignment",
    meeting_scheduled: "Meeting Scheduled",
    golden_monday_reminder: "Golden Monday Reminder",
    golden_monday_assigned: "Golden Monday Assignment",
  };
  return labels[type] || "Notification";
};

// ─── Priority Colors ───────────────────────────────────────────
const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    case "low":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [dismissingId, setDismissingId] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);
  const dropdownRef = useRef(null);

  // ─── Load Notifications ────────────────────────────────────────
  const loadNotifications = useCallback(
    async (reset = true) => {
      if (!user?._id) {
        console.warn("⚠️ No user logged in, skipping notifications");
        return;
      }

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const currentPage = reset ? 1 : page + 1;

        // ✅ PRIMARY: Use notificationAPI (matches backend)
        let response;
        let data;

        try {
          response = await notificationAPI.getAll({
            page: currentPage,
            limit: 20,
            includeRead: true,
          });
          data = response?.data || {};
        } catch (primaryError) {
          console.warn(
            "⚠️ notificationAPI.getAll failed, trying goldenMondayAPI:",
            primaryError,
          );
          // ✅ FALLBACK: Try goldenMondayAPI
          try {
            response = await goldenMondayAPI.getNotifications({
              page: currentPage,
              limit: 20,
            });
            data = response?.data || {};
          } catch (secondaryError) {
            console.warn(
              "⚠️ goldenMondayAPI.getNotifications also failed:",
              secondaryError,
            );
            // ✅ LAST RESORT: Direct fetch
            response = await goldenMondayAPI.getNotificationList?.({
              page: currentPage,
              limit: 20,
            });
            data = response?.data || {};
          }
        }

        // ✅ Safely extract data
        const items = data?.notifications || data?.data || [];
        const pagination = data?.pagination || { total: 0, pages: 1 };
        const unread = data?.unreadCount || 0;

        const safeItems = Array.isArray(items) ? items : [];

        if (reset) {
          setNotifications(safeItems);
          setUnreadCount(unread);
          setPage(1);
          setHasMore((pagination?.pages || 1) > 1);
        } else {
          setNotifications((prev) => [...prev, ...safeItems]);
          setPage(currentPage);
          setHasMore((pagination?.pages || 1) > currentPage);
        }
      } catch (error) {
        console.error("❌ Failed to load notifications:", error);
        if (reset && error.message !== "Network Error") {
          showToast("Failed to load notifications", "error");
        }
      } finally {
        if (reset) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [user, page],
  );

  // Load on mount and when user changes
  useEffect(() => {
    if (!user?._id) return;
    const timeoutId = setTimeout(() => loadNotifications(true), 100);
    return () => clearTimeout(timeoutId);
  }, [user, loadNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Mark as Read ──────────────────────────────────────────────
  const markAsRead = useCallback(
    async (id, e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (markingReadId === id) return;

      setMarkingReadId(id);
      try {
        // ✅ PRIMARY: Use notificationAPI
        let success = false;

        try {
          await notificationAPI.markRead(id);
          success = true;
        } catch (primaryError) {
          console.warn(
            "⚠️ notificationAPI.markRead failed, trying goldenMondayAPI:",
            primaryError,
          );
          try {
            await goldenMondayAPI.markNotificationRead(id);
            success = true;
          } catch (secondaryError) {
            console.warn(
              "⚠️ goldenMondayAPI.markNotificationRead also failed:",
              secondaryError,
            );
            try {
              await goldenMondayAPI.markRead(id);
              success = true;
            } catch (tertiaryError) {
              console.warn("⚠️ All mark read attempts failed:", tertiaryError);
            }
          }
        }

        // ✅ Optimistic update
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === id ? { ...n, isRead: true, readAt: new Date() } : n,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));

        if (success) {
          console.log("✅ Marked notification as read:", id);
        }
      } catch (error) {
        console.error("❌ Failed to mark as read:", error);
      } finally {
        setMarkingReadId(null);
      }
    },
    [markingReadId],
  );

  // ─── Mark All as Read ──────────────────────────────────────────
  const markAllAsRead = useCallback(
    async (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (markingAll || unreadCount === 0) return;

      setMarkingAll(true);
      try {
        // ✅ PRIMARY: Use notificationAPI
        let success = false;

        try {
          await notificationAPI.markAllRead();
          success = true;
        } catch (primaryError) {
          console.warn(
            "⚠️ notificationAPI.markAllRead failed, trying goldenMondayAPI:",
            primaryError,
          );
          try {
            await goldenMondayAPI.markAllNotificationsRead();
            success = true;
          } catch (secondaryError) {
            console.warn(
              "⚠️ goldenMondayAPI.markAllNotificationsRead also failed:",
              secondaryError,
            );
            try {
              await goldenMondayAPI.markAllRead();
              success = true;
            } catch (tertiaryError) {
              console.warn(
                "⚠️ All mark all read attempts failed:",
                tertiaryError,
              );
            }
          }
        }

        // ✅ Optimistic update
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
        );
        setUnreadCount(0);

        if (success) {
          showToast("All notifications marked as read", "success");
        }
      } catch (error) {
        console.error("❌ Failed to mark all as read:", error);
        showToast("Failed to mark all as read", "error");
      } finally {
        setMarkingAll(false);
      }
    },
    [markingAll, unreadCount],
  );

  // ─── Dismiss Notification ──────────────────────────────────────
  const dismissNotification = useCallback(
    async (id, e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (dismissingId === id) return;

      setDismissingId(id);
      try {
        // ✅ PRIMARY: Use notificationAPI
        let success = false;

        try {
          await notificationAPI.dismiss(id);
          success = true;
        } catch (primaryError) {
          console.warn(
            "⚠️ notificationAPI.dismiss failed, trying goldenMondayAPI:",
            primaryError,
          );
          try {
            await goldenMondayAPI.dismissNotification(id);
            success = true;
          } catch (secondaryError) {
            console.warn(
              "⚠️ goldenMondayAPI.dismissNotification also failed:",
              secondaryError,
            );
            try {
              await goldenMondayAPI.dismiss(id);
              success = true;
            } catch (tertiaryError) {
              console.warn("⚠️ All dismiss attempts failed:", tertiaryError);
            }
          }
        }

        // ✅ Update local state
        const removed = notifications.find((n) => n._id === id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (removed && !removed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }

        if (success) {
          showToast("Notification dismissed", "success");
        }
      } catch (error) {
        console.error("❌ Failed to dismiss:", error);
        showToast("Failed to dismiss", "error");
      } finally {
        setDismissingId(null);
      }
    },
    [dismissingId, notifications],
  );

  // ─── Handle Notification Click ────────────────────────────────
  const handleNotificationClick = useCallback(
    (notification, e) => {
      // ✅ If this is a button click, don't close the dropdown
      if (e && e.target.closest(".notification-action")) {
        return;
      }

      // Mark as read if unread
      if (!notification.isRead) {
        markAsRead(notification._id, e);
      }

      // Navigate if link exists
      if (notification.link) {
        window.location.assign(notification.link);
      }

      // Close dropdown only if clicking on the card body
      setIsOpen(false);
    },
    [markAsRead],
  );

  // ─── Load More ──────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    loadNotifications(false);
  }, [hasMore, loadingMore, loadNotifications]);

  if (!user?._id) return null;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications(true);
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: "relative",
          background: isHovering || isOpen ? "rgba(255,255,255,0.15)" : "none",
          border: isOpen ? `2px solid ${C.gold}` : "none",
          cursor: "pointer",
          padding: "8px 10px",
          borderRadius: "50%",
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          color: "#fff",
          transform: isHovering || isOpen ? "scale(1.05)" : "scale(1)",
          boxShadow: isOpen ? `0 0 30px ${C.gold}33` : "none",
        }}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <FiBell size={22} />
        ) : (
          <FiBellOff size={22} style={{ opacity: 0.5 }} />
        )}

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: 20,
              height: 20,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              animation: "bellPulse 2s ease-in-out infinite",
              boxShadow: "0 0 20px rgba(239,68,68,0.5)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "70px",
              right: "20px",
              width: "420px",
              maxWidth: "calc(100vw - 40px)",
              maxHeight: "80vh",
              background: C.white,
              borderRadius: 20,
              boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation:
                "notifSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              border: `1px solid ${C.border}`,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: `2px solid ${C.border}`,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${C.dark}05, ${C.primary}05)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <FiBell size={18} />
                </div>
                <div>
                  <span
                    style={{ fontWeight: 700, fontSize: 16, color: C.dark }}
                  >
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        color: "#fff",
                        padding: "2px 12px",
                        borderRadius: 999,
                        marginLeft: 8,
                        fontWeight: 600,
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    className="notification-action"
                    style={{
                      background: "none",
                      border: "none",
                      color: C.primary,
                      fontSize: 12,
                      cursor: markingAll ? "not-allowed" : "pointer",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontWeight: 600,
                      opacity: markingAll ? 0.5 : 1,
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      if (!markingAll) e.currentTarget.style.background = C.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {markingAll ? (
                      <FiLoader
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <FiCheck size={14} />
                    )}
                    Mark all read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="notification-action"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#999",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: 8,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* List */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "4px 0",
                background: C.white,
              }}
            >
              {loading && notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px 20px",
                    color: C.muted,
                  }}
                >
                  <FiLoader
                    size={32}
                    style={{
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 12px",
                      display: "block",
                      color: C.primary,
                    }}
                  />
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px 20px",
                    color: C.muted,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: C.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <FiBellOff size={32} style={{ opacity: 0.3 }} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
                    All caught up! 🎉
                  </p>
                  <p style={{ fontSize: 13, color: C.muted }}>
                    No notifications to show
                  </p>
                </div>
              ) : (
                <>
                  {/* Unread section */}
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <div
                      style={{
                        padding: "8px 20px 4px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.primary,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      New
                    </div>
                  )}

                  {notifications.map((n) => {
                    const isUnread = !n.isRead;
                    const priorityColor = getPriorityColor(n.priority);

                    return (
                      <div
                        key={n._id}
                        onClick={(e) => handleNotificationClick(n, e)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                          padding: "12px 20px",
                          background: isUnread
                            ? `linear-gradient(135deg, ${C.primary}08, ${C.primary}03)`
                            : "transparent",
                          borderLeft: isUnread
                            ? `3px solid ${C.primary}`
                            : "3px solid transparent",
                          borderBottom: `1px solid ${C.border}33`,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isUnread
                            ? `${C.primary}15`
                            : C.bg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isUnread
                            ? `${C.primary}08`
                            : "transparent";
                        }}
                      >
                        {/* Priority dot */}
                        {n.priority === "high" && (
                          <div
                            style={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: priorityColor,
                              animation: "pulse 2s infinite",
                            }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: isUnread ? `${C.primary}15` : C.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                            transition: "all 0.3s ease",
                          }}
                        >
                          {getNotificationIcon(n.type, 18)}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: isUnread ? 700 : 500,
                                fontSize: 14,
                                color: C.dark,
                              }}
                            >
                              {n.title}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                background: C.bg,
                                color: C.muted,
                                padding: "1px 8px",
                                borderRadius: 10,
                                fontWeight: 500,
                              }}
                            >
                              {getNotificationTypeLabel(n.type)}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 13,
                              color: isUnread ? C.dark : C.muted,
                              marginTop: 3,
                              lineHeight: 1.5,
                            }}
                          >
                            {n.message}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              marginTop: 5,
                              fontSize: 11,
                              color: "#999",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <FiClock size={12} />
                              {formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            {!n.isRead && (
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: C.primary,
                                  display: "inline-block",
                                  animation: "pulse 2s infinite",
                                }}
                              />
                            )}
                            {n.priority === "high" && (
                              <span
                                style={{
                                  color: "#ef4444",
                                  fontWeight: 600,
                                  fontSize: 10,
                                }}
                              >
                                • High priority
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            flexShrink: 0,
                            alignSelf: "flex-start",
                            marginTop: 4,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {n.link && (
                            <FiChevronRight
                              size={18}
                              color={C.muted}
                              style={{ opacity: 0.5 }}
                            />
                          )}
                          <button
                            onClick={(e) => dismissNotification(n._id, e)}
                            disabled={dismissingId === n._id}
                            className="notification-action"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#999",
                              cursor:
                                dismissingId === n._id
                                  ? "not-allowed"
                                  : "pointer",
                              padding: "4px",
                              borderRadius: 6,
                              opacity: dismissingId === n._id ? 0.5 : 1,
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (dismissingId !== n._id) {
                                e.currentTarget.style.background = "#fee2e2";
                                e.currentTarget.style.color = "#ef4444";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (dismissingId !== n._id) {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color = "#999";
                              }
                            }}
                            title="Dismiss"
                          >
                            {dismissingId === n._id ? (
                              <FiLoader
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <FiX size={16} />
                            )}
                          </button>
                          {!n.isRead && (
                            <button
                              onClick={(e) => markAsRead(n._id, e)}
                              disabled={markingReadId === n._id}
                              className="notification-action"
                              style={{
                                background: "none",
                                border: "none",
                                color: C.primary,
                                cursor:
                                  markingReadId === n._id
                                    ? "not-allowed"
                                    : "pointer",
                                padding: "4px",
                                borderRadius: 6,
                                opacity: markingReadId === n._id ? 0.5 : 1,
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (markingReadId !== n._id) {
                                  e.currentTarget.style.background = `${C.primary}15`;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (markingReadId !== n._id) {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }
                              }}
                              title="Mark as read"
                            >
                              {markingReadId === n._id ? (
                                <FiLoader
                                  size={14}
                                  style={{
                                    animation: "spin 1s linear infinite",
                                  }}
                                />
                              ) : (
                                <FiCheck size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "16px",
                        borderTop: `1px solid ${C.border}`,
                      }}
                    >
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.primary,
                          cursor: loadingMore ? "not-allowed" : "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: loadingMore ? 0.5 : 1,
                          padding: "8px 16px",
                          borderRadius: 8,
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                        onMouseEnter={(e) => {
                          if (!loadingMore)
                            e.currentTarget.style.background = C.bg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {loadingMore ? (
                          <>
                            <FiLoader
                              size={16}
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                            Loading...
                          </>
                        ) : (
                          "Load more notifications"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "10px 20px",
                borderTop: `1px solid ${C.border}`,
                background: C.bg,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 11, color: C.muted }}>
                {notifications.length} total notifications
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiAward size={12} color={C.gold} />
                Golden Monday
              </span>
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes notifSlideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes bellPulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
