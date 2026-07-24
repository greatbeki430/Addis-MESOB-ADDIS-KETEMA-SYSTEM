// frontend/src/components/golden-monday/AttendancePanel.jsx
// Golden Monday Attendance Panel with signature capture

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
} from "react-icons/fi";

export default function AttendancePanel({ sessionId, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);

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
      ];
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

  const filteredAttendance = attendance.filter((a) => {
    const matchesSearch =
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      filterDepartment === "all" || a.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const total = filteredAttendance.length;
  const attended = filteredAttendance.filter((a) => a.attended).length;
  const absent = total - attended;

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
      ) : filteredAttendance.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: C.muted }}>
          <FiUsers size={32} style={{ opacity: 0.3 }} />
          <p>{t.noEmployeesFound || "No employees found"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filteredAttendance.map((emp) => {
            const isCurrentUser = user?._id === emp.user?._id;
            const isSigned = emp.attended;
            const isSigning = signingFor === emp.user?._id;

            return (
              <div
                key={emp.user?._id || emp.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: isSigned ? "#d1fae5" : C.white,
                  border: `1px solid ${isSigned ? "#6ee7b7" : C.border}`,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {emp.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                    >
                      {emp.name}
                      {isCurrentUser && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 9,
                            background: C.primary + "15",
                            color: C.primary,
                            padding: "1px 8px",
                            borderRadius: 10,
                            fontWeight: 600,
                          }}
                        >
                          {t.you || "You"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {emp.department || t.noDepartment || "No department"} •{" "}
                      {emp.email || t.noEmail || "No email"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isSigned ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "#065f46",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <FiCheck size={14} /> {t.signed || "Signed"}
                    </span>
                  ) : isSigning ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 8,
                        width: "100%",
                        maxWidth: "220px",
                      }}
                    >
                      {/* ✅ Show SignatureCanvas when signing */}
                      <div style={{ width: "100%" }}>
                        <SignatureCanvas
                          onSave={(data) => setMySignature(data)}
                          height={60}
                          width={220}
                          label=""
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleSignAttendance(emp.user?._id)}
                          style={{
                            padding: "4px 12px",
                            background: C.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          aria-label={t.confirmSignature || "Confirm signature"}
                        >
                          <FiCheck size={12} />
                          {t.confirmSignature || "Confirm"}
                        </button>
                        <button
                          onClick={() => {
                            setSigningFor(null);
                            setMySignature(null);
                          }}
                          style={{
                            padding: "4px 8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#999",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          aria-label={t.cancelSignature || "Cancel signing"}
                        >
                          <FiX size={14} />
                          {t.cancelSignature || "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : isCurrentUser ? (
                    <button
                      onClick={() => setSigningFor(emp.user?._id)}
                      style={{
                        padding: "4px 14px",
                        background: "#f59e0b",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      aria-label={t.signIn || "Sign in"}
                    >
                      <FiPenTool size={12} />
                      {t.signIn || "Sign In"}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {t.notSigned || "Not signed"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
