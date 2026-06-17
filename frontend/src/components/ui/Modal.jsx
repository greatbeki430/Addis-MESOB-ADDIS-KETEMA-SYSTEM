/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { C, F } from "../../styles/theme";

export const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info", // info, success, warning, error, confirm
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
  size = "md", // sm, md, lg
  showCloseButton = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "confirm":
        return "❓";
      default:
        return "ℹ️";
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case "success":
        return "#10b981";
      case "warning":
        return "#f59e0b";
      case "error":
        return "#ef4444";
      case "confirm":
        return "#3b82f6";
      default:
        return C.primary;
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case "success":
        return { background: "#10b981", color: "#fff" };
      case "warning":
        return { background: "#f59e0b", color: "#fff" };
      case "error":
        return { background: "#ef4444", color: "#fff" };
      case "confirm":
        return { background: "#3b82f6", color: "#fff" };
      default:
        return { background: C.primary, color: "#fff" };
    }
  };

  const getSize = () => {
    switch (size) {
      case "sm":
        return "400px";
      case "lg":
        return "600px";
      default:
        return "480px";
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={handleOverlayClick}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          width: "100%",
          maxWidth: getSize(),
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          animation: "slideDown 0.25s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `3px solid ${getHeaderColor()}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fafafa",
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{getIcon()}</span>
            <h3
              style={{
                fontSize: "clamp(16px, 4vw, 18px)",
                fontWeight: 700,
                color: C.dark,
                fontFamily: F.serif,
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#999",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.color = "#333";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#999";
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div
          style={{
            padding: "20px 24px",
            flex: 1,
            overflow: "auto",
          }}
        >
          {children ? (
            children
          ) : (
            <p
              style={{
                fontSize: "clamp(13px, 3.5vw, 15px)",
                color: "#555",
                fontFamily: F.sans,
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            background: "#fafafa",
            borderRadius: "0 0 16px 16px",
          }}
        >
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: "8px 20px",
                background: "transparent",
                color: "#666",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: F.sans,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              style={{
                padding: "8px 20px",
                ...getButtonStyle(),
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: F.sans,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {confirmText}
            </button>
          )}
          {!onConfirm && (
            <button
              onClick={onClose}
              style={{
                padding: "8px 20px",
                ...getButtonStyle(),
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: F.sans,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Toast notification component for success/error messages
export const Toast = ({
  message,
  type = "success",
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getColors = () => {
    switch (type) {
      case "success":
        return { bg: "#10b981", icon: "✅" };
      case "error":
        return { bg: "#ef4444", icon: "❌" };
      case "warning":
        return { bg: "#f59e0b", icon: "⚠️" };
      default:
        return { bg: C.primary, icon: "ℹ️" };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 10000,
        animation: "slideDown 0.3s ease",
        maxWidth: 400,
        width: "100%",
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <div
        style={{
          background: colors.bg,
          color: "#fff",
          padding: "14px 20px",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: F.sans,
        }}
      >
        <span style={{ fontSize: 20 }}>{colors.icon}</span>
        <span style={{ fontSize: 13, flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: 16,
            opacity: 0.7,
            padding: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// ✅ Hook for using Toast
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 400,
        width: "100%",
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};
