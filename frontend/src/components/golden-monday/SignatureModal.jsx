// frontend/src/components/golden-monday/SignatureModal.jsx
// Full-screen signature capture modal for Golden Monday attendance

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

  // Compute touch device directly (no state needed)
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

  // Cleanup on unmount - capture ref value
  useEffect(() => {
    const canvas = canvasRef.current;

    return () => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

  // Get canvas coordinates - FIXED: wrapped in useCallback
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
  }, []); // Empty deps - uses refs which are stable

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
  }, []);

  const handleTextSignature = useCallback((e) => {
    const text = e.target.value;
    setTextSignature(text);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (text.trim()) {
      const fontSize = Math.min((canvas.width / text.length) * 1.2, 48);
      ctx.font = `${fontSize}px 'Noto Sans Ethiopic', 'Segoe UI', 'Arial', serif`;
      ctx.fillStyle = "#1a3aad";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text.trim(), canvas.width / 2, canvas.height / 2);
      setHasSignature(true);
      setSignatureData(canvas.toDataURL("image/png"));
    } else {
      setHasSignature(false);
      setSignatureData(null);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (signatureData) {
      onConfirm(signatureData);
    } else {
      onConfirm(null);
    }
  }, [signatureData, onConfirm]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
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
          borderRadius: 20,
          padding: "clamp(24px, 4vw, 40px)",
          maxWidth: 560,
          width: "100%",
          maxHeight: "95vh",
          overflow: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          position: "relative",
          animation: "modalSlideUp 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            color: "#999",
            padding: "4px",
            borderRadius: "50%",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#999";
          }}
          aria-label="Close"
        >
          <FiX size={24} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              fontSize: 24,
              color: "#fff",
            }}
          >
            <FiPenTool size={24} />
          </div>
          <h2
            style={{
              fontSize: "clamp(18px, 3vw, 24px)",
              fontWeight: 700,
              color: C.dark,
              margin: "0 0 4px",
              fontFamily: F.serif,
            }}
          >
            {t.pleaseSignYourAttendance || "Please Sign Your Attendance"}
          </h2>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            {sessionName || "Golden Monday Session"}
          </p>
        </div>

        {/* Employee Info */}
        {employee && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              padding: "12px 16px",
              background: C.bg,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: C.dark,
              }}
            >
              <FiUser size={14} color={C.muted} />
              <span style={{ fontWeight: 600 }}>
                {employee.name || "Unknown"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: C.dark,
              }}
            >
              <FiBriefcase size={14} color={C.muted} />
              <span>{employee.department || "No department"}</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: C.muted,
                gridColumn: "1 / -1",
              }}
            >
              <FiMail size={14} color={C.muted} />
              <span>{employee.email || "No email"}</span>
            </div>
          </div>
        )}

        {/* Signature Canvas */}
        <div
          style={{
            position: "relative",
            border: `3px solid ${hasSignature ? C.primary : C.border}`,
            borderRadius: 12,
            overflow: "hidden",
            background: "#fafbfc",
            transition: "border-color 0.3s ease",
            marginBottom: 12,
          }}
        >
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            style={{
              width: "100%",
              height: "200px",
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

          {/* Placeholder */}
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
              }}
            >
              <FiPenTool size={20} style={{ marginRight: 10, opacity: 0.5 }} />
              {isTouchDevice
                ? t.touchToSign || "Touch to sign"
                : t.clickToSign || "Click to sign"}
            </div>
          )}

          {/* Signature indicator */}
          {hasSignature && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 12,
                fontSize: 11,
                color: C.primary,
                fontWeight: 600,
                background: "rgba(255,255,255,0.9)",
                padding: "4px 12px",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiCheck size={14} />
              {t.signed || "Signed"}
            </div>
          )}

          {/* Clear button */}
          {hasSignature && (
            <button
              onClick={clearSignature}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
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
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              aria-label={t.clearSignature || "Clear signature"}
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Text Signature Input */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={textSignature}
            onChange={handleTextSignature}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: `2px solid ${textSignature.trim() ? C.primary : C.border}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: F.sans,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = textSignature.trim()
                ? C.primary
                : C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder={t.typeNameToSign || "Or type your name to sign"}
            aria-label={t.typeSignature || "Type your signature"}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: `2px solid ${C.border}`,
              background: "transparent",
              color: C.dark,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {t.cancel || "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "10px 28px",
              borderRadius: 8,
              border: "none",
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FiCheck size={16} />
            {t.confirm || "Confirm"}
          </button>
        </div>

        <p
          style={{
            fontSize: 10,
            color: C.muted,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {t.signatureVerificationNotice ||
            "Your signature will be recorded and attached to this session's attendance record."}
        </p>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
