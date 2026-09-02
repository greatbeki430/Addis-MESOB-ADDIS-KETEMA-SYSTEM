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
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (type) => {
  switch (type) {
    case "presenter_assigned":
      return <FiStar size={14} color={C.gold} />;
    case "session_reminder":
    case "title_reminder":
      return <FiClock size={14} color={C.primary} />;
    case "endorsement_received":
      return <FiMessageCircle size={14} color="#10b981" />;
    case "feedback_requested":
      return <FiMessageCircle size={14} color="#f59e0b" />;
    case "resource_uploaded":
    case "agenda_published":
      return <FiFile size={14} color="#8b5cf6" />;
    default:
      return <FiBell size={14} color={C.muted} />;
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
    [user, setPage],
  );

  // Load on mount and when user changes
  useEffect(() => {
    if (!user) return;

    // Defer the request so its state updates do not run synchronously in the effect.
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
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          transition: "all 0.2s ease",
          color: "#fff",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {unreadCount > 0 ? (
          <FiBell size={20} />
        ) : (
          <FiBellOff size={20} style={{ opacity: 0.5 }} />
        )}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 2s infinite",
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
              width: "400px",
              maxWidth: "calc(100vw - 40px)",
              maxHeight: "80vh",
              background: C.white,
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideDown 0.25s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiBell size={18} color={C.primary} />
                <span style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "#ef4444",
                      color: "#fff",
                      padding: "1px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.primary,
                      fontSize: 12,
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
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
                    padding: "4px",
                  }}
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {loading && notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: C.muted,
                  }}
                >
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: C.muted,
                  }}
                >
                  <FiBellOff size={32} style={{ opacity: 0.3 }} />
                  <p style={{ marginTop: 8 }}>No notifications</p>
                </div>
              ) : (
                <>
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "12px 20px",
                        background: n.isRead ? "transparent" : C.bg,
                        borderBottom: `1px solid ${C.border}44`,
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = n.isRead
                          ? C.bg
                          : "#e8ecf1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = n.isRead
                          ? "transparent"
                          : C.bg;
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `${C.primary}11`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {getNotificationIcon(n.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: n.isRead ? 400 : 600,
                            fontSize: 13,
                            color: C.dark,
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: C.muted,
                            marginTop: 2,
                            lineHeight: 1.4,
                          }}
                        >
                          {n.message}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 4,
                            fontSize: 10,
                            color: "#999",
                          }}
                        >
                          <span>
                            {formatDistanceToNow(new Date(n.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {n.priority === "high" && (
                            <span
                              style={{
                                color: "#ef4444",
                                fontWeight: 600,
                              }}
                            >
                              • High priority
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {n.link && <FiChevronRight size={16} color={C.muted} />}
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
                          }}
                          title="Dismiss"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {hasMore && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "12px",
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
                          opacity: loading ? 0.5 : 1,
                        }}
                      >
                        {loading ? "Loading..." : "Load more"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
