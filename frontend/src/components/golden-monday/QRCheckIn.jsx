// frontend/src/components/golden-monday/QRCheckIn.jsx
import { useState, useEffect, useRef } from "react";
import { C, F } from "../../styles/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiCheck,
  FiCamera,
  FiRefreshCw,
  FiQrcode,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAward,
  FiShield,
} from "react-icons/fi";

export default function QRCheckIn({ sessionId, onCheckIn }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const [qrCode, setQrCode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // Generate QR code for this session
  useEffect(() => {
    if (!sessionId || !user) return;

    const generateQR = async () => {
      setGenerating(true);
      setError(null);
      try {
        const response = await goldenMondayAPI.generateQRCheckIn(sessionId);
        if (response.data && response.data.qrCode) {
          setQrCode(response.data.qrCode);
        } else {
          // Fallback: generate a simple data URL representation
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            const size = canvas.width;

            // Draw a decorative QR-like pattern
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, size, size);

            // Draw a grid pattern
            const cellSize = size / 10;
            ctx.fillStyle = "#1a3aad";
            for (let row = 0; row < 10; row++) {
              for (let col = 0; col < 10; col++) {
                const x = col * cellSize;
                const y = row * cellSize;
                // Create a pattern that looks like a QR code
                const val = (row * 7 + col * 13 + 5) % 17;
                if (val < 8) {
                  ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
                }
              }
            }

            // Add center icon
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(size * 0.4, size * 0.4, size * 0.2, size * 0.2);
            ctx.fillStyle = "#1a3aad";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("✓", size / 2, size / 2);

            setQrCode(canvas.toDataURL("image/png"));
          }
        }
      } catch (error) {
        console.error("Failed to generate QR:", error);
        setError("Failed to generate QR code");
      } finally {
        setGenerating(false);
      }
    };

    generateQR();
  }, [sessionId, user]);

  const handleCheckIn = async () => {
    if (!sessionId) return;
    setScanning(true);
    setError(null);
    try {
      await goldenMondayAPI.recordAttendance(sessionId, {
        userId: user._id,
        signature: "qr-checkin",
        signatureType: "qr",
      });
      setCheckedIn(true);
      setCheckInTime(new Date());
      showToast(t.checkInSuccess || "✅ Checked in successfully!", "success");
      if (onCheckIn) onCheckIn();
    } catch (error) {
      console.error("Check-in failed:", error);
      setError(error.response?.data?.error || "Check-in failed");
      showToast(t.checkInFailed || "Check-in failed", "error");
    } finally {
      setScanning(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 20,
        padding: "clamp(20px, 3vw, 28px)",
        border: `1px solid ${checkedIn ? "#10b981" : C.border}`,
        fontFamily: F.sans,
        boxShadow: checkedIn
          ? `0 4px 24px rgba(16, 185, 129, 0.15)`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Decorative top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: checkedIn
            ? "linear-gradient(90deg, #10b981, #34d399, #10b981)"
            : `linear-gradient(90deg, ${C.primary}, ${C.gold}, ${C.primary})`,
          backgroundSize: "200% 100%",
          animation: "gradientMove 3s ease-in-out infinite",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: checkedIn
              ? "linear-gradient(135deg, #10b981, #34d399)"
              : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: checkedIn
              ? "0 4px 16px rgba(16, 185, 129, 0.4)"
              : `0 4px 16px ${C.primary}44`,
          }}
        >
          <FiQrcode size={20} />
        </div>
        <div>
          <h4
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.dark }}
          >
            {t.qrCheckIn || "QR Check-In"}
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
            {checkedIn
              ? t.alreadyCheckedIn || "You're all set!"
              : t.scanToCheckIn || "Scan or tap to check in"}
          </p>
        </div>
        {checkedIn && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "#10b981",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#d1fae5",
              padding: "4px 14px",
              borderRadius: 20,
              border: `1px solid #6ee7b7`,
            }}
          >
            <FiCheckCircle size={14} />
            {t.signed || "Checked In"}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        {/* QR Code Display - Enhanced */}
        <div
          style={{
            width: 180,
            height: 180,
            background: "#fff",
            borderRadius: 16,
            border: `3px solid ${checkedIn ? "#10b981" : isHovering ? C.primary : C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "all 0.4s ease",
            boxShadow: checkedIn
              ? "0 0 0 4px rgba(16, 185, 129, 0.15)"
              : isHovering
                ? `0 0 0 4px ${C.primary}15`
                : "none",
            transform: isHovering ? "scale(1.02)" : "scale(1)",
          }}
        >
          {generating ? (
            <div style={{ textAlign: "center", color: C.muted }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: `3px solid ${C.primary}`,
                  borderTopColor: "transparent",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 8px",
                }}
              />
              <span style={{ fontSize: 12 }}>
                {t.generatingQR || "Generating..."}
              </span>
            </div>
          ) : qrCode ? (
            <img
              src={qrCode}
              alt="QR Code"
              style={{
                width: "90%",
                height: "90%",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          ) : (
            <div style={{ textAlign: "center", color: C.muted }}>
              <FiQrcode size={40} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 12, marginTop: 8 }}>No QR available</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            style={{ display: "none" }}
          />

          {/* Animated scan line */}
          {!checkedIn && !generating && qrCode && (
            <div
              style={{
                position: "absolute",
                left: "10%",
                right: "10%",
                height: 2,
                background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`,
                animation: "scanLine 2s ease-in-out infinite",
                opacity: 0.6,
              }}
            />
          )}
        </div>

        {/* User Info - Enhanced */}
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              background: C.bg,
              borderRadius: 10,
              width: "100%",
              border: `1px solid ${C.border}`,
            }}
          >
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
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {user.name?.charAt(0) || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{user.email}</div>
            </div>
            {checkedIn && checkInTime && (
              <div
                style={{
                  fontSize: 11,
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "#d1fae5",
                  padding: "2px 10px",
                  borderRadius: 10,
                }}
              >
                <FiClock size={12} />
                {formatTime(checkInTime)}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              width: "100%",
              padding: "8px 14px",
              background: "#fee2e2",
              borderRadius: 8,
              border: `1px solid #fca5a5`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#dc2626",
            }}
          >
            <FiXCircle size={16} />
            {error}
          </div>
        )}

        {/* Check-in Button - Enhanced */}
        <button
          onClick={handleCheckIn}
          disabled={scanning || checkedIn || !sessionId}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 28px",
            background:
              checkedIn || !sessionId
                ? "#d1d5db"
                : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            cursor:
              scanning || checkedIn || !sessionId ? "not-allowed" : "pointer",
            opacity: scanning || checkedIn || !sessionId ? 0.6 : 1,
            fontWeight: 700,
            fontSize: 15,
            fontFamily: F.sans,
            width: "100%",
            justifyContent: "center",
            transition: "all 0.3s ease",
            boxShadow:
              checkedIn || !sessionId ? "none" : `0 4px 20px ${C.primary}44`,
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (!checkedIn && !scanning && sessionId) {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = `0 6px 28px ${C.primary}66`;
            }
          }}
          onMouseLeave={(e) => {
            if (!checkedIn && !scanning && sessionId) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 20px ${C.primary}44`;
            }
          }}
        >
          {scanning ? (
            <>
              <FiRefreshCw
                size={20}
                style={{ animation: "spin 1s linear infinite" }}
              />
              {t.processing || "Processing..."}
            </>
          ) : checkedIn ? (
            <>
              <FiCheck size={20} />
              {t.alreadyCheckedIn || "Already Checked In"}
            </>
          ) : (
            <>
              <FiCamera size={20} />
              {t.scanToCheckIn || "Scan QR to Check In"}
            </>
          )}
        </button>

        {/* Status Message - Enhanced */}
        <div
          style={{
            width: "100%",
            padding: "8px 14px",
            borderRadius: 8,
            background: checkedIn ? "#d1fae5" : C.bg,
            border: `1px solid ${checkedIn ? "#6ee7b7" : C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: checkedIn ? "#065f46" : C.muted,
            justifyContent: "center",
          }}
        >
          {checkedIn ? (
            <>
              <FiCheckCircle size={16} color="#10b981" />
              {t.checkInSuccess || "✅ Checked in successfully!"}
            </>
          ) : (
            <>
              <FiShield size={16} color={C.primary} />
              {t.showQRToCoordinator ||
                "Show this QR code to the session coordinator"}
            </>
          )}
        </div>

        {/* Session info */}
        {sessionId && (
          <div
            style={{
              width: "100%",
              fontSize: 10,
              color: C.muted,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              paddingTop: 4,
              borderTop: `1px solid ${C.border}33`,
            }}
          >
            <FiAward size={12} color={C.gold} />
            Session ID: {sessionId.slice(0, 8)}...
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scanLine {
          0%, 100% { top: 10%; opacity: 0.3; }
          50% { top: 80%; opacity: 1; }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
