// frontend/src/components/forum-report/SignatureModal.jsx
// Full-screen signature capture modal for Forum Report

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { C, F } from "../../styles/theme";
import {
  FiX,
  FiPenTool,
  FiCheck,
  FiUser,
  FiRefreshCw,
  FiEdit3,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";

export default function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Sign Your Report",
  subtitle = "",
  initialSignature = null,
  t = {},
  userName = "",
  teamName = "",
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [signatureData, setSignatureData] = useState(initialSignature || null);
  const [textSignature, setTextSignature] = useState("");
  const [signatureMode, setSignatureMode] = useState("draw");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1a3aad";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
        setSignatureData(initialSignature);
      };
      img.onerror = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setSignatureData(null);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  // Cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

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
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setSignatureData(null);
      setTextSignature("");
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
    onConfirm(signatureData);
    onClose();
  }, [signatureData, onConfirm, onClose]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

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
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        animation: "modalFadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: isFullscreen ? "20px" : "clamp(24px, 4vw, 40px)",
          maxWidth: isFullscreen ? "100vw" : "640px",
          width: isFullscreen ? "100vw" : "100%",
          maxHeight: isFullscreen ? "100vh" : "95vh",
          height: isFullscreen ? "100vh" : "auto",
          overflow: "auto",
          boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          position: "relative",
          animation: "modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
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

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <FiPenTool size={22} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "clamp(18px, 3vw, 24px)",
                  fontWeight: 700,
                  color: C.dark,
                  margin: 0,
                  fontFamily: F.serif,
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={toggleFullscreen}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: C.bg,
                color: C.muted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.primary + "15";
                e.currentTarget.style.color = C.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.color = C.muted;
              }}
            >
              {isFullscreen ? (
                <FiMinimize2 size={18} />
              ) : (
                <FiMaximize2 size={18} />
              )}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "#999",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
            >
              <FiX size={22} />
            </button>
          </div>
        </div>

        {/* User Info */}
        {(userName || teamName) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: `${C.primary}06`,
              borderRadius: 10,
              marginBottom: 16,
              flexShrink: 0,
              border: `1px solid ${C.primary}15`,
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
              {getInitials(userName)}
            </div>
            <div style={{ fontSize: 13, color: C.dark }}>
              <span style={{ fontWeight: 600 }}>{userName || "Unknown"}</span>
              {teamName && (
                <span style={{ color: C.muted, marginLeft: 8 }}>
                  • {teamName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 12,
            background: C.bg,
            borderRadius: 10,
            padding: "3px",
            border: `1px solid ${C.border}`,
            flexShrink: 0,
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
              fontWeight: signatureMode === "draw" ? 600 : 400,
              fontSize: 12,
              transition: "all 0.2s ease",
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
              } else {
                // Focus the text input
                setTimeout(() => {
                  const input = document.getElementById(
                    "signature-text-input-modal",
                  );
                  if (input) input.focus();
                }, 100);
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
              fontWeight: signatureMode === "text" ? 600 : 400,
              fontSize: 12,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <FiEdit3 size={14} />
            {t.typeSignature || "Type"}
          </button>
        </div>

        {/* Canvas Area - Expanded for signing */}
        <div
          style={{
            flex: 1,
            position: "relative",
            border: `3px solid ${hasSignature ? C.primary : C.border}`,
            borderRadius: 14,
            overflow: "hidden",
            background: hasSignature ? "#f8faff" : "#fafbfc",
            transition: "all 0.3s ease",
            boxShadow: hasSignature ? `0 0 0 4px ${C.primary}15` : "none",
            minHeight: isFullscreen ? "300px" : "200px",
            height: isFullscreen ? "calc(100vh - 280px)" : "260px",
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            style={{
              width: "100%",
              height: "100%",
              cursor: isTouchDevice ? "pointer" : "crosshair",
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
                gap: 8,
              }}
            >
              <FiPenTool size={36} style={{ opacity: 0.3 }} />
              <span>
                {signatureMode === "draw"
                  ? isTouchDevice
                    ? t.touchToSign || "Touch to sign"
                    : t.clickToSign || "Click and drag to sign"
                  : t.typeNameToSign || "Type your name below"}
              </span>
            </div>
          )}

          {/* Drawing indicator */}
          {isDrawing && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 16,
                fontSize: 11,
                color: C.primary,
                fontWeight: 600,
                background: "rgba(255,255,255,0.95)",
                padding: "4px 16px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${C.primary}22`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <FiPenTool size={14} />
              {t.drawing || "Drawing..."}
            </div>
          )}

          {/* Signature indicator */}
          {hasSignature && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 16,
                fontSize: 11,
                color: C.primary,
                fontWeight: 600,
                background: "rgba(255,255,255,0.95)",
                padding: "4px 16px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${C.primary}22`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <FiCheck size={14} color="#10b981" />
              {signatureMode === "text"
                ? t.signatureRecorded || "✓ Recorded"
                : t.signed || "✓ Signed"}
            </div>
          )}

          {/* Clear button */}
          {hasSignature && (
            <button
              onClick={clearSignature}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.9)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
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
              <FiRefreshCw size={16} />
            </button>
          )}
        </div>

        {/* Text input for typing */}
        {signatureMode === "text" && (
          <div style={{ marginTop: 12, flexShrink: 0 }}>
            <input
              id="signature-text-input-modal"
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
              autoFocus={signatureMode === "text"}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: `2px solid ${C.border}`,
            marginTop: 16,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
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
            disabled={!signatureData}
            style={{
              padding: "10px 32px",
              borderRadius: 10,
              border: "none",
              background: signatureData
                ? `linear-gradient(135deg, ${C.primary}, ${C.gold})`
                : "#ccc",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: signatureData ? "pointer" : "not-allowed",
              fontFamily: F.sans,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: signatureData ? `0 4px 16px ${C.primary}44` : "none",
              opacity: signatureData ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (signatureData) {
                e.currentTarget.style.transform =
                  "scale(1.03) translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 28px ${C.primary}66`;
              }
            }}
            onMouseLeave={(e) => {
              if (signatureData) {
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}44`;
              }
            }}
          >
            <FiCheck size={18} />
            {t.confirm || "Confirm"}
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${C.border}33`,
            flexShrink: 0,
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
            <FiUser size={12} />
            {t.signatureVerificationNotice ||
              "Your signature will be attached to this report."}
          </p>
          <div
            style={{
              fontSize: 9,
              color: C.muted,
              opacity: 0.5,
            }}
          >
            {isFullscreen ? "Fullscreen" : "Click expand for more space"}
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
