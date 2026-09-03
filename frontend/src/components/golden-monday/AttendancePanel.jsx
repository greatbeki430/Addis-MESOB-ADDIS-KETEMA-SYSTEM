// frontend/src/components/golden-monday/AttendancePanel.jsx
// ============================================================
// 📋 GOLDEN MONDAY ATTENDANCE - Premium Glassmorphism Panel
// Complete signature capture with department grouping and real-time stats
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import SignatureModal from "./SignatureModal";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiPenTool,
  FiChevronDown,
  FiChevronRight,
  FiBriefcase,
  FiFolder,
  FiBarChart2,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiGrid,
  FiList,
  FiDownload,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// GLASSMORPHISM STYLES
// ─────────────────────────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AttendancePanel({ sessionId, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);
  const hasAutoOpened = useRef(false);

  // Get translations based on language
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // ── State ──
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingEmployee, setSigningEmployee] = useState(null);
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "list"
  const [showUnsigned, setShowUnsigned] = useState(true);
  const [showSigned, setShowSigned] = useState(true);
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [sortBy, setSortBy] = useState("name"); // "name" | "department" | "status"
  const [sortOrder, setSortOrder] = useState("asc");

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  // ── Load Attendance ──
  const loadAttendance = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const response = await goldenMondayAPI.getAttendance(sessionId);
      setAttendance(response.data.attendance || []);

      const depts = [
        ...new Set(
          response.data.attendance.map((a) => a.department).filter(Boolean),
        ),
      ].sort();
      setDepartments(depts);
    } catch (error) {
      console.error("Failed to load attendance:", error);
      showToast(
        t.failedToLoadAttendance || "Failed to load attendance",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAttendance();
    setRefreshing(false);
    if (onRefresh) onRefresh();
  };

  // ── Handle Signature ──
  const handleSignAttendance = async (userId, signatureData) => {
    console.log("📝 [SIGNATURE] Sending signature for user:", userId);
    console.log("📝 [SIGNATURE] Signature length:", signatureData?.length || 0);

    try {
      const payload = {
        userId,
        signature: signatureData || "",
        signatureType: signatureData ? "draw" : "none",
      };

      const response = await goldenMondayAPI.recordAttendance(
        sessionId,
        payload,
      );
      console.log("📝 [SIGNATURE] Response from server:", response.data);

      showToast(
        t.attendanceRecorded || "✅ Attendance recorded successfully!",
        "success",
      );
      await loadAttendance();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("❌ [SIGNATURE] Failed to record attendance:", error);
      showToast(
        t.failedToRecordAttendance || "Failed to record attendance",
        "error",
      );
    }
  };

  // ── Load on mount ──
  useEffect(() => {
    if (sessionId) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        loadAttendance();
      } else {
        loadAttendance();
      }
    }
  }, [sessionId, loadAttendance]);

  // ── Auto-open signature modal for current user ──
  const currentUserAttendance = attendance.find(
    (a) => a.user?._id === user?._id,
  );
  const isCurrentUserUnsigned =
    currentUserAttendance && !currentUserAttendance.attended;

  useEffect(() => {
    if (
      isCurrentUserUnsigned &&
      !showSignatureModal &&
      !hasAutoOpened.current
    ) {
      hasAutoOpened.current = true;
      setSigningEmployee(currentUserAttendance);
      setShowSignatureModal(true);
    }
  }, [isCurrentUserUnsigned, showSignatureModal, currentUserAttendance]);

  // ── Filter and Sort ──
  const filterEmployees = (employees) => {
    return employees.filter((a) => {
      const matchesSearch =
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.department?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        filterDepartment === "all" || a.department === filterDepartment;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "signed" && a.attended) ||
        (filterStatus === "unsigned" && !a.attended);
      return matchesSearch && matchesDept && matchesStatus;
    });
  };

  const getSortedEmployees = (employees) => {
    const sorted = [...employees];
    sorted.sort((a, b) => {
      let compareA, compareB;
      switch (sortBy) {
        case "name":
          compareA = a.name || "";
          compareB = b.name || "";
          break;
        case "department":
          compareA = a.department || "";
          compareB = b.department || "";
          break;
        case "status":
          compareA = a.attended ? 1 : 0;
          compareB = b.attended ? 1 : 0;
          break;
        default:
          compareA = a.name || "";
          compareB = b.name || "";
      }
      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // ── Group by Department ──
  const groupByDepartment = (employees) => {
    const grouped = {};
    employees.forEach((emp) => {
      const dept = emp.department || t.uncategorized || "Uncategorized";
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(emp);
    });
    // Sort departments
    const sortedKeys = Object.keys(grouped).sort();
    const sortedGrouped = {};
    sortedKeys.forEach((key) => {
      sortedGrouped[key] = grouped[key];
    });
    return sortedGrouped;
  };

  // ── Get filtered lists ──
  const unsignedEmployees = attendance.filter((a) => !a.attended);
  const signedEmployees = attendance.filter((a) => a.attended);

  const filteredUnsigned = filterEmployees(unsignedEmployees);
  const filteredSigned = filterEmployees(signedEmployees);

  const groupedUnsigned = groupByDepartment(filteredUnsigned);
  const groupedSigned = groupByDepartment(filteredSigned);

  const total = attendance.length;
  const attended = signedEmployees.length;
  const absent = unsignedEmployees.length;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  // ── Toggle Functions ──
  const toggleDepartment = (dept) => {
    setExpandedDepartments((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // ── Export Functions ──
  const exportAttendance = () => {
    const headers = [
      "Name",
      "Email",
      "Department",
      "Position",
      "Status",
      "Signed At",
    ];
    const rows = attendance.map((a) => [
      a.name || "",
      a.email || "",
      a.department || "",
      a.position || "",
      a.attended ? "Present" : "Absent",
      a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_${sessionId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(t.exported || "Attendance exported successfully!", "success");
  };

  // ─── Render ──
  return (
    <div style={{ fontFamily: F.sans }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: #f59e0b; }
          50% { border-color: #fbbf24; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .stat-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stat-card:hover {
          transform: translateY(-4px);
        }
        .attendance-item {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .attendance-item:hover {
          transform: translateX(4px);
        }
        .department-header {
          transition: all 0.3s ease;
        }
        .department-header:hover {
          background: rgba(13, 26, 94, 0.06);
        }
        .filter-input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px ${C.primary}22;
        }
        .pulse-glow {
          animation: pulse-border 2s ease-in-out infinite;
        }
        .fade-in {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>

      {/* ── STATS HEADER ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: t.total || "Total",
            value: total,
            icon: <FiUsers size={20} />,
            bg: `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`,
            color: C.primary,
            border: C.primary + "22",
          },
          {
            label: t.present || "Present",
            value: attended,
            icon: <FiUserCheck size={20} />,
            bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
            color: "#065f46",
            border: "#6ee7b7",
          },
          {
            label: t.absent || "Absent",
            value: absent,
            icon: <FiUserX size={20} />,
            bg: "linear-gradient(135deg, #fee2e2, #fecaca)",
            color: "#991b1b",
            border: "#fca5a5",
          },
          {
            label: t.attendanceRate || "Attendance Rate",
            value: `${attendanceRate}%`,
            icon: <FiBarChart2 size={20} />,
            bg: `linear-gradient(135deg, ${C.gold}22, ${C.gold}11)`,
            color: C.gold,
            border: C.gold + "44",
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="stat-card"
            style={{
              background: stat.bg,
              borderRadius: 14,
              padding: "14px 18px",
              textAlign: "center",
              border: `1px solid ${stat.border}`,
              cursor: "default",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: stat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {stat.icon}
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: stat.color,
                fontWeight: 500,
                opacity: 0.8,
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CURRENT USER STATUS BANNER ── */}
      {isCurrentUserUnsigned && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pulse-glow"
          style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: `2px solid #f59e0b`,
            borderRadius: 14,
            padding: "14px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <FiPenTool size={20} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#92400e" }}>
                {t.pleaseSignYourAttendance || "📝 Please sign your attendance"}
              </div>
              <div style={{ fontSize: 12, color: "#78350f", opacity: 0.8 }}>
                {t.confirm || "Click the button below to confirm your presence"}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSigningEmployee(currentUserAttendance);
              setShowSignatureModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(245, 158, 11, 0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 6px 24px rgba(245, 158, 11, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(245, 158, 11, 0.4)";
            }}
          >
            <FiPenTool size={16} />
            {t.signNow || "Sign Now"}
          </button>
        </motion.div>
      )}

      {/* ── CONTROLS BAR ── */}
      <div
        style={{
          ...glass,
          borderRadius: 14,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ flex: "1 1 180px", position: "relative", minWidth: 130 }}>
          <FiSearch
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#999",
            }}
          />
          <input
            type="text"
            placeholder={t.searchEmployees || "Search employees..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              outline: "none",
              transition: "all 0.3s ease",
              background: C.white,
            }}
          />
        </div>

        {/* Department Filter */}
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="filter-input"
          style={{
            padding: "9px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 13,
            background: C.white,
            outline: "none",
            minWidth: 120,
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
        >
          <option value="all">{t.allDepartments || "All Departments"}</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-input"
          style={{
            padding: "9px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 13,
            background: C.white,
            outline: "none",
            minWidth: 110,
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
        >
          <option value="all">{t.allStatus || "All Status"}</option>
          <option value="unsigned">{t.unsigned || "Unsigned"}</option>
          <option value="signed">{t.signed || "Signed"}</option>
        </select>

        {/* Sort */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-input"
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 12,
              background: C.white,
              outline: "none",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            <option value="name">{t.sortByName || "Name"}</option>
            <option value="department">{t.sortByDept || "Department"}</option>
            <option value="status">{t.sortByStatus || "Status"}</option>
          </select>
          <button
            onClick={toggleSortOrder}
            style={{
              padding: "9px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginLeft: "auto",
            alignItems: "center",
          }}
        >
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: refreshing ? "not-allowed" : "pointer",
              fontSize: 12,
              fontWeight: 500,
              transition: "all 0.2s ease",
              opacity: refreshing ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onMouseEnter={(e) => {
              if (!refreshing) e.currentTarget.style.background = C.bg;
            }}
            onMouseLeave={(e) => {
              if (!refreshing) e.currentTarget.style.background = C.white;
            }}
          >
            <FiRefreshCw
              size={14}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {refreshing ? t.refreshing || "..." : t.refresh || "Refresh"}
          </button>

          <button
            onClick={exportAttendance}
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            <FiDownload size={14} /> {t.export || "Export"}
          </button>

          <button
            onClick={() => setViewMode("grouped")}
            style={{
              padding: "9px 10px",
              borderRadius: 10,
              border: `1.5px solid ${viewMode === "grouped" ? C.primary : C.border}`,
              background: viewMode === "grouped" ? C.primary : C.white,
              color: viewMode === "grouped" ? "#fff" : C.muted,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "9px 10px",
              borderRadius: 10,
              border: `1.5px solid ${viewMode === "list" ? C.primary : C.border}`,
              background: viewMode === "list" ? C.primary : C.white,
              color: viewMode === "list" ? "#fff" : C.muted,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiList size={14} />
          </button>
        </div>
      </div>

      {/* ── TOGGLE SECTIONS ── */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        <button
          onClick={() => setShowUnsigned(!showUnsigned)}
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            border: `1.5px solid ${showUnsigned ? "#dc2626" : C.border}`,
            background: showUnsigned ? "#fee2e2" : "transparent",
            color: showUnsigned ? "#dc2626" : C.muted,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiUserX size={14} />
          {t.unsigned || "Unsigned"} ({filteredUnsigned.length})
        </button>
        <button
          onClick={() => setShowSigned(!showSigned)}
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            border: `1.5px solid ${showSigned ? "#10b981" : C.border}`,
            background: showSigned ? "#d1fae5" : "transparent",
            color: showSigned ? "#10b981" : C.muted,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiUserCheck size={14} />
          {t.signed || "Signed"} ({filteredSigned.length})
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      {loading ? (
        <div
          style={{
            ...glass,
            borderRadius: 14,
            padding: "50px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `3px solid ${C.primary}`,
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: C.muted }}>
            {t.loadingAttendance || "Loading attendance..."}
          </p>
        </div>
      ) : filteredUnsigned.length === 0 && filteredSigned.length === 0 ? (
        <div
          style={{
            ...glass,
            borderRadius: 14,
            padding: "50px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: C.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <FiUsers size={32} style={{ opacity: 0.3 }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
            {t.noEmployeesFound || "No employees found"}
          </p>
          <p style={{ fontSize: 13, color: C.muted }}>
            {t.searchEmployees || "Try adjusting your search filters"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {/* ── UNSIGNED SECTION ── */}
          {showUnsigned && filteredUnsigned.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#991b1b",
                  padding: "12px 18px",
                  background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `1px solid #fca5a5`,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <FiUserX size={16} />
                </div>
                <span>
                  {t.unsignedEmployees || "Unsigned Employees"} (
                  {filteredUnsigned.length})
                </span>
              </div>

              {viewMode === "grouped" ? (
                // ── GROUPED VIEW ──
                Object.keys(groupedUnsigned).map((dept) => {
                  const employees = getSortedEmployees(groupedUnsigned[dept]);
                  const isExpanded =
                    expandedDepartments[`unsigned-${dept}`] !== false;

                  return (
                    <div key={dept} style={{ marginBottom: 8 }}>
                      <div
                        onClick={() => toggleDepartment(`unsigned-${dept}`)}
                        className="department-header"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 16px",
                          background: C.bg,
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.dark,
                          border: `1px solid transparent`,
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <FiFolder size={16} color={C.primary} />
                          {dept}
                          <span
                            style={{
                              fontSize: 11,
                              color: C.muted,
                              fontWeight: 400,
                            }}
                          >
                            ({employees.length})
                          </span>
                        </span>
                        {isExpanded ? (
                          <FiChevronDown size={16} />
                        ) : (
                          <FiChevronRight size={16} />
                        )}
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            paddingLeft: 16,
                            marginTop: 6,
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          {employees.map((emp, index) => {
                            const userId =
                              emp.user?._id || emp.user || emp.userId;
                            const isCurrentUser = user?._id === userId;
                            const canSign = isCurrentUser || isAdmin;

                            return (
                              <motion.div
                                key={userId || index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: index * 0.03,
                                  duration: 0.2,
                                }}
                                className="attendance-item"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 16px",
                                  borderRadius: 10,
                                  background: isCurrentUser
                                    ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                                    : C.white,
                                  border: `1.5px solid ${isCurrentUser ? "#f59e0b" : C.border}`,
                                  flexWrap: "wrap",
                                  gap: 8,
                                  boxShadow: isCurrentUser
                                    ? "0 2px 12px rgba(245, 158, 11, 0.15)"
                                    : "none",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: "50%",
                                      background: isCurrentUser
                                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                        : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 14,
                                      fontWeight: 700,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {emp.name?.charAt(0) || "?"}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: C.dark,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      {emp.name}
                                      {isCurrentUser && (
                                        <span
                                          style={{
                                            fontSize: 9,
                                            background: `${C.primary}15`,
                                            color: C.primary,
                                            padding: "1px 10px",
                                            borderRadius: 10,
                                            fontWeight: 700,
                                          }}
                                        >
                                          {t.you || "You"}
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: 11,
                                        color: C.muted,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                      >
                                        <FiMail size={12} />
                                        {emp.email || t.noEmail || "No email"}
                                      </span>
                                      {emp.position && (
                                        <span
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                          }}
                                        >
                                          <FiBriefcase size={12} />
                                          {emp.position}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  {canSign ? (
                                    <button
                                      onClick={() => {
                                        setSigningEmployee(emp);
                                        setShowSignatureModal(true);
                                      }}
                                      style={{
                                        padding: "6px 18px",
                                        background: isCurrentUser
                                          ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                          : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        transition: "all 0.3s ease",
                                        boxShadow: isCurrentUser
                                          ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                                          : "0 4px 12px rgba(59, 130, 246, 0.3)",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform =
                                          "scale(1.05)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                          "scale(1)";
                                      }}
                                    >
                                      <FiPenTool size={14} />
                                      {t.signIn || "Sign In"}
                                    </button>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: C.muted,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <FiXCircle size={14} color="#ef4444" />
                                      {t.notSigned || "Not signed"}
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // ── LIST VIEW ──
                <div style={{ display: "grid", gap: 6 }}>
                  {getSortedEmployees(filteredUnsigned).map((emp, index) => {
                    const userId = emp.user?._id || emp.user || emp.userId;
                    const isCurrentUser = user?._id === userId;
                    const canSign = isCurrentUser || isAdmin;

                    return (
                      <motion.div
                        key={userId || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 16px",
                          borderRadius: 10,
                          background: isCurrentUser
                            ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                            : C.white,
                          border: `1.5px solid ${isCurrentUser ? "#f59e0b" : C.border}`,
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: isCurrentUser
                                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {emp.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: C.dark,
                              }}
                            >
                              {emp.name}
                              {isCurrentUser && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    background: `${C.primary}15`,
                                    color: C.primary,
                                    padding: "1px 10px",
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    marginLeft: 6,
                                  }}
                                >
                                  {t.you || "You"}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted }}>
                              {emp.department ||
                                t.noDepartment ||
                                "No department"}
                              {emp.position && ` · ${emp.position}`}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {canSign ? (
                            <button
                              onClick={() => {
                                setSigningEmployee(emp);
                                setShowSignatureModal(true);
                              }}
                              style={{
                                padding: "6px 18px",
                                background: isCurrentUser
                                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                  : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "all 0.3s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              <FiPenTool size={14} />
                              {t.signIn || "Sign In"}
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: C.muted,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <FiXCircle size={14} color="#ef4444" />
                              {t.notSigned || "Not signed"}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── SIGNED SECTION ── */}
          {showSigned && filteredSigned.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#065f46",
                  padding: "12px 18px",
                  background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `1px solid #6ee7b7`,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <FiUserCheck size={16} />
                </div>
                <span>
                  {t.signedEmployees || "Signed Employees"} (
                  {filteredSigned.length})
                </span>
              </div>

              {viewMode === "grouped" ? (
                Object.keys(groupedSigned).map((dept) => {
                  const employees = getSortedEmployees(groupedSigned[dept]);
                  const isExpanded =
                    expandedDepartments[`signed-${dept}`] !== false;

                  return (
                    <div key={dept} style={{ marginBottom: 8 }}>
                      <div
                        onClick={() => toggleDepartment(`signed-${dept}`)}
                        className="department-header"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 16px",
                          background: "#ecfdf5",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#065f46",
                          border: `1px solid #6ee7b744`,
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <FiFolder size={16} color="#10b981" />
                          {dept}
                          <span
                            style={{
                              fontSize: 11,
                              opacity: 0.7,
                              fontWeight: 400,
                            }}
                          >
                            ({employees.length})
                          </span>
                        </span>
                        {isExpanded ? (
                          <FiChevronDown size={16} />
                        ) : (
                          <FiChevronRight size={16} />
                        )}
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            paddingLeft: 16,
                            marginTop: 6,
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          {employees.map((emp, index) => (
                            <motion.div
                              key={emp.user?._id || index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: index * 0.03,
                                duration: 0.2,
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 16px",
                                borderRadius: 10,
                                background:
                                  "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                                border: `1px solid #6ee7b7`,
                                flexWrap: "wrap",
                                gap: 8,
                                opacity: 0.85,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background:
                                      "linear-gradient(135deg, #10b981, #34d399)",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                  }}
                                >
                                  {emp.name?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      fontSize: 13,
                                      color: C.dark,
                                    }}
                                  >
                                    {emp.name}
                                    {emp.user?._id === user?._id && (
                                      <span
                                        style={{
                                          fontSize: 9,
                                          background: `${C.primary}15`,
                                          color: C.primary,
                                          padding: "1px 10px",
                                          borderRadius: 10,
                                          fontWeight: 700,
                                          marginLeft: 6,
                                        }}
                                      >
                                        {t.you || "You"}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 11, color: C.muted }}>
                                    {emp.department ||
                                      t.noDepartment ||
                                      "No department"}
                                  </div>
                                </div>
                              </div>

                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  color: "#065f46",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                <FiCheckCircle size={16} color="#10b981" />
                                {t.signed || "Signed"}
                                {emp.checkedInAt && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: C.muted,
                                      fontWeight: 400,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <FiClock size={12} />
                                    {new Date(
                                      emp.checkedInAt,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  {getSortedEmployees(filteredSigned).map((emp, index) => (
                    <motion.div
                      key={emp.user?._id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                        border: `1px solid #6ee7b7`,
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #10b981, #34d399)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {emp.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: C.dark,
                            }}
                          >
                            {emp.name}
                            {emp.user?._id === user?._id && (
                              <span
                                style={{
                                  fontSize: 9,
                                  background: `${C.primary}15`,
                                  color: C.primary,
                                  padding: "1px 10px",
                                  borderRadius: 10,
                                  fontWeight: 700,
                                  marginLeft: 6,
                                }}
                              >
                                {t.you || "You"}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            {emp.department ||
                              t.noDepartment ||
                              "No department"}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "#065f46",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <FiCheckCircle size={16} color="#10b981" />
                        {t.signed || "Signed"}
                        {emp.checkedInAt && (
                          <span
                            style={{
                              fontSize: 10,
                              color: C.muted,
                              fontWeight: 400,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <FiClock size={12} />
                            {new Date(emp.checkedInAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ── SIGNATURE MODAL ── */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setSigningEmployee(null);
        }}
        onConfirm={(signature) => {
          if (signingEmployee) {
            const userId = signingEmployee.user?._id || signingEmployee.user;
            handleSignAttendance(userId, signature);
          }
          setShowSignatureModal(false);
          setSigningEmployee(null);
        }}
        employee={signingEmployee}
        sessionName={`Golden Monday - ${new Date().toLocaleDateString()}`}
      />
    </div>
  );
}
