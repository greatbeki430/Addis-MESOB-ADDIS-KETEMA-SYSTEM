// frontend/src/components/golden-monday/AttendancePanel.jsx
// Golden Monday Attendance Panel with signature capture - ENHANCED

import { useState, useEffect, useCallback, useRef } from "react";
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
} from "react-icons/fi";

export default function AttendancePanel({ sessionId, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);
  const hasAutoOpened = useRef(false);

  // Get translations based on language
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingEmployee, setSigningEmployee] = useState(null);

  // State for showing signed employees
  const [showSigned, setShowSigned] = useState(true);
  const [showUnsigned, setShowUnsigned] = useState(true);
  // State for expanding departments
  const [expandedDepartments, setExpandedDepartments] = useState({});

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

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
        t.attendanceRecorded || "Attendance recorded successfully! ✅",
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

  // Load attendance on mount and when sessionId changes
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

  // Check if current user can sign
  const currentUserAttendance = attendance.find(
    (a) => a.user?._id === user?._id,
  );
  const isCurrentUserUnsigned =
    currentUserAttendance && !currentUserAttendance.attended;

  // Auto-start signing for current user
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

  // Group employees by department and position
  const groupEmployees = (employees) => {
    const grouped = {};
    employees.forEach((emp) => {
      const dept = emp.department || t.uncategorized || "Uncategorized";
      const position = emp.position || t.staff || "Staff";
      if (!grouped[dept]) {
        grouped[dept] = {};
      }
      if (!grouped[dept][position]) {
        grouped[dept][position] = [];
      }
      grouped[dept][position].push(emp);
    });
    return grouped;
  };

  // Sort employees within each position by name
  const sortEmployees = (employees) => {
    return [...employees].sort((a, b) => a.name?.localeCompare(b.name) || 0);
  };

  // Filter employees
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

  // Get filtered lists
  const unsignedEmployees = attendance.filter((a) => !a.attended);
  const signedEmployees = attendance.filter((a) => a.attended);

  const filteredUnsigned = filterEmployees(unsignedEmployees);
  const filteredSigned = filterEmployees(signedEmployees);

  // Group filtered employees
  const groupedUnsigned = groupEmployees(filteredUnsigned);
  const groupedSigned = groupEmployees(filteredSigned);

  const total = attendance.length;
  const attended = signedEmployees.length;
  const absent = unsignedEmployees.length;

  // Toggle department expansion
  const toggleDepartment = (dept) => {
    setExpandedDepartments((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <div style={{ fontFamily: F.sans }}>
      {/* Enhanced Stats Header with gradient backgrounds */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`,
            borderRadius: 12,
            padding: "14px 18px",
            textAlign: "center",
            border: `1px solid ${C.primary}22`,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}22`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: C.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiUsers size={20} color={C.primary} />
            {total}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
            {t.total || "Total"}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
            borderRadius: 12,
            padding: "14px 18px",
            textAlign: "center",
            border: "1px solid #6ee7b7",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 16px #6ee7b766";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#065f46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiUserCheck size={20} color="#065f46" />
            {attended}
          </div>
          <div style={{ fontSize: 11, color: "#065f46", fontWeight: 500 }}>
            {t.present || "Present"}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #fee2e2, #fecaca)",
            borderRadius: 12,
            padding: "14px 18px",
            textAlign: "center",
            border: "1px solid #fca5a5",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 16px #fca5a566";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiUserX size={20} color="#991b1b" />
            {absent}
          </div>
          <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 500 }}>
            {t.absent || "Absent"}
          </div>
        </div>

        <div
          style={{
            background: `linear-gradient(135deg, ${C.gold}22, ${C.gold}11)`,
            borderRadius: 12,
            padding: "14px 18px",
            textAlign: "center",
            border: `1px solid ${C.gold}44`,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 4px 16px ${C.gold}44`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiBarChart2 size={20} color={C.gold} />
            {attendanceRate}%
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
            <FiClock size={12} style={{ marginRight: 4 }} />
            {t.attendanceRate || "Attendance Rate"}
          </div>
        </div>
      </div>

      {/* Current User Status Banner - Enhanced */}
      {isCurrentUserUnsigned && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: `2px solid #f59e0b`,
            borderRadius: 12,
            padding: "12px 18px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            animation: "pulse-border 2s ease-in-out infinite",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <FiPenTool size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                {t.pleaseSignYourAttendance || "Please sign your attendance"}
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
              gap: 6,
              padding: "8px 20px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(245, 158, 11, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(245, 158, 11, 0.4)";
            }}
          >
            <FiPenTool size={14} />
            {t.signNow || "Sign Now"}
          </button>
        </div>
      )}

      {/* Controls - Enhanced */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
          background: C.white,
          padding: "12px 16px",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 200px", position: "relative", minWidth: 150 }}>
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
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              transition: "border-color 0.2s ease",
              background: C.white,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          style={{
            padding: "9px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: C.white,
            outline: "none",
            minWidth: 140,
            transition: "border-color 0.2s ease",
            cursor: "pointer",
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
          <option value="all">{t.allDepartments || "All Departments"}</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "9px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: C.white,
            outline: "none",
            minWidth: 130,
            transition: "border-color 0.2s ease",
            cursor: "pointer",
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
          <option value="all">All Status</option>
          <option value="unsigned">Unsigned</option>
          <option value="signed">Signed</option>
        </select>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            background: C.bg,
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            cursor: refreshing ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 0.2s ease",
            opacity: refreshing ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!refreshing) {
              e.currentTarget.style.background = C.border;
            }
          }}
          onMouseLeave={(e) => {
            if (!refreshing) {
              e.currentTarget.style.background = C.bg;
            }
          }}
        >
          <FiRefreshCw
            size={16}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          {refreshing
            ? t.refreshing || "Refreshing..."
            : t.refresh || "Refresh"}
        </button>

        {/* Toggle buttons for signed/unsigned sections */}
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button
            onClick={() => setShowUnsigned(!showUnsigned)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1.5px solid ${showUnsigned ? "#dc2626" : C.border}`,
              background: showUnsigned ? "#fee2e2" : "transparent",
              color: showUnsigned ? "#dc2626" : C.muted,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiUserX size={12} style={{ marginRight: 4 }} />
            Unsigned ({filteredUnsigned.length})
          </button>
          <button
            onClick={() => setShowSigned(!showSigned)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1.5px solid ${showSigned ? "#10b981" : C.border}`,
              background: showSigned ? "#d1fae5" : "transparent",
              color: showSigned ? "#10b981" : C.muted,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiUserCheck size={12} style={{ marginRight: 4 }} />
            Signed ({filteredSigned.length})
          </button>
        </div>
      </div>

      {/* Attendance List */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            color: C.muted,
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `3px solid ${C.primary}`,
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p>{t.loadingAttendance || "Loading attendance..."}</p>
        </div>
      ) : filteredUnsigned.length === 0 && filteredSigned.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            color: C.muted,
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
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
          <p style={{ fontSize: 13 }}>
            {t.searchEmployees || "Try adjusting your search"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {/* UNSIGNED EMPLOYEES SECTION */}
          {showUnsigned && filteredUnsigned.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#991b1b",
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1px solid #fca5a5`,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <FiUserX size={14} />
                </div>
                <span>
                  {t.unsignedEmployees || "Unsigned Employees"} (
                  {filteredUnsigned.length})
                </span>
              </div>

              {/* Group by Department */}
              {Object.keys(groupedUnsigned)
                .sort()
                .map((dept) => {
                  const positions = groupedUnsigned[dept];
                  const deptTotal = Object.values(positions).reduce(
                    (sum, empList) => sum + empList.length,
                    0,
                  );
                  const isExpanded =
                    expandedDepartments[`unsigned-${dept}`] !== false;

                  return (
                    <div key={dept} style={{ marginBottom: 6 }}>
                      <div
                        onClick={() => toggleDepartment(`unsigned-${dept}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          background: C.bg,
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.dark,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${C.primary}08`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = C.bg;
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
                            ({deptTotal})
                          </span>
                        </span>
                        {isExpanded ? (
                          <FiChevronDown size={16} color={C.muted} />
                        ) : (
                          <FiChevronRight size={16} color={C.muted} />
                        )}
                      </div>

                      {isExpanded && (
                        <div style={{ paddingLeft: 16, marginTop: 6 }}>
                          {Object.keys(positions)
                            .sort()
                            .map((position) => {
                              const employees = sortEmployees(
                                positions[position],
                              );
                              return (
                                <div
                                  key={position}
                                  style={{ marginBottom: 10 }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      fontSize: 12,
                                      color: C.muted,
                                      padding: "4px 8px",
                                      fontWeight: 600,
                                      borderBottom: `1px solid ${C.border}33`,
                                      marginBottom: 4,
                                    }}
                                  >
                                    <FiBriefcase size={14} />
                                    {position} ({employees.length})
                                  </div>
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {employees.map((emp) => {
                                      const userId =
                                        emp.user?._id || emp.user || emp.userId;
                                      const isCurrentUser =
                                        user?._id === userId;
                                      const canSign = isCurrentUser || isAdmin;

                                      return (
                                        <div
                                          key={userId || emp.name}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "10px 14px",
                                            borderRadius: 8,
                                            background: isCurrentUser
                                              ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                                              : C.white,
                                            border: `1.5px solid ${
                                              isCurrentUser
                                                ? "#f59e0b"
                                                : C.border
                                            }`,
                                            flexWrap: "wrap",
                                            gap: 8,
                                            transition: "all 0.2s ease",
                                            boxShadow: isCurrentUser
                                              ? "0 2px 8px rgba(245, 158, 11, 0.15)"
                                              : "none",
                                          }}
                                          onMouseEnter={(e) => {
                                            if (!isCurrentUser) {
                                              e.currentTarget.style.borderColor =
                                                C.primary + "44";
                                              e.currentTarget.style.background = `${C.primary}03`;
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (!isCurrentUser) {
                                              e.currentTarget.style.borderColor =
                                                C.border;
                                              e.currentTarget.style.background =
                                                C.white;
                                            }
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 10,
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: "50%",
                                                background: isCurrentUser
                                                  ? `linear-gradient(135deg, #f59e0b, #d97706)`
                                                  : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                                                color: "#fff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 13,
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
                                                      background:
                                                        C.primary + "15",
                                                      color: C.primary,
                                                      padding: "1px 8px",
                                                      borderRadius: 10,
                                                      fontWeight: 700,
                                                    }}
                                                  >
                                                    {t.you || "You"}
                                                  </span>
                                                )}
                                                {isAdmin && !isCurrentUser && (
                                                  <span
                                                    style={{
                                                      fontSize: 8,
                                                      background: "#fef3c7",
                                                      color: "#92400e",
                                                      padding: "1px 8px",
                                                      borderRadius: 10,
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    Admin
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
                                                  {emp.email ||
                                                    t.noEmail ||
                                                    "No email"}
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
                                                  console.log(
                                                    "🖊️ Sign In clicked for:",
                                                    emp.name,
                                                  );
                                                  setSigningEmployee(emp);
                                                  setShowSignatureModal(true);
                                                }}
                                                style={{
                                                  padding: "6px 16px",
                                                  background: isCurrentUser
                                                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                                    : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                                  color: "#fff",
                                                  border: "none",
                                                  borderRadius: 6,
                                                  cursor: "pointer",
                                                  fontSize: 12,
                                                  fontWeight: 600,
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 6,
                                                  transition: "all 0.2s ease",
                                                  boxShadow: isCurrentUser
                                                    ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                                                    : "0 4px 12px rgba(59, 130, 246, 0.3)",
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (isCurrentUser) {
                                                    e.currentTarget.style.background =
                                                      "linear-gradient(135deg, #d97706, #b45309)";
                                                  } else {
                                                    e.currentTarget.style.background =
                                                      "linear-gradient(135deg, #2563eb, #1d4ed8)";
                                                  }
                                                  e.currentTarget.style.transform =
                                                    "scale(1.05)";
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (isCurrentUser) {
                                                    e.currentTarget.style.background =
                                                      "linear-gradient(135deg, #f59e0b, #d97706)";
                                                  } else {
                                                    e.currentTarget.style.background =
                                                      "linear-gradient(135deg, #3b82f6, #2563eb)";
                                                  }
                                                  e.currentTarget.style.transform =
                                                    "scale(1)";
                                                }}
                                                aria-label={
                                                  t.signIn || "Sign in"
                                                }
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
                                                <FiXCircle
                                                  size={14}
                                                  color="#ef4444"
                                                />
                                                {t.notSigned || "Not signed"}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* SIGNED EMPLOYEES SECTION */}
          {showSigned && filteredSigned.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#065f46",
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1px solid #6ee7b7`,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <FiUserCheck size={14} />
                </div>
                <span>
                  {t.signedEmployees || "Signed Employees"} (
                  {filteredSigned.length})
                </span>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {Object.keys(groupedSigned)
                  .sort()
                  .map((dept) => {
                    const positions = groupedSigned[dept];
                    const deptTotal = Object.values(positions).reduce(
                      (sum, empList) => sum + empList.length,
                      0,
                    );
                    const isExpanded =
                      expandedDepartments[`signed-${dept}`] !== false;

                    return (
                      <div key={dept} style={{ marginBottom: 6 }}>
                        <div
                          onClick={() => toggleDepartment(`signed-${dept}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 14px",
                            background: "#ecfdf5",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#065f46",
                            transition: "all 0.2s ease",
                            border: `1px solid #6ee7b744`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#d1fae5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ecfdf5";
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
                                color: "#065f46",
                                fontWeight: 400,
                                opacity: 0.7,
                              }}
                            >
                              ({deptTotal})
                            </span>
                          </span>
                          {isExpanded ? (
                            <FiChevronDown size={16} />
                          ) : (
                            <FiChevronRight size={16} />
                          )}
                        </div>

                        {isExpanded && (
                          <div style={{ paddingLeft: 16, marginTop: 6 }}>
                            {Object.keys(positions)
                              .sort()
                              .map((position) => {
                                const employees = sortEmployees(
                                  positions[position],
                                );
                                return (
                                  <div
                                    key={position}
                                    style={{ marginBottom: 8 }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 12,
                                        color: "#065f46",
                                        padding: "4px 8px",
                                        fontWeight: 600,
                                        opacity: 0.7,
                                        borderBottom: `1px solid ${C.border}22`,
                                        marginBottom: 4,
                                      }}
                                    >
                                      <FiBriefcase size={14} />
                                      {position} ({employees.length})
                                    </div>
                                    <div style={{ display: "grid", gap: 6 }}>
                                      {employees.map((emp) => (
                                        <div
                                          key={emp.user?._id || emp.name}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "8px 14px",
                                            borderRadius: 8,
                                            background:
                                              "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                                            border: `1px solid #6ee7b7`,
                                            flexWrap: "wrap",
                                            gap: 6,
                                            opacity: 0.85,
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 10,
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: "50%",
                                                background:
                                                  "linear-gradient(135deg, #10b981, #34d399)",
                                                color: "#fff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 13,
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
                                                {emp.user?._id ===
                                                  user?._id && (
                                                  <span
                                                    style={{
                                                      fontSize: 9,
                                                      background:
                                                        C.primary + "15",
                                                      color: C.primary,
                                                      padding: "1px 8px",
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
                                                  {emp.email ||
                                                    t.noEmail ||
                                                    "No email"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <span
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 6,
                                              color: "#065f46",
                                              fontSize: 12,
                                              fontWeight: 600,
                                            }}
                                          >
                                            <FiCheckCircle
                                              size={16}
                                              color="#10b981"
                                            />
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
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Signature Modal */}
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: #f59e0b; }
          50% { border-color: #fbbf24; }
        }
      `}</style>
    </div>
  );
}
