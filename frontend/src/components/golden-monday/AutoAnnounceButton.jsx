// src/components/golden-monday/AutoAnnounceButton.jsx
import { useState, useCallback } from "react";
import { FiLoader, FiBell } from "react-icons/fi";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";

export default function AutoAnnounceButton({ onDone, t }) {
  const [announcing, setAnnouncing] = useState(false);

  const handleAnnounce = useCallback(async () => {
    setAnnouncing(true);
    try {
      const res = await goldenMondayAPI.announceNext();
      if (res.data?.result) {
        showToast(
          t.announcementPosted || "📢 Announcement posted to Telegram!",
          "success",
        );
      } else {
        showToast(
          t.noAnnouncementNeeded || "No new announcement needed",
          "info",
        );
      }
      if (onDone) onDone();
    } catch (error) {
      console.error("Auto-announce failed:", error);
      showToast(t.failedAnnounce || "Failed to post announcement", "error");
    } finally {
      setAnnouncing(false);
    }
  }, [onDone, t]);

  return (
    <button
      onClick={handleAnnounce}
      disabled={announcing}
      className="gm-auto-announce-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        border: "none",
        background: announcing
          ? "#d1d5db"
          : "linear-gradient(135deg, #f5c518, #d4a017)",
        color: announcing ? "#6b7280" : "#1a1a2e",
        fontWeight: 700,
        fontSize: "clamp(11px, 1.8vw, 13px)",
        cursor: announcing ? "not-allowed" : "pointer",
        opacity: announcing ? 0.6 : 1,
        transition: "all 0.3s ease",
        whiteSpace: "nowrap",
        minHeight: "clamp(32px, 4.5vh, 40px)",
        flexShrink: 0,
      }}
    >
      {announcing ? (
        <FiLoader size={14} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <FiBell size={14} />
      )}
      <span className="btn-label">
        {announcing
          ? t.posting || "Posting..."
          : t.autoAnnounce || "Auto-Announce"}
      </span>
    </button>
  );
}
