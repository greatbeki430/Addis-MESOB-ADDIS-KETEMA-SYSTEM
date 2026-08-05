// src/components/SignatureModal.jsx
import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { C, F } from "../styles/theme";
import { FiX, FiPenTool, FiCheck } from "react-icons/fi";

export default function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Please Sign",
  subtitle = "",
  initialSignature = null,
  required = true,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [signatureData, setSignatureData] = useState(initialSignature || null);
  const [textSignature, setTextSignature] = useState("");

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  // ─── Draw signature on canvas ───────────────────────────────
  const drawSignature = useCallback((dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a3aad";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
        setSignatureData(dataUrl);
      };
      img.onerror = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setSignatureData(null);
      };
      img.src = dataUrl;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setSignatureData(null);
    }
  }, []);

  // ─── Effect to update canvas when initialSignature changes ──
  useLayoutEffect(() => {
    const timeoutId = setTimeout(() => {
      drawSignature(initialSignature);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [initialSignature, drawSignature]);

  // ─── Cleanup on unmount – FIXED (capture ref value) ────────
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

  // ─── Drawing callbacks ──────────────────────────────────────
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
          const dataUrl = canvas.toDataURL("image/png");
          setSignatureData(dataUrl);
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
    if (required && !signatureData) return;
    onConfirm(signatureData);
    onClose();
  }, [signatureData, onConfirm, onClose, required]);

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
      onClick={onClose}
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
        <button
          onClick={onClose}
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
        >
          <FiX size={24} />
        </button>

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
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>

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
              {isTouchDevice ? "Touch to sign" : "Click to sign"}
            </div>
          )}
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
              <FiCheck size={14} /> Signed
            </div>
          )}
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
            >
              <FiX size={16} />
            </button>
          )}
        </div>

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
            placeholder="Or type your name to sign"
          />
        </div>

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
            onClick={onClose}
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
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={required && !signatureData}
            style={{
              padding: "10px 28px",
              borderRadius: 8,
              border: "none",
              background:
                required && !signatureData
                  ? "#ccc"
                  : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: required && !signatureData ? "not-allowed" : "pointer",
              fontFamily: F.sans,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: required && !signatureData ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!(required && !signatureData)) {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}55`;
              }
            }}
            onMouseLeave={(e) => {
              if (!(required && !signatureData)) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            <FiCheck size={16} /> Confirm
          </button>
        </div>
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
