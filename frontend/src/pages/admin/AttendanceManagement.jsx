// frontend/src/pages/admin/AttendanceManagement.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../styles/theme";
import axios from "axios";
import {
  FiClock,
  FiFileText,
  FiMail,
  FiRefreshCw,
  FiLoader,
  FiAlertCircle,
  FiSearch,
  FiZap,
  FiSmartphone,
} from "react-icons/fi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ✅ Moved generateAIInsights outside the component or define it before use
const generateAIInsights = (allData, biometrics, digital) => {
  const insights = {
    attendanceRate:
      allData.length > 0
        ? Math.round(
            (allData.filter(
              (d) =>
                d.status === "present" ||
                d.status === "verified" ||
                d.status === "completed",
            ).length /
              allData.length) *
              100,
          )
        : 0,
    digitalPercentage:
      allData.length > 0
        ? Math.round((digital.length / allData.length) * 100)
        : 0,
    biometricsPercentage:
      allData.length > 0
        ? Math.round((biometrics.length / allData.length) * 100)
        : 0,
    pendingCount: digital.filter((d) => d.status === "pending_verification")
      .length,
    reliability:
      allData.length > 0
        ? Math.round((biometrics.length / allData.length) * 100)
        : 0,
    recommendation: "",
    riskLevel: "Low",
  };

  // Generate recommendations based on data
  if (insights.digitalPercentage > 50) {
    insights.recommendation =
      "⚠️ High digital attendance usage detected. Consider checking biometrics system health.";
    insights.riskLevel = "High";
  } else if (insights.digitalPercentage > 25) {
    insights.recommendation =
      "📊 Moderate digital attendance usage. Monitor biometrics system performance.";
    insights.riskLevel = "Medium";
  } else if (insights.attendanceRate < 70) {
    insights.recommendation =
      "⚠️ Low attendance rate detected. Consider investigating causes.";
    insights.riskLevel = "High";
  } else if (insights.pendingCount > 0) {
    insights.recommendation = `📋 ${insights.pendingCount} digital attendance records pending verification. Please review.`;
    insights.riskLevel = "Medium";
  } else {
    insights.recommendation =
      "✅ Attendance system is functioning well. Biometrics is the primary method.";
    insights.riskLevel = "Low";
  }

  return insights;
};

