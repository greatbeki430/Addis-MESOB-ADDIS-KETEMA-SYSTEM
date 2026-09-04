// frontend/src/components/forum-report/TimeExpiredModal.jsx
// Modal shown when meeting time expires

import { useState } from "react";
import { C, radius, shadows, btn } from "../../styles/theme";
import { FiAlertTriangle, FiX, FiClock, FiSave, FiUser } from "react-icons/fi";

const TimeExpiredModal = ({
  isOpen,
  onClose,
  onRequestExtension,
  onViewProgress,
  isAdmin = false,
  t = {},
}) => {
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.white,
          borderRadius: radius.xl,
          maxWidth: "520px",
          width: "100%",
          padding: "clamp(24px, 4vw, 40px)",
          boxShadow: shadows.xl,
          position: "relative",
          animation: "scaleIn 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "#999",
            padding: "4px",
          }}
        >
          <FiX size={22} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: "clamp(60px, 12vw, 80px)",
            height: "clamp(60px, 12vw, 80px)",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <FiAlertTriangle size={36} color="#dc2626" />
        </div>

        <h2
          style={{
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: 800,
            color: C.dark,
            textAlign: "center",
            fontFamily: "serif",
            marginBottom: 8,
          }}
        >
          {t.timeExpiredTitle || "⏰ Meeting Time Expired!"}
        </h2>

        <p
          style={{
            fontSize: "clamp(13px, 2.5vw, 16px)",
            color: C.muted,
            textAlign: "center",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {t.timeExpiredMessage ||
            "Your 30-minute meeting time has ended. Your progress has been auto-saved and is now only visible to Admins and Super Admins."}
        </p>

        {/* Progress saved indicator */}
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: radius.md,
            padding: "10px 14px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiSave size={18} color="#15803D" />
          <span style={{ fontSize: "13px", color: "#15803D", fontWeight: 500 }}>
            {t.progressSavedMessage ||
              "✅ Your progress has been automatically saved to the system."}
          </span>
        </div>

        {/* Admin info */}
        {!isAdmin && (
          <div
            style={{
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: radius.md,
              padding: "10px 14px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FiUser size={18} color="#1D4ED8" />
            <span
              style={{ fontSize: "13px", color: "#1D4ED8", fontWeight: 500 }}
            >
              {t.adminOnlyMessage ||
                "🔒 Only Admins and Super Admins can view your saved progress."}
            </span>
          </div>
        )}

        {/* Reason input for extension request */}
        {showReasonInput && (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: C.dark,
                display: "block",
                marginBottom: 4,
              }}
            >
              {t.reasonLabel || "Reason for extension:"}
            </label>
            <textarea
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: radius.md,
                border: `2px solid ${C.border}`,
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
                minHeight: "60px",
                transition: "border-color 0.2s",
              }}
              placeholder={
                t.reasonPlaceholder || "Explain why you need more time..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border;
              }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexDirection: "column",
          }}
        >
          {!showReasonInput ? (
            <>
              <button
                onClick={() => setShowReasonInput(true)}
                style={{
                  ...btn.primary,
                  width: "100%",
                  justifyContent: "center",
                  padding: "12px",
                  fontSize: "14px",
                  gap: "8px",
                }}
              >
                <FiClock size={18} />
                {t.requestExtension || "Request Extension"}
              </button>

              {isAdmin && (
                <button
                  onClick={onViewProgress}
                  style={{
                    ...btn.secondary,
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px",
                    fontSize: "14px",
                    gap: "8px",
                  }}
                >
                  <FiSave size={18} />
                  {t.viewSavedProgress || "View Saved Progress"}
                </button>
              )}

              <button
                onClick={onClose}
                style={{
                  ...btn.secondary,
                  width: "100%",
                  justifyContent: "center",
                  padding: "12px",
                  fontSize: "14px",
                  gap: "8px",
                  borderStyle: "dashed",
                }}
              >
                {t.close || "Close"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onRequestExtension(reason)}
                disabled={!reason.trim()}
                style={{
                  ...btn.primary,
                  width: "100%",
                  justifyContent: "center",
                  padding: "12px",
                  fontSize: "14px",
                  gap: "8px",
                  opacity: reason.trim() ? 1 : 0.5,
                  cursor: reason.trim() ? "pointer" : "not-allowed",
                }}
              >
                <FiClock size={18} />
                {t.submitRequest || "Submit Extension Request"}
              </button>

              <button
                onClick={() => setShowReasonInput(false)}
                style={{
                  ...btn.secondary,
                  width: "100%",
                  justifyContent: "center",
                  padding: "12px",
                  fontSize: "14px",
                  gap: "8px",
                }}
              >
                {t.cancel || "Cancel"}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TimeExpiredModal;
