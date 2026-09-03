// frontend/src/components/golden-monday/SignatureModal.jsx
// Full-screen signature capture modal for Golden Monday attendance - ENHANCED

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { C, F } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiX,
  FiPenTool,
  FiCheck,
  FiUser,
  FiBriefcase,
  FiMail,
  FiRefreshCw,
  FiAward,
  FiClock,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";

export default function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  employee,
  sessionName,
}) {
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [textSignature, setTextSignature] = useState("");
  const [setIsHovering] = useState(false);
  const [signatureMode, setSignatureMode] = useState("draw"); // "draw" | "text"

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#1a3aad";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

  // Get canvas coordinates
  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDrawing = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const { x, y } = getCanvasCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      setHasSignature(true);
      setSignatureMode("draw");
    },
    [getCanvasCoords],
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawing) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const { x, y } = getCanvasCoords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, getCanvasCoords],
  );

  const stopDrawing = useCallback(
    (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      setIsDrawing(false);
      if (hasSignature) {
        const canvas = canvasRef.current;
        if (canvas) {
          setSignatureData(canvas.toDataURL("image/png"));
        }
      }
    },
    [isDrawing, hasSignature],
  );

  const clearSignature = useCallback(() => {
    setHasSignature(false);
    setSignatureData(null);
    setTextSignature("");

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#1a3aad";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    setSignatureMode("draw");
  }, []);

  const handleTextSignature = useCallback((e) => {
    const text = e.target.value;
    setTextSignature(text);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (text.trim()) {
      const fontSize = Math.min(
        (canvas.width / Math.max(text.length, 1)) * 1.2,
        48,
      );
      ctx.font = `${fontSize}px 'Noto Sans Ethiopic', 'Segoe UI', 'Arial', serif`;
      ctx.fillStyle = "#1a3aad";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text.trim(), canvas.width / 2, canvas.height / 2);
      setHasSignature(true);
      setSignatureData(canvas.toDataURL("image/png"));
      setSignatureMode("text");
    } else {
      setHasSignature(false);
      setSignatureData(null);
      setSignatureMode("draw");
    }
  }, []);

  const handleConfirm = useCallback(() => {
    console.log("📝 [SIGNATURE MODAL] Confirm clicked");
    console.log("📝 [SIGNATURE MODAL] hasSignature:", !!signatureData);
    console.log(
      "📝 [SIGNATURE MODAL] signatureData length:",
      signatureData?.length || 0,
    );

    if (signatureData) {
      console.log(
        "📝 [SIGNATURE MODAL] Signature is data URL:",
        signatureData.startsWith("data:image"),
      );
      onConfirm(signatureData);
    } else {
      console.log("📝 [SIGNATURE MODAL] No signature - confirming without");
      onConfirm(null);
    }
  }, [signatureData, onConfirm]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return createPortal(
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
        padding: "20px",
        animation: "modalFadeIn 0.3s ease",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "clamp(24px, 4vw, 40px)",
          maxWidth: 600,
          width: "100%",
          maxHeight: "95vh",
          overflow: "auto",
          boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          position: "relative",
          animation: "modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
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
            background: `linear-gradient(90deg, ${C.primary}, ${C.gold}, ${C.primary})`,
            backgroundSize: "200% 100%",
            animation: "gradientMove 3s ease-in-out infinite",
          }}
        />

        {/* Close Button - Enhanced */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            color: "#999",
            padding: "6px",
            borderRadius: "50%",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#999";
            e.currentTarget.style.transform = "scale(1)";
          }}
          aria-label="Close"
        >
          <FiX size={22} />
        </button>

        {/* Header - Enhanced */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 28,
              color: "#fff",
              boxShadow: `0 8px 32px ${C.primary}44`,
              animation: "pulseRing 2s ease-in-out infinite",
            }}
          >
            <FiPenTool size={28} />
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 3vw, 26px)",
              fontWeight: 800,
              color: C.dark,
              margin: "0 0 4px",
              fontFamily: F.serif,
            }}
          >
            {t.pleaseSignYourAttendance || "Please Sign Your Attendance"}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: C.muted,
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiClock size={14} />
            {sessionName || "Golden Monday Session"}
          </p>
        </div>

        {/* Employee Info - Enhanced */}
        {employee && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "6px 14px",
              padding: "14px 20px",
              background: `linear-gradient(135deg, ${C.primary}06, ${C.gold}06)`,
              borderRadius: 12,
              marginBottom: 20,
              border: `1px solid ${C.primary}15`,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
                gridRow: "span 2",
                flexShrink: 0,
                boxShadow: `0 4px 12px ${C.primary}33`,
              }}
            >
              {getInitials(employee.name)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: C.dark,
                fontWeight: 600,
              }}
            >
              <FiUser size={16} color={C.primary} />
              {employee.name || "Unknown"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: C.muted,
                flexWrap: "wrap",
              }}
            >
              <FiBriefcase size={14} />
              {employee.department || "No department"}
              <span style={{ opacity: 0.3 }}>|</span>
              <FiMail size={14} />
              {employee.email || "No email"}
            </div>
          </div>
        )}

        {/* Signature Mode Toggle - Enhanced */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 14,
            background: C.bg,
            borderRadius: 10,
            padding: "4px",
            border: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={() => {
              setSignatureMode("draw");
              if (!hasSignature) {
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext("2d");
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
              }
            }}
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: signatureMode === "draw" ? C.primary : "transparent",
              color: signatureMode === "draw" ? "#fff" : C.muted,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiPenTool size={14} />
            {t.drawSignature || "Draw"}
          </button>
          <button
            onClick={() => {
              setSignatureMode("text");
              if (textSignature.trim()) {
                handleTextSignature({ target: { value: textSignature } });
              }
            }}
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: signatureMode === "text" ? C.primary : "transparent",
              color: signatureMode === "text" ? "#fff" : C.muted,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiCheck size={14} />
            {t.typeSignature || "Type"}
          </button>
        </div>

        {/* Signature Canvas - Enhanced */}
        <div
          style={{
            position: "relative",
            border: `3px solid ${hasSignature ? C.primary : C.border}`,
            borderRadius: 14,
            overflow: "hidden",
            background: hasSignature ? "#f8faff" : "#fafbfc",
            transition: "all 0.3s ease",
            marginBottom: 14,
            boxShadow: hasSignature ? `0 0 0 4px ${C.primary}15` : "none",
          }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={220}
            style={{
              width: "100%",
              height: "220px",
              cursor: isTouchDevice ? "pointer" : "crosshair",
              touchAction: "none",
              display: "block",
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          />

          {/* Animated placeholder */}
          {!hasSignature && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                color: "#bbb",
                fontSize: 14,
                flexDirection: "column",
                gap: 6,
              }}
            >
              <FiPenTool size={32} style={{ opacity: 0.3 }} />
              <span>
                {isTouchDevice
                  ? t.touchToSign || "Touch to sign"
                  : t.clickToSign || "Click to sign"}
              </span>
              {signatureMode === "text" && textSignature.trim() && (
                <span style={{ fontSize: 11, color: C.primary, opacity: 0.7 }}>
                  {t.signatureRecorded || "✓ Signature recorded"}
                </span>
              )}
            </div>
          )}

          {/* Signature indicator - Enhanced */}
          {hasSignature && (
            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: 14,
                fontSize: 11,
                color: C.primary,
                fontWeight: 600,
                background: "rgba(255,255,255,0.95)",
                padding: "4px 14px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${C.primary}22`,
              }}
            >
              <FiCheckCircle size={14} color="#10b981" />
              {signatureMode === "text"
                ? t.signatureRecorded || "✓ Signature recorded"
                : t.signed || "Signed"}
            </div>
          )}

          {/* Clear button - Enhanced */}
          {hasSignature && (
            <button
              onClick={clearSignature}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.9)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.15)";
                e.currentTarget.style.background = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(239,68,68,0.9)";
              }}
              aria-label={t.clearSignature || "Clear signature"}
            >
              <FiRefreshCw size={16} />
            </button>
          )}

          {/* Drawing indicator */}
          {isDrawing && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 14,
                fontSize: 10,
                color: C.primary,
                fontWeight: 600,
                background: "rgba(255,255,255,0.9)",
                padding: "2px 12px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
                border: `1px solid ${C.primary}22`,
              }}
            >
              <FiPenTool size={12} />
              {t.drawing || "Drawing..."}
            </div>
          )}
        </div>

        {/* Text Signature Input - Enhanced */}
        {signatureMode === "text" && (
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={textSignature}
              onChange={handleTextSignature}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `2px solid ${textSignature.trim() ? C.primary : C.border}`,
                borderRadius: 10,
                fontSize: 15,
                fontFamily: F.sans,
                outline: "none",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
                background: textSignature.trim() ? `${C.primary}04` : C.white,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.boxShadow = `0 0 0 4px ${C.primary}22`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = textSignature.trim()
                  ? C.primary
                  : C.border;
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder={t.typeNameToSign || "Type your full name to sign"}
              aria-label={t.typeSignature || "Type your signature"}
              autoFocus={signatureMode === "text"}
            />
            {textSignature.trim() && (
              <div
                style={{
                  fontSize: 11,
                  color: C.primary,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiCheck size={14} />
                {t.signatureVerified || "✓ Signature verified"}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Enhanced */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: `2px solid ${C.border}`,
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "10px 28px",
              borderRadius: 10,
              border: `2px solid ${C.border}`,
              background: "transparent",
              color: C.dark,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {t.cancel || "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "10px 32px",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: `0 4px 16px ${C.primary}44`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03) translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 28px ${C.primary}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1) translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}44`;
            }}
          >
            <FiCheck size={18} />
            {t.confirm || "Confirm"}
          </button>
        </div>

        {/* Footer - Enhanced */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${C.border}33`,
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: C.muted,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiShield size={12} />
            {t.signatureVerificationNotice ||
              "Your signature will be recorded and attached to this session's attendance record."}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 9,
              color: C.muted,
              opacity: 0.5,
            }}
          >
            <FiAward size={10} color={C.gold} />
            Golden Monday
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 8px 32px ${C.primary}44; }
          50% { box-shadow: 0 8px 48px ${C.primary}66; }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
