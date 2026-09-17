// frontend/src/components/golden-monday/QRCheckIn.jsx
// QR Check-In card — supports these modes:
//   • Admin:    "Show Session QR"  (employees scan this)
//   • Admin:    "Scan Employee QR" (camera)
//   • Admin:    "Manage Check-ins" (undo a scan for re-testing)
//   • Employee: "Scan Session QR"  (camera) + "Show My QR"
//
// ⚠️ WHITE-SCREEN FIX (read before editing the scanner):
// html5-qrcode injects and destroys its own DOM (<video>, overlay, canvas)
// inside the element it is given, and clear() does `element.innerHTML = ""`.
// Previously that element was rendered by React. When the modal closed in the
// same tick the library was tearing down, React's commit phase tried to
// removeChild a node the library had already detached → NotFoundError thrown
// during commit → React 18 unmounts the whole root → blank white page with
// nothing in the console. Two structural rules now prevent that:
//   1. The scanner's host element is created with document.createElement and
//      appended to a React wrapper that has NO React children. React never
//      tracks the host, so React can never try to remove a node the library
//      already removed. We detach the host ourselves during teardown.
//   2. The camera is fully stopped BEFORE the parent is asked to close the
//      modal, so unmount and library teardown can never overlap.
import { useState, useEffect, useRef, useCallback, Component } from "react";
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
  FiUsers,
} from "react-icons/fi";
import { RiQrCodeLine } from "react-icons/ri";

// ─────────────────────────────────────────────────────────────
// Safe helpers — never let a shape change from the API throw
// during render. Every list we map over goes through this.
// ─────────────────────────────────────────────────────────────
const safeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.data))
    return data.data;
  return [];
};

const safeInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const safeTime = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────────
// Local error boundary.
// A boundary cannot catch errors thrown from async callbacks, which is why
// the scanner race is fixed structurally above — but it DOES catch commit
// and render phase failures, so a future regression shows a readable card
// instead of unmounting the whole application. The fallback is on-screen,
// not console-only, because mobile Safari/Chrome swallow console output.
// ─────────────────────────────────────────────────────────────
class QRErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: (error && error.message) || "Unexpected error",
    };
  }

  componentDidCatch(error, info) {
    console.error("[QRCheckIn] crashed:", error, info);
  }

  handleRetry() {
    this.setState({ hasError: false, message: "" });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: C.white,
            borderRadius: 20,
            padding: "22px 20px",
            border: "1px solid #fecaca",
            fontFamily: F.sans,
            textAlign: "center",
          }}
        >
          <FiAlertTriangle size={28} color="#dc2626" />
          <p
            style={{
              margin: "10px 0 4px",
              fontSize: 14,
              fontWeight: 700,
              color: C.dark,
            }}
          >
            QR check-in is temporarily unavailable
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
            {this.state.message}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: 14,
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: C.primary,
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: F.sans,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Camera Scanner Modal (reusable for admin & employee) ───
function QRScannerModal({ isOpen, onClose, onDecoded, title, hint, t }) {
  // React owns ONLY this wrapper. It never receives React children, so React
  // has nothing inside it to reconcile or remove.
  const wrapperRef = useRef(null);
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);

  // Handlers live in refs so that changing their identity (the parent passes
  // an inline arrow for onClose) can never re-trigger the camera effect.
  // The old dependency array [isOpen, onDecoded, onClose, containerId]
  // restarted the scanner on EVERY parent re-render, which is what made the
  // teardown race fire reliably on phones.
  const onDecodedRef = useRef(onDecoded);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    let hostEl = null;
    let handled = false;

    const setErrorSafe = (value) => {
      if (!cancelled && mountedRef.current) setError(value);
    };
    const setStartingSafe = (value) => {
      if (!cancelled && mountedRef.current) setStarting(value);
    };

    // Stop the camera and detach the host element ourselves. Because the host
    // was created imperatively, removing it here is the ONLY removal that ever
    // happens for that node — React is not involved and cannot double-remove.
    const teardown = async () => {
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance) {
        try {
          await instance.stop();
        } catch {
          /* already stopped / never started — safe to ignore */
        }
        try {
          instance.clear();
        } catch {
          /* container may already be gone — safe to ignore */
        }
      }
      if (hostEl && hostEl.parentNode) {
        try {
          hostEl.parentNode.removeChild(hostEl);
        } catch {
          /* ignore */
        }
      }
      hostEl = null;
    };

    const start = async () => {
      try {
        setStartingSafe(true);
        setErrorSafe(null);

        const wrapper = wrapperRef.current;
        if (!wrapper || cancelled) return;

        hostEl = document.createElement("div");
        hostEl.id = `qr-host-${Math.random().toString(36).slice(2, 9)}`;
        hostEl.style.width = "100%";
        hostEl.style.minHeight = "300px";
        hostEl.style.borderRadius = "14px";
        hostEl.style.overflow = "hidden";
        hostEl.style.background = "#000";
        wrapper.appendChild(hostEl);

        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) {
          await teardown();
          return;
        }

        const instance = new Html5Qrcode(hostEl.id);
        scannerRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (handled || cancelled) return;
            handled = true;
            // Release the camera and detach our host FIRST, then hand the
            // payload up and close. Ordering is what removes the race: by the
            // time React unmounts this modal there is no library-owned DOM
            // left to collide with.
            teardown()
              .catch(() => {})
              .then(() => {
                try {
                  if (onDecodedRef.current) onDecodedRef.current(decodedText);
                } catch (cbErr) {
                  console.error("[QRScannerModal] onDecoded threw:", cbErr);
                }
                try {
                  if (onCloseRef.current) onCloseRef.current();
                } catch (closeErr) {
                  console.error("[QRScannerModal] onClose threw:", closeErr);
                }
              });
          },
          () => {
            /* per-frame decode failures are normal — ignore */
          },
        );

        setStartingSafe(false);
      } catch (err) {
        console.error("Camera start failed:", err);
        setStartingSafe(false);
        await teardown();
        if (
          err?.name === "NotAllowedError" ||
          err?.message?.includes("Permission")
        ) {
          setErrorSafe(
            t?.qrCameraPermissionDenied ||
              "Camera permission denied. Please allow camera access in your browser settings.",
          );
        } else if (
          err?.name === "NotFoundError" ||
          err?.message?.includes("NotFoundError")
        ) {
          setErrorSafe(
            t?.qrCameraNotFound || "No camera found on this device.",
          );
        } else {
          setErrorSafe(
            err?.message || t?.qrCameraOpenFailed || "Failed to open camera.",
          );
        }
      }
    };

    const timer = setTimeout(start, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      teardown();
    };
    // Deliberately depends on isOpen only — see the refs above.
  }, [isOpen, t]);

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
                {title || t?.qrScannerDefaultTitle || "Scan QR Code"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
                {hint ||
                  t?.qrScannerDefaultHint ||
                  "Point the camera at the QR code"}
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
                {t?.qrCameraCloseBtn || "Close"}
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* React-owned wrapper with NO React children. html5-qrcode's
                  host node is appended here imperatively and removed by us. */}
              <div
                ref={wrapperRef}
                style={{
                  width: "100%",
                  minHeight: 300,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#000",
                }}
              />
              {starting && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.7)",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    flexDirection: "column",
                    gap: 12,
                    pointerEvents: "none",
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
                  <span style={{ fontSize: 13 }}>
                    {t?.qrCameraStarting || "Starting camera…"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ─── Big QR Display Modal (admin shows, or employee shows own) ───
function QRLargeModal({ isOpen, onClose, qrCode, title, subtitle, hint }) {
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

          {/* qrCode can legitimately be null while it loads — render a
              placeholder instead of a broken <img>. */}
          <div
            style={{
              display: "inline-block",
              padding: 12,
              borderRadius: 16,
              background: "#fff",
              border: `3px solid ${C.primary}`,
              boxShadow: `0 0 0 6px ${C.primary}15`,
              minWidth: 160,
              minHeight: 160,
            }}
          >
            {qrCode ? (
              <img
                src={qrCode}
                alt="QR Code"
                style={{
                  width: "min(100%, 320px)",
                  height: "auto",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 200,
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 10,
                  color: C.muted,
                }}
              >
                <FiRefreshCw
                  size={26}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <span style={{ fontSize: 12 }}>Generating QR code…</span>
              </div>
            )}
          </div>

          {hint && (
            <p
              style={{
                marginTop: 16,
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              {hint}
            </p>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ─── Success confirmation (employee + admin scan) ───────────
// Rendered from the richer backend payload. All numbers pass through
// safeInt so a string or missing field can never throw during render.
function CheckInSuccessModal({ isOpen, onClose, info, t }) {
  if (!isOpen || !info) return null;

  const already = Boolean(info.already);
  const rank = safeInt(info.rank);
  const total = safeInt(info.totalCheckedIn);
  const eligible = safeInt(info.totalEligible);
  const time = safeTime(info.checkedInAt);

  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
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
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 22,
            padding: "28px 24px 24px",
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
            fontFamily: F.sans,
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 14,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#999",
              padding: 6,
            }}
          >
            <FiX size={20} />
          </button>

          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              margin: "0 auto",
              background: already ? `${C.gold}22` : "#d1fae5",
              color: already ? "#92400e" : "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "qr-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <FiCheckCircle size={40} />
          </div>

          <h3
            style={{
              margin: "16px 0 4px",
              fontSize: 20,
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.serif,
            }}
          >
            {already
              ? t?.alreadyCheckedIn || "Already Checked In"
              : t?.checkInSuccess || "✅ Check-in successful!"}
          </h3>

          {info.name && (
            <p style={{ margin: "0 0 2px", fontSize: 14, color: C.dark }}>
              {info.name}
            </p>
          )}
          {info.department && (
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
              {info.department}
            </p>
          )}
          {info.sessionTitle && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: C.muted }}>
              {info.sessionTitle}
            </p>
          )}

          {(total !== null || rank !== null || time) && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                background: C.bg,
                borderRadius: 12,
                display: "flex",
                justifyContent: "center",
                gap: 22,
                flexWrap: "wrap",
              }}
            >
              {total !== null && (
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: C.primary,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      justifyContent: "center",
                    }}
                  >
                    <FiUsers size={16} />
                    {eligible !== null ? `${total}/${eligible}` : total}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {t?.present || "Present"}
                  </div>
                </div>
              )}
              {rank !== null && (
                <div>
                  <div
                    style={{ fontSize: 20, fontWeight: 800, color: C.primary }}
                  >
                    #{rank}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {t?.checkIn || "Check In"}
                  </div>
                </div>
              )}
              {time && (
                <div>
                  <div
                    style={{ fontSize: 20, fontWeight: 800, color: C.primary }}
                  >
                    {time}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {t?.uploadedAt || "Time"}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "11px 20px",
              borderRadius: 12,
              border: "none",
              background: C.primary,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: F.sans,
            }}
          >
            {t?.close || "Close"}
          </button>
        </div>
      </div>
    </Portal>
  );
}

