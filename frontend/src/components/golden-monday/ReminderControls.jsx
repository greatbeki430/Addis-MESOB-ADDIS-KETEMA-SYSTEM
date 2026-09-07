// src/components/golden-monday/ReminderControls.jsx
import { useState, useCallback } from "react";
import { FiBell, FiLoader } from "react-icons/fi";
import { C } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";

// ✅ Remove sessionId entirely if not used
export default function ReminderControls({ t }) {
  const [sending, setSending] = useState(false);

  const handleSendReminders = useCallback(async () => {
    setSending(true);
    try {
      const res = await goldenMondayAPI.sendReminders();
      const count = res?.data?.count || 0;
      showToast(
        count > 0
          ? `${count} ${t.remindersSent || "reminders sent"}!`
          : t.noRemindersToSend || "No reminders needed at this time",
        count > 0 ? "success" : "info",
      );
    } catch (error) {
      console.error("Send reminders failed:", error);
      showToast(t.failedSendReminders || "Failed to send reminders", "error");
    } finally {
      setSending(false);
    }
  }, [t]);

  return (
    <button
      onClick={handleSendReminders}
      disabled={sending}
      className="gm-reminder-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        border: "none",
        background: sending
          ? C.border
          : "linear-gradient(135deg, #f59e0b, #d97706)",
        color: sending ? C.muted : "#fff",
        fontWeight: 600,
        fontSize: "clamp(11px, 1.8vw, 13px)",
        cursor: sending ? "not-allowed" : "pointer",
        opacity: sending ? 0.6 : 1,
        transition: "all 0.3s ease",
        whiteSpace: "nowrap",
        minHeight: "clamp(32px, 4.5vh, 40px)",
        flexShrink: 0,
      }}
    >
      {sending ? (
        <FiLoader size={14} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <FiBell size={14} />
      )}
      <span className="btn-label">
        {sending ? t.sending || "Sending..." : t.sendReminders || "Reminders"}
      </span>
    </button>
  );
}
