// frontend/src/pages/DailyReport.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { btn, card, C, F } from "../styles/theme";
import Field from "../components/ui/Field";
import { dailyReportAPI, serviceAPI } from "../services/api";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { generateDailyReportPDF } from "../utils/pdf/reports/dailyReport";
import DailyReportFeed from "../components/DailyReportFeed";
import { AISummary, AIReportAssistant } from "../components/ai";
import { aiAPI } from "../services/api";
import {
  FiCalendar,
  FiList,
  FiPlus,
  FiX,
  FiSave,
  FiLoader,
  FiFileText,
  FiBarChart2,
  FiDownload,
  FiClock,
  FiTrash2,
  FiEye,
  FiUsers,
} from "react-icons/fi";

export default function DailyReport({ t, lang }) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const td = useCallback(
    (key, fb = "") => t?.(`dailyReport.${key}`) || fb,
    [t],
  );
  const tcm = useCallback((key, fb = "") => t?.(`common.${key}`) || fb, [t]);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("draft");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [savedReportId, setSavedReportId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pdfLanguage, setPdfLanguage] = useState("am");

  // ✅ New state for History
  const [activeTab, setActiveTab] = useState("new"); // "new" | "history" | "feed"
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Refs for tracking state
  const historyLoadedRef = useRef(false);
  const loadingRef = useRef(false); // ✅ Track loading state to prevent duplicates

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Fetch departments and services ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await serviceAPI.getAll();

        const services = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response?.data?.services)
              ? response.data.services
              : [];

        if (cancelled) return;

        setAllServices(services);

        const deptMap = new Map();

        services.forEach((s) => {
          if (!s?.dept) return;
          deptMap.set(s.dept, lang === "en" ? s.deptEn || s.dept : s.dept);
        });

        const deptEntries = [...deptMap.entries()];
        setDepartments(deptEntries);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        if (!cancelled) {
          setAllServices([]);
          setDepartments([]);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  // ─── Load daily report for selected date ────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // ✅ Own full report for this date (entries + summary + id), not the
        // old team-wide lookup that could load a teammate's draft.
        const response = await dailyReportAPI.getMine(date);
        const report = response.data?.data;
        if (report && report.entries?.length > 0) {
          setRows(report.entries);
          setSummary(report.summary || "");
          setStatus(report.status || "draft");
          setSavedReportId(report._id || null);
        } else {
          setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
          setSummary("");
          setStatus("draft");
          setSavedReportId(null);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
          setSummary("");
          setSavedReportId(null);
        } else {
          console.error("Failed to load daily report:", error);
          showToast(td("saveError", "Failed to load daily report"), "error");
          setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // ─── Load history for current user ──────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    // Prevent multiple simultaneous loads using ref
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setHistoryLoading(true);
      const response = await dailyReportAPI.getUserHistory();

      // ✅ Fix: Handle different response structures
      let historyData = [];

      // Check if response.data exists
      if (response && response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          historyData = response.data;
        }
        // If response.data has a data property that is an array (nested response)
        else if (response.data.data && Array.isArray(response.data.data)) {
          historyData = response.data.data;
        }
        // If response.data.data has a data property that is an array (deeply nested)
        else if (
          response.data.data &&
          response.data.data.data &&
          Array.isArray(response.data.data.data)
        ) {
          historyData = response.data.data.data;
        }
        // Fallback: try to get array from any property
        else {
          // Look for any property that is an array
          let found = false;
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              historyData = response.data[key];
              found = true;
              break;
            }
          }
          // If no array found, try response itself if it's an array
          if (!found && Array.isArray(response)) {
            historyData = response;
          }
        }
      } else if (Array.isArray(response)) {
        // If response itself is an array
        historyData = response;
      }

      // Ensure we have an array
      setHistory(Array.isArray(historyData) ? historyData : []);
      historyLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to load history:", error);
      showToast(
        td("historyLoadError", "Failed to load report history"),
        "error",
      );
      historyLoadedRef.current = true;
      setHistory([]); // ✅ Set to empty array on error
    } finally {
      setHistoryLoading(false);
      loadingRef.current = false;
    }
  }, [td, showToast]); // ✅ Only depend on td and showToast

  // ─── Auto-load history when the History tab becomes active ─────────────────
  useEffect(() => {
    if (activeTab === "history" && !historyLoadedRef.current) {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  // ─── Calculate Totals ──────────────────────────────────────────────────────
  const calculateTotals = (rowsData) => {
    const total = rowsData.reduce((a, r) => a + (r.total || 0), 0);
    const male = rowsData.reduce((a, r) => a + (r.male || 0), 0);
    const female = rowsData.reduce((a, r) => a + (r.female || 0), 0);
    return { total, male, female };
  };

  // ✅ Calculate totals directly from rows (no effect needed)
  const totals = calculateTotals(rows);

  const upd = (index, field, value) => {
    setRows((prevRows) => {
      const next = [...prevRows];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      if (field === "male" || field === "female") {
        next[index].total =
          (Number(field === "male" ? value : next[index].male) || 0) +
          (Number(field === "female" ? value : next[index].female) || 0);
      }
      return next;
    });
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        dept: "",
        service: "",
        male: 0,
        female: 0,
        total: 0,
      },
    ]);

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const getServicesByDept = (deptKey) => {
    if (!deptKey) return [];
    return allServices.filter((s) => s.dept === deptKey);
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      const entries = rows.filter((r) => r.dept || r.service);
      if (entries.length === 0) {
        showToast(
          td("addServiceEntry", "Please add at least one service entry"),
          "warning",
        );
        return;
      }
      const invalidRows = entries.filter((r) => !r.dept || !r.service);
      if (invalidRows.length > 0) {
        showToast(
          td(
            "fillDeptService",
            "Please fill in both Department and Service for all rows",
          ),
          "warning",
        );
        return;
      }
      const grandTotal = entries.reduce((sum, e) => sum + (e.total || 0), 0);
      const response = await dailyReportAPI.create({
        date,
        entries,
        grandTotal,
        summary,
        status: status || "draft",
        team: user?.team || null,
      });
      setSavedReportId(response?.data?._id || null);
      showToast(td("savedSuccess", "✅ Report saved successfully!"), "success");
      // Refresh history if it's open
      if (activeTab === "history") {
        historyLoadedRef.current = false; // ✅ Reset flag to force reload
        loadHistory();
      }
    } catch (error) {
      console.error("Failed to save report:", error);
      showToast(
        error.response?.data?.message ||
          td("saveError", "Failed to save report"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Submit report for review ──────────────────────────────────────────────
  const submitReportForReview = async () => {
    if (!savedReportId) {
      showToast(td("saveFirst", "Please save your report first"), "warning");
      return;
    }
    try {
      setSaving(true);
      await dailyReportAPI.update(savedReportId, { status: "submitted" });
      setStatus("submitted");
      showToast(
        td("submittedSuccess", "✅ Report submitted for review!"),
        "success",
      );
      if (activeTab === "history") {
        historyLoadedRef.current = false;
        loadHistory();
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
      showToast(td("submitError", "Failed to submit report"), "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Load a report from history ─────────────────────────────────────────────
  const loadReportFromHistory = (report) => {
    try {
      if (report.entries && report.entries.length > 0) {
        setRows(report.entries);
        setSummary(report.summary || "");
        setStatus(report.status || "draft");
        setDate(
          report.date
            ? new Date(report.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        );
        setSavedReportId(report._id);
        setActiveTab("new");
        showToast(
          td("reportLoaded", "📄 Report loaded successfully!"),
          "success",
        );
      } else {
        showToast(
          td("noEntries", "No entries found in this report"),
          "warning",
        );
      }
    } catch (error) {
      console.error("Failed to load report:", error);
      showToast(td("loadError", "Failed to load report"), "error");
    }
  };

  // ─── Delete a report from history ───────────────────────────────────────────
  const deleteReport = async (id) => {
    if (
      !confirm(
        td("confirmDelete", "Are you sure you want to delete this report?"),
      )
    ) {
      return;
    }
    try {
      setDeletingId(id);
      await dailyReportAPI.delete(id);
      showToast(
        td("deleteSuccess", "✅ Report deleted successfully!"),
        "success",
      );
      historyLoadedRef.current = false; // ✅ Reset flag to force reload
      await loadHistory();
    } catch (error) {
      console.error("Failed to delete report:", error);
      showToast(td("deleteError", "Failed to delete report"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Export PDF from history ────────────────────────────────────────────────
  const exportHistoryPDF = async (report) => {
    try {
      setExporting(true);
      const exportData = report.entries || [];
      if (exportData.length === 0) {
        showToast(td("noDataToExport", "No data to export"), "warning");
        return;
      }

      // ✅ Get user info with professional fallback
      const userName =
        user?.fullName ||
        user?.displayName ||
        user?.name ||
        user?.username ||
        "Unknown User";

      // ✅ Department/Team - NO role, professional default
      const userDepartment =
        user?.team?.department ||
        user?.team?.name ||
        user?.department ||
        "A-MESOB Staff";

      // ✅ Get branch/location
      const userBranch = user?.branch || "Addis Ketema";

      await generateDailyReportPDF(exportData, report.date, t, {
        language: pdfLanguage,
        showWatermark: true,
        watermarkText:
          pdfLanguage === "am"
            ? "ዕለታዊ ሪፖርት"
            : pdfLanguage === "om"
              ? "Gabaasa Guyyaa"
              : "Daily Report",
        preparedBy: userName,
        preparedByDepartment: userDepartment,
        preparedByRole: user?.role || "Staff",
        preparedByBranch: userBranch,
      });
      showToast(
        td("exportSuccess", "✅ PDF exported successfully!"),
        "success",
      );
    } catch (error) {
      console.error("Failed to export PDF:", error);
      showToast(
        td("exportError", "Failed to export PDF: ") + error.message,
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  // ─── Main Export PDF ────────────────────────────────────────────────────────

  const exportPDF = async () => {
    try {
      setExporting(true);

      const exportData = rows.filter((r) => r.dept || r.service);

      if (exportData.length === 0) {
        showToast(td("noDataToExport", "No data to export"), "warning");
        return;
      }

      // ✅ Get user name
      const userName =
        user?.fullName ||
        user?.displayName ||
        user?.name ||
        user?.username ||
        "Unknown User";

      // ✅ Get department from team (NOT from user directly)
      const userDepartment =
        user?.team?.department || // Department from team
        user?.team?.name || // Team name as fallback
        "";

      // ✅ Get position from user
      const userPosition = user?.position || "";

      // ✅ Get branch
      const userBranch = user?.branch || "Addis Ketema";

      // ✅ Build the parts array - Department and Position together
      const parts = [];

      // Add department if exists
      if (userDepartment && userDepartment !== "") {
        parts.push(userDepartment);
      }

      // Add position if exists
      if (userPosition && userPosition !== "") {
        parts.push(userPosition);
      }

      // Add branch if exists
      if (userBranch && userBranch !== "") {
        parts.push(userBranch);
      }

      // If no department, position, or branch - show nothing
      const displayParts = parts.length > 0 ? `(${parts.join(" - ")})` : "";

      console.log("👤 PDF prepared by:", userName);
      console.log("🏢 Department (from team):", userDepartment);
      console.log("💼 Position:", userPosition);
      console.log("📍 Branch:", userBranch);

      await generateDailyReportPDF(exportData, date, t, {
        language: pdfLanguage,
        showWatermark: true,
        watermarkAngle: 30,
        watermarkText:
          pdfLanguage === "am"
            ? "ዕለታዊ ሪፖርት"
            : pdfLanguage === "om"
              ? "Gabaasa Guyyaa"
              : "Daily Report",
        preparedBy: userName,
        preparedByDepartment: userDepartment,
        preparedByPosition: userPosition,
        preparedByBranch: userBranch,
        preparedByDisplay: displayParts,
      });

      showToast(
        td("exportSuccess", "✅ PDF exported successfully!"),
        "success",
      );
    } catch (error) {
      console.error("Failed to export PDF:", error);
      showToast(
        td("exportError", "Failed to export PDF: ") + error.message,
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  // ─── Style helpers ───────────────────────────────────────────────────────────
  const th = {
    background: C.dark,
    color: C.light,
    padding: "clamp(6px, 2vw, 10px) clamp(4px, 1.5vw, 10px)",
    textAlign: "left",
    fontFamily: F.sans,
    fontWeight: 700,
    fontSize: "clamp(10px, 3vw, 12px)",
    whiteSpace: "nowrap",
  };

  const tdCell = {
    padding: "clamp(6px, 2vw, 10px) clamp(4px, 1.5vw, 10px)",
    borderBottom: "1px solid #eef2ee",
    fontFamily: F.sans,
    verticalAlign: "middle",
    fontSize: "clamp(11px, 3vw, 13px)",
  };

  const ti = {
    border: `1.5px solid ${C.border}`,
    borderRadius: 6,
    padding: "clamp(3px, 1.5vw, 6px) clamp(4px, 2vw, 8px)",
    fontFamily: F.sans,
    background: "#fafffe",
    fontSize: "clamp(11px, 3vw, 13px)",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };

  // ─── Render History Tab ──────────────────────────────────────────────────────
  const renderHistory = () => {
    if (historyLoading) {
      return (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          <FiLoader
            size={24}
            style={{
              animation: "spin 1s linear infinite",
              display: "block",
              margin: "0 auto 12px",
            }}
          />
          {tcm("loading", "Loading history...")}
        </div>
      );
    }

    if (history.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          <FiClock
            size={48}
            style={{ display: "block", margin: "0 auto 12px", opacity: 0.5 }}
          />
          <p style={{ fontWeight: 600, fontSize: "16px", color: C.dark }}>
            {td("noHistory", "No saved reports")}
          </p>
          <p style={{ fontSize: "13px" }}>
            {td("saveFirst", "Save your first report to see it here")}
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {history.map((report) => {
          const totalEntries = report.entries?.length || 0;
          const grandTotal =
            report.entries?.reduce((sum, e) => sum + (e.total || 0), 0) || 0;
          const reportDate = report.date
            ? new Date(report.date).toLocaleDateString(
                lang === "en" ? "en-US" : lang === "am" ? "am-ET" : "om-ET",
                { year: "numeric", month: "short", day: "numeric" },
              )
            : "N/A";

          return (
            <div
              key={report._id}
              style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: isMobile ? "14px" : "16px",
                transition: "box-shadow 0.2s",
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto",
                gap: isMobile ? "12px" : "16px",
                alignItems: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0,0,0,0.08)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Icon */}
              <div
                style={{
                  width: isMobile ? "100%" : "48px",
                  height: isMobile ? "60px" : "48px",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, #EFF6FF, #DBEAFE)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                }}
              >
                <FiFileText size={20} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: isMobile ? "14px" : "15px",
                    color: "#0F172A",
                  }}
                >
                  {td("reportFor", "Report for")} {reportDate}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "11px" : "12px",
                    color: "#64748B",
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "2px",
                  }}
                >
                  <span>
                    {totalEntries} {td("entries", "entries")}
                  </span>
                  <span style={{ fontWeight: 600, color: C.primary }}>
                    {td("total", "Total")}: {grandTotal}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      background: "#F1F5F9",
                      padding: "2px 8px",
                      borderRadius: "99px",
                    }}
                  >
                    {report.team || td("myTeam", "My Team")}
                  </span>
                  {report.status && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "99px",
                        background:
                          report.status === "submitted" ? "#DBEAFE" : "#F1F5F9",
                        color:
                          report.status === "submitted" ? "#2563EB" : "#64748B",
                      }}
                    >
                      {report.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexShrink: 0,
                  flexWrap: isMobile ? "wrap" : "nowrap",
                  justifyContent: isMobile ? "flex-start" : "flex-end",
                }}
              >
                <button
                  onClick={() => loadReportFromHistory(report)}
                  style={{
                    background: "#3B82F6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: isMobile ? "6px 10px" : "6px 12px",
                    fontSize: isMobile ? "11px" : "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#2563EB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#3B82F6")
                  }
                >
                  <FiEye size={14} />
                  {!isMobile && td("load", "Load")}
                </button>
                <button
                  onClick={() => exportHistoryPDF(report)}
                  style={{
                    background: "#DC2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: isMobile ? "6px 10px" : "6px 12px",
                    fontSize: isMobile ? "11px" : "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#B91C1C")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#DC2626")
                  }
                >
                  <FiDownload size={14} />
                  {!isMobile && td("export", "Export")}
                </button>
                <button
                  onClick={() => deleteReport(report._id)}
                  disabled={deletingId === report._id}
                  style={{
                    background: "#EF4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: isMobile ? "6px 10px" : "6px 12px",
                    fontSize: isMobile ? "11px" : "12px",
                    cursor:
                      deletingId === report._id ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s",
                    opacity: deletingId === report._id ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!deletingId)
                      e.currentTarget.style.background = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    if (!deletingId)
                      e.currentTarget.style.background = "#EF4444";
                  }}
                >
                  {deletingId === report._id ? (
                    <FiLoader
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <FiTrash2 size={14} />
                  )}
                  {!isMobile && td("delete", "Delete")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
        animation: "fadeInUp 0.5s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 3vw, 14px)",
          marginBottom: "clamp(16px, 4vw, 24px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FiFileText size={36} color={C.primary} />
          <div>
            <h1
              style={{
                fontSize: "clamp(18px, 5vw, 24px)",
                fontWeight: 900,
                color: C.dark,
                fontFamily: F.serif,
                margin: 0,
                background: `linear-gradient(90deg, ${C.dark}, ${C.primary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {td("title", "Daily Report")}
            </h1>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                margin: "2px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiCalendar size={14} />
              {new Date(date).toLocaleDateString(
                lang === "en" ? "en-US" : lang === "am" ? "am-ET" : "om-ET",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </p>
          </div>
        </div>
        <span
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
            color: "#fff",
            padding: "clamp(4px, 1.5vw, 6px) clamp(12px, 3vw, 18px)",
            borderRadius: 20,
            fontSize: "clamp(11px, 3vw, 13px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: `0 4px 15px ${C.primary}44`,
          }}
        >
          {t?.("year") || "2018 E.C."}
        </span>
      </div>

      {/* ✅ Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#F1F5F9",
          borderRadius: "10px",
          padding: "4px",
          marginBottom: "clamp(16px, 3vw, 20px)",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("new");
            historyLoadedRef.current = false; // ✅ Reset flag when switching tabs
          }}
          style={{
            flex: 1,
            padding: isMobile ? "8px 12px" : "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "new" ? "#fff" : "transparent",
            color: activeTab === "new" ? "#0F172A" : "#64748B",
            fontWeight: 600,
            fontSize: isMobile ? "12px" : "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow:
              activeTab === "new" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <FiFileText size={isMobile ? 14 : 16} />
          {td("newReport", "New Report")}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            flex: 1,
            padding: isMobile ? "8px 12px" : "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "history" ? "#fff" : "transparent",
            color: activeTab === "history" ? "#0F172A" : "#64748B",
            fontWeight: 600,
            fontSize: isMobile ? "12px" : "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow:
              activeTab === "history" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <FiClock size={isMobile ? 14 : 16} />
          {td("history", "History")}
          {history.length > 0 && (
            <span
              style={{
                background: C.primary,
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                padding: "1px 8px",
                borderRadius: "99px",
                marginLeft: "2px",
              }}
            >
              {history.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          style={{
            flex: 1,
            padding: isMobile ? "8px 12px" : "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "feed" ? "#fff" : "transparent",
            color: activeTab === "feed" ? "#0F172A" : "#64748B",
            fontWeight: 600,
            fontSize: isMobile ? "12px" : "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow:
              activeTab === "feed" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <FiUsers size={isMobile ? 14 : 16} />
          {td("teamFeed", "Team Feed")}
        </button>
      </div>

      {/* ─── NEW REPORT TAB ─────────────────────────────────────────────────── */}
      {activeTab === "new" ? (
        <>
          {/* Date Picker */}
          <div
            style={{
              ...card,
              marginBottom: "clamp(16px, 4vw, 20px)",
              transition: "all 0.3s ease",
            }}
          >
            <Field
              label={
                <>
                  <FiCalendar size={14} style={{ marginRight: 6 }} />
                  {td("reportDate", "Report Date")}
                </>
              }
              value={date}
              onChange={setDate}
              type="date"
            />
          </div>

          {/* ✅ Daily reflection - this is what teammates actually read and
              react to in the Team Feed; the service table alone is just
              numbers. */}
          <div style={{ ...card, marginBottom: "clamp(16px, 4vw, 20px)" }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.dark,
                display: "block",
                marginBottom: 8,
              }}
            >
              {td("dailySummary", "How did today go? (visible to your team)")}
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={td(
                "dailySummaryPlaceholder",
                "Share highlights, blockers, or anything your team should know...",
              )}
              rows={3}
              maxLength={3000}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 13.5,
                fontFamily: F.sans,
                resize: "vertical",
              }}
            />
          </div>

          {/* Service Table */}
          <div style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "clamp(12px, 3vw, 16px)",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h3
                style={{
                  fontSize: "clamp(14px, 4vw, 16px)",
                  fontWeight: 800,
                  color: C.dark,
                  fontFamily: F.sans,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiList size={18} color={C.primary} />
                {td("serviceList", "Service List")}
                <span
                  style={{
                    fontSize: "clamp(11px, 3vw, 12px)",
                    color: C.muted,
                    fontWeight: 400,
                    marginLeft: 8,
                  }}
                >
                  ({rows.length} {tcm("records", "records")})
                </span>
              </h3>
              <button
                onClick={addRow}
                style={{
                  ...btn.secondary,
                  padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 18px)",
                  fontSize: "clamp(12px, 3vw, 13px)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiPlus size={14} />
                {td("addRow", "Add Row")}
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
                <FiLoader
                  size={24}
                  style={{
                    animation: "spin 1s linear infinite",
                    display: "block",
                    margin: "0 auto 12px",
                  }}
                />
                {tcm("loading", "Loading...")}
              </div>
            ) : (
              <>
                <div
                  style={{
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    margin: "0 -4px",
                    padding: "0 4px",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "clamp(11px, 3vw, 13px)",
                      minWidth: "500px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={th}>#</th>
                        <th style={th}>{td("colDept", "Department")}</th>
                        <th style={th}>{td("colService", "Service")}</th>
                        <th style={{ ...th, textAlign: "center" }}>
                          {td("colMale", "M")}
                        </th>
                        <th style={{ ...th, textAlign: "center" }}>
                          {td("colFemale", "F")}
                        </th>
                        <th style={{ ...th, textAlign: "center" }}>
                          {td("colTotal", "Total")}
                        </th>
                        <th style={{ ...th, textAlign: "center", width: 40 }}>
                          <FiX size={14} color={C.light} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const availableServices = getServicesByDept(r.dept);
                        return (
                          <tr
                            key={i}
                            style={{
                              ...(i % 2 === 0 ? { background: C.cardBg } : {}),
                              transition: "background 0.3s ease",
                            }}
                            onMouseEnter={() => setHoveredRow(i)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <td
                              style={{
                                ...tdCell,
                                textAlign: "center",
                                color: "#aaa",
                                fontWeight: 600,
                              }}
                            >
                              {i + 1}
                            </td>

                            <td style={tdCell}>
                              <select
                                style={{
                                  ...ti,
                                  width: "clamp(120px, 15vw, 150px)",
                                  borderColor:
                                    hoveredRow === i ? C.primary : C.border,
                                  cursor: "pointer",
                                }}
                                value={r.dept || ""}
                                onChange={(e) => {
                                  setRows((prev) => {
                                    const next = [...prev];
                                    next[i] = {
                                      ...next[i],
                                      dept: e.target.value,
                                      service: "",
                                    };
                                    return next;
                                  });
                                }}
                              >
                                <option value="">
                                  {td("selectDept", "Select Dept")}
                                </option>
                                {departments.map(([rawKey, label]) => (
                                  <option key={rawKey} value={rawKey}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td style={tdCell}>
                              <select
                                style={{
                                  ...ti,
                                  width: "clamp(130px, 20vw, 180px)",
                                  borderColor:
                                    hoveredRow === i ? C.primary : C.border,
                                  cursor: "pointer",
                                }}
                                value={r.service || ""}
                                onChange={(e) =>
                                  upd(i, "service", e.target.value)
                                }
                              >
                                <option value="">
                                  {td("selectService", "Select Service")}
                                </option>
                                {availableServices.length > 0 ? (
                                  availableServices.map((s) => (
                                    <option key={s._id} value={s.name}>
                                      {lang === "en"
                                        ? s.nameEn || s.name
                                        : s.name}
                                    </option>
                                  ))
                                ) : r.dept ? (
                                  <option value="" disabled>
                                    {td(
                                      "noServices",
                                      "No services for this dept",
                                    )}
                                  </option>
                                ) : (
                                  <option value="" disabled>
                                    {td(
                                      "selectDeptFirst",
                                      "Select a department first",
                                    )}
                                  </option>
                                )}
                              </select>
                            </td>

                            <td style={tdCell}>
                              <input
                                type="number"
                                style={{
                                  ...ti,
                                  width: "clamp(50px, 10vw, 60px)",
                                  textAlign: "center",
                                  minHeight: "32px",
                                  borderColor:
                                    hoveredRow === i ? C.primary : C.border,
                                }}
                                value={r.male || 0}
                                onChange={(e) =>
                                  upd(i, "male", Number(e.target.value) || 0)
                                }
                                inputMode="numeric"
                                min="0"
                              />
                            </td>

                            <td style={tdCell}>
                              <input
                                type="number"
                                style={{
                                  ...ti,
                                  width: "clamp(50px, 10vw, 60px)",
                                  textAlign: "center",
                                  minHeight: "32px",
                                  borderColor:
                                    hoveredRow === i ? C.primary : C.border,
                                }}
                                value={r.female || 0}
                                onChange={(e) =>
                                  upd(i, "female", Number(e.target.value) || 0)
                                }
                                inputMode="numeric"
                                min="0"
                              />
                            </td>

                            <td
                              style={{
                                ...tdCell,
                                textAlign: "center",
                                fontWeight: 700,
                                color: C.primary,
                                fontSize: "clamp(13px, 3.5vw, 15px)",
                              }}
                            >
                              {r.total || 0}
                            </td>

                            <td style={{ ...tdCell, textAlign: "center" }}>
                              {rows.length > 1 && (
                                <button
                                  onClick={() => removeRow(i)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 16,
                                    color: "#999",
                                    transition: "all 0.3s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#dc2626";
                                    e.currentTarget.style.transform =
                                      "scale(1.2)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#999";
                                    e.currentTarget.style.transform =
                                      "scale(1)";
                                  }}
                                >
                                  <FiX size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Grand Total Row - Using totals variable instead of animatedTotals */}
                      <tr
                        style={{
                          background: `linear-gradient(90deg, ${C.primary}15, ${C.primary}08)`,
                          borderTop: `2px solid ${C.primary}`,
                        }}
                      >
                        <td
                          colSpan={3}
                          style={{
                            ...tdCell,
                            fontWeight: 800,
                            textAlign: "right",
                            fontSize: "clamp(13px, 3.5vw, 15px)",
                            color: C.dark,
                          }}
                        >
                          <FiBarChart2 size={14} style={{ marginRight: 6 }} />
                          {td("grandTotal", "Grand Total")}
                        </td>
                        <td
                          style={{
                            ...tdCell,
                            fontWeight: 700,
                            textAlign: "center",
                            fontSize: "clamp(14px, 3.5vw, 16px)",
                            color: C.primary,
                          }}
                        >
                          {totals.male}
                        </td>
                        <td
                          style={{
                            ...tdCell,
                            fontWeight: 700,
                            textAlign: "center",
                            fontSize: "clamp(14px, 3.5vw, 16px)",
                            color: C.primary,
                          }}
                        >
                          {totals.female}
                        </td>
                        <td
                          style={{
                            ...tdCell,
                            fontWeight: 900,
                            textAlign: "center",
                            fontSize: "clamp(18px, 4.5vw, 22px)",
                            color: C.primary,
                          }}
                        >
                          {totals.total}
                        </td>
                        <td style={tdCell}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ✅ AI Report Assistant */}
                {rows.length > 0 && rows.some((r) => r.dept || r.service) && (
                  <div style={{ marginTop: "clamp(12px, 3vw, 16px)" }}>
                    <AIReportAssistant
                      reportContext={{
                        date: date,
                        entries: rows.filter((r) => r.dept || r.service),
                        grandTotal: rows.reduce(
                          (sum, e) => sum + (e.total || 0),
                          0,
                        ),
                        teamName: user?.team || tcm("myTeam", "My Team"),
                      }}
                      onApply={(text) => {
                        showToast(
                          td("aiInsight", "AI suggestion applied to report!"),
                          "success",
                        );
                        console.log("Applied suggestion:", text);
                      }}
                    />
                  </div>
                )}

                {/* ✅ Action Buttons */}
                <div
                  style={{
                    marginTop: "clamp(16px, 3vw, 24px)",
                    display: "flex",
                    gap: "clamp(8px, 2vw, 14px)",
                    justifyContent: isMobile ? "center" : "flex-start",
                    flexWrap: "wrap",
                    padding: isMobile ? "0" : "0",
                  }}
                >
                  <button
                    style={{
                      background: exporting ? "#94A3B8" : "#DC2626",
                      color: "#fff",
                      border: "none",
                      padding: isMobile
                        ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                        : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                      borderRadius: 10,
                      fontSize: isMobile
                        ? "clamp(12px, 3vw, 13px)"
                        : "clamp(13px, 2.5vw, 14px)",
                      fontWeight: 700,
                      cursor: exporting ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.3s ease",
                      opacity: exporting ? 0.7 : 1,
                      boxShadow: exporting
                        ? "none"
                        : "0 4px 15px rgba(220,38,38,0.3)",
                      flex: isMobile ? "1 1 auto" : "0 1 auto",
                      minWidth: isMobile ? "auto" : "140px",
                    }}
                    onClick={exportPDF}
                    disabled={exporting}
                    onMouseEnter={(e) => {
                      if (!exporting) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 6px 20px rgba(220,38,38,0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = exporting
                        ? "none"
                        : "0 4px 15px rgba(220,38,38,0.3)";
                    }}
                  >
                    {exporting ? (
                      <>
                        <FiLoader
                          size={16}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        {!isMobile && td("exporting", "Exporting...")}
                      </>
                    ) : (
                      <>
                        <FiDownload size={16} />
                        {isMobile
                          ? td("export", "Export")
                          : td("exportPdf", "Export PDF")}
                      </>
                    )}
                  </button>

                  <button
                    style={{
                      background: saving ? "#94A3B8" : C.primary,
                      color: "#fff",
                      border: "none",
                      padding: isMobile
                        ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                        : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                      borderRadius: 10,
                      fontSize: isMobile
                        ? "clamp(12px, 3vw, 13px)"
                        : "clamp(13px, 2.5vw, 14px)",
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.3s ease",
                      opacity: saving ? 0.7 : 1,
                      boxShadow: saving ? "none" : `0 4px 15px ${C.primary}44`,
                      flex: isMobile ? "1 1 auto" : "0 1 auto",
                      minWidth: isMobile ? "auto" : "140px",
                    }}
                    onClick={saveReport}
                    disabled={saving}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = `0 6px 20px ${C.primary}66`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = saving
                        ? "none"
                        : `0 4px 15px ${C.primary}44`;
                    }}
                  >
                    {saving ? (
                      <>
                        <FiLoader
                          size={16}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        {!isMobile && tcm("saving", "Saving...")}
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {isMobile
                          ? tcm("save", "Save")
                          : td("save", "Save Report")}
                      </>
                    )}
                  </button>
                  {savedReportId && status !== "submitted" && (
                    <button
                      style={{
                        background: saving ? "#94A3B8" : "#8B5CF6",
                        color: "#fff",
                        border: "none",
                        padding: isMobile
                          ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                          : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                        borderRadius: 10,
                        fontSize: isMobile
                          ? "clamp(12px, 3vw, 13px)"
                          : "clamp(13px, 2.5vw, 14px)",
                        fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.3s ease",
                        opacity: saving ? 0.7 : 1,
                        boxShadow: saving
                          ? "none"
                          : "0 4px 15px rgba(139,92,246,0.3)",
                        flex: isMobile ? "1 1 auto" : "0 1 auto",
                        minWidth: isMobile ? "auto" : "140px",
                      }}
                      onClick={submitReportForReview}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <FiLoader
                            size={16}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                          {!isMobile && tcm("submitting", "Submitting...")}
                        </>
                      ) : (
                        <>
                          <FiFileText size={16} />
                          {isMobile
                            ? td("submit", "Submit")
                            : td("submitForReview", "Submit for Review")}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* ✅ PDF Language Selector */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "clamp(12px, 2vw, 16px)",
                    paddingTop: "clamp(12px, 2vw, 16px)",
                    borderTop: `1px solid ${C.border}`,
                    width: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(11px, 2vw, 13px)",
                      color: C.muted,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiDownload size={14} />
                    {td("pdfLanguage", "PDF Language:")}
                  </span>
                  <select
                    value={pdfLanguage}
                    onChange={(e) => setPdfLanguage(e.target.value)}
                    style={{
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      padding: isMobile ? "6px 12px" : "8px 14px",
                      fontSize: isMobile ? "12px" : "13px",
                      background: "#fff",
                      cursor: "pointer",
                      outline: "none",
                      width: isMobile ? "100%" : "auto",
                      minWidth: isMobile ? "100%" : "180px",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <option value="am">አማርኛ (Amharic)</option>
                    <option value="en">English</option>
                    <option value="om">Oromo</option>
                  </select>
                </div>

                {/* ✅ AI Insight panel */}
                {savedReportId && (
                  <div style={{ marginTop: "clamp(20px, 4vw, 30px)" }}>
                    <AISummary
                      fetchFn={(id) => aiAPI.getDailyInsight(id, null)}
                      args={[savedReportId]}
                      label={td("aiInsight", "AI Daily Insight")}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : activeTab === "feed" ? (
        /* ─── TEAM FEED TAB ────────────────────────────────────────────────── */
        <DailyReportFeed t={t} isMobile={isMobile} />
      ) : (
        /* ─── HISTORY TAB ──────────────────────────────────────────────────── */
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "clamp(12px, 3vw, 16px)",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3
              style={{
                fontSize: "clamp(14px, 4vw, 16px)",
                fontWeight: 800,
                color: C.dark,
                fontFamily: F.sans,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FiClock size={18} color={C.primary} />
              {td("savedReports", "Saved Reports")}
              <span
                style={{
                  fontSize: "clamp(11px, 3vw, 12px)",
                  color: C.muted,
                  fontWeight: 400,
                  marginLeft: 8,
                }}
              >
                ({history.length} {tcm("records", "records")})
              </span>
            </h3>
            <button
              onClick={() => {
                historyLoadedRef.current = false; // ✅ Reset flag to force reload
                loadHistory();
              }}
              style={{
                ...btn.secondary,
                padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 18px)",
                fontSize: "clamp(12px, 3vw, 13px)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiLoader
                size={14}
                style={
                  historyLoading ? { animation: "spin 1s linear infinite" } : {}
                }
              />
              {td("refresh", "Refresh")}
            </button>
          </div>
          {renderHistory()}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
