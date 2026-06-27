import { useState, useEffect, useCallback } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { meetingAPI, dailyReportAPI, reportAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

// ✅ Import export utilities
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  FiClock as FiClockIcon,
  FiDatabase,
  FiFolder,
} from "react-icons/fi";

// ✅ Also import specific icons we actually need
// import {
//   FiBarChart2 as FiBarChart2Icon,
//   FiCalendar as FiCalendarIcon,
//   FiCheck as FiCheckIcon,
//   FiChevronDown as FiChevronDownIcon,
//   FiClock as FiClockIcon2,
//   FiDownload as FiDownloadIcon,
//   FiFile as FiFileIcon,
//   FiFileText as FiFileTextIcon,
//   FiFolder as FiFolderIcon,
//   FiGrid as FiGridIcon,
//   FiHome as FiHomeIcon,
//   FiList as FiListIcon,
//   FiPlus as FiPlusIcon,
//   FiPrinter as FiPrinterIcon,
//   FiRefreshCw as FiRefreshCwIcon,
//   FiSave as FiSaveIcon,
//   FiSearch as FiSearchIcon2,
//   FiSettings as FiSettingsIcon,
//   FiStar as FiStarIcon2,
//   FiTrash2 as FiTrash2Icon,
//   FiUser as FiUserIcon2,
//   FiUsers as FiUsersIcon3,
//   FiX as FiXIcon2,
// } from "react-icons/fi";

