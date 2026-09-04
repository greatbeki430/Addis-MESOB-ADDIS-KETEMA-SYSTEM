// frontend/src/components/forum-report/RequestExtensionModal.jsx
// Modal for requesting time extension from admin

import { useState } from "react";
import { C, radius, shadows, btn } from "../../styles/theme";
import {
  FiClock,
  FiX,
  FiSend,
  FiAlertCircle,
  FiUser,
  FiCheckCircle,
} from "react-icons/fi";

const RequestExtensionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  t = {},
  teamName = "",
}) => {
  const [reason, setReason] = useState("");
  const [requestedDuration, setRequestedDuration] = useState(15);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason, requestedDuration);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason("");
      setRequestedDuration(15);
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setReason("");
    setRequestedDuration(15);
    onClose();
  };

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
      onClick={handleClose}
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
          onClick={handleClose}
          disabled={isSubmitting}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            color: "#999",
            padding: "4px",
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          <FiX size={22} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: "clamp(56px, 10vw, 72px)",
            height: "clamp(56px, 10vw, 72px)",
            borderRadius: "50%",
            background: `linear-gradient(145deg, ${C.primary}20, ${C.primary}08)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <FiClock size={32} color={C.primary} />
        </div>

        <h2
          style={{
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: 800,
            color: C.dark,
            textAlign: "center",
            fontFamily: "serif",
            marginBottom: 4,
          }}
        >
          {t.extensionRequestTitle || "⏰ Request Time Extension"}
        </h2>

        {teamName && (
          <p
            style={{
              fontSize: "clamp(13px, 2.5vw, 15px)",
              color: C.primary,
              textAlign: "center",
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            {t.teamLabel || "Team"}: {teamName}
          </p>
        )}

        <p
          style={{
            fontSize: "clamp(13px, 2.5vw, 15px)",
            color: C.muted,
            textAlign: "center",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {t.extensionRequestMessage ||
            "Your meeting time has expired. Request additional time from an admin by providing a reason below."}
        </p>

        {/* Info box */}
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: radius.md,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <FiAlertCircle
            size={18}
            color="#92400E"
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          <span style={{ fontSize: "13px", color: "#92400E" }}>
            {t.extensionInfo ||
              "Your request will be sent to an admin for approval. You will be notified once a decision is made."}
          </span>
        </div>

        {/* Reason input */}
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
            {t.reasonLabel || "Reason for extension:"}{" "}
            <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: radius.md,
              border: `2px solid ${reason.trim() ? C.primary : C.border}`,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: "80px",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxShadow: reason.trim() ? `0 0 0 3px ${C.primary}22` : "none",
            }}
            placeholder={
              t.reasonPlaceholder ||
              "Explain why you need more time to complete the report..."
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting || submitted}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              if (!reason.trim()) {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: C.muted,
              marginTop: "4px",
            }}
          >
            <span>{reason.length}/500 characters</span>
            <span>{reason.trim() ? "✅ Valid" : "Required"}</span>
          </div>
        </div>

        {/* Duration selector */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: C.dark,
              display: "block",
              marginBottom: 4,
            }}
          >
            {t.durationLabel || "Additional time needed:"}
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
              gap: "8px",
            }}
          >
            {[5, 10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => setRequestedDuration(mins)}
                disabled={isSubmitting || submitted}
                style={{
                  padding: "8px 12px",
                  borderRadius: radius.md,
                  border: `2px solid ${requestedDuration === mins ? C.primary : C.border}`,
                  background:
                    requestedDuration === mins ? `${C.primary}10` : C.white,
                  color: requestedDuration === mins ? C.primary : C.muted,
                  fontWeight: requestedDuration === mins ? 700 : 400,
                  cursor: isSubmitting || submitted ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "13px",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => {
                  if (
                    !isSubmitting &&
                    !submitted &&
                    requestedDuration !== mins
                  ) {
                    e.currentTarget.style.borderColor = C.primary + "66";
                    e.currentTarget.style.background = `${C.primary}05`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    !isSubmitting &&
                    !submitted &&
                    requestedDuration !== mins
                  ) {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.background = C.white;
                  }
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexDirection: "column",
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting || submitted}
            style={{
              ...btn.primary,
              width: "100%",
              justifyContent: "center",
              padding: "14px",
              fontSize: "15px",
              gap: "8px",
              opacity: !reason.trim() || isSubmitting || submitted ? 0.5 : 1,
              cursor:
                !reason.trim() || isSubmitting || submitted
                  ? "not-allowed"
                  : "pointer",
              borderRadius: radius.lg,
              transition: "all 0.3s ease",
            }}
          >
            {isSubmitting ? (
              <>
                <FiClock
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                {t.submitting || "Submitting..."}
              </>
            ) : submitted ? (
              <>
                <FiCheckCircle size={18} color="#fff" />
                {t.submittedSuccess || "✅ Request Sent!"}
              </>
            ) : (
              <>
                <FiSend size={18} />
                {t.submitRequest || "Submit Extension Request"}
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              ...btn.secondary,
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: "14px",
              gap: "8px",
              borderStyle: "solid",
              opacity: isSubmitting ? 0.5 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {t.cancel || "Cancel"}
          </button>
        </div>

        {/* Admin info */}
        <div
          style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: radius.md,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiUser size={16} color="#15803D" />
          <span style={{ fontSize: "12px", color: "#15803D" }}>
            {t.adminNotification ||
              "🔔 An admin will review your request and notify you of their decision."}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RequestExtensionModal;
