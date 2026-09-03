// frontend/src/components/notifications/NotificationBell.jsx
//
// Generic system notification bell — currently used for evaluation
// alerts to Admin/Super Admin ("New evaluation submitted", "Evaluation
// passed to Super Admin"). Structured so any future feature can reuse
// the same /api/notifications endpoints by just picking a `type`.
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { C } from "../../styles/theme";
import { notificationAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import {
  FiBell,
  FiBellOff,
  FiX,
  FiChevronRight,
  FiClipboard,
  FiSend,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (type) => {
  switch (type) {
    case "evaluation_submitted":
      return <FiClipboard size={14} color={C.primary} />;
    case "evaluation_passed_to_superadmin":
      return <FiSend size={14} color="#8b5cf6" />;
    default:
      return <FiBell size={14} color={C.muted} />;
  }
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await notificationAPI.getAll({ page: 1, limit: 20 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial + periodic refresh (light polling so a new evaluation shows
  // up without requiring a manual page reload)
  useEffect(() => {
    if (!user) return;
    // Deferred so the state update doesn't run synchronously inside the effect body.
    const initial = setTimeout(loadNotifications, 0);
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [user, loadNotifications]);

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
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const dismissNotification = async (id) => {
    try {
      await notificationAPI.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => {
          setIsOpen((o) => !o);
          if (!isOpen) loadNotifications();
        }}
        title="Notifications"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.dark,
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${C.primary}11`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {unreadCount > 0 ? (
          <FiBell size={18} />
        ) : (
          <FiBellOff size={18} style={{ opacity: 0.5 }} />
        )}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 15,
              height: 15,
              borderRadius: "50%",
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
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
              top: 62,
              right: 16,
              width: 380,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "75vh",
              background: C.white,
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "notifSlideDown 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiBell size={16} color={C.primary} />
                <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
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
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.primary,
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600,
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
                    display: "flex",
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
              {loading && notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: 40, color: C.muted }}
                >
                  <FiBellOff size={28} style={{ opacity: 0.3 }} />
                  <p style={{ marginTop: 8, fontSize: 13 }}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 16px",
                      background: n.isRead ? "transparent" : `${C.primary}08`,
                      borderBottom: `1px solid ${C.border}33`,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
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
                          fontWeight: n.isRead ? 500 : 700,
                          fontSize: 12.5,
                          color: C.dark,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: C.muted,
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        {n.message}
                      </div>
                      <div
                        style={{ fontSize: 10, color: "#999", marginTop: 4 }}
                      >
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {n.link && <FiChevronRight size={14} color={C.muted} />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(n._id);
                        }}
                        title="Dismiss"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#999",
                          cursor: "pointer",
                          padding: 2,
                          display: "flex",
                        }}
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes notifSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
