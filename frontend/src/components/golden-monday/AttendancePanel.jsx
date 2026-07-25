// frontend/src/components/golden-monday/AttendancePanel.jsx
// Golden Monday Attendance Panel with signature capture - FIXED

import { useState, useEffect, useCallback, useRef } from "react";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { showToast } from "../../utils/toastHelper";
import SignatureCanvas from "./SignatureCanvas";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiLoader,
  FiSearch,
  FiPenTool,
  FiChevronDown,
  FiChevronRight,
  FiBriefcase,
  FiFolder,
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
  const [departments, setDepartments] = useState([]);
  const [mySignature, setMySignature] = useState(null);
  const [signingFor, setSigningFor] = useState(null);

  // State for showing signed employees
  const [showSigned, setShowSigned] = useState(false);
  // State for expanding departments
  const [expandedDepartments, setExpandedDepartments] = useState({});

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

  const handleSignAttendance = async (userId) => {
    if (!mySignature) {
      showToast(
        t.pleaseSignFirst || "Please sign first by drawing or typing your name",
        "warning",
      );
      return;
    }

    try {
      await goldenMondayAPI.recordAttendance(sessionId, {
        userId,
        signature: mySignature,
        signatureType: "draw",
      });
      showToast(
        t.attendanceRecorded || "Attendance recorded successfully!",
        "success",
      );
      setMySignature(null);
      setSigningFor(null);
      await loadAttendance();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to record attendance:", error);
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

  // Check if current user can sign (is in the attendance list)
  const currentUserAttendance = attendance.find(
    (a) => a.user?._id === user?._id,
  );
  const isCurrentUserUnsigned =
    currentUserAttendance && !currentUserAttendance.attended;

  // Auto-start signing for current user if they haven't signed yet (only once)
  useEffect(() => {
    if (
      isCurrentUserUnsigned &&
      !signingFor &&
      !mySignature &&
      !hasAutoOpened.current
    ) {
      hasAutoOpened.current = true;
      setSigningFor(currentUserAttendance.user?._id);
    }
  }, [isCurrentUserUnsigned, signingFor, mySignature, currentUserAttendance]);

  // Group employees by department and position
  const groupEmployees = (employees) => {
    const grouped = {};
    employees.forEach((emp) => {
      const dept = emp.department || "Uncategorized";
      const position = emp.position || "Staff";
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
        a.position?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        filterDepartment === "all" || a.department === filterDepartment;
      return matchesSearch && matchesDept;
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

  return (
    <div style={{ fontFamily: F.sans }}>
      {/* Stats Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: C.bg,
            borderRadius: 8,
            padding: "12px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: C.primary }}>
            {total}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            <FiUsers size={12} style={{ marginRight: 4 }} />
            {t.total || "Total"}
          </div>
        </div>
        <div
          style={{
            background: "#d1fae5",
            borderRadius: 8,
            padding: "12px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#065f46" }}>
            {attended}
          </div>
          <div style={{ fontSize: 11, color: "#065f46" }}>
            <FiUserCheck size={12} style={{ marginRight: 4 }} />
            {t.present || "Present"}
          </div>
        </div>
        <div
          style={{
            background: "#fee2e2",
            borderRadius: 8,
            padding: "12px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#991b1b" }}>
            {absent}
          </div>
          <div style={{ fontSize: 11, color: "#991b1b" }}>
            <FiUserX size={12} style={{ marginRight: 4 }} />
            {t.absent || "Absent"}
          </div>
        </div>
        <div
          style={{
            background: C.primary + "11",
            borderRadius: 8,
            padding: "12px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: C.primary }}>
            {total > 0 ? Math.round((attended / total) * 100) : 0}%
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            <FiClock size={12} style={{ marginRight: 4 }} />
            {t.attendanceRate || "Attendance Rate"}
          </div>
        </div>
      </div>

      {/* Current User Status Banner */}
      {isCurrentUserUnsigned && (
        <div
          style={{
            background: "#fef3c7",
            border: `1px solid #f59e0b`,
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiPenTool size={16} color="#f59e0b" />
          <span style={{ fontSize: 13, color: "#92400e" }}>
            {t.pleaseSignYourAttendance || "Please sign your attendance below"}
          </span>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ flex: "1 1 200px", position: "relative" }}>
          <FiSearch
            size={14}
            style={{
              position: "absolute",
              left: 10,
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
              padding: "8px 10px 8px 32px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
            }}
            aria-label={t.searchEmployees || "Search employees"}
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 12,
            background: C.white,
            outline: "none",
            minWidth: 120,
          }}
          aria-label={t.allDepartments || "Filter by department"}
        >
          <option value="all">{t.allDepartments || "All Departments"}</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "8px 14px",
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
          }}
          aria-label={t.refresh || "Refresh attendance"}
        >
          <FiRefreshCw
            size={14}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          {refreshing
            ? t.refreshing || "Refreshing..."
            : t.refresh || "Refresh"}
        </button>
      </div>

      {/* Attendance List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "30px", color: C.muted }}>
          <FiLoader
            size={24}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p>{t.loadingAttendance || "Loading attendance..."}</p>
        </div>
      ) : filteredUnsigned.length === 0 && filteredSigned.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: C.muted }}>
          <FiUsers size={32} style={{ opacity: 0.3 }} />
          <p>{t.noEmployeesFound || "No employees found"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {/* UNSIGNED EMPLOYEES SECTION */}
          {filteredUnsigned.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#991b1b",
                  padding: "8px 14px",
                  background: "#fee2e2",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiUserX size={16} />
                {t.unsignedEmployees || "Unsigned Employees"} (
                {filteredUnsigned.length})
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
                  const isExpanded = expandedDepartments[dept] !== false;

                  return (
                    <div key={dept} style={{ marginBottom: 4 }}>
                      <div
                        onClick={() => toggleDepartment(dept)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 12px",
                          background: C.bg,
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.dark,
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <FiFolder size={14} />
                          {dept} ({deptTotal})
                        </span>
                        {isExpanded ? (
                          <FiChevronDown size={14} />
                        ) : (
                          <FiChevronRight size={14} />
                        )}
                      </div>

                      {isExpanded && (
                        <div style={{ paddingLeft: 12, marginTop: 4 }}>
                          {Object.keys(positions)
                            .sort()
                            .map((position) => {
                              const employees = sortEmployees(
                                positions[position],
                              );
                              return (
                                <div key={position} style={{ marginBottom: 8 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: 11,
                                      color: C.muted,
                                      padding: "4px 8px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <FiBriefcase size={12} />
                                    {position} ({employees.length})
                                  </div>
                                  <div style={{ display: "grid", gap: 4 }}>
                                    {employees.map((emp) => {
                                      const isCurrentUser =
                                        user?._id === emp.user?._id;
                                      const isSigning =
                                        signingFor === emp.user?._id;

                                      return (
                                        <div
                                          key={emp.user?._id || emp.name}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "8px 12px",
                                            borderRadius: 6,
                                            background: isCurrentUser
                                              ? "#fef3c7"
                                              : C.white,
                                            border: `1px solid ${
                                              isCurrentUser
                                                ? "#f59e0b"
                                                : C.border
                                            }`,
                                            flexWrap: "wrap",
                                            gap: 6,
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 8,
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: "50%",
                                                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                                                color: "#fff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 11,
                                                fontWeight: 700,
                                              }}
                                            >
                                              {emp.name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                              <div
                                                style={{
                                                  fontWeight: 600,
                                                  fontSize: 12,
                                                  color: C.dark,
                                                }}
                                              >
                                                {emp.name}
                                                {isCurrentUser && (
                                                  <span
                                                    style={{
                                                      marginLeft: 4,
                                                      fontSize: 8,
                                                      background:
                                                        C.primary + "15",
                                                      color: C.primary,
                                                      padding: "1px 6px",
                                                      borderRadius: 8,
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    {t.you || "You"}
                                                  </span>
                                                )}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: 10,
                                                  color: C.muted,
                                                }}
                                              >
                                                {emp.email ||
                                                  t.noEmail ||
                                                  "No email"}
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
                                            {isSigning ? (
                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  alignItems: "flex-end",
                                                  gap: 4,
                                                  maxWidth: "180px",
                                                }}
                                              >
                                                <SignatureCanvas
                                                  onSave={(data) =>
                                                    setMySignature(data)
                                                  }
                                                  height={40}
                                                  width={180}
                                                  label=""
                                                />
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    gap: 4,
                                                  }}
                                                >
                                                  <button
                                                    onClick={() =>
                                                      handleSignAttendance(
                                                        emp.user?._id,
                                                      )
                                                    }
                                                    style={{
                                                      padding: "2px 10px",
                                                      background: C.primary,
                                                      color: "#fff",
                                                      border: "none",
                                                      borderRadius: 4,
                                                      cursor: "pointer",
                                                      fontSize: 10,
                                                      fontWeight: 600,
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 3,
                                                    }}
                                                    aria-label={
                                                      t.confirmSignature ||
                                                      "Confirm signature"
                                                    }
                                                  >
                                                    <FiCheck size={10} />
                                                    {t.confirm || "Confirm"}
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setSigningFor(null);
                                                      setMySignature(null);
                                                    }}
                                                    style={{
                                                      padding: "2px 6px",
                                                      background: "none",
                                                      border: "none",
                                                      cursor: "pointer",
                                                      color: "#999",
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 3,
                                                    }}
                                                    aria-label={
                                                      t.cancelSignature ||
                                                      "Cancel signing"
                                                    }
                                                  >
                                                    <FiX size={12} />
                                                    {t.cancel || "Cancel"}
                                                  </button>
                                                </div>
                                              </div>
                                            ) : isCurrentUser ? (
                                              <button
                                                onClick={() =>
                                                  setSigningFor(emp.user?._id)
                                                }
                                                style={{
                                                  padding: "3px 12px",
                                                  background: "#f59e0b",
                                                  color: "#fff",
                                                  border: "none",
                                                  borderRadius: 4,
                                                  cursor: "pointer",
                                                  fontSize: 10,
                                                  fontWeight: 600,
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 3,
                                                }}
                                                aria-label={
                                                  t.signIn || "Sign in"
                                                }
                                              >
                                                <FiPenTool size={10} />
                                                {t.signIn || "Sign In"}
                                              </button>
                                            ) : (
                                              <span
                                                style={{
                                                  fontSize: 10,
                                                  color: C.muted,
                                                }}
                                              >
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
            </>
          )}

          {/* SIGNED EMPLOYEES SECTION - Collapsible */}
          {filteredSigned.length > 0 && (
            <>
              <div
                onClick={() => setShowSigned(!showSigned)}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#065f46",
                  padding: "8px 14px",
                  background: "#d1fae5",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FiUserCheck size={16} />
                  {t.signedEmployees || "Signed Employees"} (
                  {filteredSigned.length})
                </div>
                {showSigned ? (
                  <FiChevronDown size={16} />
                ) : (
                  <FiChevronRight size={16} />
                )}
              </div>

              {showSigned && (
                <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                  {/* Group signed employees by department */}
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
                        <div key={dept} style={{ marginBottom: 4 }}>
                          <div
                            onClick={() => toggleDepartment(`signed-${dept}`)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 12px",
                              background: "#ecfdf5",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#065f46",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <FiFolder size={14} />
                              {dept} ({deptTotal})
                            </span>
                            {isExpanded ? (
                              <FiChevronDown size={14} />
                            ) : (
                              <FiChevronRight size={14} />
                            )}
                          </div>

                          {isExpanded && (
                            <div style={{ paddingLeft: 12, marginTop: 4 }}>
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
                                          gap: 4,
                                          fontSize: 11,
                                          color: "#065f46",
                                          padding: "4px 8px",
                                          fontWeight: 600,
                                          opacity: 0.7,
                                        }}
                                      >
                                        <FiBriefcase size={12} />
                                        {position} ({employees.length})
                                      </div>
                                      <div style={{ display: "grid", gap: 4 }}>
                                        {employees.map((emp) => (
                                          <div
                                            key={emp.user?._id || emp.name}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              padding: "8px 12px",
                                              borderRadius: 6,
                                              background: "#f0fdf4",
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
                                                gap: 8,
                                              }}
                                            >
                                              <div
                                                style={{
                                                  width: 28,
                                                  height: 28,
                                                  borderRadius: "50%",
                                                  background: `linear-gradient(135deg, #10b981, #34d399)`,
                                                  color: "#fff",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  fontSize: 11,
                                                  fontWeight: 700,
                                                }}
                                              >
                                                {emp.name?.charAt(0) || "?"}
                                              </div>
                                              <div>
                                                <div
                                                  style={{
                                                    fontWeight: 600,
                                                    fontSize: 12,
                                                    color: C.dark,
                                                  }}
                                                >
                                                  {emp.name}
                                                  {emp.user?._id ===
                                                    user?._id && (
                                                    <span
                                                      style={{
                                                        marginLeft: 4,
                                                        fontSize: 8,
                                                        background:
                                                          C.primary + "15",
                                                        color: C.primary,
                                                        padding: "1px 6px",
                                                        borderRadius: 8,
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {t.you || "You"}
                                                    </span>
                                                  )}
                                                </div>
                                                <div
                                                  style={{
                                                    fontSize: 10,
                                                    color: C.muted,
                                                  }}
                                                >
                                                  {emp.email ||
                                                    t.noEmail ||
                                                    "No email"}
                                                </div>
                                              </div>
                                            </div>
                                            <span
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                                color: "#065f46",
                                                fontSize: 11,
                                                fontWeight: 600,
                                              }}
                                            >
                                              <FiCheck size={14} />{" "}
                                              {t.signed || "Signed"}
                                              {emp.checkedInAt && (
                                                <span
                                                  style={{
                                                    fontSize: 9,
                                                    color: C.muted,
                                                    fontWeight: 400,
                                                  }}
                                                >
                                                  at{" "}
                                                  {new Date(
                                                    emp.checkedInAt,
                                                  ).toLocaleTimeString()}
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
              )}
            </>
          )}
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
}
