import { useState, useEffect, useCallback } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { meetingAPI, dailyReportAPI } from "../services/api";

export default function Report({ t }) {
  const [reportType, setReportType] = useState("daily");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teams, setTeams] = useState([]);

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

  // Pure data loading function (no loading state)
  const fetchTeams = useCallback(() => {
    const savedTeams = localStorage.getItem("forumTeams");
    if (savedTeams) {
      try {
        const parsed = JSON.parse(savedTeams);
        setTeams(parsed);
      } catch (e) {
        console.error("Failed to parse teams:", e);
        setTeams([]);
      }
    } else {
      setTeams([]);
    }
  }, []);

  // Initial load – Clean effect (no setState directly in effect body)
  useEffect(() => {
    let isMounted = true;

    const loadInitialTeams = () => {
      if (isMounted) {
        fetchTeams();
      }
    };

    loadInitialTeams();

    return () => {
      isMounted = false;
    };
  }, [fetchTeams]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("type", reportType);
      params.append("period", period);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedTeam) params.append("teamId", selectedTeam);

      let response;
      if (reportType === "daily") {
        response = await dailyReportAPI.getByDate(
          startDate || new Date().toISOString().split("T")[0],
        );
      } else {
        response = await meetingAPI.getAll();
      }

      const data = processReportData(response?.data || [], reportType, period);
      setReportData(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert(
        t?.report?.generateError ||
          "Failed to generate report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data, type, period) => {
    return {
      summary: {
        total: data?.length || 0,
        period: period,
        type: type,
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

          {/* Summary Cards + Table (same as before) */}
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
                  color: C.primary,
                }}
              >
                {reportData.summary?.period || "—"}
              </div>
              <div
                style={{ fontSize: "clamp(10px, 3vw, 11px)", color: C.muted }}
              >
                {t?.report?.period || "Period"}
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
                {reportData.summary?.type || "—"}
              </div>
              <div
                style={{ fontSize: "clamp(10px, 3vw, 11px)", color: C.muted }}
              >
                {t?.report?.type || "Report Type"}
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
                  <th style={{ padding: 10, textAlign: "right" }}>
                    {t?.report?.value || "Value"}
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
                      <td
                        style={{
                          padding: 10,
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        {item.value || item.total || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
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
    </div>
  );
}
