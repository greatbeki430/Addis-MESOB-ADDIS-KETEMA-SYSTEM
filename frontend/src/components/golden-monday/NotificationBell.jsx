// frontend/src/components/golden-monday/NotificationBell.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { C } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
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
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

// ─── Notification Icon Mapping ────────────────────────────────
const getNotificationIcon = (type, size = 14) => {
  const iconProps = { size, style: { flexShrink: 0 } };

  switch (type) {
    case "presenter_assigned":
      return <FiStar {...iconProps} color={C.gold} />;
    case "session_reminder":
    case "title_reminder":
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
  const [setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const dropdownRef = useRef(null);
  const pageRef = useRef(1);

  const loadNotifications = useCallback(
    async (reset = true) => {
      if (!user) return;
      setLoading(true);
      try {
        const p = reset ? 1 : pageRef.current;
        const response = await goldenMondayAPI.getNotifications({
          page: p,
          limit: 20,
        });
        const data = response.data;
        if (reset) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          pageRef.current = 1;
          setPage(1);
          setHasMore(data.pagination?.pages > 1);
        } else {
          setNotifications((prev) => [...prev, ...(data.notifications || [])]);
          pageRef.current = p + 1;
          setPage(p + 1);
          setHasMore(data.pagination?.pages > p + 1);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Load on mount and when user changes
  useEffect(() => {
    if (!user) return;
    const timeoutId = setTimeout(() => loadNotifications(true), 0);
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

  const markAsRead = async (id) => {
    try {
      await goldenMondayAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, readAt: new Date() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await goldenMondayAPI.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
      );
      setUnreadCount(0);
      showToast("All notifications marked as read", "success");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const dismissNotification = async (id) => {
    try {
      await goldenMondayAPI.dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Failed to dismiss:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      window.location.assign(notification.link);
    }
    setIsOpen(false);
  };

  if (!user) return null;

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
      >
        {unreadCount > 0 ? (
          <FiBell size={22} />
        ) : (
          <FiBellOff size={22} style={{ opacity: 0.5 }} />
        )}

        {/* Animated unread badge */}
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
                    style={{
                      background: "none",
                      border: "none",
                      color: C.primary,
                      fontSize: 12,
                      cursor: "pointer",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FiCheck size={14} style={{ marginRight: 4 }} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
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
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: `3px solid ${C.primary}`,
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 12px",
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
                  <p style={{ fontSize: 13 }}>No notifications to show</p>
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
                        onClick={() => handleNotificationClick(n)}
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
                        >
                          {n.link && (
                            <FiChevronRight
                              size={18}
                              color={C.muted}
                              style={{ opacity: 0.5 }}
                            />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(n._id);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#999",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: 6,
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#fee2e2";
                              e.currentTarget.style.color = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#999";
                            }}
                            title="Dismiss"
                          >
                            <FiX size={16} />
                          </button>
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
                        onClick={() => loadNotifications(false)}
                        disabled={loading}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.primary,
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: loading ? 0.5 : 1,
                          padding: "8px 16px",
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
                        {loading ? (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                border: `2px solid ${C.primary}`,
                                borderTopColor: "transparent",
                                animation: "spin 0.8s linear infinite",
                                display: "inline-block",
                              }}
                            />
                            Loading...
                          </span>
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
