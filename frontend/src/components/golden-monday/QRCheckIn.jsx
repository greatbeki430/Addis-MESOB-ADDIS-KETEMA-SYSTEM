// frontend/src/components/golden-monday/QRCheckIn.jsx
// QR Check-In card — supports three modes:
//   • Admin:    "Show Session QR"  (employees scan this)
//   • Admin:    "Scan Employee QR" (camera)
//   • Admin:    "Manage Check-ins" (undo a scan for re-testing)
//   • Employee: "Scan Session QR"  (camera) + "Show My QR"
import { useState, useEffect, useRef, useCallback } from "react";
import { C, F } from "../../styles/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import { Portal } from "../ui/Portal";
import {
  FiCamera,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiUser,
  FiMaximize2,
  FiRotateCcw,
} from "react-icons/fi";
import { RiQrCodeLine } from "react-icons/ri";

// ─── Camera Scanner Modal (reusable for admin & employee) ───
function QRScannerModal({ isOpen, onClose, onDecoded, title, hint }) {
  const scannerRef = useRef(null);
  const [containerId] = useState(
    () => `qr-scanner-${Math.random().toString(36).slice(2, 9)}`,
  );
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    hasScannedRef.current = false;

    const start = async () => {
      try {
        setStarting(true);
        setError(null);

        const { Html5Qrcode } = await import("html5-qrcode");

        html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            onDecoded(decodedText);
            html5QrCode
              .stop()
              .then(() => html5QrCode.clear())
              .catch(() => {});
            onClose();
          },
          () => {
            /* per-frame decode failures are normal — ignore */
          },
        );
        setStarting(false);
      } catch (err) {
        console.error("Camera start failed:", err);
        setStarting(false);
        if (
          err?.name === "NotAllowedError" ||
          err?.message?.includes("Permission")
        ) {
          setError(
            "Camera permission denied. Please allow camera access in your browser settings.",
          );
        } else if (
          err?.message?.includes("NotFoundError") ||
          err?.name === "NotFoundError"
        ) {
          setError("No camera found on this device.");
        } else {
          setError(err?.message || "Failed to open camera.");
        }
      }
    };

    const timeout = setTimeout(start, 100);

    return () => {
      clearTimeout(timeout);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [isOpen, onDecoded, onClose, containerId]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2147483647,
          padding: 16,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "20px 20px 24px",
            maxWidth: 480,
            width: "100%",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                {title || "Scan QR Code"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
                {hint || "Point the camera at the QR code"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                padding: 6,
                borderRadius: "50%",
              }}
            >
              <FiX size={22} />
            </button>
          </div>

          {error ? (
            <div
              style={{
                padding: "20px 16px",
                background: "#fef2f2",
                borderRadius: 12,
                border: "1px solid #fecaca",
                textAlign: "center",
              }}
            >
              <FiAlertTriangle size={28} color="#dc2626" />
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 13,
                  color: "#991b1b",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  onClose();
                }}
                style={{
                  marginTop: 12,
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div
                id={containerId}
                style={{
                  width: "100%",
                  minHeight: 300,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#000",
                  position: "relative",
                }}
              />
              {starting && (
                <div
                  style={{
                    position: "absolute",
                    inset: "70px 20px 24px",
                    background: "rgba(0,0,0,0.7)",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "3px solid #fff",
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: 13 }}>Starting camera…</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ─── Big QR Display Modal (admin shows, or employee shows own) ───
function QRLargeModal({ isOpen, onClose, qrCode, title, subtitle }) {
  if (!isOpen) return null;
  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2147483647,
          padding: 16,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "24px 24px 28px",
            maxWidth: 480,
            width: "100%",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
            textAlign: "center",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#999",
              padding: 6,
            }}
          >
            <FiX size={22} />
          </button>

          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.serif,
            }}
          >
            {title || "Scan this QR code"}
          </h3>
          {subtitle && (
            <p style={{ margin: "4px 0 16px", fontSize: 13, color: C.muted }}>
              {subtitle}
            </p>
          )}

          <div
            style={{
              display: "inline-block",
              padding: 12,
              borderRadius: 16,
              background: "#fff",
              border: `3px solid ${C.primary}`,
              boxShadow: `0 0 0 6px ${C.primary}15`,
            }}
          >
            <img
              src={qrCode}
              alt="QR Code"
              style={{
                width: "min(100%, 320px)",
                height: "auto",
                display: "block",
              }}
            />
          </div>

          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.5,
            }}
          >
            📱 Ask the person to open Golden Monday → "Scan QR" on their phone
          </p>
        </div>
      </div>
    </Portal>
  );
}