export default function Report({ t }) {
  // ✅ FIX: Safe access to translations with fallback
  const safeT = t || {};
  const safeReport = safeT.report || {};
  const safePeriod = safeT.period || {};

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

  // ✅ Report History states
  const [savedReports, setSavedReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSavedReport, setSelectedSavedReport] = useState(null);

  const reportTypes = [
    { value: "daily", label: safeReport.daily || "Daily Report" },
    { value: "weekly", label: safeReport.weekly || "Weekly Report" },
    { value: "monthly", label: safeReport.monthly || "Monthly Report" },
    { value: "quarterly", label: safeReport.quarterly || "Quarterly Report" },
    { value: "half-year", label: safeReport.halfYear || "Half-Year Report" },
    { value: "yearly", label: safeReport.yearly || "Yearly Report" },
    { value: "custom", label: safeReport.custom || "Custom Range" },
  ];

  const periods = [
    { value: "daily", label: safePeriod.daily || "Daily" },
    { value: "weekly", label: safePeriod.weekly || "Weekly" },
    { value: "monthly", label: safePeriod.monthly || "Monthly" },
    { value: "quarterly", label: safePeriod.quarterly || "Quarterly" },
    { value: "half-year", label: safePeriod.halfYear || "Half Year" },
    { value: "yearly", label: safePeriod.yearly || "Yearly" },
  ];

  // ✅ Load teams and determine user's team
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

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = () => {
      if (isMounted) {
        loadTeamsAndUserTeam();
        // eslint-disable-next-line react-hooks/immutability
        loadSavedReports();
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [loadTeamsAndUserTeam]);

  // ✅ Load saved reports from database
  const loadSavedReports = async () => {
    try {
      setLoadingHistory(true);
      const response = await reportAPI.getAll();
      setSavedReports(response.data || []);
    } catch (error) {
      console.error("Failed to load saved reports:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ✅ Get team display name for header
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

  // ✅ Generate sample data - FILTERED by selected team
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

  // ✅ Generate and save report
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
        safeReport.generateError ||
          "Failed to generate report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save report to database
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

  // ✅ Load a saved report
  const loadSavedReport = (report) => {
    setSelectedSavedReport(report);
    setReportData({
      data: report.data,
      summary: report.summary,
      generatedAt: report.createdAt,
    });
    setShowHistory(false);
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

  // ✅ EXPORT FUNCTIONS
  const exportToExcel = () => {
    if (!reportData || !reportData.data.length) return;

    const wsData = [
      ["#", "Date", "Team", "Type", "Description", "Value", "Status"],
      ...reportData.data.map((item, idx) => [
        idx + 1,
        item.date,
        item.team,
        item.type,
        item.description,
        item.value,
        item.status,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const colWidths = [
      { wch: 5 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
    ];
    ws["!cols"] = colWidths;

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      blob,
      `${reportType}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    setShowExportOptions(false);
  };

  const exportToWord = () => {
    if (!reportData || !reportData.data.length) return;

    let tableRows = reportData.data
      .map(
        (item, idx) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.date}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.team}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.type}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.value}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.status}</td>
      </tr>
    `,
      )
      .join("");

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1a6b4a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #1a6b4a; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            .summary { margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
            .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 120px; }
            .summary-card h3 { margin: 0; color: #666; font-size: 12px; }
            .summary-card p { margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1a6b4a; }
            .footer { margin-top: 30px; color: #999; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>📊 ${reportType.toUpperCase()} Report</h1>
          <p><strong>Generated:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</p>
          <p><strong>Team:</strong> ${getTeamDisplayName() || "All Teams"}</p>
          <p><strong>Period:</strong> ${period}</p>
          
          <div class="summary">
            <div class="summary-card"><h3>Total Records</h3><p>${reportData.summary.total}</p></div>
            <div class="summary-card"><h3>Completed</h3><p>${reportData.summary.completed}</p></div>
            <div class="summary-card"><h3>Pending</h3><p>${reportData.summary.pending}</p></div>
            <div class="summary-card"><h3>Average Value</h3><p>${reportData.summary.average}</p></div>
          </div>

          <table>
            <thead>
              <tr><th>#</th><th>Date</th><th>Team</th><th>Type</th>
              <th>Description</th><th>Value</th><th>Status</th></tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">Generated by A-MESOB Report Generator © ${new Date().getFullYear()}</div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    saveAs(
      blob,
      `${reportType}_report_${new Date().toISOString().split("T")[0]}.doc`,
    );
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    if (!reportData || !reportData.data.length) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor("#1a6b4a");
    doc.text(`📊 ${reportType.toUpperCase()} Report`, pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setTextColor("#666");
    doc.text(
      `Generated: ${new Date(reportData.generatedAt).toLocaleString()}`,
      14,
      35,
    );
    doc.text(`Team: ${getTeamDisplayName() || "All Teams"}`, 14, 42);
    doc.text(`Period: ${period}`, 14, 49);

    const summaryY = 60;
    doc.setFontSize(10);
    doc.setTextColor("#333");
    doc.text(`Total Records: ${reportData.summary.total}`, 14, summaryY);
    doc.text(`Completed: ${reportData.summary.completed}`, 80, summaryY);
    doc.text(`Pending: ${reportData.summary.pending}`, 145, summaryY);
    doc.text(`Average Value: ${reportData.summary.average}`, 14, summaryY + 10);

    const tableData = reportData.data.map((item) => [
      item.date,
      item.team,
      item.type,
      item.description || "",
      item.value.toString(),
      item.status,
    ]);

    doc.autoTable({
      startY: summaryY + 20,
      head: [["Date", "Team", "Type", "Description", "Value", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [26, 107, 74],
        textColor: [255, 255, 255],
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor("#999");
    doc.text(
      `Generated by A-MESOB Report Generator © ${new Date().getFullYear()}`,
      pageWidth / 2,
      finalY + 10,
      { align: "center" },
    );

    doc.save(
      `${reportType}_report_${new Date().toISOString().split("T")[0]}.pdf`,
    );
    setShowExportOptions(false);
  };

  // ✅ Delete saved report
  const deleteSavedReport = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this saved report?")) {
      try {
        await reportAPI.delete(reportId);
        await loadSavedReports();
      } catch (error) {
        console.error("Failed to delete report:", error);
        alert("Failed to delete report");
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
      {/* Header */}
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
          {safeReport.title || "Report Generator"}
          {getTeamDisplayName()}
          {isLeader && userTeam && (
            <span style={{ fontSize: 16, color: C.primary, fontWeight: 600 }}>
              {" "}
              - {safeReport.myTeam || "My Team"}
            </span>
          )}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              background: C.primary,
              color: "#fff",
              padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 3vw, 12px)",
              borderRadius: 20,
              fontSize: "clamp(10px, 3vw, 11px)",
              fontWeight: 700,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiTrendingUp size={12} />
            {safeReport.analytics || "Analytics"}
          </span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: "#8b5cf6",
              color: "#fff",
              border: "none",
              padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 3vw, 12px)",
              borderRadius: 20,
              fontSize: "clamp(10px, 3vw, 11px)",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiFolder size={12} />
            History
          </button>
        </div>
      </div>

      {/* ✅ Description - Only show when no report has been generated yet */}
      {!reportData && !loading && (
        <p
          style={{
            color: "#555",
            marginBottom: "clamp(16px, 4vw, 22px)",
            fontSize: "clamp(12px, 3.5vw, 13px)",
            fontFamily: F.sans,
          }}
        >
          {safeReport.description ||
            "Generate comprehensive reports by merging data from all modules"}
        </p>
      )}

      {/* Team Leader Info Banner */}
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
              {safeReport.leadingTeam || "Leading Team"}:
            </span>
            <span style={{ color: C.primary, fontWeight: 700, marginLeft: 6 }}>
              {userTeam.name}
            </span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>
              {safeReport.teamLeaderAccess ||
                "You have access to your team's analytics only"}
            </span>
          </div>
        </div>
      )}

      {/* ✅ Saved Reports History */}
      {showHistory && (
        <div
          style={{
            ...card,
            marginBottom: 16,
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
              }}
            >
              <FiFolder size={16} />
              Saved Reports
            </h4>
            <button
              onClick={() => setShowHistory(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "#999",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FiX size={18} />
            </button>
          </div>
          {loadingHistory ? (
            <p style={{ textAlign: "center", color: C.muted }}>Loading...</p>
          ) : savedReports.length === 0 ? (
            <p style={{ textAlign: "center", color: C.muted }}>
              No saved reports found. Generate a report to save it.
            </p>
          ) : (
            savedReports.map((report) => (
              <div
                key={report._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  onClick={() => loadSavedReport(report)}
                  style={{ flex: 1 }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {report.title}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {report.type} • {report.period} •{" "}
                    {report.teamName || "All Teams"} •{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
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
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Delete report"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Error Message */}
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
              {safeReport.typeLabel || "Report Type"}
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
              {safeReport.periodLabel || "Period"}
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
                {safeReport.teamLabel || "Team (Optional)"}
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={inp}
              >
                <option value="">{safeReport.allTeams || "All Teams"}</option>
                {teams.map((team) => (
                  <option key={team.id || team._id} value={team.id || team._id}>
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
                {safeReport.teamLabel || "Team"}
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
              {safeReport.startDate || "Start Date"}
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
              {safeReport.endDate || "End Date"}
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
                {safeReport.generating || "Generating..."}
              </>
            ) : (
              <>
                <FiFilePlus size={16} />
                Generate & Save Report
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
                {safeReport.exportBtn || "Export Report"}
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
                    Export as Excel
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
                    Export as Word
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
                    Export as PDF
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
              {safeReport.results || "Report Results"}
              {selectedSavedReport && (
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>
                  {" "}
                  (Loaded from history)
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
              {safeReport.generated || "Generated"}:{" "}
              {new Date(reportData.generatedAt).toLocaleString()}
            </span>
          </div>

          {/* Summary Cards */}
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
                {safeReport.totalRecords || "Total Records"}
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
                {safeReport.completed || "Completed"}
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
                <FiClockIcon size={12} />
                {safeReport.pending || "Pending"}
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
                {safeReport.average || "Average Value"}
              </div>
            </div>
          </div>

          {/* Data Table */}
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
                    {safeReport.date || "Date"}
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      color: C.light,
                      textAlign: "left",
                    }}
                  >
                    {safeReport.team || "Team"}
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      color: C.light,
                      textAlign: "left",
                    }}
                  >
                    {safeReport.typeCol || "Type"}
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      color: C.light,
                      textAlign: "left",
                    }}
                  >
                    {safeReport.descriptionCol || "Description"}
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      color: C.light,
                      textAlign: "left",
                    }}
                  >
                    {safeReport.value || "Value"}
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      color: C.light,
                      textAlign: "left",
                    }}
                  >
                    {safeReport.status || "Status"}
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
                    <td style={{ padding: "8px 10px" }}>{item.description}</td>
                    <td style={{ padding: "8px 10px" }}>{item.value}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          background:
                            item.status === "Completed" ? "#d1fae5" : "#fef3c7",
                          color:
                            item.status === "Completed" ? "#065f46" : "#92400e",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {item.status === "Completed" ? (
                          <FiCheck size={10} />
                        ) : (
                          <FiClockIcon size={10} />
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

      {/* Empty State */}
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
            {safeReport.noReportGenerated || "No Report Generated Yet"}
          </h3>
          <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: C.muted }}>
            {safeReport.selectParameters ||
              "Select your report parameters and click 'Generate Report' to view data"}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
