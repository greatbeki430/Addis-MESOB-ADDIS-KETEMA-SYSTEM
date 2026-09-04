// frontend/src/components/forum-report/SignatureCanvas.jsx
// Signature capture with touch/type support for Forum Report

import { useState, useRef, useEffect, useCallback } from "react";
import { C, F, radius } from "../../styles/theme";
import {
  FiPenTool,
  FiCheck,
  FiRefreshCw,
  FiEdit3,
  FiEye,
  FiUser,
} from "react-icons/fi";

export default function SignatureCanvas({
  onSave,
  value,
  height = 120,
  width = 400,
  readOnly = false,
  label = "Signature",
  required = false,
  className = "",
  placeholder,
  showTypeInput = true,
  t = {},
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [textSignature, setTextSignature] = useState("");
  const [isTouchDevice] = useState(
    () =>
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0),
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [signatureMode, setSignatureMode] = useState("draw");

  // Initialize canvas and draw existing signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1a3aad";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.onerror = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const resetFrame = requestAnimationFrame(() => setHasSignature(false));
      return () => cancelAnimationFrame(resetFrame);
    }
  }, [value]);

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
      if (readOnly) return;
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
    [readOnly, getCanvasCoords],
  );

  const draw = useCallback(
    (e) => {
      if (readOnly || !isDrawing) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const { x, y } = getCanvasCoords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [readOnly, isDrawing, getCanvasCoords],
  );

  const stopDrawing = useCallback(
    (e) => {
      if (readOnly) return;
      e.preventDefault();
      setIsDrawing(false);
      if (hasSignature && onSave) {
        const canvas = canvasRef.current;
        onSave(canvas.toDataURL("image/png"));
      }
    },
    [readOnly, hasSignature, onSave],
  );

  const clearSignature = useCallback(() => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setTextSignature("");
    setSignatureMode("draw");
    if (onSave) onSave(null);
  }, [readOnly, onSave]);

  const handleTextSignature = useCallback(
    (e) => {
      if (readOnly) return;
      const text = e.target.value;
      setTextSignature(text);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (text.trim()) {
        const fontSize = Math.min(
          (canvas.width / Math.max(text.length, 1)) * 1.2,
          40,
        );
        ctx.font = `${fontSize}px 'Noto Sans Ethiopic', 'Segoe UI', 'Arial', serif`;
        ctx.fillStyle = "#1a3aad";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text.trim(), canvas.width / 2, canvas.height / 2);
        setHasSignature(true);
        setSignatureMode("text");
        if (onSave) onSave(canvas.toDataURL("image/png"));
      } else {
        setHasSignature(false);
        setSignatureMode("draw");
        if (onSave) onSave(null);
      }
    },
    [readOnly, onSave],
  );

  return (
    <div className={className} style={{ fontFamily: F.sans, width: "100%" }}>
      {/* Label */}
      {label && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.dark,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiPenTool size={14} color={C.primary} />
            {label}
            {required && (
              <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
            )}
          </label>
          {hasSignature && !readOnly && (
            <span
              style={{
                fontSize: 11,
                color: "#10b981",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiCheck size={14} />
              {t.signed || "Signed"}
            </span>
          )}
        </div>
      )}

      {/* Mode toggle */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 8,
            background: C.bg,
            borderRadius: 8,
            padding: "3px",
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
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: signatureMode === "draw" ? C.primary : "transparent",
              color: signatureMode === "draw" ? "#fff" : C.muted,
              cursor: "pointer",
              fontWeight: signatureMode === "draw" ? 600 : 400,
              fontSize: 12,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <FiPenTool size={14} />
            {t.drawSignature || "Draw"}
          </button>
          <button
            onClick={() => setSignatureMode("text")}
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: signatureMode === "text" ? C.primary : "transparent",
              color: signatureMode === "text" ? "#fff" : C.muted,
              cursor: "pointer",
              fontWeight: signatureMode === "text" ? 600 : 400,
              fontSize: 12,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <FiEdit3 size={14} />
            {t.typeSignature || "Type"}
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        style={{
          position: "relative",
          border: `2px solid ${hasSignature ? C.primary : isFocused ? C.primary : C.border}`,
          borderRadius: radius.md,
          overflow: "hidden",
          background: readOnly
            ? "#f9fafb"
            : hasSignature
              ? "#f8faff"
              : "#fafbfc",
          opacity: readOnly ? 0.8 : 1,
          transition: "all 0.3s ease",
          boxShadow:
            isHovered && !readOnly
              ? `0 0 0 4px ${C.primary}15`
              : isFocused && !readOnly
                ? `0 0 0 4px ${C.primary}22`
                : "none",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: "100%",
            height: `${height}px`,
            cursor: readOnly
              ? "default"
              : signatureMode === "draw"
                ? "crosshair"
                : "default",
            touchAction: "none",
            display: "block",
          }}
          onMouseDown={signatureMode === "draw" ? startDrawing : undefined}
          onMouseMove={signatureMode === "draw" ? draw : undefined}
          onMouseUp={signatureMode === "draw" ? stopDrawing : undefined}
          onMouseLeave={signatureMode === "draw" ? stopDrawing : undefined}
          onTouchStart={signatureMode === "draw" ? startDrawing : undefined}
          onTouchMove={signatureMode === "draw" ? draw : undefined}
          onTouchEnd={signatureMode === "draw" ? stopDrawing : undefined}
          onTouchCancel={signatureMode === "draw" ? stopDrawing : undefined}
        />

        {/* Placeholder */}
        {!hasSignature && !readOnly && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              color: "#bbb",
              fontSize: 13,
              flexDirection: "column",
              gap: 4,
            }}
          >
            <FiPenTool size={24} style={{ opacity: 0.3 }} />
            <span>
              {signatureMode === "draw"
                ? isTouchDevice
                  ? t.touchToSign || "Touch to sign"
                  : t.clickToSign || "Click to sign"
                : t.typeNameToSign || "Type your name below"}
            </span>
          </div>
        )}

        {/* Drawing indicator */}
        {isDrawing && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 12,
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

        {/* Signature indicator */}
        {hasSignature && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 12,
              fontSize: 10,
              color: C.primary,
              fontWeight: 600,
              background: "rgba(255,255,255,0.95)",
              padding: "3px 14px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: `1px solid ${C.primary}22`,
            }}
          >
            <FiCheck size={12} color="#10b981" />
            {signatureMode === "text"
              ? t.signatureRecorded || "Recorded"
              : t.signed || "Signed"}
          </div>
        )}

        {/* Clear button */}
        {hasSignature && !readOnly && (
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
          >
            <FiRefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Text input */}
      {!readOnly && showTypeInput && signatureMode === "text" && (
        <div style={{ marginTop: 10 }}>
          <input
            id="signature-text-input"
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
            placeholder={
              placeholder || t.typeNameToSign || "Type your full name to sign"
            }
            autoFocus={signatureMode === "text"}
          />
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: hasSignature ? "#10b981" : C.muted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {hasSignature ? (
            <>
              <FiCheck size={12} color="#10b981" />
              {t.signatureVerified || "Signature verified"}
            </>
          ) : readOnly ? (
            <>
              <FiEye size={12} />
              {t.readOnly || "Read only"}
            </>
          ) : (
            <>
              <FiUser size={12} />
              {t.drawOrTypeSignature || "Draw or type your signature"}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
