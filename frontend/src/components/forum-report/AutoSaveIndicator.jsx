// frontend/src/components/forum-report/AutoSaveIndicator.jsx
// Shows auto-save status with subtle animation

import { C } from "../../styles/theme";
import { FiCheckCircle, FiLoader, FiClock } from "react-icons/fi";

const AutoSaveIndicator = ({ isSaving, isSaved, lastSavedAt, t = {} }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
        color: C.muted,
        padding: "4px 10px",
        borderRadius: "12px",
        background: isSaved ? "#F0FDF4" : isSaving ? "#EFF6FF" : "transparent",
        transition: "all 0.3s ease",
        border: isSaved ? "1px solid #86EFAC" : "none",
      }}
    >
      {isSaving ? (
        <>
          <FiLoader
            size={14}
            style={{ animation: "spin 1s linear infinite", color: C.primary }}
          />
          <span>{t.saving || "Auto-saving..."}</span>
        </>
      ) : isSaved ? (
        <>
          <FiCheckCircle size={14} color="#15803D" />
          <span style={{ color: "#15803D" }}>{t.saved || "Auto-saved"}</span>
          {lastSavedAt && (
            <span style={{ fontSize: "10px", opacity: 0.7 }}>
              {new Date(lastSavedAt).toLocaleTimeString()}
            </span>
          )}
        </>
      ) : (
        <>
          <FiClock size={14} />
          <span>{t.autoSaveReady || "Auto-save ready"}</span>
        </>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
