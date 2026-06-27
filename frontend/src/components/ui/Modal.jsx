import { useState, useEffect, useRef } from "react";
import { C, F } from "../../styles/theme";
import {
  FiCheckCircle,
  // FiAlertCircle,
  FiXCircle,
  FiInfo,
  FiHelpCircle,
  FiX,
  FiCheck,
  FiAlertTriangle,
  // FiBell,
  // FiMessageSquare,
  // FiThumbsUp,
  // FiThumbsDown,
  // FiStar,
  // FiAward,
  // FiClock,
  // FiCalendar,
  // FiEdit2,
  // FiTrash2,
  // FiPlus,
  // FiMinus,
  // FiSave,
  // FiDownload,
  // FiPrinter,
  // FiFile,
  // FiFolder,
  // FiSearch,
  // FiSettings,
  // FiUser,
  // FiUsers,
  // FiMail,
  // FiPhone,
  // FiMapPin,
  // FiGlobe,
  // FiLink,
  // FiLock,
  // FiUnlock,
  // FiEye,
  // FiEyeOff,
  // FiHeart,
  // FiFlag,
  // FiGift,
  // FiTrophy,
  // FiMedal,
  // FiAward as FiAwardIcon,
} from "react-icons/fi";

export const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const isOpenRef = useRef(isOpen);

  // Update ref when isOpen changes
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle body scroll and visibility - using a different approach
  useEffect(() => {
    // Use a timeout to avoid the cascading render warning
    const timer = setTimeout(() => {
      if (isOpen) {
        setIsVisible(true);
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle closing with animation
  const handleClose = () => {
    document.body.style.overflow = "unset";
    setIsVisible(false);
    // Call onClose after animation completes
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Don't render if not open and not visible
  if (!isOpen && !isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FiCheckCircle size={24} />;
      case "warning":
        return <FiAlertTriangle size={24} />;
      case "error":
        return <FiXCircle size={24} />;
      case "confirm":
        return <FiHelpCircle size={24} />;
      default:
        return <FiInfo size={24} />;
    }
  };

  const getIconColor = () => {
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
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  const iconColor = getIconColor();

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
        animation: isVisible ? "fadeIn 0.2s ease" : "fadeOut 0.2s ease",
      }}
      onClick={handleOverlayClick}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-30px) scale(0.95); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
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
          animation: isVisible ? "slideDown 0.3s ease" : "slideUp 0.3s ease",
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
            <span
              style={{
                fontSize: 22,
                color: iconColor,
                animation: "pulse 2s ease-in-out infinite",
                display: "flex",
                alignItems: "center",
              }}
            >
              {getIcon()}
            </span>
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
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#999",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.color = "#333";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#999";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", flex: 1, overflow: "auto" }}>
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
              onClick={handleCancel}
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
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FiX size={14} />
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={handleConfirm}
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
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <FiCheck size={14} />
              {confirmText}
            </button>
          )}
          {!onConfirm && !onCancel && (
            <button
              onClick={handleClose}
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
                display: "flex",
                alignItems: "center",
                gap: 6,
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
              <FiCheck size={14} />
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Toast notification component
export const Toast = ({
  message,
  type = "success",
  onClose,
  duration = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onClose after fade out animation
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getColors = () => {
    switch (type) {
      case "success":
        return { bg: "#10b981", icon: <FiCheckCircle size={20} /> };
      case "error":
        return { bg: "#ef4444", icon: <FiXCircle size={20} /> };
      case "warning":
        return { bg: "#f59e0b", icon: <FiAlertTriangle size={20} /> };
      default:
        return { bg: C.primary, icon: <FiInfo size={20} /> };
    }
  };

  const colors = getColors();

  if (!isVisible) return null;

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
        <span style={{ fontSize: 20, display: "flex", alignItems: "center" }}>
          {colors.icon}
        </span>
        <span style={{ fontSize: 13, flex: 1 }}>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              if (onClose) onClose();
            }, 300);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: 16,
            opacity: 0.7,
            padding: "4px",
            transition: "opacity 0.2s",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

// ✅ ToastContainer component
export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
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
          onClose={() => removeToast?.(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
};
