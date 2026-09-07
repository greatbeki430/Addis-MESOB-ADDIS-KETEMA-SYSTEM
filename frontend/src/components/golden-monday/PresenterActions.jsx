// src/components/golden-monday/PresenterActions.jsx
import { useState } from "react";
import { FiCheck, FiX, FiLoader } from "react-icons/fi";
import { C } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";

export default function PresenterActions({ session, user, onAction, t }) {
  const [processing, setProcessing] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");

  if (!session || !user) return null;

  const isPresenter =
    session.presenter?._id === user._id || session.presenter === user._id;

  if (!isPresenter) return null;

  const alreadyResponded =
    session.presenterStatus === "confirmed" ||
    session.presenterStatus === "declined";

  if (alreadyResponded) return null;

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await goldenMondayAPI.confirmAvailability(session._id);
      showToast(t.availabilityConfirmed || "✅ You're confirmed!", "success");
      if (onAction) onAction();
    } catch (error) {
      console.error("Confirm action failed:", error);
      showToast(t.failedConfirm || "Failed to confirm", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!reason || reason.length < 10) {
      showToast(
        t.reasonRequired || "Please provide a valid reason (min 10 chars)",
        "warning",
      );
      return;
    }
    setProcessing(true);
    try {
      await goldenMondayAPI.declineAvailability(session._id, reason);
      showToast(t.declinedRecorded || "Your reason has been recorded", "info");
      setShowReasonInput(false);
      setReason("");
      if (onAction) onAction();
    } catch (error) {
      console.error("Decline action failed:", error);
      showToast(t.failedDecline || "Failed to record decline", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (showReasonInput) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 12,
          background: "#fef2f2",
          border: "1px solid #fecaca",
        }}
      >
        <p style={{ fontSize: 13, color: "#991b1b", marginBottom: 8 }}>
          {t.provideReason || "Please explain why you can't present:"}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t.reasonPlaceholder || "I can't present because..."}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #fca5a5",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            background: "#fff",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => setShowReasonInput(false)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "transparent",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {t.cancel || "Cancel"}
          </button>
          <button
            onClick={handleDecline}
            disabled={processing}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "none",
              background: processing ? "#d1d5db" : "#ef4444",
              color: "#fff",
              cursor: processing ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {processing ? (
              <FiLoader
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <FiX size={14} />
            )}
            {t.submit || "Submit"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        background: C.bg,
        border: `1px solid ${C.border}`,
      }}
    >
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        {t.availabilityRequest || "Please confirm your availability:"}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleConfirm}
          disabled={processing}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: processing ? "#d1d5db" : "#10b981",
            color: "#fff",
            cursor: processing ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            justifyContent: "center",
          }}
        >
          {processing ? (
            <FiLoader
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <FiCheck size={16} />
          )}
          {t.imAvailable || "✅ I'm Available"}
        </button>
        <button
          onClick={() => setShowReasonInput(true)}
          disabled={processing}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "1px solid #fca5a5",
            background: "transparent",
            color: "#ef4444",
            cursor: processing ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <FiX size={16} />
          {t.notAvailable || "❌ Not Available"}
        </button>
      </div>
    </div>
  );
}