const AttendanceManagement = ({ isDigitalView = false }) => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [digitalAttendanceData, setDigitalAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    team: "all",
    startDate: "",
    endDate: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    digitalCount: 0,
    biometricsCount: 0,
    pendingVerification: 0,
    verified: 0,
    rejected: 0,
  });
  const [reportGenerating, setReportGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!user?._id || !isMountedRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const queryParams = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.team !== "all" && { team: filters.team }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const [biometricsRes, digitalRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/attendance?${queryParams}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          signal: abortControllerRef.current.signal,
        }),
        axios.get(`${API_BASE_URL}/admin/digital-attendance?${queryParams}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          signal: abortControllerRef.current.signal,
        }),
      ]);

      if (isMountedRef.current) {
        const biometrics = biometricsRes.data.data || [];
        const digital = digitalRes.data.data || [];

        setAttendanceData(biometrics);
        setDigitalAttendanceData(digital);

        const allData = [...biometrics, ...digital];
        const present = allData.filter(
          (d) =>
            d.status === "present" ||
            d.status === "verified" ||
            d.status === "completed",
        ).length;

        setStats({
          total: allData.length,
          present: present,
          absent: allData.filter((d) => d.status === "absent").length,
          late: allData.filter((d) => d.status === "late").length,
          digitalCount: digital.length,
          biometricsCount: biometrics.length,
          pendingVerification: digital.filter(
            (d) => d.status === "pending_verification",
          ).length,
          verified: digital.filter((d) => d.status === "verified").length,
          rejected: digital.filter((d) => d.status === "rejected").length,
        });

        // ✅ Generate AI insights using the function
        const insights = generateAIInsights(allData, biometrics, digital);
        setAiInsights(insights);
        hasLoadedRef.current = true;
      }
    } catch (error) {
      if (error.name !== "AbortError" && isMountedRef.current) {
        console.error("Error fetching attendance:", error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, filters]);

  // Initial load
  useEffect(() => {
    if (user?._id && !hasLoadedRef.current) {
      fetchAttendance();
    }
  }, [user?._id, fetchAttendance]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getCombinedData = () => {
    if (isDigitalView) {
      return digitalAttendanceData;
    }
    if (activeTab === "biometrics") return attendanceData;
    if (activeTab === "digital") return digitalAttendanceData;
    return [...attendanceData, ...digitalAttendanceData];
  };

  const combinedData = getCombinedData();

  const generatePayrollReport = async () => {
    setReportGenerating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/attendance/generate-payroll-report`,
        {
          startDate:
            filters.startDate || new Date().toISOString().split("T")[0],
          endDate: filters.endDate || new Date().toISOString().split("T")[0],
          includeDigital: true,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payroll-attendance-report-${new Date().toISOString().split("T")[0]}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setReportGenerating(false);
    }
  };

  const sendReportToHeadOffice = async () => {
    if (
      !window.confirm(
        "Send attendance report to Head Office for payroll processing?",
      )
    ) {
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/admin/attendance/send-to-head-office`,
        {
          startDate:
            filters.startDate || new Date().toISOString().split("T")[0],
          endDate: filters.endDate || new Date().toISOString().split("T")[0],
          includeDigital: true,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("✅ Report sent to Head Office successfully!");
    } catch (error) {
      console.error("Error sending report:", error);
      alert("Failed to send report. Please try again.");
    }
  };

  const renderStats = () => (
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
          background: C.white,
          padding: "12px 16px",
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>
          {stats.total}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Total Records</div>
      </div>
      <div
        style={{
          background: C.white,
          padding: "12px 16px",
          borderRadius: 10,
          border: `1px solid #10b981`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>
          {stats.present}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Present</div>
      </div>
      <div
        style={{
          background: C.white,
          padding: "12px 16px",
          borderRadius: 10,
          border: `1px solid #ef4444`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>
          {stats.absent}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Absent</div>
      </div>
      {!isDigitalView && (
        <div
          style={{
            background: C.white,
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid #f59e0b`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>
            {stats.digitalCount}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            Digital <span style={{ fontSize: 9 }}>(Backup)</span>
          </div>
        </div>
      )}
      {isDigitalView && (
        <>
          <div
            style={{
              background: C.white,
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid #f59e0b`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>
              {stats.pendingVerification}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>Pending</div>
          </div>
          <div
            style={{
              background: C.white,
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid #10b981`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>
              {stats.verified}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>Verified</div>
          </div>
        </>
      )}
    </div>
  );

  // AI Insights Panel
  const renderAIInsights = () => {
    if (!aiInsights) return null;
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
          border: `1px solid ${C.primary}`,
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 20,
          cursor: "pointer",
        }}
        onClick={() => setShowAIInsights(!showAIInsights)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiZap size={20} color={C.primary} />
            <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
              AI Attendance Insights
            </span>
            <span
              style={{
                background:
                  aiInsights.riskLevel === "High"
                    ? "#ef4444"
                    : aiInsights.riskLevel === "Medium"
                      ? "#f59e0b"
                      : "#10b981",
                color: "#fff",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {aiInsights.riskLevel} Risk
            </span>
          </div>
          <span style={{ fontSize: 13, color: C.muted }}>
            {showAIInsights ? "▲ Hide details" : "▼ View details"}
          </span>
        </div>

        {showAIInsights && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: C.muted }}>
                  Attendance Rate
                </span>
                <div
                  style={{ fontSize: 18, fontWeight: 700, color: C.primary }}
                >
                  {aiInsights.attendanceRate}%
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: C.muted }}>
                  System Reliability
                </span>
                <div
                  style={{ fontSize: 18, fontWeight: 700, color: C.primary }}
                >
                  {aiInsights.reliability}%
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: C.muted }}>
                  Digital vs Biometrics
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>
                  {aiInsights.digitalPercentage}% /{" "}
                  {aiInsights.biometricsPercentage}%
                </div>
              </div>
            </div>
            <div
              style={{
                background: C.bg,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13,
                color: C.dark,
              }}
            >
              {aiInsights.recommendation}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCellValue = (item, key) => {
    const value = item[key];
    if (value === null || value === undefined) return "—";

    if (key === "status") {
      const colors = {
        present: "#10b981",
        absent: "#ef4444",
        late: "#f59e0b",
        verified: "#10b981",
        completed: "#3b82f6",
        pending_verification: "#f59e0b",
        rejected: "#ef4444",
      };
      return (
        <span
          style={{
            background: colors[value] + "22",
            color: colors[value],
            padding: "2px 10px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {value.replace("_", " ")}
        </span>
      );
    }

    if (key === "date" || key === "createdAt") {
      return new Date(value).toLocaleDateString();
    }

    if (key === "checkIn" || key === "checkOut") {
      return value ? new Date(value).toLocaleTimeString() : "—";
    }

    if (key === "hours") {
      return value ? `${value}h` : "—";
    }

    if (key === "verificationMethod") {
      return (
        <span
          style={{
            background: value === "digital" ? "#fef3c7" : "#dbeafe",
            color: value === "digital" ? "#92400e" : "#1e40af",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {value}
        </span>
      );
    }

    return value;
  };

  // Get title based on view
  const getTitle = () => {
    if (isDigitalView) {
      return {
        title: "Digital Attendance Logs",
        subtitle:
          "Monitor and verify digital attendance records from biometrics backup",
        icon: <FiSmartphone size={24} color={C.primary} />,
        showTabs: false,
      };
    }
    return {
      title: "Attendance Management",
      subtitle:
        "Combined biometrics and digital attendance records for payroll processing",
      icon: <FiClock size={24} color={C.primary} />,
      showTabs: true,
    };
  };

  const titleConfig = getTitle();

  return (
    <div style={{ padding: "20px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              color: C.dark,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {titleConfig.icon}
            {titleConfig.title}
          </h1>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>
            {titleConfig.subtitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={generatePayrollReport}
            disabled={reportGenerating}
            style={{
              padding: "8px 16px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            {reportGenerating ? (
              <FiLoader
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <FiFileText size={16} />
            )}
            Payroll Report
          </button>
          <button
            onClick={sendReportToHeadOffice}
            style={{
              padding: "8px 16px",
              background: "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <FiMail size={16} />
            Send to Head Office
          </button>
          <button
            onClick={fetchAttendance}
            style={{
              padding: "8px 16px",
              background: C.bg,
              color: C.dark,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {renderStats()}

      {/* AI Insights */}
      {renderAIInsights()}

      {/* Tabs - Only show for Attendance Management, not for Digital Logs */}
      {titleConfig.showTabs && (
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: `2px solid ${C.border}`,
            marginBottom: 16,
            paddingBottom: 8,
          }}
        >
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "6px 16px",
              background: activeTab === "all" ? C.primary : "transparent",
              color: activeTab === "all" ? "#fff" : C.muted,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: activeTab === "all" ? 700 : 500,
              fontSize: 13,
            }}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab("biometrics")}
            style={{
              padding: "6px 16px",
              background:
                activeTab === "biometrics" ? C.primary : "transparent",
              color: activeTab === "biometrics" ? "#fff" : C.muted,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: activeTab === "biometrics" ? 700 : 500,
              fontSize: 13,
            }}
          >
            Biometrics ({stats.biometricsCount})
          </button>
          <button
            onClick={() => setActiveTab("digital")}
            style={{
              padding: "6px 16px",
              background: activeTab === "digital" ? C.primary : "transparent",
              color: activeTab === "digital" ? "#fff" : C.muted,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: activeTab === "digital" ? 700 : 500,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiAlertCircle size={14} />
            Digital Backup ({stats.digitalCount})
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
          padding: "12px 16px",
          background: C.white,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ flex: "1", minWidth: 150, position: "relative" }}>
          <FiSearch
            size={16}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.muted,
            }}
          />
          <input
            type="text"
            placeholder={
              isDigitalView ? "Search digital records..." : "Search employee..."
            }
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "6px 10px 6px 32px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 13,
              background: C.bg,
            }}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          style={{
            padding: "6px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 13,
            background: C.white,
            minWidth: 120,
          }}
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="verified">Verified</option>
          <option value="pending_verification">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value }))
          }
          style={{
            padding: "6px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 13,
            background: C.white,
          }}
        />
        <span style={{ display: "flex", alignItems: "center", color: C.muted }}>
          to
        </span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, endDate: e.target.value }))
          }
          style={{
            padding: "6px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 13,
            background: C.white,
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: C.white,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: C.muted }}>
            <FiLoader
              size={32}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p>Loading attendance records...</p>
          </div>
        ) : combinedData.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>
            <FiClock size={32} style={{ marginBottom: 8 }} />
            <p>
              {isDigitalView
                ? "No digital attendance records found"
                : "No attendance records found"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: C.bg,
                    borderBottom: `2px solid ${C.border}`,
                  }}
                >
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Employee
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Team
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Check In
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Check Out
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Hours
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Method
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottom: `1px solid ${C.border}44`,
                      background:
                        item.verificationMethod === "digital"
                          ? "#fffbeb"
                          : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                      {item.employee_name || "N/A"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {item.team_name || "N/A"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {renderCellValue(item, "date")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {renderCellValue(item, "checkIn")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {renderCellValue(item, "checkOut")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {renderCellValue(item, "hours")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {renderCellValue(item, "verificationMethod")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {renderCellValue(item, "status")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      {!isDigitalView && stats.digitalCount > 0 && (
        <div
          style={{
            marginTop: 16,
            background: "#fef3c7",
            border: `1px solid #fcd34d`,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiAlertCircle size={20} color="#92400e" />
          <div style={{ fontSize: 13, color: "#92400e" }}>
            <strong>⚠️ Biometrics Backup Used:</strong> {stats.digitalCount}{" "}
            digital attendance records found. These have been included in the
            payroll calculation. Please verify all digital entries.
          </div>
        </div>
      )}

      {isDigitalView && stats.pendingVerification > 0 && (
        <div
          style={{
            marginTop: 16,
            background: "#fef3c7",
            border: `1px solid #fcd34d`,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiAlertCircle size={20} color="#92400e" />
          <div style={{ fontSize: 13, color: "#92400e" }}>
            <strong>⚠️ Pending Verification:</strong>{" "}
            {stats.pendingVerification} digital attendance records need
            verification. Please review each record.
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AttendanceManagement;
