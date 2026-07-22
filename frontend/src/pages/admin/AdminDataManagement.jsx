// frontend/src/pages/admin/AdminDataManagement.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../styles/theme";
import axios from "axios";
import {
  FiSearch,
  FiCalendar,
  FiDownload,
  FiEye,
  FiTrash2,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiStar,
  FiClock,
  FiFileText,
  FiMessageSquare,
  FiSettings,
  FiBarChart2,
  FiBell,
  FiSmartphone,
  FiGrid,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import {} from // FaCheck,
// FaTimes,
// FaTrash,
// FaEye,
// FaDownload,
// FaSearch,
// FaCalendarAlt,
"react-icons/fa";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Column configurations with React Icons
const COLUMN_CONFIGS = {
  evaluations: {
    label: "Evaluations",
    icon: <FiStar size={24} />,
    columns: [
      { key: "employee_name", label: "Employee" },
      { key: "team_name", label: "Team" },
      { key: "score", label: "Score", type: "score" },
      { key: "status", label: "Status", type: "status" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  "daily-reports": {
    label: "Daily Reports",
    icon: <FiFileText size={24} />,
    columns: [
      { key: "employee_name", label: "Employee" },
      { key: "team_name", label: "Team" },
      { key: "date", label: "Date", type: "date" },
      { key: "status", label: "Status", type: "status" },
      { key: "submittedBy", label: "Submitted By" },
    ],
  },
  "forum-reports": {
    label: "Forum Reports",
    icon: <FiMessageSquare size={24} />,
    columns: [
      { key: "topic", label: "Topic" },
      { key: "author_name", label: "Author" },
      { key: "team_name", label: "Team" },
      { key: "replies", label: "Replies", type: "number" },
      { key: "createdAt", label: "Date", type: "date" },
      { key: "status", label: "Status", type: "status" },
    ],
  },
  requests: {
    label: "Service Requests",
    icon: <FiSettings size={24} />,
    columns: [
      { key: "title", label: "Title" },
      { key: "requester_name", label: "Requester" },
      { key: "team_name", label: "Team" },
      { key: "priority", label: "Priority", type: "priority" },
      { key: "status", label: "Status", type: "status" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  attendance: {
    label: "Attendance",
    icon: <FiClock size={24} />,
    columns: [
      { key: "employee_name", label: "Employee" },
      { key: "team_name", label: "Team" },
      { key: "date", label: "Date", type: "date" },
      { key: "checkIn", label: "Check In", type: "time" },
      { key: "checkOut", label: "Check Out", type: "time" },
      { key: "hours", label: "Hours", type: "number" },
      { key: "status", label: "Status", type: "status" },
    ],
  },
  performance: {
    label: "Performance Metrics",
    icon: <FiBarChart2 size={24} />,
    columns: [
      { key: "employee_name", label: "Employee" },
      { key: "team_name", label: "Team" },
      { key: "kpi", label: "KPI" },
      { key: "score", label: "Score", type: "score" },
      { key: "quarter", label: "Quarter" },
      { key: "status", label: "Status", type: "status" },
    ],
  },
  "digital-attendance": {
    label: "Digital Attendance",
    icon: <FiSmartphone size={24} />,
    columns: [
      { key: "employee_name", label: "Employee" },
      { key: "team_name", label: "Team" },
      { key: "date", label: "Date", type: "date" },
      { key: "checkIn", label: "Check In", type: "time" },
      { key: "checkOut", label: "Check Out", type: "time" },
      { key: "hours", label: "Hours", type: "number" },
      { key: "status", label: "Status", type: "status" },
    ],
  },
  alerts: {
    label: "Alerts",
    icon: <FiBell size={24} />,
    columns: [
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "severity", label: "Severity", type: "severity" },
      { key: "status", label: "Status", type: "status" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
};

const AdminDataManagement = ({ dataType }) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 20,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    team: "all",
    startDate: "",
    endDate: "",
    sortBy: "",
    sortOrder: "ASC",
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const config = COLUMN_CONFIGS[dataType];

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch data with filters
  const fetchData = useCallback(async () => {
    if (!user?._id || !isMountedRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.team !== "all" && { team: filters.team }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.sortBy && {
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        }),
      });

      const response = await axios.get(
        `${API_BASE_URL}/admin/data/${dataType}?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          signal: abortControllerRef.current.signal,
        },
      );

      if (response.data.success && isMountedRef.current) {
        setData(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      if (error.name !== "AbortError" && isMountedRef.current) {
        console.error("Error fetching data:", error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, dataType, filters, pagination.page, pagination.limit]);

  // Load initial data
  useEffect(() => {
    if (user?._id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchData();
    }
  }, [user?._id, fetchData]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle sorting
  const handleSort = useCallback(
    (key) => {
      const newOrder =
        filters.sortBy === key && filters.sortOrder === "ASC" ? "DESC" : "ASC";
      handleFilterChange("sortBy", key);
      handleFilterChange("sortOrder", newOrder);
    },
    [filters.sortBy, filters.sortOrder, handleFilterChange],
  );

  // Handle search with debounce
  useEffect(() => {
    if (hasLoadedRef.current) {
      const timer = setTimeout(() => {
        if (filters.search !== "") {
          fetchData();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filters.search, fetchData]);

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (action) => {
      if (!selectedItems.length) return;

      try {
        await axios.post(
          `${API_BASE_URL}/admin/data/${dataType}/bulk-action`,
          { action, ids: selectedItems },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        await fetchData();
        setSelectedItems([]);
      } catch (error) {
        console.error("Bulk action error:", error);
      }
    },
    [dataType, selectedItems, fetchData],
  );

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/data/${dataType}/export`,
        { filters },
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
        `${dataType}-export-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export error:", error);
    }
  }, [dataType, filters]);

  // View item details
  const viewItem = useCallback((item) => {
    setSelectedItem(item);
    setShowModal(true);
  }, []);

  // Delete item
  const deleteItem = useCallback(
    async (id) => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        try {
          await axios.delete(`${API_BASE_URL}/admin/data/${dataType}/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          await fetchData();
        } catch (error) {
          console.error("Delete error:", error);
        }
      }
    },
    [dataType, fetchData],
  );

  // Render cell value based on type
  const renderCellValue = useCallback((item, col) => {
    const value = item[col.key];

    if (value === null || value === undefined) return "—";

    const statusColors = {
      pending: "#F59E0B",
      approved: "#10B981",
      rejected: "#EF4444",
      completed: "#3B82F6",
      active: "#10B981",
      inactive: "#6B7280",
      verified: "#10B981",
      resolved: "#3B82F6",
      dismissed: "#6B7280",
    };

    const priorityColors = {
      high: "#EF4444",
      medium: "#F59E0B",
      low: "#10B981",
      critical: "#DC2626",
    };

    const severityColors = {
      low: "#10B981",
      medium: "#F59E0B",
      high: "#EF4444",
      critical: "#DC2626",
    };

    switch (col.type) {
      case "status":
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: statusColors[value.toLowerCase()] || "#6B7280",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              display: "inline-block",
            }}
          >
            {value === "approved" || value === "verified" ? (
              <FiCheck size={12} style={{ marginRight: 4 }} />
            ) : value === "rejected" ? (
              <FiX size={12} style={{ marginRight: 4 }} />
            ) : null}
            {value}
          </span>
        );

      case "score":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>{value}</span>
            {value >= 80 && <FiStar size={14} color="#f59e0b" />}
            {value >= 60 && value < 80 && <FiStar size={14} color="#f59e0b" />}
          </div>
        );

      case "priority":
        return (
          <span
            className="priority-badge"
            style={{
              backgroundColor: priorityColors[value.toLowerCase()] || "#6B7280",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              display: "inline-block",
            }}
          >
            {value === "high" || value === "critical" ? (
              <FiAlertCircle size={12} style={{ marginRight: 4 }} />
            ) : null}
            {value}
          </span>
        );

      case "severity":
        return (
          <span
            className="severity-badge"
            style={{
              backgroundColor: severityColors[value.toLowerCase()] || "#6B7280",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              display: "inline-block",
            }}
          >
            <FiAlertCircle size={12} style={{ marginRight: 4 }} />
            {value}
          </span>
        );

      case "date":
        return new Date(value).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

      case "time":
        return new Date(value).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

      case "number":
        return value;

      default:
        return value;
    }
  }, []);

  // Pagination controls
  const renderPagination = useCallback(() => {
    const { page, totalPages } = pagination;
    if (totalPages <= 1) return null;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "16px 0",
        }}
      >
        <button
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
          }
          disabled={page === 1}
          style={{
            padding: "8px 16px",
            background: page === 1 ? "#e5e7eb" : C.primary,
            color: page === 1 ? "#6b7280" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: page === 1 ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          Previous
        </button>
        <span style={{ color: C.muted }}>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
          }
          disabled={page === totalPages}
          style={{
            padding: "8px 16px",
            background: page === totalPages ? "#e5e7eb" : C.primary,
            color: page === totalPages ? "#6b7280" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: page === totalPages ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          Next
        </button>
      </div>
    );
  }, [pagination]);

  if (!config) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
        Invalid data type
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.primary }}>{config.icon}</span>
          <h1 style={{ margin: 0, fontSize: 24, color: C.dark }}>
            {config.label} Management
          </h1>
          <span
            style={{
              background: C.bg,
              padding: "4px 12px",
              borderRadius: 12,
              fontSize: 12,
              color: C.muted,
            }}
          >
            Total: {pagination.total}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          padding: "16px",
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ flex: "1", minWidth: 200, position: "relative" }}>
          <FiSearch
            size={18}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.muted,
            }}
          />
          <input
            type="text"
            placeholder={`Search ${config.label}...`}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            style={{
              width: "100%",
              padding: "8px 14px 8px 36px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 14,
              background: C.bg,
            }}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            fontSize: 14,
            background: C.white,
            minWidth: 140,
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="verified">Verified</option>
          <option value="resolved">Resolved</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiCalendar size={18} color={C.muted} />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 14,
              background: C.white,
            }}
          />
        </div>
        <span style={{ display: "flex", alignItems: "center", color: C.muted }}>
          to
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiCalendar size={18} color={C.muted} />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 14,
              background: C.white,
            }}
          />
        </div>

        <button
          onClick={handleExport}
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
          }}
        >
          <FiDownload size={16} />
          Export
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: C.muted,
            }}
          >
            <FiClock size={32} style={{ marginBottom: 12 }} />
            <div>Loading...</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: C.bg,
                      borderBottom: `2px solid ${C.border}`,
                    }}
                  >
                    <th style={{ padding: "12px 16px", width: 40 }}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(data.map((item) => item.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                        checked={
                          selectedItems.length === data.length &&
                          data.length > 0
                        }
                      />
                    </th>
                    {config.columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          color: C.muted,
                          fontWeight: 600,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        {col.label}
                        {filters.sortBy === col.key && (
                          <span style={{ marginLeft: 4 }}>
                            {filters.sortOrder === "ASC" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                    ))}
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={config.columns.length + 2}
                        style={{
                          padding: "40px",
                          textAlign: "center",
                          color: C.muted,
                        }}
                      >
                        <FiGrid size={32} style={{ marginBottom: 8 }} />
                        <div>No {config.label.toLowerCase()} found</div>
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: `1px solid ${C.border}44`,
                          background: selectedItems.includes(item.id)
                            ? `${C.primary}08`
                            : "transparent",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item.id]);
                              } else {
                                setSelectedItems(
                                  selectedItems.filter((id) => id !== item.id),
                                );
                              }
                            }}
                          />
                        </td>
                        {config.columns.map((col) => (
                          <td key={col.key} style={{ padding: "12px 16px" }}>
                            {renderCellValue(item, col)}
                          </td>
                        ))}
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              justifyContent: "center",
                            }}
                          >
                            <button
                              onClick={() => viewItem(item)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                                color: C.primary,
                                padding: 4,
                                borderRadius: 4,
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = C.bg;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "none";
                              }}
                              title="View details"
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                                color: "#ef4444",
                                padding: 4,
                                borderRadius: 4,
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#fee2e2";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "none";
                              }}
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.dark,
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            zIndex: 100,
          }}
        >
          <span>{selectedItems.length} items selected</span>
          <button
            onClick={() => handleBulkAction("approve")}
            style={{
              padding: "6px 16px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiCheckCircle size={16} />
            Approve
          </button>
          <button
            onClick={() => handleBulkAction("reject")}
            style={{
              padding: "6px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiXCircle size={16} />
            Reject
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            style={{
              padding: "6px 16px",
              background: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiTrash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => setSelectedItems([])}
            style={{
              padding: "6px 16px",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* View Modal */}
      {showModal && selectedItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 24,
              maxWidth: 600,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: C.dark,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiEye size={24} color={C.primary} />
                Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: C.muted,
                }}
              >
                <FiX size={24} />
              </button>
            </div>
            {Object.entries(selectedItem).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.border}44`,
                }}
              >
                <div
                  style={{
                    width: 140,
                    fontWeight: 600,
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  {key.replace(/_/g, " ").toUpperCase()}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: C.dark }}>
                  {value !== null && value !== undefined
                    ? typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDataManagement;
