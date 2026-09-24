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
  FiPrinter,
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
  FiInfo,
  FiUsers,
  FiPenTool,
  FiAlignLeft,
  FiActivity,
} from "react-icons/fi";

import {
  generateReportForRow,
  isReportSupported,
} from "../../utils/adminReportGenerator";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ─── Column configurations (unchanged) ──────────────────────────
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

// ─── Sensitive fields that must never render ────────────────────
const BLOCKED_FIELDS = new Set([
  "password",
  "__v",
  "_id",
  "id",
  "profilePhotoPublicId",
]);

// ─── Human-friendly key labels ──────────────────────────────────
const KEY_LABELS = {
  topic: "Topic",
  author_name: "Author",
  team_name: "Team",
  createdAt: "Created",
  updatedAt: "Last Updated",
  date: "Date",
  timeStart: "Start Time",
  timeEnd: "End Time",
  present: "Present Members",
  absent: "Absent Members",
  prevResults: "Previous Results",
  topics: "Discussion Topics",
  explanation: "Explanation",
  gaps: "Identified Gaps",
  agreements: "Agreed Points",
  signatures: "Signatures",
  teamName: "Team Name",
  createdBy: "Created By",
  team: "Team",
  status: "Status",
  isAutoSave: "Auto-Saved",
  lastAutoSave: "Last Auto-Save",
  autoSaveCount: "Auto-Save Count",
  meetingDuration: "Meeting Duration (min)",
  timeExpired: "Time Expired",
  timeExpiredAt: "Expired At",
  extensionApproved: "Extension Approved",
  extensionExpiresAt: "Extension Expires",
  isResumed: "Resumed",
  resumedAt: "Resumed At",
  isLocked: "Locked",
  lockedAt: "Locked At",
  lockedReason: "Lock Reason",
  adminNotes: "Admin Notes",
  reviewedBy: "Reviewed By",
  reviewedAt: "Reviewed At",
  finalizedAt: "Finalized At",
  aiGeneratedContent: "AI Generated Content",
  employee_name: "Employee",
  submittedBy: "Submitted By",
  evaluatedBy: "Evaluated By",
  evaluatedAt: "Evaluated At",
  bestPerformer: "Best Performer",
  averageScore: "Average Score",
  highestScore: "Highest Score",
  lowestScore: "Lowest Score",
  totalMembers: "Total Members",
  members: "Members",
  scores: "Scores",
  comments: "Comments",
  totalScores: "Total Scores",
  grandTotal: "Grand Total",
  entries: "Entries",
  summary: "Summary",
  reactions: "Reactions",
  replies: "Replies",
  name: "Name",
  email: "Email",
  role: "Role",
  position: "Position",
  branch: "Branch",
  department: "Department",
  phone: "Phone",
  leader: "Leader",
  score: "Score",
};
// ─── Helpers ────────────────────────────────────────────────────
const formatLabel = (key) =>
  KEY_LABELS[key] ||
  key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// Detect a base64 image data-URL
const isImageDataUrl = (v) =>
  typeof v === "string" && /^data:image\/[a-z]+;base64,/i.test(v);
// Detect an http(s) URL that points to an image
const isImageUrl = (v) =>
  typeof v === "string" &&
  /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(v);

// True for either a data: URL or an http(s) image URL
const isImageLike = (v) => isImageDataUrl(v) || isImageUrl(v);

const isDateLike = (v) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/.test(v);

const formatValue = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();

  if (isDateLike(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      // Show date + time nicely
      const hasTime = value.includes("T");
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      });
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((v) =>
        typeof v === "object"
          ? v.name || v.text || v.title || JSON.stringify(v)
          : String(v),
      )
      .join(", ");
  }

  return String(value);
};

