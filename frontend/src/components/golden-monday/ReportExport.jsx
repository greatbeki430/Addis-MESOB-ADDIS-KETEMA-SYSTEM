// components/golden-monday/ReportExport.jsx
// Export reports for Golden Monday (attendance, sessions, gallery)

import { useState } from "react";
import { C, F } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiDownload,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiCamera,
  FiLoader,
  FiCheck,
} from "react-icons/fi";

export default function ReportExport({ sessionId }) {
  const { language } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState("attendance");

  // Get translations based on language
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // Use useMemo to avoid impure Date.now() during render
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return {
      start: thirtyDaysAgo.toISOString().split("T")[0],
      end: now.toISOString().split("T")[0],
    };
  });

  const reportTypes = [
    {
      value: "attendance",
      label: t.attendanceReport || "Attendance Report",
      icon: <FiUsers size={14} />,
    },
    {
      value: "sessions",
      label: t.sessionsReport || "Sessions Report",
      icon: <FiFileText size={14} />,
    },
    {
      value: "gallery",
      label: t.galleryReport || "Gallery Report",
      icon: <FiCamera size={14} />,
    },
  ];

  // Helper function to get report data based on type
  const getReportData = async (type) => {
    switch (type) {
      case "attendance": {
        const attendanceRes = await goldenMondayAPI.getAttendance(sessionId);
        return {
          title: "Golden Monday Attendance Report",
          date: new Date().toISOString(),
          sessionId: sessionId,
          attendance: attendanceRes.data.attendance || [],
          stats: attendanceRes.data,
        };
      }
      case "sessions": {
        const sessionsRes = await goldenMondayAPI.getSessions();
        return {
          title: "Golden Monday Sessions Report",
          date: new Date().toISOString(),
          total: sessionsRes.data.length,
          sessions: sessionsRes.data,
        };
      }
      case "gallery": {
        const galleryRes = await goldenMondayAPI.getGallery({ limit: 1000 });
        return {
          title: "Golden Monday Gallery Report",
          date: new Date().toISOString(),
          total: galleryRes.data.photos.length,
          photos: galleryRes.data.photos,
        };
      }
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  };

  // Helper function to get filename based on type
  const getFilename = (type) => {
    const date = new Date().toISOString().split("T")[0];
    return `golden-monday-${type}-${date}.json`;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Get report data
      const data = await getReportData(reportType);
      const filename = getFilename(reportType);

      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(t.exportSuccess || "Report exported successfully!", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showToast(t.exportError || "Failed to export report", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ fontFamily: F.sans }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {reportTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setReportType(type.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              border: `2px solid ${reportType === type.value ? C.primary : C.border}`,
              background:
                reportType === type.value ? C.primary + "11" : C.white,
              color: reportType === type.value ? C.primary : C.muted,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: reportType === type.value ? 600 : 400,
              transition: "all 0.2s ease",
              fontFamily: F.sans,
            }}
            aria-label={type.label}
          >
            {type.icon}
            {type.label}
            {reportType === type.value && (
              <FiCheck
                size={14}
                color={C.primary}
                style={{ marginLeft: "auto" }}
              />
            )}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiCalendar size={14} color={C.muted} />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            style={{
              padding: "6px 10px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              fontFamily: F.sans,
            }}
            aria-label={t.startDate || "Start date"}
          />
          <span style={{ color: C.muted }}>{t.to || "to"}</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            style={{
              padding: "6px 10px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              fontFamily: F.sans,
            }}
            aria-label={t.endDate || "End date"}
          />
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: exporting ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            fontFamily: F.sans,
            opacity: exporting ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
          aria-label={t.exportReport || "Export Report"}
        >
          {exporting ? (
            <>
              <FiLoader
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
              {t.exporting || "Exporting..."}
            </>
          ) : (
            <>
              <FiDownload size={16} />
              {t.exportReport || "Export Report"}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
