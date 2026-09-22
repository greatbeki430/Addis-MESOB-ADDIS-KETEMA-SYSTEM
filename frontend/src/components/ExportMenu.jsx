// frontend/src/components/ExportMenu.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  exportForumReportToPDF,
  exportDailyReportToPDF,
  // Uncomment once the certificate / biweekly menu items are enabled:
  // exportRecognitionCertificateToPDF,
  // exportBiWeeklyAggregateReportToPDF,
} from "../utils/pdfExport";
import { FiDownload, FiChevronDown, FiFileText } from "react-icons/fi";

const EXPORT_TYPES = [
  "forum",
  "evaluation",
  "daily",
  "certificate",
  "biweekly",
];

const ExportMenu = ({
  type,
  data,
  t,
  teamName,
  meetingNumber,
  reportDate,
  // certificate / biweekly only — unused while those branches are
  // commented out, kept in the signature so call sites don't need to
  // change when the branches are re-enabled.
  employeeName,
  month,
  score,
  weeklyData,
  startDate,
  endDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Dev-time guard: catch typos in `type` early instead of silently no-op'ing.
  // Uses Vite's `import.meta.env.DEV` (not `process.env.NODE_ENV`) because
  // Vite does not polyfill `process` for browser builds.
  useEffect(() => {
    if (import.meta.env.DEV && !EXPORT_TYPES.includes(type)) {
      console.warn(
        `[ExportMenu] Unknown type "${type}". Expected one of: ${EXPORT_TYPES.join(", ")}.`,
      );
    }
  }, [type]);

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleExport = useCallback(async () => {
    try {
      switch (type) {
        case "forum":
          // Signature: (formData, t, lang, teamName, options)
          exportForumReportToPDF(data, t, "am", teamName);
          break;

        case "daily":
          // Signature is async: (rows, date, t, options)
          await exportDailyReportToPDF(data, reportDate, t);
          break;

        // Evaluation reports have a completely different argument shape
        // (scores, members, totalScores, bestPerformer, t, comments,
        // signatures, ...) which this generic menu cannot supply. The
        // evaluation page should call exportEvaluationReportToPDF()
        // directly with its full argument list.

        // Uncomment once the certificate branch is wired up:
        // case "certificate":
        //   exportRecognitionCertificateToPDF(
        //     employeeName,
        //     month,
        //     teamName,
        //     score,
        //   );
        //   break;

        // Uncomment once the biweekly branch is wired up:
        // case "biweekly":
        //   exportBiWeeklyAggregateReportToPDF(
        //     weeklyData,
        //     startDate,
        //     endDate,
        //     teamName,
        //   );
        //   break;

        default:
          break;
      }
    } catch (error) {
      console.error("[ExportMenu] Export failed:", error);
    } finally {
      setIsOpen(false);
    }
  }, [
    type,
    data,
    t,
    teamName,
    meetingNumber,
    reportDate,
    // Only used when the certificate / biweekly branches are re-enabled.
    // Listed here so the hook doesn't go stale if those branches return.
    employeeName,
    month,
    score,
    weeklyData,
    startDate,
    endDate,
  ]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        style={buttonStyle}
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <FiDownload size={14} />
        Export Report
        <FiChevronDown size={12} />
      </button>

      {isOpen && (
        <div
          role="menu"
          style={menuStyle}
          onMouseLeave={() => setIsOpen(false)}
        >
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle}
            onClick={handleExport}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <FiFileText size={14} />
            PDF Format
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Styles (module-scope so they're not recreated per render) ─────────────

const buttonStyle = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const menuStyle = {
  position: "absolute",
  top: "100%",
  right: 0,
  marginTop: 4,
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  overflow: "hidden",
  zIndex: 50,
  minWidth: 150,
};

const menuItemStyle = {
  padding: "10px 16px",
  fontSize: 12,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderBottom: "1px solid #eee",
  transition: "background 0.15s",
  background: "#fff",
  border: "none",
  width: "100%",
  textAlign: "left",
  fontFamily: "inherit",
  color: "inherit",
};

export default ExportMenu;