// ─── Admin: Un-sign / roll back a check-in ──────────────────
function UndoCheckInModal({
  isOpen,
  onClose,
  attendees,
  sessionId,
  onUndone,
  t,
}) {
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("");

  const handleUndo = useCallback(
    async (userId, name) => {
      if (!userId) return;
      setBusyId(userId);
      try {
        await goldenMondayAPI.undoQRCheckIn(sessionId, userId);
        showToast(`↩️ ${name}'s check-in removed`, "success");
        if (onUndone) {
          try {
            await onUndone();
          } catch (refreshErr) {
            // A parent refresh failure must never bubble out of a click
            // handler — an unhandled rejection here would surface as an
            // unexplained failure on mobile.
            console.error("[UndoCheckIn] onUndone threw:", refreshErr);
          }
        }
      } catch (err) {
        console.error("[UndoCheckIn] failed:", err);
        showToast(
          err.response?.data?.error || "Failed to undo check-in",
          "error",
        );
      } finally {
        setBusyId(null);
      }
    },
    [sessionId, onUndone],
  );

  if (!isOpen) return null;

  const list = safeArray(attendees);
  const filtered = list.filter((a) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      (a?.name || "").toLowerCase().includes(q) ||
      (a?.email || "").toLowerCase().includes(q) ||
      (a?.department || "").toLowerCase().includes(q)
    );
  });

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
              fontFamily: F.sans,
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
                {list.length === 0
                  ? "No one is checked in yet."
                  : "No matches for your filter."}
              </div>
            ) : (
              filtered.map((a, idx) => {
                const rowId =
                  a?.userId || a?.user?._id || a?._id || `row-${idx}`;
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
                      {(a?.name || "?").charAt(0)}
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
                        {a?.name || t?.unknown || "Unknown"}
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
                        {a?.department ? `${a.department} · ` : ""}
                        {safeTime(a?.checkedInAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndo(rowId, a?.name || "this user")}
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
function QRCheckInCard({ sessionId, onCheckIn }) {
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

  // Success confirmation state (built from the richer backend payload)
  const [successInfo, setSuccessInfo] = useState(null);

  // Undo / manage check-ins (admin only)
  const [undoModalOpen, setUndoModalOpen] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Stable close handler. Passing an inline arrow here previously changed the
  // scanner effect's dependency identity on every render and restarted the
  // camera mid-scan — the trigger for the teardown race.
  const closeScanner = useCallback(() => setScannerOpen(false), []);

  // ─── Load checked-in attendees (admin) ───
  const loadAttendees = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoadingAttendees(true);
      const res = await goldenMondayAPI.getAttendance(sessionId);
      const checkedIn = safeArray(res?.data?.attendance).filter(
        (a) => a && a.attended,
      );
      setAttendees(checkedIn);
    } catch (err) {
      console.error("[QRCheckIn] loadAttendees failed:", err);
      setAttendees([]);
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
      if (res?.data?.qrCode) setSessionQR(res.data.qrCode);
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
      if (res?.data?.qrCode) setMyQR(res.data.qrCode);
    } catch (err) {
      console.error("Failed to load my QR:", err);
      showToast(err.response?.data?.error || "Failed to load your QR", "error");
    } finally {
      setLoadingMyQR(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin || !sessionId) return undefined;
    const timer = setTimeout(() => {
      loadSessionQR();
    }, 0);
    return () => clearTimeout(timer);
  }, [isAdmin, sessionId, loadSessionQR]);

  // Shared: notify the parent without ever letting its failure escape.
  // refreshData() is an async function; an unhandled rejection from it inside
  // a scan handler is exactly the kind of silent failure that is impossible
  // to diagnose on a phone.
  const notifyParent = useCallback(async () => {
    if (!onCheckIn) return;
    try {
      await onCheckIn();
    } catch (refreshErr) {
      console.error("[QRCheckIn] onCheckIn threw:", refreshErr);
    }
  }, [onCheckIn]);

  // ─── Handle employee scanning admin's session QR ───
  const handleEmployeeScan = useCallback(
    async (decodedText) => {
      try {
        setSubmitting(true);
        let payload;
        try {
          payload = JSON.parse(decodedText);
        } catch {
          showToast(
            t.qrInvalidNotSessionShort ||
              "Invalid QR code — not a session code",
            "error",
          );
          return;
        }
        if (payload?.type !== "gm-session-checkin" || !payload?.sessionId) {
          showToast(
            t.qrInvalidNotSession ||
              "This QR is not a Golden Monday session code",
            "error",
          );
          return;
        }

        const res = await goldenMondayAPI.recordQRCheckIn(payload.sessionId, {
          location: "qr-scan",
        });
        const data = res?.data || {};

        setSuccessInfo({
          name: data.employee?.name || user?.name || "",
          department: data.employee?.department || "",
          sessionTitle:
            data.session?.presentationTitle || data.session?.title || "",
          checkedInAt: data.attendance?.checkedInAt || null,
          rank: data.summary?.yourRank,
          totalCheckedIn: data.summary?.totalCheckedIn,
          totalEligible: data.summary?.totalEligible,
          already: Boolean(data.summary?.alreadyCheckedIn),
        });

        showToast(
          data.summary?.alreadyCheckedIn
            ? t.qrAlreadyCheckedInShort ||
                "You've already checked in to this session"
            : t.checkInSuccess || "✅ Checked in successfully!",
          data.summary?.alreadyCheckedIn ? "info" : "success",
        );

        await notifyParent();
      } catch (err) {
        console.error("Employee check-in failed:", err);
        const msg =
          err.response?.data?.error || t.checkInError || "Check-in failed";
        if (err.response?.data?.alreadyCheckedIn) {
          showToast(
            t.qrAlreadyCheckedInShort ||
              "You've already checked in to this session",
            "info",
          );
        } else {
          showToast(msg, "error");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [notifyParent, t, user],
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
        const data = res?.data || {};
        const name = data.employee?.name || t.staff || "Employee";

        setSuccessInfo({
          name,
          department: data.employee?.department || "",
          sessionTitle:
            data.session?.presentationTitle || data.session?.title || "",
          checkedInAt: data.attendance?.checkedInAt || null,
          rank: data.summary?.yourRank,
          totalCheckedIn: data.summary?.totalCheckedIn,
          totalEligible: data.summary?.totalEligible,
          already: Boolean(data.summary?.alreadyCheckedIn),
        });

        showToast(`✅ ${name} checked in successfully!`, "success");
        await notifyParent();
      } catch (err) {
        console.error("Admin scan failed:", err);
        showToast(
          err.response?.data?.error ||
            t.qrCheckInEmployeeFailed ||
            "Failed to check in employee",
          "error",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [sessionId, notifyParent, t],
  );

  // ─── Open the manage-check-ins modal ───
  const handleOpenManage = useCallback(async () => {
    await loadAttendees();
    setUndoModalOpen(true);
  }, [loadAttendees]);

  const handleDecoded = useCallback(
    (text) => {
      if (scannerMode === "admin") {
        handleAdminScan(text);
      } else {
        handleEmployeeScan(text);
      }
    },
    [scannerMode, handleAdminScan, handleEmployeeScan],
  );

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
              ? t.qrHeaderAdminHint ||
                "Show session QR, scan employee QR, or manage check-ins"
              : t.qrHeaderEmployeeHint || "Scan the session QR to check in"}
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
              fontFamily: F.sans,
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
            <span>{t.qrShowSessionQR || "Show Session QR"}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: C.muted,
                textAlign: "center",
              }}
            >
              {t.qrShowSessionQRSub || "Employees scan this to check in"}
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
              fontFamily: F.sans,
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
            <span>{t.qrScanEmployeeQR || "Scan Employee QR"}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: C.muted,
                textAlign: "center",
              }}
            >
              {t.qrScanEmployeeQRSub || "Point camera at employee's QR"}
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
              fontFamily: F.sans,
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
            fontFamily: F.sans,
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
          <span>{t.qrShowMyQR || "Show My QR"}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.muted,
              textAlign: "center",
            }}
          >
            {t.qrShowMyQRSub || "Let the coordinator scan you"}
          </span>
        </button>

        {/* EVERYONE: Scan Session QR (the employee check-in path) */}
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
            fontFamily: F.sans,
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
          <span>{t.qrScanSessionQR || "Scan Session QR"}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.muted,
              textAlign: "center",
            }}
          >
            {t.qrScanSessionQRSub || "Point camera at coordinator's QR"}
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
        {t.qrVerifiedNote ||
          "Identity is verified server-side — no spoofing possible."}
      </div>

      {/* ── Modals ── */}
      <QRLargeModal
        isOpen={showSessionQR}
        onClose={() => setShowSessionQR(false)}
        qrCode={sessionQR}
        title={t.qrSessionModalTitle || "Session Check-In QR"}
        subtitle={
          t.qrSessionModalSub ||
          "Employees scan this to mark themselves present"
        }
        hint={
          t.qrSessionModalHint ||
          '📱 Ask the person to open Golden Monday → "Scan QR" on their phone'
        }
      />

      <QRLargeModal
        isOpen={showMyQR}
        onClose={() => setShowMyQR(false)}
        qrCode={myQR}
        title={t.qrPersonalModalTitle || "Your Personal QR"}
        subtitle={
          t.qrPersonalModalSub || "Show this to the Golden Monday coordinator"
        }
      />

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={closeScanner}
        onDecoded={handleDecoded}
        t={t}
        title={
          scannerMode === "admin"
            ? t.qrScannerTitleEmployee || "Scan Employee's QR"
            : t.qrScannerTitleSession || "Scan Session QR to Check In"
        }
        hint={
          scannerMode === "admin"
            ? t.qrScannerHintEmployee ||
              "Point camera at the employee's personal QR"
            : t.qrScannerHintSession ||
              "Point camera at the coordinator's session QR"
        }
      />

      <CheckInSuccessModal
        isOpen={Boolean(successInfo)}
        onClose={() => setSuccessInfo(null)}
        info={successInfo}
        t={t}
      />

      <UndoCheckInModal
        isOpen={undoModalOpen}
        onClose={() => setUndoModalOpen(false)}
        attendees={attendees}
        sessionId={sessionId}
        t={t}
        onUndone={async () => {
          await loadAttendees();
          await notifyParent();
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
        @keyframes qr-pop {
          0% { transform: scale(0.4); opacity: 0; }
          70% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Public contract is unchanged: QRCheckIn({ sessionId, onCheckIn }).
// The boundary wrapper is invisible to callers.
export default function QRCheckIn({ sessionId, onCheckIn }) {
  return (
    <QRErrorBoundary>
      <QRCheckInCard sessionId={sessionId} onCheckIn={onCheckIn} />
    </QRErrorBoundary>
  );
}
