// frontend/src/components/DigitalAttendance.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { C, F } from "../styles/theme";
import axios from "axios";
import {
  FiSmartphone,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiLogIn,
  FiLogOut,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiList, // Replacing FiHistory with FiList
} from "react-icons/fi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const DigitalAttendance = () => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [location, setLocation] = useState(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const abortControllerRef = useRef(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn("Location access denied:", err);
          setLocation({ manual: true });
        },
      );
    }
  }, []);

  // Fetch attendance history
  const fetchHistory = useCallback(async () => {
    if (!user?._id) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/digital-attendance/history/${user._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          signal: abortControllerRef.current.signal,
        },
      );
      if (response.data.success) {
        setHistory(response.data.data || []);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching history:", error);
      }
    } finally {
      setIsInitialLoad(false);
    }
  }, [user]);

  // Check current attendance status
  const checkCurrentStatus = useCallback(async () => {
    if (!user?._id) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/attendance/current/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (response.data.success && response.data.data) {
        setIsCheckedIn(true);
        setCurrentAttendance(response.data.data);
      } else {
        setIsCheckedIn(false);
        setCurrentAttendance(null);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (user?._id && isInitialLoad) {
      const loadInitialData = async () => {
        await checkCurrentStatus();
        await fetchHistory();
      };
      loadInitialData();
    }
  }, [user?._id, isInitialLoad, checkCurrentStatus, fetchHistory]);

  // Handle digital check-in
  const handleCheckIn = async () => {
    if (!reason) {
      setError("Please provide a reason for digital check-in");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      const response = await axios.post(
        `${API_BASE_URL}/admin/attendance/digital-checkin`,
        {
          userId: user._id,
          teamId: user.team,
          location: location,
          deviceInfo: deviceInfo,
          reason: reason,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      if (response.data.success) {
        setCurrentAttendance(response.data.data);
        setIsCheckedIn(true);
        setReason("");
        setSuccess("✅ Digital check-in successful! Admin has been notified.");
        await fetchHistory();
      }
    } catch (error) {
      setError(
        error.response?.data?.error || "Failed to check in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle digital check-out
  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/attendance/digital-checkout`,
        {
          userId: user._id,
          location: location,
          notes: notes,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      if (response.data.success) {
        setIsCheckedIn(false);
        setCurrentAttendance(null);
        setNotes("");
        setSuccess("✅ Digital check-out successful!");
        await fetchHistory();
      }
    } catch (error) {
      setError(
        error.response?.data?.error || "Failed to check out. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "20px",
        fontFamily: F.sans,
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <FiSmartphone size={28} color={C.primary} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: C.dark }}>
              Digital Attendance
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: C.muted,
              }}
            >
              <FiInfo size={13} style={{ marginRight: 4 }} />
              Backup attendance when biometrics is unavailable
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiXCircle size={18} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: "#dc2626",
              }}
            >
              <FiXCircle size={18} />
            </button>
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#d1fae5",
              color: "#065f46",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiCheckCircle size={18} />
            <span style={{ flex: 1 }}>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: "#065f46",
              }}
            >
              <FiXCircle size={18} />
            </button>
          </div>
        )}

        {/* Status indicator */}
        <div
          style={{
            background: C.bg,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: isCheckedIn ? "#10b981" : "#ef4444",
                display: "inline-block",
              }}
            />
            <span style={{ fontWeight: 600, color: C.dark }}>
              {isCheckedIn ? (
                <>
                  <FiCheckCircle
                    size={16}
                    color="#10b981"
                    style={{ marginRight: 4 }}
                  />
                  Checked In
                </>
              ) : (
                <>
                  <FiXCircle
                    size={16}
                    color="#ef4444"
                    style={{ marginRight: 4 }}
                  />
                  Not Checked In
                </>
              )}
            </span>
          </div>
          {isCheckedIn && currentAttendance && (
            <div
              style={{
                fontSize: 13,
                color: C.muted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiClock size={14} />
              Checked in at:{" "}
              {new Date(currentAttendance.checkIn).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Check-in/out actions */}
        <div style={{ marginBottom: 24 }}>
          {!isCheckedIn ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label
                  htmlFor="reason"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 6,
                    fontSize: 14,
                    color: C.dark,
                  }}
                >
                  Reason for Digital Check-in{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 14,
                    background: C.white,
                  }}
                >
                  <option value="">Select reason...</option>
                  <option value="Biometrics system down">
                    Biometrics system down
                  </option>
                  <option value="Power outage">Power outage</option>
                  <option value="Biometrics machine not working">
                    Biometrics machine not working
                  </option>
                  <option value="Network issue">Network issue</option>
                  <option value="Other">Other</option>
                </select>
                {reason === "Other" && (
                  <input
                    type="text"
                    placeholder="Please specify..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 14,
                      marginTop: 8,
                      background: C.white,
                    }}
                  />
                )}
              </div>
              <button
                onClick={handleCheckIn}
                disabled={loading || !reason}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading || !reason ? "not-allowed" : "pointer",
                  opacity: loading || !reason ? 0.6 : 1,
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <FiClock
                      size={18}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiLogIn size={18} />
                    Digital Check-In
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label
                  htmlFor="notes"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 6,
                    fontSize: 14,
                    color: C.dark,
                  }}
                >
                  Work Summary (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about your work today..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 14,
                    fontFamily: F.sans,
                    background: C.white,
                    resize: "vertical",
                  }}
                />
              </div>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: `linear-gradient(135deg, #f59e0b, #d97706)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <FiClock
                      size={18}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiLogOut size={18} />
                    Digital Check-Out
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Alert banner */}
        <div
          style={{
            background: "#fef3c7",
            border: `1px solid #fcd34d`,
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <FiAlertCircle size={20} color="#92400e" style={{ marginTop: 2 }} />
          <div style={{ fontSize: 13, color: "#92400e" }}>
            <strong>Biometrics Down?</strong>
            <p style={{ margin: "4px 0 0" }}>
              Use digital attendance as backup. Admin will be notified for
              verification.
            </p>
          </div>
        </div>
      </div>

      {/* History section */}
      <div
        style={{
          marginTop: 24,
          background: C.white,
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            cursor: "pointer",
          }}
          onClick={() => setShowHistory(!showHistory)}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              color: C.dark,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiList size={18} /> {/* Changed from FiHistory to FiList */}
            Recent Digital Attendance History
          </h3>
          {showHistory ? (
            <FiChevronUp size={18} />
          ) : (
            <FiChevronDown size={18} />
          )}
        </div>
        {showHistory && (
          <>
            {history.length === 0 ? (
              <p
                style={{
                  color: C.muted,
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                No digital attendance records found
              </p>
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
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          color: C.muted,
                        }}
                      >
                        <FiCalendar size={14} style={{ marginRight: 4 }} />
                        Date
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          color: C.muted,
                        }}
                      >
                        <FiClock size={14} style={{ marginRight: 4 }} />
                        Check In
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          color: C.muted,
                        }}
                      >
                        <FiClock size={14} style={{ marginRight: 4 }} />
                        Check Out
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          color: C.muted,
                        }}
                      >
                        Hours
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          color: C.muted,
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((record) => (
                      <tr
                        key={record._id}
                        style={{ borderBottom: `1px solid ${C.border}44` }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {record.checkIn
                            ? new Date(record.checkIn).toLocaleTimeString()
                            : "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {record.checkOut
                            ? new Date(record.checkOut).toLocaleTimeString()
                            : "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {record.hours ? `${record.hours}h` : "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span
                            style={{
                              padding: "2px 10px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 600,
                              background:
                                record.status === "verified"
                                  ? "#d1fae5"
                                  : record.status === "completed"
                                    ? "#dbeafe"
                                    : record.status === "rejected"
                                      ? "#fee2e2"
                                      : "#fef3c7",
                              color:
                                record.status === "verified"
                                  ? "#065f46"
                                  : record.status === "completed"
                                    ? "#1e40af"
                                    : record.status === "rejected"
                                      ? "#dc2626"
                                      : "#92400e",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {record.status === "verified" && (
                              <FiCheckCircle size={12} />
                            )}
                            {record.status === "completed" && (
                              <FiClock size={12} />
                            )}
                            {record.status === "rejected" && (
                              <FiXCircle size={12} />
                            )}
                            {record.status === "pending_verification" && (
                              <FiAlertCircle size={12} />
                            )}
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {history.length > 10 && (
              <button
                style={{
                  marginTop: 12,
                  padding: "6px 16px",
                  background: "none",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  color: C.muted,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                View All
              </button>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DigitalAttendance;
