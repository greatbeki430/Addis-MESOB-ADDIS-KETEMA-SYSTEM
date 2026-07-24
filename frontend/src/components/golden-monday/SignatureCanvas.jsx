// src/components/golden-monday/SignatureCanvas.jsx
// Signature capture with touch/type support for Golden Monday attendance
// Reusable component that works with both mouse and touch devices

import { useState, useRef, useEffect } from "react";
import { C, F } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import { FiX, FiPenTool } from "react-icons/fi";

export default function SignatureCanvas({
  onSave,
  value,
  height = 100,
  width = 300,
  readOnly = false,
  label = "Signature",
  required = false,
  className = "",
}) {
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [textSignature, setTextSignature] = useState("");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const touch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouchDevice(touch);
  }, []);

  // Initialize canvas and draw existing signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1a3aad";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // If there's an existing signature value, draw it
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.onerror = () => {
        // If image fails to load, clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      };
      img.src = value;
    } else {
      // Clear canvas if no value
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSignature(false);
    }
  }, [value]);

  // Get canvas coordinates from mouse or touch event
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  // Start drawing
  const startDrawing = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  // Draw while moving
  const draw = (e) => {
    if (readOnly || !isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing and save
  const stopDrawing = (e) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDrawing(false);
    if (hasSignature && onSave) {
      const canvas = canvasRef.current;
      onSave(canvas.toDataURL("image/png"));
    }
  };

  // Clear the signature
  const clearSignature = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setTextSignature("");
    if (onSave) onSave(null);
  };

  // Handle text-based signature
  const handleTextSignature = (e) => {
    if (readOnly) return;
    const text = e.target.value;
    setTextSignature(text);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (text.trim()) {
      // Draw text signature
      const fontSize = Math.min((canvas.width / text.length) * 1.2, 36);
      ctx.font = `${fontSize}px 'Noto Sans Ethiopic', 'Segoe UI', 'Arial', serif`;
      ctx.fillStyle = "#1a3aad";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text.trim(), canvas.width / 2, canvas.height / 2);
      setHasSignature(true);
      if (onSave) onSave(canvas.toDataURL("image/png"));
    } else {
      setHasSignature(false);
      if (onSave) onSave(null);
    }
  };

  // Download signature as PNG
  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!hasSignature) return;
    const link = document.createElement("a");
    link.download = "signature.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={className} style={{ fontFamily: F.sans }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: C.dark,
            marginBottom: 4,
          }}
        >
          {label}
          {required && (
            <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
          )}
        </label>
      )}

      <div
        style={{
          position: "relative",
          border: `2px ${readOnly ? "solid" : "dashed"} ${hasSignature ? C.primary : C.border}`,
          borderRadius: 8,
          overflow: "hidden",
          background: readOnly ? "#f9fafb" : "#fafbfc",
          opacity: readOnly ? 0.8 : 1,
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          boxShadow:
            isHovered && !readOnly ? `0 0 0 3px ${C.primary}22` : "none",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: "100%",
            height: `${height}px`,
            cursor: readOnly ? "default" : "crosshair",
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

        {/* Placeholder text when empty */}
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
            }}
          >
            <FiPenTool size={16} style={{ marginRight: 8, opacity: 0.5 }} />
            {isTouchDevice
              ? t.touchToSign || "Touch to sign"
              : t.clickToSign || "Click to sign"}
          </div>
        )}

        {/* Signature indicator when signed */}
        {hasSignature && (
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 8,
              fontSize: 10,
              color: C.primary,
              fontWeight: 600,
              background: "rgba(255,255,255,0.9)",
              padding: "2px 8px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>✓</span> {t.signed || "Signed"}
          </div>
        )}

        {/* Clear button */}
        {hasSignature && !readOnly && (
          <button
            onClick={clearSignature}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.9)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            title={t.clearSignature || "Clear signature"}
            aria-label={t.clearSignature || "Clear signature"}
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Text input for typing signature */}
      {!readOnly && (
        <div style={{ marginTop: 8 }}>
          <input
            type="text"
            value={textSignature}
            onChange={handleTextSignature}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: `1.5px solid ${textSignature.trim() ? C.primary : C.border}`,
              borderRadius: 6,
              fontSize: 13,
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              fontSize: 10,
              color: C.muted,
            }}
          >
            <span>
              {hasSignature
                ? t.signatureRecorded || "✓ Signature recorded"
                : t.drawOrTypeSignature || "Draw or type your signature"}
            </span>
            {hasSignature && (
              <button
                onClick={downloadSignature}
                style={{
                  background: "none",
                  border: "none",
                  color: C.primary,
                  cursor: "pointer",
                  fontSize: 10,
                  textDecoration: "underline",
                }}
                aria-label={t.downloadPNG || "Download signature as PNG"}
              >
                {t.downloadPNG || "Download PNG"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Read-only indicator */}
      {readOnly && hasSignature && (
        <div
          style={{
            fontSize: 10,
            color: C.muted,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          ✓ {t.signatureVerified || "Signature verified"}
        </div>
      )}
    </div>
  );
}