// ─── Admin: Un-sign / roll back a check-in ──────────────────
// Small list modal. Shows all currently checked-in attendees for
// the session. Each row has an "Un-sign" button that calls the
// DELETE endpoint and updates the parent's list in place.
function UndoCheckInModal({ isOpen, onClose, attendees, sessionId, onUndone }) {
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("");

  if (!isOpen) return null;

  const filtered = (attendees || []).filter((a) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.name || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q) ||
      (a.department || "").toLowerCase().includes(q)
    );
  });

  const handleUndo = async (userId, name) => {
    if (!userId) return;
    setBusyId(userId);
    try {
      await goldenMondayAPI.undoQRCheckIn(sessionId, userId);
      showToast(`↩️ ${name}'s check-in removed`, "success");
      if (onUndone) await onUndone();
    } catch (err) {
      console.error("[UndoCheckIn] failed:", err);
      showToast(
        err.response?.data?.error || "Failed to undo check-in",
        "error",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2147483647,
          padding: 16,
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "22px 22px 20px",
            maxWidth: 520,
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                Manage check-ins
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
                Remove a check-in to let that person scan again.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                padding: 6,
              }}
            >
              <FiX size={22} />
            </button>
          </div>

          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name, email, or department"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 10,
            }}
          />

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "30px 16px",
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 13,
                }}
              >
                {attendees && attendees.length === 0
                  ? "No one is checked in yet."
                  : "No matches for your filter."}
              </div>
            ) : (
              filtered.map((a) => {
                const rowId = a.userId || a.user?._id || a._id;
                const isBusy = busyId === rowId;
                return (
                  <div
                    key={rowId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: C.primary,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {(a.name || "?").charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: C.dark,
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.name || "Unknown"}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.department ? `${a.department} · ` : ""}
                        {a.checkedInAt
                          ? new Date(a.checkedInAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndo(rowId, a.name || "this user")}
                      disabled={isBusy}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: isBusy ? C.border : "#dc2626",
                        color: isBusy ? C.muted : "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: isBusy ? "not-allowed" : "pointer",
                        fontFamily: F.sans,
                      }}
                    >
                      <FiRotateCcw size={12} />
                      Un-sign
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Main QRCheckIn Card ───
export default function QRCheckIn({ sessionId, onCheckIn }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const isAdmin =
    ["admin", "superadmin", "leader"].includes(user?.role) ||
    user?.isGoldenMondayAdmin === true;

  const [sessionQR, setSessionQR] = useState(null);
  const [myQR, setMyQR] = useState(null);
  const [loadingSessionQR, setLoadingSessionQR] = useState(false);
  const [loadingMyQR, setLoadingMyQR] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState(null); // "admin" | "employee"
  const [showSessionQR, setShowSessionQR] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Undo / manage check-ins (admin only)
  const [undoModalOpen, setUndoModalOpen] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // ─── Load checked-in attendees (admin) ───
  const loadAttendees = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoadingAttendees(true);
      const res = await goldenMondayAPI.getAttendance(sessionId);
      // getAttendance returns { attendance: [...] } where each row
      // has { userId, name, email, department, attended, checkedInAt }
      const checkedIn = (res.data?.attendance || []).filter((a) => a.attended);
      setAttendees(checkedIn);
    } catch (err) {
      console.error("[QRCheckIn] loadAttendees failed:", err);
      showToast("Failed to load attendees", "error");
    } finally {
      setLoadingAttendees(false);
    }
  }, [sessionId]);

  // ─── Load session QR (admin) ───
  const loadSessionQR = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoadingSessionQR(true);
      const res = await goldenMondayAPI.generateQRCheckIn(sessionId);
      if (res.data?.qrCode) setSessionQR(res.data.qrCode);
    } catch (err) {
      console.error("Failed to load session QR:", err);
      showToast(
        err.response?.data?.error || "Failed to load session QR",
        "error",
      );
    } finally {
      setLoadingSessionQR(false);
    }
  }, [sessionId]);

  // ─── Load MY personal QR (all users) ───
  const loadMyQR = useCallback(async () => {
    try {
      setLoadingMyQR(true);
      const res = await goldenMondayAPI.getMyQR();
      if (res.data?.qrCode) setMyQR(res.data.qrCode);
    } catch (err) {
      console.error("Failed to load my QR:", err);
      showToast(err.response?.data?.error || "Failed to load your QR", "error");
    } finally {
      setLoadingMyQR(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin || !sessionId) return;

    const timer = setTimeout(() => {
      loadSessionQR();
    }, 0);

    return () => clearTimeout(timer);
  }, [isAdmin, sessionId, loadSessionQR]);

  // ─── Handle employee scanning admin's session QR ───
  const handleEmployeeScan = useCallback(
    async (decodedText) => {
      try {
        setSubmitting(true);
        let payload;
        try {
          payload = JSON.parse(decodedText);
        } catch {
          showToast("Invalid QR code — not a session code", "error");
          return;
        }
        if (payload.type !== "gm-session-checkin" || !payload.sessionId) {
          showToast("This QR is not a Golden Monday session code", "error");
          return;
        }
        await goldenMondayAPI.recordQRCheckIn(payload.sessionId, {
          location: "qr-scan",
        });
        showToast("✅ Checked in successfully!", "success");
        if (onCheckIn) onCheckIn();
      } catch (err) {
        console.error("Employee check-in failed:", err);
        const msg = err.response?.data?.error || "Check-in failed";
        // The backend now returns 200 for repeat check-ins, but if a
        // proxy or cache serves an old 400 we still handle it.
        if (err.response?.data?.alreadyCheckedIn) {
          showToast("You've already checked in to this session", "info");
        } else {
          showToast(msg, "error");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [onCheckIn],
  );

  // ─── Handle admin scanning employee's personal QR ───
  const handleAdminScan = useCallback(
    async (decodedText) => {
      try {
        setSubmitting(true);
        const res = await goldenMondayAPI.adminScanQRCheckIn(
          sessionId,
          decodedText,
        );
        const name = res.data?.employee?.name || "Employee";
        showToast(`✅ ${name} checked in successfully!`, "success");
        if (onCheckIn) onCheckIn();
      } catch (err) {
        console.error("Admin scan failed:", err);
        showToast(
          err.response?.data?.error || "Failed to check in employee",
          "error",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [sessionId, onCheckIn],
  );

  // ─── Open the manage-check-ins modal ───
  const handleOpenManage = useCallback(async () => {
    await loadAttendees();
    setUndoModalOpen(true);
  }, [loadAttendees]);

  // ─── Render ───
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 20,
        padding: "clamp(18px, 3vw, 26px)",
        border: `1px solid ${C.border}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        fontFamily: F.sans,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${C.primary}, ${C.gold}, ${C.primary})`,
          backgroundSize: "200% 100%",
          animation: "qr-gm-sweep 4s ease-in-out infinite",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: `0 4px 16px ${C.primary}44`,
            flexShrink: 0,
          }}
        >
          <RiQrCodeLine size={22} />
        </div>
        <div>
          <h4
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.dark }}
          >
            {t.qrCheckIn || "QR Check-In"}
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
            {isAdmin
              ? "Show session QR, scan employee QR, or manage check-ins"
              : "Scan the session QR to check in"}
          </p>
        </div>
      </div>

      {/* Body — adaptive to role */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {/* ADMIN: Show Session QR */}
        {isAdmin && (
          <button
            onClick={() => {
              if (!sessionQR && !loadingSessionQR) loadSessionQR();
              setShowSessionQR(true);
            }}
            disabled={loadingSessionQR || submitting}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "20px 14px",
              borderRadius: 14,
              border: `2px solid ${C.primary}`,
              background: `linear-gradient(135deg, ${C.primary}08, ${C.gold}08)`,
              color: C.primary,
              cursor: loadingSessionQR ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${C.primary}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loadingSessionQR ? (
              <FiRefreshCw
                size={26}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <FiMaximize2 size={26} />
            )}
            <span>Show Session QR</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: C.muted,
                textAlign: "center",
              }}
            >
              Employees scan this to check in
            </span>
          </button>
        )}

        {/* ADMIN: Scan Employee QR */}
        {isAdmin && (
          <button
            onClick={() => {
              setScannerMode("admin");
              setScannerOpen(true);
            }}
            disabled={submitting || !sessionId}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "20px 14px",
              borderRadius: 14,
              border: `2px solid #10b981`,
              background: `linear-gradient(135deg, #10b98108, #34d39908)`,
              color: "#065f46",
              cursor: submitting || !sessionId ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              transition: "all 0.25s ease",
              opacity: !sessionId ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (submitting || !sessionId) return;
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 24px #10b98133`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {submitting && scannerMode === "admin" ? (
              <FiRefreshCw
                size={26}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <FiCamera size={26} />
            )}
            <span>Scan Employee QR</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: C.muted,
                textAlign: "center",
              }}
            >
              Point camera at employee's QR
            </span>
          </button>
        )}

        {/* ADMIN: Manage Check-Ins (undo / un-sign) */}
        {isAdmin && (
          <button
            onClick={handleOpenManage}
            disabled={loadingAttendees || !sessionId}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "20px 14px",
              borderRadius: 14,
              border: `2px solid #f59e0b`,
              background: `linear-gradient(135deg, #f59e0b08, #fbbf2408)`,
              color: "#92400e",
              cursor:
                loadingAttendees || !sessionId ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              transition: "all 0.25s ease",
              opacity: !sessionId ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (loadingAttendees || !sessionId) return;
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 24px #f59e0b33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loadingAttendees ? (
              <FiRefreshCw
                size={26}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <FiRotateCcw size={26} />
            )}
            <span>Manage Check-ins</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: C.muted,
                textAlign: "center",
              }}
            >
              Un-sign someone to retry the scan
            </span>
          </button>
        )}

        {/* EVERYONE: Show My QR (for admin to scan) */}
        <button
          onClick={() => {
            if (!myQR && !loadingMyQR) loadMyQR();
            setShowMyQR(true);
          }}
          disabled={loadingMyQR || submitting}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "20px 14px",
            borderRadius: 14,
            border: `2px solid ${C.gold}`,
            background: `linear-gradient(135deg, ${C.gold}10, ${C.goldLight}10)`,
            color: "#92400e",
            cursor: loadingMyQR ? "wait" : "pointer",
            fontWeight: 700,
            fontSize: 13,
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = `0 8px 24px ${C.gold}44`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {loadingMyQR ? (
            <FiRefreshCw
              size={26}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <FiUser size={26} />
          )}
          <span>Show My QR</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.muted,
              textAlign: "center",
            }}
          >
            Let the coordinator scan you
          </span>
        </button>

        {/* EMPLOYEE-ONLY: Scan Session QR */}
        <button
          onClick={() => {
            setScannerMode("employee");
            setScannerOpen(true);
          }}
          disabled={submitting}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "20px 14px",
            borderRadius: 14,
            border: `2px solid ${C.primary}`,
            background: `linear-gradient(135deg, ${C.primary}08, ${C.gold}08)`,
            color: C.primary,
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: 13,
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            if (submitting) return;
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = `0 8px 24px ${C.primary}33`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {submitting && scannerMode === "employee" ? (
            <FiRefreshCw
              size={26}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <FiCamera size={26} />
          )}
          <span>Scan Session QR</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.muted,
              textAlign: "center",
            }}
          >
            Point camera at coordinator's QR
          </span>
        </button>
      </div>

      {/* Footer hint */}
      <div
        style={{
          marginTop: 14,
          padding: "8px 12px",
          background: C.bg,
          borderRadius: 10,
          fontSize: 11,
          color: C.muted,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <FiCheckCircle size={14} color="#10b981" />
        Identity is verified server-side — no spoofing possible.
      </div>

      {/* ── Modals ── */}
      <QRLargeModal
        isOpen={showSessionQR}
        onClose={() => setShowSessionQR(false)}
        qrCode={sessionQR}
        title="Session Check-In QR"
        subtitle="Employees scan this to mark themselves present"
      />

      <QRLargeModal
        isOpen={showMyQR}
        onClose={() => setShowMyQR(false)}
        qrCode={myQR}
        title="Your Personal QR"
        subtitle="Show this to the Golden Monday coordinator"
      />

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDecoded={
          scannerMode === "admin" ? handleAdminScan : handleEmployeeScan
        }
        title={
          scannerMode === "admin"
            ? "Scan Employee's QR"
            : "Scan Session QR to Check In"
        }
        hint={
          scannerMode === "admin"
            ? "Point camera at the employee's personal QR"
            : "Point camera at the coordinator's session QR"
        }
      />

      <UndoCheckInModal
        isOpen={undoModalOpen}
        onClose={() => setUndoModalOpen(false)}
        attendees={attendees}
        sessionId={sessionId}
        onUndone={async () => {
          await loadAttendees();
          if (onCheckIn) onCheckIn();
        }}
      />

      <style>{`
        @keyframes qr-gm-sweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
