// frontend/src/components/ui/Modal.jsx

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { C, F } from "../../styles/theme";
import {
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiHelpCircle,
  FiX,
  FiCheck,
  FiAlertTriangle,
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
  // `shouldRender` = whether the modal exists in the DOM at all.
  // `active`       = whether it should be showing its "open" visual state.
  // Splitting these lets us mount with the "closed" styles first, then flip
  // to "open" on the next frame so the CSS transition has something to
  // animate from. This replaces the old approach of swapping named
  // keyframe animations, which could get stuck mid fade-out (content at
  // opacity 0) while the backdrop blur was still applied — that's what
  // produced the "blurred, empty overlay" bug.
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [active, setActive] = useState(false);

  // Tracks the isOpen value from the previous render so we can react to it
  // changing. React's own guidance for "state that must update the instant
  // a prop changes" is to do that update in the render body (comparing
  // against a value stored in state), not in an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  // Doing it here (rather than as a top-level setState call inside
  // useEffect) is what the ESLint rule below is asking for.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Keep the latest onClose in a ref instead of an effect dependency.
  // Callers pass onClose as a new inline arrow function every render, so
  // depending on it directly would re-run effects (and re-animate) on
  // every parent render, not just on actual open/close — the original
  // source of the cascading-render warning and the flicker/race.
  const onCloseRef = useRef(onClose);
  const hasClosedRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setShouldRender(true);
    } else {
      setActive(false);
    }
  }

  // This effect only does things that genuinely require the DOM to have
  // committed/painted: locking body scroll, kicking off the enter
  // transition one frame later, and delaying the unmount until the exit
  // transition finishes. Every setState call here is nested inside a
  // requestAnimationFrame or setTimeout callback rather than sitting
  // directly in the effect body, so it isn't a synchronous render-triggering
  // call from React's point of view.
  useEffect(() => {
    let rafId;
    let timeoutId;

    if (isOpen) {
      hasClosedRef.current = false;
      document.body.style.overflow = "hidden";
      // Wait a frame so the "closed" styles paint first, then flip to
      // "active" on the next frame so the opacity/transform transition
      // actually has a starting point to animate from.
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => setActive(true));
      });
    } else {
      timeoutId = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = "unset";
      }, 300);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Single entry point for closing — guarantees onClose fires at most once
  // per open/close cycle, no matter which UI element triggered it.
  const requestClose = () => {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;
    onCloseRef.current?.();
  };

  if (!shouldRender) return null;

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

  const getHeaderColor = () => getIconColor();

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
      requestClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    requestClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    requestClose();
  };

  const iconColor = getIconColor();

  return createPortal(
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
        opacity: active ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
      onClick={handleOverlayClick}
    >
      <style>{`
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
          opacity: active ? 1 : 0,
          transform: active
            ? "translateY(0) scale(1)"
            : "translateY(-30px) scale(0.95)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
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
              onClick={requestClose}
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
              onClick={requestClose}
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
    </div>,
    document.body,
  );
};

// ✅ Toast notification component (unchanged — no bug reported here)
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
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
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

// ✅ ToastContainer component (unchanged)
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
