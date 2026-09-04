// frontend/src/components/forum-report/MeetingTimer.jsx
// Meeting timer display with visual progress and warnings

import { C, radius, shadows } from "../../styles/theme";
import { FiClock, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const MeetingTimer = ({
  timeRemaining,
  formattedTime,
  progressPercent,
  status,
  isExpired,
  progressSaved,
  warningMessage,
  onExtend,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "expired":
        return "#dc2626";
      case "critical":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return C.primary;
    }
  };

  const getStatusIcon = () => {
    if (isExpired) return <FiAlertTriangle size={20} color="#dc2626" />;
    if (status === "critical")
      return <FiAlertTriangle size={20} color="#ef4444" />;
    if (progressSaved) return <FiCheckCircle size={20} color="#10b981" />;
    return <FiClock size={20} color={getStatusColor()} />;
  };

  return (
    <div
      style={{
        background: C.white,
        borderRadius: radius.lg,
        padding: "12px 16px",
        boxShadow: shadows.md,
        border: `2px solid ${isExpired ? "#dc2626" : getStatusColor()}`,
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress bar background */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "4px",
          width: "100%",
          background: "#e5e7eb",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, progressPercent)}%`,
            background: isExpired
              ? "#dc2626"
              : status === "critical"
                ? "#ef4444"
                : status === "warning"
                  ? "#f59e0b"
                  : C.primary,
            transition: "width 1s ease",
            borderRadius: "0 0 0 0",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: isExpired
                ? "#fee2e2"
                : status === "critical"
                  ? "#fef2f2"
                  : status === "warning"
                    ? "#fffbeb"
                    : `${C.primary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getStatusIcon()}
          </div>
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                fontFamily: "monospace",
                color: isExpired ? "#dc2626" : C.dark,
              }}
            >
              {isExpired ? "⏰ Time Expired!" : formattedTime}
            </div>
            <div style={{ fontSize: "11px", color: C.muted }}>
              {isExpired
                ? "Meeting time has ended"
                : `${Math.ceil(timeRemaining / 60)} minutes remaining`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {warningMessage && !isExpired && (
            <div
              style={{
                fontSize: "11px",
                color: "#dc2626",
                background: "#fee2e2",
                padding: "4px 10px",
                borderRadius: radius.pill,
                fontWeight: 600,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              {warningMessage}
            </div>
          )}

          {progressSaved && (
            <div
              style={{
                fontSize: "11px",
                color: "#15803D",
                background: "#DCFCE7",
                padding: "4px 10px",
                borderRadius: radius.pill,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiCheckCircle size={12} />
              Auto-saved
            </div>
          )}

          {isExpired && (
            <button
              onClick={onExtend}
              style={{
                fontSize: "11px",
                padding: "4px 12px",
                borderRadius: radius.pill,
                border: `1px solid ${C.primary}`,
                background: C.primary,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Request Extension
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default MeetingTimer;
