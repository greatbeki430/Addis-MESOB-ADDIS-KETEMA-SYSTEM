import { useState, useEffect, useCallback, useMemo } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { meetingAPI, dailyReportAPI, reportAPI } from "../services/api";
import { aiAPI } from "../services/api";
import { AISummary } from "../components/ai";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

// ✅ Import export utilities from new file
import {
  exportReportToExcel,
  exportReportToWord,
  exportReportToPDF,
} from "../utils/reportExport";

// ✅ Import react-icons
import {
  FiBarChart2,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiFile,
  FiFileText,
  FiList,
  FiPrinter,
  FiRefreshCw,
  FiTrash2,
  FiX,
  FiDownload,
  FiFilePlus,
  FiTrendingUp,
  FiAward,
  FiAlertCircle,
  FiDatabase,
  FiFolder,
  FiSearch,
  FiCalendar,
} from "react-icons/fi";

export default function Report({ t: tProp }) {
  const { t: tHook } = useLanguage();
  const t = tProp || tHook;

  const safeT = t || {};

  // Translation helper
  const tr = (key, fallback) => safeT?.report?.[key] || fallback;

  const { user, isLeader, isAdmin, isSuperAdmin } = useAuth();

  const [reportType, setReportType] = useState("daily");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [error, setError] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const [savedReports, setSavedReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSavedReport, setSelectedSavedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("new");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  // const [filteredReports, setFilteredReports] = useState([]);

  // ✅ Filter reports reactively using useMemo (no setState in effect)
  const filteredReports = useMemo(() => {
    let filtered = [...savedReports];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (report) =>
          report.title?.toLowerCase().includes(term) ||
          report.type?.toLowerCase().includes(term) ||
          report.period?.toLowerCase().includes(term) ||
          report.teamName?.toLowerCase().includes(term),
      );
    }

    // Filter by period
    if (filterPeriod !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((report) => {
        const reportDate = new Date(report.createdAt);
        const reportDay = new Date(
          reportDate.getFullYear(),
          reportDate.getMonth(),
          reportDate.getDate(),
        );

        switch (filterPeriod) {
          case "today":
            return reportDay.getTime() === today.getTime();
          case "week": {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return reportDay >= weekStart;
          }
          case "month": {
            return (
              reportDate.getMonth() === today.getMonth() &&
              reportDate.getFullYear() === today.getFullYear()
            );
          }
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [savedReports, searchTerm, filterPeriod]);

  const reportTypes = [
    { value: "daily", label: tr("daily", "Daily Report") },
    { value: "weekly", label: tr("weekly", "Weekly Report") },
    { value: "monthly", label: tr("monthly", "Monthly Report") },
    { value: "quarterly", label: tr("quarterly", "Quarterly Report") },
    { value: "half-year", label: tr("halfYear", "Half-Year Report") },
    { value: "yearly", label: tr("yearly", "Yearly Report") },
    { value: "custom", label: tr("custom", "Custom Range") },
  ];

  const periods = [
    { value: "daily", label: tr("daily", "Daily") },
    { value: "weekly", label: tr("weekly", "Weekly") },
    { value: "monthly", label: tr("monthly", "Monthly") },
    { value: "quarterly", label: tr("quarterly", "Quarterly") },
    { value: "half-year", label: tr("halfYear", "Half Year") },
    { value: "yearly", label: tr("yearly", "Yearly") },
  ];

  // ✅ Define loadSavedReports
  const loadSavedReports = async () => {
    try {
      setLoadingHistory(true);
      const response = await reportAPI.getAll();
      const reports = response.data || [];
      setSavedReports(reports);
    } catch (error) {
      console.error("Failed to load saved reports:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadTeamsAndUserTeam = useCallback(() => {
    try {
      const savedTeams = localStorage.getItem("forumTeams");
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        setTeams(parsed);

        if (isLeader && user) {
          const userTeamFound = parsed.find(
            (team) =>
              team.leader === user.name ||
              team.leader === user._id ||
              (team.members && team.members.includes(user.name)),
          );
          if (userTeamFound) {
            setUserTeam(userTeamFound);
            setSelectedTeam(userTeamFound.id || userTeamFound._id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load teams:", e);
    }
  }, [isLeader, user]);

  // ✅ useEffect to load initial data
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = () => {
      if (isMounted) {
        loadTeamsAndUserTeam();
        loadSavedReports();
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [loadTeamsAndUserTeam]);

  const getTeamDisplayName = () => {
    if (isLeader && userTeam) {
      return ` (${userTeam.name})`;
    }
    if (selectedTeam) {
      const team = teams.find((t) => (t.id || t._id) === selectedTeam);
      return team ? ` (${team.name})` : "";
    }
    return "";
  };

  const generateSampleData = (type, period, teamFilter) => {
    const data = [];
    const now = new Date();

    let count;
    switch (period) {
      case "daily":
        count = 7;
        break;
      case "weekly":
        count = 4;
        break;
      case "monthly":
        count = 12;
        break;
      case "quarterly":
        count = 4;
        break;
      case "half-year":
        count = 6;
        break;
      case "yearly":
        count = 5;
        break;
      default:
        count = 10;
    }

    let targetTeamName = null;
    if (teamFilter) {
      const filteredTeam = teams.find((t) => (t.id || t._id) === teamFilter);
      if (filteredTeam) {
        targetTeamName = filteredTeam.name;
      }
    }

    if (isLeader && userTeam) {
      targetTeamName = userTeam.name;
    }

    const allTeamNames = [
      "Customer Service",
      "Technical Support",
      "Administration",
      "Sales",
      "Marketing",
    ];

    const types = [
      "Forum Report",
      "Evaluation",
      "Daily Service",
      "Meeting",
      "Training",
    ];

    for (let i = 0; i < count; i++) {
      const date = new Date(now);
      if (period === "daily") date.setDate(date.getDate() - i);
      else if (period === "weekly") date.setDate(date.getDate() - i * 7);
      else if (
        period === "monthly" ||
        period === "quarterly" ||
        period === "half-year"
      ) {
        date.setMonth(date.getMonth() - i);
      } else if (period === "yearly") {
        date.setFullYear(date.getFullYear() - i);
      }

      const teamName = targetTeamName || allTeamNames[i % allTeamNames.length];

      data.push({
        id: i + 1,
        date: date.toISOString().split("T")[0],
        team: teamName,
        type: types[i % types.length],
        value: Math.floor(Math.random() * 50) + 50,
        status: Math.random() > 0.3 ? "Completed" : "Pending",
        description: `Report ${i + 1} for ${period} period`,
      });
    }
    return data;
  };

  const processReportData = (data, type, period) => {
    const total = data?.length || 0;
    const completed =
      data?.filter((item) => item.status === "Completed").length || 0;
    const pending = total - completed;
    const avgValue =
      total > 0
        ? Math.round(
            data.reduce((sum, item) => sum + (item.value || 0), 0) / total,
          )
        : 0;

    return {
      summary: {
        total: total,
        period: period,
        type: type,
        completed: completed,
        pending: pending,
        average: avgValue,
      },
      data: data || [],
      generatedAt: new Date().toISOString(),
    };
  };

  const saveReportToDatabase = async (data, teamId) => {
    try {
      await reportAPI.create({
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        type: reportType,
        period: period,
        startDate: startDate || null,
        endDate: endDate || null,
        team: teamId || null,
        data: data.data,
        summary: data.summary,
      });

      console.log("✅ Report saved to database");
    } catch (error) {
      console.error("Failed to save report:", error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("type", reportType);
      params.append("period", period);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const teamId =
        isLeader && userTeam ? userTeam.id || userTeam._id : selectedTeam;
      if (teamId) params.append("teamId", teamId);

      let responseData = [];

      try {
        let response;
        if (reportType === "daily") {
          response = await dailyReportAPI.getByDate(
            startDate || new Date().toISOString().split("T")[0],
          );
        } else {
          response = await meetingAPI.getAll();
        }
        responseData = response?.data || [];
      } catch (apiError) {
        console.warn("API call failed, using sample data:", apiError);
        responseData = generateSampleData(reportType, period, teamId);
      }

      if (!responseData || responseData.length === 0) {
        responseData = generateSampleData(reportType, period, teamId);
      }

      const data = processReportData(responseData, reportType, period);
      setReportData(data);

      await saveReportToDatabase(data, teamId);
      await loadSavedReports();
    } catch (error) {
      console.error("Failed to generate report:", error);
      setError(
        tr("generateError", "Failed to generate report. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReport = (report) => {
    setSelectedSavedReport(report);
    setReportData({
      data: report.data,
      summary: report.summary,
      generatedAt: report.createdAt,
    });
    setShowHistory(false);
  };

  // ✅ Helper to resolve team name from ID
  const resolveTeamName = (teamId) => {
    if (!teamId) return "Unknown Team";
    // If it's already a string name (not an ID), return it
    if (typeof teamId === "string" && !teamId.match(/^[0-9a-fA-F]{24}$/)) {
      return teamId;
    }
    // Look up in teams array
    const team = teams.find((t) => (t.id || t._id) === teamId);
    return team?.name || teamId || "Unknown Team";
  };

  const exportToExcel = () => {
    const teamName =
      isLeader && userTeam ? userTeam.name : getTeamDisplayName();

    // ✅ Resolve team names in report data
    const resolvedData = {
      ...reportData,
      data: reportData.data.map((item) => ({
        ...item,
        team: resolveTeamName(item.team),
      })),
    };

    exportReportToExcel(resolvedData, reportType, period, teamName, safeT);
    setShowExportOptions(false);
  };

  const exportToWord = () => {
    const teamName =
      isLeader && userTeam ? userTeam.name : getTeamDisplayName();

    // ✅ Resolve team names in report data
    const resolvedData = {
      ...reportData,
      data: reportData.data.map((item) => ({
        ...item,
        team: resolveTeamName(item.team),
      })),
    };

    exportReportToWord(resolvedData, reportType, period, teamName, safeT);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const teamName =
      isLeader && userTeam ? userTeam.name : getTeamDisplayName();

    // ✅ Resolve team names in report data
    const resolvedData = {
      ...reportData,
      data: reportData.data.map((item) => ({
        ...item,
        team: resolveTeamName(item.team),
      })),
    };

    exportReportToPDF(resolvedData, reportType, period, teamName, safeT);
    setShowExportOptions(false);
  };

  const deleteSavedReport = async (reportId) => {
    if (
      window.confirm(
        tr(
          "deleteConfirm",
          "Are you sure you want to delete this saved report?",
        ),
      )
    ) {
      try {
        await reportAPI.delete(reportId);
        await loadSavedReports();
      } catch (error) {
        console.error("Failed to delete report:", error);
        alert(tr("deleteError", "Failed to delete report"));
      }
    }
  };

  const showEmptyState = !reportData && !loading;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
      }}
    >
      {/* Header with Tabs */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 3vw, 14px)",
          marginBottom: "clamp(8px, 3vw, 12px)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(18px, 5vw, 24px)",
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiBarChart2 size={24} color={C.primary} />
          {tr("title", "Report Generator")}
          {getTeamDisplayName()}
          {isLeader && userTeam && (
            <span style={{ fontSize: 16, color: C.primary, fontWeight: 600 }}>
              {" "}
              - {tr("myTeam", "My Team")}
            </span>
          )}
        </h1>
      </div>

      {/* ✅ Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "clamp(16px, 4vw, 20px)",
          borderBottom: `2px solid ${C.border}`,
          paddingBottom: "8px",
          flexWrap: "wrap",
        }}
      >
        {/* New Report Tab */}
        <button
          onClick={() => setActiveTab("new")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: activeTab === "new" ? C.primary : "transparent",
            color: activeTab === "new" ? "#fff" : C.muted,
            border: "none",
            borderRadius: "10px",
            fontSize: "clamp(13px, 3vw, 15px)",
            fontWeight: activeTab === "new" ? 700 : 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            fontFamily: F.sans,
            position: "relative",
            boxShadow:
              activeTab === "new" ? `0 4px 16px ${C.primary}44` : "none",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "new") {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.color = C.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "new") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.muted;
            }
          }}
        >
          <FiFilePlus size={18} />
          <span>{tr("newReport", "New Report")}</span>
          {activeTab === "new" && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                background: C.gold,
                borderRadius: "50%",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          )}
        </button>

        {/* History Tab */}
        <button
          onClick={() => {
            setActiveTab("history");
            if (!showHistory) {
              loadSavedReports();
            }
            setShowHistory(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: activeTab === "history" ? C.primary : "transparent",
            color: activeTab === "history" ? "#fff" : C.muted,
            border: "none",
            borderRadius: "10px",
            fontSize: "clamp(13px, 3vw, 15px)",
            fontWeight: activeTab === "history" ? 700 : 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            fontFamily: F.sans,
            position: "relative",
            boxShadow:
              activeTab === "history" ? `0 4px 16px ${C.primary}44` : "none",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "history") {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.color = C.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "history") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.muted;
            }
          }}
        >
          <FiFolder size={18} />
          <span>
            {tr("history", "History")}
            {savedReports.length > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background:
                    activeTab === "history"
                      ? "rgba(255,255,255,0.2)"
                      : C.primary,
                  color: activeTab === "history" ? "#fff" : "#fff",
                  padding: "1px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {savedReports.length}
              </span>
            )}
          </span>
          {activeTab === "history" && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                background: C.gold,
                borderRadius: "50%",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          )}
        </button>
      </div>

      {!reportData && !loading && activeTab === "new" && (
        <p
          style={{
            color: "#555",
            marginBottom: "clamp(16px, 4vw, 22px)",
            fontSize: "clamp(12px, 3.5vw, 13px)",
            fontFamily: F.sans,
          }}
        >
          {tr(
            "description",
            "Generate comprehensive reports by merging data from all modules",
          )}
        </p>
      )}

      {isLeader && userTeam && (
        <div
          style={{
            background: `${C.primary}10`,
            border: `1px solid ${C.primary}30`,
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FiAward size={20} color={C.gold} />
          <div>
            <span style={{ fontWeight: 600, color: C.dark }}>
              {tr("leadingTeam", "Leading Team")}:
            </span>
            <span style={{ color: C.primary, fontWeight: 700, marginLeft: 6 }}>
              {userTeam.name}
            </span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>
              {tr(
                "teamLeaderAccess",
                "You have access to your team's analytics only",
              )}
            </span>
          </div>
        </div>
      )}

      {/* ─── HISTORY TAB CONTENT ─── */}
      {activeTab === "history" && (
        <div style={{ ...card, marginBottom: "clamp(16px, 4vw, 20px)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: 12,
            }}
          >
            <h4
              style={{
                margin: 0,
                color: C.dark,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "clamp(14px, 3.5vw, 16px)",
              }}
            >
              <FiFolder size={18} color={C.primary} />
              {tr("savedReports", "Saved Reports")}
              <span
                style={{
                  fontSize: "12px",
                  color: C.muted,
                  fontWeight: 400,
                }}
              >
                ({filteredReports.length} {tr("reports", "reports")})
              </span>
            </h4>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  setActiveTab("new");
                  setShowHistory(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.color = C.dark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#999";
                }}
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* ✅ Filter Buttons & Search */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
              padding: "8px 0",
              borderBottom: `1px solid ${C.border}`,
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}
            >
              <button
                onClick={() => {
                  setFilterPeriod("all");
                  setSearchTerm("");
                }}
                style={{
                  padding: "5px 14px",
                  background:
                    filterPeriod === "all" ? C.primary : "transparent",
                  color: filterPeriod === "all" ? "#fff" : C.muted,
                  border: `1px solid ${filterPeriod === "all" ? C.primary : C.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: F.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  if (filterPeriod !== "all") {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.color = C.primary;
                    e.currentTarget.style.background = `${C.primary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterPeriod !== "all") {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.muted;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <FiList size={12} />
                {tr("all", "All")}
              </button>
              <button
                onClick={() => setFilterPeriod("today")}
                style={{
                  padding: "5px 14px",
                  background:
                    filterPeriod === "today" ? C.primary : "transparent",
                  color: filterPeriod === "today" ? "#fff" : C.muted,
                  border: `1px solid ${filterPeriod === "today" ? C.primary : C.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: F.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  if (filterPeriod !== "today") {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.color = C.primary;
                    e.currentTarget.style.background = `${C.primary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterPeriod !== "today") {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.muted;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <FiClock size={12} />
                {tr("today", "Today")}
              </button>
              <button
                onClick={() => setFilterPeriod("week")}
                style={{
                  padding: "5px 14px",
                  background:
                    filterPeriod === "week" ? C.primary : "transparent",
                  color: filterPeriod === "week" ? "#fff" : C.muted,
                  border: `1px solid ${filterPeriod === "week" ? C.primary : C.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: F.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  if (filterPeriod !== "week") {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.color = C.primary;
                    e.currentTarget.style.background = `${C.primary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterPeriod !== "week") {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.muted;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <FiCalendar size={12} />
                {tr("thisWeek", "This Week")}
              </button>
              <button
                onClick={() => setFilterPeriod("month")}
                style={{
                  padding: "5px 14px",
                  background:
                    filterPeriod === "month" ? C.primary : "transparent",
                  color: filterPeriod === "month" ? "#fff" : C.muted,
                  border: `1px solid ${filterPeriod === "month" ? C.primary : C.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: F.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  if (filterPeriod !== "month") {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.color = C.primary;
                    e.currentTarget.style.background = `${C.primary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterPeriod !== "month") {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.muted;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <FiCalendar size={12} />
                {tr("thisMonth", "This Month")}
              </button>
            </div>

            {/* ✅ Search Input */}
            <div
              style={{
                position: "relative",
                minWidth: "180px",
                flex: "0 1 200px",
              }}
            >
              <input
                type="text"
                placeholder={tr("searchReports", "Search reports...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...inp,
                  padding: "5px 12px",
                  paddingRight: "30px",
                  fontSize: "12px",
                  height: "32px",
                }}
              />
              <FiSearch
                size={14}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.muted,
                }}
              />
            </div>
          </div>

          {loadingHistory ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: C.muted }}
            >
              <FiRefreshCw
                size={24}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <p style={{ marginTop: 8 }}>
                {tr("loadingHistory", "Loading...")}
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: C.muted,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
                {searchTerm.trim() || filterPeriod !== "all"
                  ? tr("noMatchingReports", "No reports match your filters")
                  : tr("noSavedReports", "No saved reports found")}
              </p>
              <p style={{ fontSize: 13 }}>
                {searchTerm.trim() || filterPeriod !== "all"
                  ? tr(
                      "tryAdjustingFilters",
                      "Try adjusting your search or filters",
                    )
                  : tr(
                      "generateFirstReport",
                      "Generate a report to save it to your history.",
                    )}
              </p>
              {(searchTerm.trim() || filterPeriod !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterPeriod("all");
                  }}
                  style={{
                    ...btn.secondary,
                    marginTop: 12,
                    padding: "6px 20px",
                    fontSize: "13px",
                  }}
                >
                  <FiRefreshCw size={14} />
                  {tr("clearFilters", "Clear Filters")}
                </button>
              )}
              {!searchTerm.trim() && filterPeriod === "all" && (
                <button
                  onClick={() => {
                    setActiveTab("new");
                    setShowHistory(false);
                  }}
                  style={{
                    ...btn.primary,
                    marginTop: 12,
                    padding: "6px 20px",
                    fontSize: "13px",
                  }}
                >
                  <FiFilePlus size={14} />
                  {tr("generateNew", "Generate New Report")}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: C.cardBg,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = `0 2px 12px ${C.primary}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    onClick={() => loadSavedReport(report)}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "clamp(13px, 3vw, 14px)",
                        color: C.dark,
                      }}
                    >
                      {report.title}
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(11px, 2.5vw, 12px)",
                        color: C.muted,
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginTop: 2,
                      }}
                    >
                      <span>
                        <span style={{ fontWeight: 600 }}>
                          {tr("type", "Type")}:
                        </span>{" "}
                        {report.type}
                      </span>
                      <span>
                        <span style={{ fontWeight: 600 }}>
                          {tr("period", "Period")}:
                        </span>{" "}
                        {report.period}
                      </span>
                      <span>
                        <span style={{ fontWeight: 600 }}>
                          {tr("team", "Team")}:
                        </span>{" "}
                        {report.teamName || tr("allTeams", "All Teams")}
                      </span>
                      <span>
                        <span style={{ fontWeight: 600 }}>
                          {tr("records", "Records")}:
                        </span>{" "}
                        {report.data?.length || 0}
                      </span>
                      <span>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      {report.status && (
                        <span
                          style={{
                            background:
                              report.status === "submitted"
                                ? "#DBEAFE"
                                : "#D1FAE5",
                            color:
                              report.status === "submitted"
                                ? "#1D4ED8"
                                : "#065F46",
                            padding: "1px 10px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {report.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSavedReport(report._id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      color: "#dc2626",
                      padding: "6px 10px",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    title={tr("deleteReport", "Delete report")}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── NEW REPORT TAB CONTENT ─── */}
      {activeTab === "new" && (
        <>
          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
                border: "1px solid #fecaca",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FiAlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Report Controls */}
          <div style={card}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                gap: "clamp(12px, 3vw, 16px)",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "clamp(11px, 3vw, 12px)",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: C.dark,
                  }}
                >
                  {tr("typeLabel", "Report Type")}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={inp}
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "clamp(11px, 3vw, 12px)",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: C.dark,
                  }}
                >
                  {tr("periodLabel", "Period")}
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  style={inp}
                >
                  {periods.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {(isAdmin || isSuperAdmin) && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "clamp(11px, 3vw, 12px)",
                      fontWeight: 600,
                      marginBottom: 6,
                      color: C.dark,
                    }}
                  >
                    {tr("teamLabel", "Team (Optional)")}
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    style={inp}
                  >
                    <option value="">{tr("allTeams", "All Teams")}</option>
                    {teams.map((team) => (
                      <option
                        key={team.id || team._id}
                        value={team.id || team._id}
                      >
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isLeader && userTeam && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "clamp(11px, 3vw, 12px)",
                      fontWeight: 600,
                      marginBottom: 6,
                      color: C.dark,
                    }}
                  >
                    {tr("teamLabel", "Team")}
                  </label>
                  <input
                    type="text"
                    value={userTeam.name}
                    disabled
                    style={{
                      ...inp,
                      background: "#f3f4f6",
                      cursor: "not-allowed",
                      opacity: 0.7,
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "clamp(11px, 3vw, 12px)",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: C.dark,
                  }}
                >
                  {tr("startDate", "Start Date")}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inp}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "clamp(11px, 3vw, 12px)",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: C.dark,
                  }}
                >
                  {tr("endDate", "End Date")}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={inp}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "clamp(8px, 3vw, 12px)",
                marginTop: "clamp(16px, 4vw, 20px)",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={generateReport}
                disabled={loading}
                style={{
                  ...btn.primary,
                  padding: "clamp(8px, 2.5vw, 11px) clamp(20px, 5vw, 32px)",
                  fontSize: "clamp(12px, 3.5vw, 14px)",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <FiRefreshCw
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {tr("generating", "Generating...")}
                  </>
                ) : (
                  <>
                    <FiFilePlus size={16} />
                    {tr("generateAndSave", "Generate & Save Report")}
                  </>
                )}
              </button>

              {reportData && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowExportOptions(!showExportOptions)}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      padding: "clamp(8px, 2.5vw, 11px) clamp(20px, 5vw, 32px)",
                      borderRadius: 8,
                      fontSize: "clamp(12px, 3.5vw, 14px)",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FiDownload size={16} />
                    {tr("exportBtn", "Export Report")}
                    <FiChevronDown size={14} />
                  </button>

                  {showExportOptions && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: 4,
                        background: C.white,
                        borderRadius: 8,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        minWidth: 180,
                        zIndex: 100,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={exportToExcel}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "10px 16px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          color: C.dark,
                          transition: "background 0.15s",
                          fontFamily: F.sans,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f0f7f4")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <FiFile size={18} color="#217346" />
                        {tr("exportAsExcel", "Export as Excel")}
                      </button>
                      <button
                        onClick={exportToWord}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "10px 16px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          color: C.dark,
                          transition: "background 0.15s",
                          fontFamily: F.sans,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f0f7f4")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <FiFileText size={18} color="#2b579a" />
                        {tr("exportAsWord", "Export as Word")}
                      </button>
                      <button
                        onClick={exportToPDF}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "10px 16px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          color: C.dark,
                          transition: "background 0.15s",
                          fontFamily: F.sans,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f0f7f4")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <FiPrinter size={18} color="#dc2626" />
                        {tr("exportAsPDF", "Export as PDF")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Report Results */}
          {reportData && (
            <div style={{ ...card, marginTop: "clamp(16px, 4vw, 20px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    fontSize: "clamp(14px, 4vw, 16px)",
                    fontWeight: 800,
                    color: C.dark,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiList size={18} />
                  {tr("results", "Report Results")}
                  {selectedSavedReport && (
                    <span
                      style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}
                    >
                      {" "}
                      ({tr("loadedFromHistory", "Loaded from history")})
                    </span>
                  )}
                </h3>
                <span
                  style={{
                    fontSize: "clamp(10px, 3vw, 11px)",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiClock size={12} />
                  {tr("generated", "Generated")}:{" "}
                  {new Date(reportData.generatedAt).toLocaleString()}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: C.bg,
                    borderRadius: 8,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(20px, 5vw, 28px)",
                      fontWeight: 900,
                      color: C.primary,
                    }}
                  >
                    {reportData.summary?.total || 0}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(10px, 3vw, 11px)",
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <FiDatabase size={12} />
                    {tr("totalRecords", "Total Records")}
                  </div>
                </div>
                <div
                  style={{
                    background: C.bg,
                    borderRadius: 8,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(20px, 5vw, 28px)",
                      fontWeight: 900,
                      color: "#10b981",
                    }}
                  >
                    {reportData.summary?.completed || 0}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(10px, 3vw, 11px)",
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <FiCheck size={12} />
                    {tr("completed", "Completed")}
                  </div>
                </div>
                <div
                  style={{
                    background: C.bg,
                    borderRadius: 8,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(20px, 5vw, 28px)",
                      fontWeight: 900,
                      color: "#f59e0b",
                    }}
                  >
                    {reportData.summary?.pending || 0}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(10px, 3vw, 11px)",
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <FiClock size={12} />
                    {tr("pending", "Pending")}
                  </div>
                </div>
                <div
                  style={{
                    background: C.bg,
                    borderRadius: 8,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(20px, 5vw, 28px)",
                      fontWeight: 900,
                      color: C.primary,
                    }}
                  >
                    {reportData.summary?.average || 0}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(10px, 3vw, 11px)",
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <FiTrendingUp size={12} />
                    {tr("average", "Average Value")}
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "clamp(11px, 3vw, 13px)",
                  }}
                >
                  <thead>
                    <tr style={{ background: C.dark }}>
                      <th
                        style={{
                          padding: "10px",
                          color: C.light,
                          textAlign: "left",
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          color: C.light,
                          textAlign: "left",
                        }}
                      >
                        {tr("date", "Date")}
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          color: C.light,
                          textAlign: "left",
                        }}
                      >
                        {tr("team", "Team")}
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          color: C.light,
                          textAlign: "left",
                        }}
                      >
                        {tr("typeCol", "Type")}
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          color: C.light,
                          textAlign: "left",
                        }}
                      >
                        {tr("descriptionCol", "Description")}
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          color: C.light,
                          textAlign: "left",
                        }}
                      >
                        {tr("value", "Value")}
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          color: C.light,
                          textAlign: "left",
                        }}
                      >
                        {tr("status", "Status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          background: idx % 2 === 0 ? C.white : C.cardBg,
                        }}
                      >
                        <td style={{ padding: "8px 10px" }}>{idx + 1}</td>
                        <td style={{ padding: "8px 10px" }}>{item.date}</td>
                        <td style={{ padding: "8px 10px" }}>{item.team}</td>
                        <td style={{ padding: "8px 10px" }}>{item.type}</td>
                        <td style={{ padding: "8px 10px" }}>
                          {item.description}
                        </td>
                        <td style={{ padding: "8px 10px" }}>{item.value}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span
                            style={{
                              padding: "2px 10px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 600,
                              background:
                                item.status === "Completed"
                                  ? "#d1fae5"
                                  : "#fef3c7",
                              color:
                                item.status === "Completed"
                                  ? "#065f46"
                                  : "#92400e",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {item.status === "Completed" ? (
                              <FiCheck size={10} />
                            ) : (
                              <FiClock size={10} />
                            )}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ✅ AI Report Digest */}
          {reportData && (
            <AISummary
              fetchFn={() =>
                aiAPI.getDashboardDigest({
                  totalUsers: reportData.summary?.total || 0,
                  activeTeams: teams.length || 0,
                  totalServicesLogged: reportData.summary?.total || 0,
                  evaluationsCompleted: reportData.summary?.completed || 0,
                  topDepartment:
                    getTeamDisplayName() || tr("allTeams", "All Teams"),
                  period: period,
                })
              }
              args={[]}
              label={tr("aiDigest", "AI Report Digest")}
            />
          )}

          {showEmptyState && (
            <div
              style={{
                ...card,
                marginTop: "clamp(16px, 4vw, 20px)",
                textAlign: "center",
                padding: "40px 20px",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                <FiBarChart2
                  size={48}
                  color={C.muted}
                  style={{ display: "block", margin: "0 auto" }}
                />
              </div>
              <h3
                style={{
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 8,
                }}
              >
                {tr("noReportGenerated", "No Report Generated Yet")}
              </h3>
              <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: C.muted }}>
                {tr(
                  "selectParameters",
                  "Select your report parameters and click 'Generate Report' to view data",
                )}
              </p>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