// ─── Component ──────────────────────────────────────────────────
const AdminDataManagement = ({ dataType }) => {
  const { user } = useAuth();
  // ─── Responsive viewport tracking ────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
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
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, label }
  const [deleting, setDeleting] = useState(false);
  // Tracks which row is currently being turned into a PDF so the
  // button can show a spinner and can't be double-clicked.
  const [generatingPdfId, setGeneratingPdfId] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const config = COLUMN_CONFIGS[dataType];

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  useEffect(() => {
    if (user?._id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchData();
    }
  }, [user?._id, fetchData]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSort = useCallback(
    (key) => {
      const newOrder =
        filters.sortBy === key && filters.sortOrder === "ASC" ? "DESC" : "ASC";
      handleFilterChange("sortBy", key);
      handleFilterChange("sortOrder", newOrder);
    },
    [filters.sortBy, filters.sortOrder, handleFilterChange],
  );

  useEffect(() => {
    if (hasLoadedRef.current) {
      const timer = setTimeout(() => {
        if (filters.search !== "") fetchData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filters.search, fetchData]);

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

  const viewItem = useCallback((item) => {
    setSelectedItem(item);
    setShowModal(true);
  }, []);

  // Opens the delete confirmation modal (does NOT delete yet)
  const requestDelete = useCallback((item) => {
    const label =
      item.employee_name ||
      item.topic ||
      item.title ||
      item.name ||
      "this record";
    setDeleteTarget({ id: item.id, label });
  }, []);

  // Performs the actual delete, then closes the modal
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/admin/data/${dataType}/${deleteTarget.id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  }, [dataType, deleteTarget, fetchData]);

  // Generates a PDF for one row. Delegates to the adminReportGenerator
  // module, which knows how to shape each data type for its generator.
  const handleGeneratePdf = useCallback(
    async (item) => {
      setGeneratingPdfId(item.id);
      try {
        const result = await generateReportForRow(item, dataType, {
          language: "am",
        });
        if (!result.success) {
          alert(result.error || "Failed to generate PDF.");
        }
      } finally {
        setGeneratingPdfId(null);
      }
    },
    [dataType],
  );

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
      in_progress: "#8B5CF6",
      auto_saved: "#F59E0B",
      draft: "#6B7280",
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
              backgroundColor:
                statusColors[String(value).toLowerCase()] || "#6B7280",
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
            {value >= 60 && <FiStar size={14} color="#f59e0b" />}
          </div>
        );

      case "priority":
        return (
          <span
            className="priority-badge"
            style={{
              backgroundColor:
                priorityColors[String(value).toLowerCase()] || "#6B7280",
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
              backgroundColor:
                severityColors[String(value).toLowerCase()] || "#6B7280",
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

  // ─── Section grouping for the modal ────────────────────────────
  const SECTION_MAP = {
    "forum-reports": [
      {
        title: "Report Summary",
        icon: <FiFileText size={16} />,
        keys: ["topic", "team_name", "author_name", "createdAt", "status"],
      },
      {
        title: "Meeting Details",
        icon: <FiCalendar size={16} />,
        keys: ["date", "timeStart", "timeEnd", "teamName"],
      },
      {
        title: "Attendees",
        icon: <FiUsers size={16} />,
        keys: ["present", "absent"],
      },
      {
        title: "Discussion",
        icon: <FiMessageSquare size={16} />,
        keys: ["topics", "prevResults", "explanation", "gaps", "agreements"],
      },
      {
        title: "Signatures",
        icon: <FiPenTool size={16} />,
        keys: ["signatures"],
      },
      {
        title: "Activity",
        icon: <FiActivity size={16} />,
        keys: [
          "isAutoSave",
          "lastAutoSave",
          "autoSaveCount",
          "finalizedAt",
          "adminNotes",
        ],
      },
    ],
    "daily-reports": [
      {
        title: "Report Summary",
        icon: <FiFileText size={16} />,
        keys: ["employee_name", "team_name", "submittedBy", "date", "status"],
      },
      {
        title: "Totals",
        icon: <FiBarChart2 size={16} />,
        keys: ["grandTotal"],
      },
      {
        title: "Entries",
        icon: <FiAlignLeft size={16} />,
        keys: ["entries"],
      },
      {
        title: "Summary",
        icon: <FiAlignLeft size={16} />,
        keys: ["summary"],
      },
    ],
    evaluations: [
      {
        title: "Evaluation Summary",
        icon: <FiStar size={16} />,
        keys: [
          "employee_name",
          "team_name",
          "score",
          "averageScore",
          "highestScore",
          "lowestScore",
          "bestPerformer",
          "totalMembers",
          "status",
          "createdAt",
        ],
      },
      {
        title: "Members",
        icon: <FiUsers size={16} />,
        keys: ["members"],
      },
      {
        title: "Scores",
        icon: <FiBarChart2 size={16} />,
        keys: ["totalScores"],
      },
      {
        title: "Comments",
        icon: <FiMessageSquare size={16} />,
        keys: ["comments"],
      },
      {
        title: "Audit",
        icon: <FiActivity size={16} />,
        keys: ["evaluatedBy", "evaluatedAt"],
      },
    ],
  };

  const buildSections = (item, dtype) => {
    const map = SECTION_MAP[dtype] || [];
    const usedKeys = new Set();
    const sections = [];

    map.forEach((section) => {
      const rows = section.keys
        .filter((k) => k in item && !BLOCKED_FIELDS.has(k))
        .map((k) => {
          usedKeys.add(k);
          return { key: k, value: item[k] };
        })
        .filter(({ value }) => {
          // Hide empty arrays and null/undefined values
          if (value === null || value === undefined) return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        });
      if (rows.length > 0) {
        sections.push({ ...section, rows });
      }
    });

    // Remaining keys not covered by any section → "More Details"
    const leftovers = Object.keys(item)
      .filter((k) => !usedKeys.has(k) && !BLOCKED_FIELDS.has(k))
      .filter((k) => {
        const v = item[k];
        if (v === null || v === undefined) return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      })
      .map((k) => ({ key: k, value: item[k] }));

    if (leftovers.length > 0) {
      sections.push({
        title: "More Details",
        icon: <FiInfo size={16} />,
        rows: leftovers,
      });
    }

    return sections;
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
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
          <option value="in_progress">In Progress</option>
          <option value="auto_saved">Auto Saved</option>
          <option value="draft">Draft</option>
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
          <div style={{ padding: "60px", textAlign: "center", color: C.muted }}>
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
                          style={{ padding: "12px 16px", textAlign: "center" }}
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
                            {isReportSupported(dataType) && (
                              <button
                                onClick={() => handleGeneratePdf(item)}
                                disabled={generatingPdfId === item.id}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor:
                                    generatingPdfId === item.id
                                      ? "wait"
                                      : "pointer",
                                  fontSize: 16,
                                  color: C.primary,
                                  padding: 4,
                                  borderRadius: 4,
                                  transition: "background 0.2s",
                                  opacity:
                                    generatingPdfId === item.id ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) => {
                                  if (generatingPdfId !== item.id)
                                    e.currentTarget.style.background = C.bg;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "none";
                                }}
                                title="Generate PDF report"
                              >
                                <FiPrinter size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => requestDelete(item)}
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
      {selectedItems.length > 0 && !showModal && (
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
            zIndex: 3000,
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

      {/* ─── View Modal (responsive, roomy) ──────────────────────── */}
      {showModal && selectedItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "center",
            zIndex: 200,
            padding: isMobile ? 0 : 24,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: isMobile ? 0 : 20,
              maxWidth: isMobile ? "100%" : "min(1100px, 94vw)",
              width: "100%",
              maxHeight: isMobile ? "100vh" : "92vh",
              height: isMobile ? "100vh" : "auto",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: isMobile ? "none" : "0 24px 72px rgba(0,0,0,0.28)",
              animation: "slideUp 0.25s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header (sticky) ── */}
            <div
              style={{
                padding: isMobile ? "14px 18px" : "20px 32px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: `linear-gradient(135deg, ${C.primary}12, ${C.primary}04)`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 10 : 14,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: isMobile ? 36 : 48,
                    height: isMobile ? 36 : 48,
                    borderRadius: isMobile ? 10 : 14,
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primary}dd)`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 16px ${C.primary}44`,
                  }}
                >
                  {config.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: isMobile ? 16 : 20,
                      color: C.dark,
                      fontFamily: "inherit",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {config.label} Details
                  </h2>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: isMobile ? 11 : 13,
                      color: C.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Full record view — sensitive fields hidden
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close"
                style={{
                  background: "rgba(0,0,0,0.06)",
                  border: "none",
                  width: isMobile ? 34 : 38,
                  height: isMobile ? 34 : 38,
                  borderRadius: 10,
                  cursor: "pointer",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.12)";
                  e.currentTarget.style.color = C.dark;
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.06)";
                  e.currentTarget.style.color = C.muted;
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <FiX size={isMobile ? 18 : 20} />
              </button>
            </div>

            {/* ── Body ── */}
            <div
              style={{
                padding: isMobile ? "16px 16px 24px" : "28px 32px",
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? 18 : 24,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {buildSections(selectedItem, dataType).map((section, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    background: "#FAFBFC",
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: isMobile ? "14px 14px" : "18px 22px",
                  }}
                >
                  {/* Section header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: isMobile ? 12 : 16,
                      paddingBottom: 10,
                      borderBottom: `2px solid ${C.primary}22`,
                    }}
                  >
                    <span
                      style={{
                        color: C.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: `${C.primary}15`,
                      }}
                    >
                      {section.icon}
                    </span>
                    <span
                      style={{
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 800,
                        color: C.primary,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {section.title}
                    </span>
                  </div>

                  {/* Section rows */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: isMobile ? 12 : 10,
                    }}
                  >
                    {section.rows.map((row, rIdx) => (
                      <div
                        key={rIdx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "180px 1fr",
                          gap: isMobile ? 4 : 16,
                          padding: isMobile ? "8px 10px" : "10px 14px",
                          background: "#fff",
                          borderRadius: 10,
                          border: `1px solid ${C.border}66`,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            fontSize: isMobile ? 10 : 11,
                            fontWeight: 700,
                            color: C.muted,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            paddingTop: isMobile ? 0 : 2,
                          }}
                        >
                          {formatLabel(row.key)}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? 13 : 14,
                            color: C.dark,
                            wordBreak: "break-word",
                            lineHeight: 1.6,
                            minWidth: 0,
                          }}
                        >
                          {renderModalValue(row.value, isMobile)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {buildSections(selectedItem, dataType).length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: C.muted,
                  }}
                >
                  <FiInfo
                    size={40}
                    style={{ marginBottom: 12, opacity: 0.5 }}
                  />
                  <p>No displayable fields in this record.</p>
                </div>
              )}
            </div>

            {/* ── Footer (sticky) ── */}
            <div
              style={{
                padding: isMobile ? "12px 16px" : "16px 32px",
                borderTop: `1px solid ${C.border}`,
                background: "#FAFBFC",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: isMobile ? "10px 20px" : "10px 24px",
                  background: C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: isMobile ? 13 : 14,
                  width: isMobile ? "100%" : "auto",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 6px 20px ${C.primary}44`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Close
              </button>
            </div>
          </div>

          <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────── */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4000,
            padding: 24,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 460,
              overflow: "hidden",
              boxShadow: "0 24px 72px rgba(0,0,0,0.32)",
              animation: "slideUp 0.25s ease",
            }}
          >
            {/* Header strip */}
            <div
              style={{
                padding: "22px 26px 18px",
                background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
                borderBottom: "1px solid #FECACA",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #EF4444, #DC2626)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 6px 18px rgba(239,68,68,0.4)",
                }}
              >
                <FiAlertCircle size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#7F1D1D",
                    lineHeight: 1.3,
                  }}
                >
                  Delete {config.label.replace(/s$/, "")}?
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "#B91C1C",
                    lineHeight: 1.5,
                  }}
                >
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 26px 22px" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: C.dark,
                  lineHeight: 1.6,
                }}
              >
                You are about to permanently delete{" "}
                <strong style={{ color: "#DC2626" }}>
                  “{deleteTarget.label}”
                </strong>
                . All associated data will be removed from the system.
              </p>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 24,
                }}
              >
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  style={{
                    padding: "10px 20px",
                    background: "#F1F5F9",
                    color: "#475569",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    cursor: deleting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    opacity: deleting ? 0.6 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) e.currentTarget.style.background = "#E2E8F0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={{
                    padding: "10px 20px",
                    background: deleting
                      ? "#FCA5A5"
                      : "linear-gradient(135deg, #EF4444, #DC2626)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: deleting ? "wait" : "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: deleting
                      ? "none"
                      : "0 6px 18px rgba(239,68,68,0.35)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 22px rgba(239,68,68,0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 18px rgba(239,68,68,0.35)";
                  }}
                >
                  {deleting ? (
                    <>
                      <FiClock size={15} />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={15} />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Modal value renderer (handles all value types) ─────────────
function renderModalValue(value, isMobile = false) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();

  if (isDateLike(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      const hasTime = value.includes("T");
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      });
    }
  }

  // Image URL or base64 data URL → render as an actual <img>
  if (isImageLike(value)) {
    const isDataUrl = isImageDataUrl(value);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        {" "}
        <img
          src={value}
          alt={isDataUrl ? "Signature" : "Image"}
          style={{
            width: "auto",
            height: "auto",
            maxWidth: isMobile ? "100%" : 280,
            maxHeight: isMobile ? 160 : 220,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "#fff",
            padding: isDataUrl ? 6 : 0,
            display: "block",
            objectFit: "contain",
          }}
          onError={(e) => {
            // If the image fails to load, replace with the raw URL text
            const parent = e.currentTarget.parentNode;
            if (parent) {
              parent.innerHTML = `<span style="color:${C.muted};font-size:12px;word-break:break-all">${value}</span>`;
            }
          }}
        />
        {!isDataUrl && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: C.primary,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Open in new tab ↗
          </a>
        )}
      </div>
    );
  }

  if (Array.isArray(value)) {
    // Array of image strings (base64 or http) → grid of images
    if (value.every((v) => isImageLike(v))) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(auto-fill, minmax(120px, 1fr))"
              : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: isMobile ? 10 : 14,
          }}
        >
          {value.map((v, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: isMobile ? 8 : 10,
                textAlign: "center",
              }}
            >
              <img
                src={v}
                alt={`Signature ${i + 1}`}
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: isMobile ? 70 : 100,
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
              />
              <div
                style={{
                  fontSize: isMobile ? 10 : 11,
                  color: C.muted,
                  marginTop: 6,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Signature {i + 1}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Array of strings → pill list
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {value.map((v, i) => (
            <span
              key={i}
              style={{
                background: `${C.primary}15`,
                color: C.primary,
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {v}
            </span>
          ))}
        </div>
      );
    }

    // Array of uniform objects → render as a sub-table.
    // This is what "members", "scores", "entries", "scores[].items"
    // actually are — a small tabular dataset, not a stack of cards.
    // Falls back to cards for a single object (a one-row table reads
    // worse than a card).
    if (value.length >= 2 && value.every(isPlainObject)) {
      const firstKeys = Object.keys(value[0]).filter(
        (k) => !BLOCKED_FIELDS.has(k),
      );
      const extraKeys = Array.from(
        new Set(
          value.flatMap((v) =>
            Object.keys(v).filter(
              (k) => !BLOCKED_FIELDS.has(k) && !firstKeys.includes(k),
            ),
          ),
        ),
      );
      const columns = [...firstKeys, ...extraKeys];

      if (columns.length > 0) {
        return (
          <div
            style={{
              overflowX: "auto",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              background: "#fff",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: isMobile ? 11 : 12,
              }}
            >
              <thead>
                <tr style={{ background: "#F1F5F9" }}>
                  {columns.map((k) => (
                    <th
                      key={k}
                      style={{
                        padding: isMobile ? "6px 8px" : "8px 12px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: C.muted,
                        textTransform: "uppercase",
                        fontSize: isMobile ? 9 : 10,
                        letterSpacing: "0.04em",
                        borderBottom: `1px solid ${C.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatLabel(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? "#fff" : "#FAFBFC",
                      borderBottom: `1px solid ${C.border}55`,
                    }}
                  >
                    {columns.map((k) => (
                      <td
                        key={k}
                        style={{
                          padding: isMobile ? "6px 8px" : "8px 12px",
                          color: C.dark,
                          verticalAlign: "top",
                          wordBreak: "break-word",
                        }}
                      >
                        {formatValue(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // Array of objects → mini cards
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {value.map((v, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
            }}
          >
            {isPlainObject(v)
              ? Object.entries(v)
                  .filter(([k]) => !BLOCKED_FIELDS.has(k))
                  .map(([k, vv]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: C.muted,
                          minWidth: 70,
                        }}
                      >
                        {formatLabel(k)}:
                      </span>
                      <span style={{ color: C.dark }}>{formatValue(vv)}</span>
                    </div>
                  ))
              : formatValue(v)}
          </div>
        ))}
      </div>
    );
  }

  // Nested object → sub rows (recurse so images render as images)
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(
      ([k]) => !BLOCKED_FIELDS.has(k),
    );
    if (entries.length === 0) return "—";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "10px 14px",
        }}
      >
        {entries.map(([k, vv]) => (
          <div
            key={k}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "140px 1fr",
              gap: isMobile ? 4 : 10,
              fontSize: 12,
              alignItems: "flex-start",
              paddingBottom: 6,
              borderBottom: `1px solid ${C.border}44`,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                fontSize: 10,
                letterSpacing: "0.04em",
                paddingTop: isMobile ? 0 : 2,
              }}
            >
              {formatLabel(k)}
            </span>
            <div style={{ color: C.dark, minWidth: 0 }}>
              {renderModalValue(vv, isMobile)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return String(value);
}

export default AdminDataManagement;
