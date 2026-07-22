// frontend/src/pages/admin/AlertsManagement.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../styles/theme";
import axios from "axios";
import {
  FiBell,
  FiAlertCircle,
  FiCheck,
  FiRefreshCw,
  FiLoader,
  FiUser,
  FiSearch,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const AlertsManagement = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    severity: "all",
    search: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    high: 0,
    critical: 0,
  });
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
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
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.type !== "all" && { type: filters.type }),
        ...(filters.severity !== "all" && { severity: filters.severity }),
      });

      const response = await axios.get(
        `${API_BASE_URL}/admin/alerts?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          signal: abortControllerRef.current.signal,
        },
      );

      if (isMountedRef.current) {
        const data = response.data.data || [];
        setAlerts(data);
        hasLoadedRef.current = true;

        // Calculate stats
        const pending = data.filter((a) => a.status === "pending").length;
        const resolved = data.filter((a) => a.status === "resolved").length;
        const high = data.filter((a) => a.severity === "high").length;
        const critical = data.filter((a) => a.severity === "critical").length;

        setStats({
          total: data.length,
          pending,
          resolved,
          high,
          critical,
        });
      }
    } catch (error) {
      if (error.name !== "AbortError" && isMountedRef.current) {
        console.error("Error fetching alerts:", error);
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
      fetchAlerts();
    }
  }, [user?._id, fetchAlerts]);

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

  // Resolve alert
  const resolveAlert = async (alertId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/alerts/${alertId}/resolve`,
        { resolution: "Resolved by admin" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      fetchAlerts();
    } catch (error) {
      console.error("Error resolving alert:", error);
      alert("Failed to resolve alert. Please try again.");
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ef4444",
      critical: "#dc2626",
    };
    return colors[severity] || "#6b7280";
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return (
        <span
          style={{
            background: "#d1fae5",
            color: "#065f46",
            padding: "2px 10px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiCheck size={12} />
          Resolved
        </span>
      );
    }
    return (
      <span
        style={{
          background: "#fef3c7",
          color: "#92400e",
          padding: "2px 10px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <FiAlertCircle size={12} />
        Pending
      </span>
    );
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case "biometrics_failure":
        return <FiAlertCircle size={16} color="#ef4444" />;
      case "attendance_verification":
        return <FiUser size={16} color="#f59e0b" />;
      case "system_alert":
        return <FiInfo size={16} color="#3b82f6" />;
      default:
        return <FiBell size={16} />;
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
        <div style={{ fontSize: 11, color: C.muted }}>Total</div>
      </div>
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
          {stats.pending}
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
          {stats.resolved}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Resolved</div>
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
          {stats.high + stats.critical}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>High/Critical</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
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
            <FiBell size={24} color={C.primary} />
            Alerts & Notifications
          </h1>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>
            System alerts including biometrics failures and attendance
            verification requests
          </p>
        </div>
        <button
          onClick={fetchAlerts}
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

      {renderStats()}

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
            placeholder="Search alerts..."
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
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filters.severity}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, severity: e.target.value }))
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
          <option value="all">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Alerts List */}
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
            <p>Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>
            <FiBell size={32} style={{ marginBottom: 8 }} />
            <p>No alerts found</p>
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
                    Type
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Severity
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
                      textAlign: "center",
                      color: C.muted,
                      fontWeight: 600,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert._id}
                    style={{
                      borderBottom: `1px solid ${C.border}44`,
                      background:
                        alert.status === "pending" ? "#fffbeb" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {getTypeIcon(alert.type)}
                        <span style={{ fontSize: 11 }}>
                          {alert.type?.replace("_", " ") || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                      {alert.title || "N/A"}
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: 200 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>
                        {alert.description?.substring(0, 60) || "N/A"}
                        {alert.description?.length > 60 ? "..." : ""}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          background: getSeverityColor(alert.severity) + "22",
                          color: getSeverityColor(alert.severity),
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {alert.severity || "N/A"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {getStatusBadge(alert.status)}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      {alert.status === "pending" && (
                        <button
                          onClick={() => resolveAlert(alert._id)}
                          style={{
                            padding: "4px 12px",
                            background: "#10b981",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#059669";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#10b981";
                          }}
                        >
                          <FiCheck size={14} />
                          Resolve
                        </button>
                      )}
                      {alert.status === "resolved" && (
                        <span style={{ fontSize: 12, color: C.muted }}>
                          <FiCheckCircle size={14} color="#10b981" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      {stats.pending > 0 && (
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
            <strong>⚠️ Pending Alerts:</strong> {stats.pending} alert(s) require
            your attention. Please review and resolve them.
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

export default AlertsManagement;
