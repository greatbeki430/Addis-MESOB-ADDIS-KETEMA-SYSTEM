// frontend/src/components/golden-monday/QRCheckIn.jsx
import { useState, useEffect, useRef } from "react";
import { C, F } from "../../styles/theme";
import { useAuth } from "../../hooks/useAuth";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { FiGrid, FiCheck, FiCamera, FiRefreshCw } from "react-icons/fi";

// We'll use a simple QR code generation approach
// For production, consider using qrcode.react or similar

export default function QRCheckIn({ sessionId, onCheckIn }) {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [generating, setGenerating] = useState(true);
  const canvasRef = useRef(null);

  // Generate QR code for this session
  useEffect(() => {
    if (!sessionId || !user) return;

    const generateQR = async () => {
      setGenerating(true);
      try {
        // For now, we'll use a simple API endpoint that generates a QR
        // In production, use a proper QR library
        const response = await goldenMondayAPI.generateQRCheckIn(sessionId);
        if (response.data && response.data.qrCode) {
          setQrCode(response.data.qrCode);
        } else {
          // Fallback: generate a simple data URL representation
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            // Simple rendering - in production use qrcode library
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("QR Code", canvas.width / 2, canvas.height / 2);
            ctx.font = "8px monospace";
            ctx.fillText(
              "Tap to check in",
              canvas.width / 2,
              canvas.height / 2 + 20,
            );
            setQrCode(canvas.toDataURL("image/png"));
          }
        }
      } catch (error) {
        console.error("Failed to generate QR:", error);
      } finally {
        setGenerating(false);
      }
    };

    generateQR();
  }, [sessionId, user]);

  const handleCheckIn = async () => {
    if (!sessionId) return;
    setScanning(true);
    try {
      await goldenMondayAPI.recordAttendance(sessionId, {
        userId: user._id,
        signature: "qr-checkin",
        signatureType: "qr",
      });
      setCheckedIn(true);
      showToast("✅ Checked in successfully!", "success");
      if (onCheckIn) onCheckIn();
    } catch (error) {
      console.error("Check-in failed:", error);
      showToast("Check-in failed", "error");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        padding: "20px 24px",
        border: `1px solid ${C.border}`,
        fontFamily: F.sans,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <FiGrid size={24} color={C.primary} />
        <h4 style={{ margin: 0, fontSize: 16, color: C.dark }}>QR Check-In</h4>
        {checkedIn && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "#10b981",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiCheck size={14} /> Checked In
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* QR Code Display */}
        <div
          style={{
            width: 160,
            height: 160,
            background: "#fff",
            borderRadius: 12,
            border: `2px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {generating ? (
            <div style={{ color: C.muted }}>Generating...</div>
          ) : qrCode ? (
            <img
              src={qrCode}
              alt="QR Code"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ color: C.muted }}>No QR available</div>
          )}
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            style={{ display: "none" }}
          />
        </div>

        {/* Check-in Button */}
        <button
          onClick={handleCheckIn}
          disabled={scanning || checkedIn || !sessionId}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 24px",
            background:
              checkedIn || !sessionId
                ? "#d1d5db"
                : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor:
              scanning || checkedIn || !sessionId ? "not-allowed" : "pointer",
            opacity: scanning || checkedIn || !sessionId ? 0.6 : 1,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: F.sans,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {scanning ? (
            <>
              <FiRefreshCw
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Processing...
            </>
          ) : checkedIn ? (
            <>
              <FiCheck size={18} /> Already Checked In
            </>
          ) : (
            <>
              <FiCamera size={18} /> Scan QR to Check In
            </>
          )}
        </button>

        <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
          {checkedIn
            ? "You have successfully checked in for this session."
            : "Show this QR code to the session coordinator or tap to check in."}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
