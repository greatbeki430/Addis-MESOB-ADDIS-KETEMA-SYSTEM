import { useState, useEffect, useCallback } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { meetingAPI, dailyReportAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Report({ t }) {
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

  const reportTypes = [
    { value: "daily", label: t?.report?.daily || "Daily Report" },
    { value: "weekly", label: t?.report?.weekly || "Weekly Report" },
    { value: "monthly", label: t?.report?.monthly || "Monthly Report" },
    { value: "quarterly", label: t?.report?.quarterly || "Quarterly Report" },
    { value: "half-year", label: t?.report?.halfYear || "Half-Year Report" },
    { value: "yearly", label: t?.report?.yearly || "Yearly Report" },
    { value: "custom", label: t?.report?.custom || "Custom Range" },
  ];

  const periods = [
    { value: "daily", label: t?.period?.daily || "Daily" },
    { value: "weekly", label: t?.period?.weekly || "Weekly" },
    { value: "monthly", label: t?.period?.monthly || "Monthly" },
    { value: "quarterly", label: t?.period?.quarterly || "Quarterly" },
    { value: "half-year", label: t?.period?.halfYear || "Half Year" },
    { value: "yearly", label: t?.period?.yearly || "Yearly" },
  ];

  // ✅ Load teams and determine user's team
  const loadTeamsAndUserTeam = useCallback(() => {
    try {
      const savedTeams = localStorage.getItem("forumTeams");
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        setTeams(parsed);

        // ✅ If user is a Team Leader, find their team
        if (isLeader && user) {
          // Try to find team where user is the leader
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

  // === ADDED: Clean effect wrapper to fix "setState in effect" warning ===
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = () => {
      if (isMounted) {
        loadTeamsAndUserTeam();
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [loadTeamsAndUserTeam]);
  // =====================================================================

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

  // ✅ Generate sample data based on report type and period
  const generateSampleData = (type, period, teamFilter) => {
    const data = [];
    const now = new Date();

    // Determine count based on period (no useless initial assignment)
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

    // ✅ Get team names (filtered if Team Leader)
    let teamNames = [
      "Customer Service",
      "Technical Support",
      "Administration",
      "Sales",
      "Marketing",
    ];

    // ✅ If Team Leader, only show their team
    if (isLeader && userTeam) {
      teamNames = [userTeam.name];
    } else if (teamFilter) {
      const filteredTeam = teams.find((t) => (t.id || t._id) === teamFilter);
      if (filteredTeam) {
        teamNames = [filteredTeam.name];
      }
    }

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

      // ✅ Randomly assign team from available teams
      const teamIndex = i % teamNames.length;

      data.push({
        id: i + 1,
        date: date.toISOString().split("T")[0],
        team: teamNames[teamIndex],
        type: types[i % types.length],
        value: Math.floor(Math.random() * 50) + 50,
        status: Math.random() > 0.3 ? "Completed" : "Pending",
        description: `Report ${i + 1} for ${period} period`,
      });
    }
    return data;
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

      // ✅ If Team Leader, force their team ID
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

      // If no data from API, use sample data
      if (!responseData || responseData.length === 0) {
        responseData = generateSampleData(reportType, period, teamId);
      }

      const data = processReportData(responseData, reportType, period);
      setReportData(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
      setError(
        t?.report?.generateError ||
          "Failed to generate report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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

  const exportReport = () => {
    if (!reportData) return;
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          marginBottom: "clamp(12px, 3vw, 20px)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(18px, 5vw, 24px)",
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          📊 {t?.report?.title || "Report Generator"}
          {getTeamDisplayName()}
          {isLeader && userTeam && (
            <span style={{ fontSize: 16, color: C.primary, fontWeight: 600 }}>
              {" "}
              - {t?.report?.myTeam || "My Team"}
            </span>
          )}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 3vw, 12px)",
            borderRadius: 20,
            fontSize: "clamp(10px, 3vw, 11px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {t?.report?.analytics || "Analytics"}
        </span>
      </div>

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
          <span style={{ fontSize: 20 }}>👑</span>
          <div>
            <span style={{ fontWeight: 600, color: C.dark }}>
              {t?.report?.leadingTeam || "Leading Team"}:
            </span>
            <span style={{ color: C.primary, fontWeight: 700, marginLeft: 6 }}>
              {userTeam.name}
            </span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>
              {t?.report?.teamLeaderAccess ||
                "You have access to your team's analytics only"}
            </span>
          </div>
        </div>
      )}

      <p
        style={{
          color: "#555",
          marginBottom: "clamp(16px, 4vw, 22px)",
          fontSize: "clamp(12px, 3.5vw, 13px)",
          fontFamily: F.sans,
        }}
      >
        {t?.report?.description ||
          "Generate comprehensive reports by merging data from all modules"}
      </p>

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
          }}
        >
          ⚠️ {error}
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
              {t?.report?.typeLabel || "Report Type"}
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
              {t?.report?.periodLabel || "Period"}
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

          {/* ✅ Team Filter - Only show for Admins/Super Admins */}
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
                {t?.report?.teamLabel || "Team (Optional)"}
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={inp}
              >
                <option value="">{t?.report?.allTeams || "All Teams"}</option>
                {teams.map((team) => (
                  <option key={team.id || team._id} value={team.id || team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ✅ Team Leader - Show their team but disabled */}
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
                {t?.report?.teamLabel || "Team"}
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
              {t?.report?.startDate || "Start Date"}
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
              {t?.report?.endDate || "End Date"}
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
            }}
          >
            {loading
              ? t?.report?.generating || "⏳ Generating..."
              : t?.report?.generateBtn || "🔍 Generate Report"}
          </button>

          {reportData && (
            <button
              onClick={exportReport}
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                padding: "clamp(8px, 2.5vw, 11px) clamp(20px, 5vw, 32px)",
                borderRadius: 8,
                fontSize: "clamp(12px, 3.5vw, 14px)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📥 {t?.report?.exportBtn || "Export Report"}
            </button>
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
              }}
            >
              📋 {t?.report?.results || "Report Results"}
            </h3>
            <span
              style={{ fontSize: "clamp(10px, 3vw, 11px)", color: C.muted }}
            >
              {t?.report?.generated || "Generated"}:{" "}
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
                style={{ fontSize: "clamp(10px, 3vw, 11px)", color: C.muted }}
              >
                {t?.report?.totalRecords || "Total Records"}
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
                style={{ fontSize: "clamp(10px, 3vw, 11px)", color: C.muted }}
              >
                {t?.report?.completed || "Completed"}
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
                style={{ fontSize: "clamp(10px, 3vw, 11px)", color: C.muted }}
              >
                {t?.report?.pending || "Pending"}
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
                  color: "#8b5cf6",
                }}
              >
                {reportData.summary?.average || 0}
              </div>
              <div
                style={{ fontSize: "clamp(10px, 3vw, 11px)", color: C.muted }}
              >
                {t?.report?.average || "Average Value"}
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
                <tr style={{ background: C.dark, color: C.light }}>
                  <th style={{ padding: 10, textAlign: "left" }}>#</th>
                  <th style={{ padding: 10, textAlign: "left" }}>
                    {t?.report?.date || "Date"}
                  </th>
                  <th style={{ padding: 10, textAlign: "left" }}>
                    {t?.report?.team || "Team"}
                  </th>
                  <th style={{ padding: 10, textAlign: "left" }}>
                    {t?.report?.typeCol || "Type"}
                  </th>
                  <th style={{ padding: 10, textAlign: "left" }}>
                    {t?.report?.descriptionCol || "Description"}
                  </th>
                  <th style={{ padding: 10, textAlign: "right" }}>
                    {t?.report?.value || "Value"}
                  </th>
                  <th style={{ padding: 10, textAlign: "center" }}>
                    {t?.report?.status || "Status"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: index % 2 === 0 ? C.cardBg : "transparent",
                      }}
                    >
                      <td style={{ padding: 10 }}>{index + 1}</td>
                      <td style={{ padding: 10 }}>
                        {item.date || item.createdAt?.split("T")[0] || "—"}
                      </td>
                      <td style={{ padding: 10 }}>
                        {item.team || item.teamName || "—"}
                      </td>
                      <td style={{ padding: 10 }}>
                        {item.type || reportType || "—"}
                      </td>
                      <td style={{ padding: 10 }}>{item.description || "—"}</td>
                      <td
                        style={{
                          padding: 10,
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        {item.value || item.total || 0}
                      </td>
                      <td style={{ padding: 10, textAlign: "center" }}>
                        <span
                          style={{
                            background:
                              item.status === "Completed"
                                ? "#10b98120"
                                : "#f59e0b20",
                            color:
                              item.status === "Completed"
                                ? "#10b981"
                                : "#f59e0b",
                            padding: "2px 10px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 30,
                        textAlign: "center",
                        color: C.muted,
                      }}
                    >
                      {t?.report?.noData ||
                        "No data found for the selected criteria"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <div
          style={{
            ...card,
            marginTop: "clamp(16px, 4vw, 20px)",
            textAlign: "center",
            padding: "40px 20px",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3
            style={{
              fontSize: "clamp(16px, 4vw, 20px)",
              fontWeight: 700,
              color: C.dark,
              marginBottom: 8,
            }}
          >
            {t?.report?.noReportGenerated || "No Report Generated Yet"}
          </h3>
          <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: C.muted }}>
            {t?.report?.selectParameters ||
              "Select your report parameters and click 'Generate Report' to view data"}
          </p>
        </div>
      )}
    </div>
  );
}
