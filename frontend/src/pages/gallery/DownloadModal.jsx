// frontend/src/pages/gallery/DownloadModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiDownloadCloud,
  FiCheck,
  FiAlertCircle,
  FiFile,
  FiVideo,
  FiImage,
  FiX,
} from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const BAR_PADDING = `${SPACING.md} ${SPACING.lg}`;

const formatSize = (bytes) => {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

/**
 * Download modal — replaces the invisible <a download> click with a
 * visible, confirmable, progress-tracked flow.
 *
 * Props:
 *   open           boolean
 *   item           { fileName, fileSize, mediaType, thumbnailUrl, fileUrl, caption }
 *   onClose        () => void
 *   onPerform      () => Promise<void> | void   — does the actual download
 */
const DownloadModal = ({ open, item, onClose, onPerform }) => {
  const { t } = useLanguage();
  const [phase, setPhase] = useState("ready"); // "ready" | "downloading" | "done" | "error"
  const [pct, setPct] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  // Reset state when modal opens with a new item
  useEffect(() => {
    if (!open) return undefined;

    // Defer the reset until after the opening render to avoid a synchronous
    // state update in the effect body.
    const resetId = setTimeout(() => {
      setPhase("ready");
      setPct(0);
      setErrMsg("");
    }, 0);

    return () => clearTimeout(resetId);
  }, [open, item?._id]);

  if (!open || !item) return null;

  const isVideo = item.mediaType === "video";
  const MediaIcon = isVideo ? FiVideo : FiImage;

  const handleDownload = async () => {
    setPhase("downloading");
    setPct(0);

    // Fake-but-honest progress: the browser <a download> trick doesn't
    // expose bytes-downloaded events reliably, so we animate a bar that
    // completes right as onPerform's promise resolves. Feels responsive,
    // never gets stuck.
    const tick = setInterval(() => {
      setPct((p) => (p >= 90 ? 90 : p + Math.random() * 12));
    }, 180);

    try {
      await onPerform();
      clearInterval(tick);
      setPct(100);
      setPhase("done");
      // Auto-close shortly after success
      setTimeout(() => {
        if (typeof onClose === "function") onClose();
      }, 900);
    } catch (e) {
      clearInterval(tick);
      setPhase("error");
      setErrMsg(e?.message || t("gallery.downloadError") || "Download failed.");
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(13,26,94,0.55)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        padding: SPACING.md,
      }}
      onClick={(e) => {
        if (phase !== "downloading" && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: radius.xl,
          boxShadow: "0 20px 60px rgba(13,26,94,0.4)",
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          fontFamily: F.sans,
          overflow: "hidden",
        }}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: BAR_PADDING,
            borderBottom: `2px solid ${C.primary}22`,
          }}
        >
          <h2
            style={{
              fontSize: FONT_SIZES.h3,
              fontWeight: 700,
              fontFamily: F.serif,
              color: C.dark,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiDownloadCloud size={20} style={{ color: C.primary }} />
            {t("gallery.download") || "Download"}
          </h2>
          {phase !== "downloading" && (
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                background: "transparent",
                border: "none",
                borderRadius: radius.sm,
                color: C.muted,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.color = C.dark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = C.muted;
              }}
            >
              <FiX size={18} />
            </button>
          )}
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div style={{ padding: SPACING.lg }}>
          {/* File preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.md,
              padding: SPACING.sm,
              borderRadius: radius.md,
              background: C.cardBg,
              border: `1px solid ${C.border}`,
              marginBottom: SPACING.md,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: radius.md,
                overflow: "hidden",
                background: C.bg,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.primary,
                position: "relative",
              }}
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <MediaIcon size={28} />
              )}
              {/* Media-type chip */}
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  padding: "2px 6px",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  fontSize: 9,
                  borderRadius: radius.sm,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {isVideo ? "VIDEO" : "PHOTO"}
              </span>
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: FONT_SIZES.body,
                  fontWeight: 700,
                  color: C.dark,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={item.fileName}
              >
                {item.fileName || item.caption || "Untitled"}
              </p>
              <p
                style={{
                  fontSize: FONT_SIZES.small,
                  color: C.muted,
                  margin: "4px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiFile size={12} /> {formatSize(item.fileSize)}
                {item.width && item.height ? (
                  <>
                    {" · "}
                    {item.width}×{item.height}
                  </>
                ) : null}
              </p>
            </div>
          </div>

          {/* Status / progress area */}
          {phase === "ready" && (
            <p
              style={{
                fontSize: FONT_SIZES.small,
                color: C.muted,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {t("gallery.downloadConfirm") ||
                "The file will be saved to your device. Large videos may take a moment."}
            </p>
          )}

          {phase === "downloading" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 8,
                  background: C.bg,
                  borderRadius: radius.pill,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${C.primary}, ${C.light})`,
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: FONT_SIZES.small,
                  color: C.primary,
                  fontWeight: 600,
                }}
              >
                {t("gallery.downloading") || "Downloading…"} {Math.round(pct)}%
              </span>
            </div>
          )}

          {phase === "done" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
                color: "#16a34a",
                fontWeight: 600,
                fontSize: FONT_SIZES.small,
                padding: "8px 0",
              }}
            >
              <FiCheck size={18} />
              {t("gallery.downloadComplete") || "Download started"}
            </div>
          )}

          {phase === "error" && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                color: C.red,
                background: "#fef2f2",
                border: `1px solid ${C.red}44`,
                borderRadius: radius.md,
                padding: "10px 12px",
                fontSize: FONT_SIZES.small,
              }}
            >
              <FiAlertCircle
                size={16}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <span>{errMsg}</span>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: SPACING.sm,
            padding: BAR_PADDING,
            borderTop: `1px solid ${C.border}`,
            background: C.cardBg,
          }}
        >
          {phase !== "done" && (
            <button
              type="button"
              onClick={onClose}
              disabled={phase === "downloading"}
              style={{
                padding: "9px 20px",
                background: "#fff",
                color: C.dark,
                border: `1.5px solid ${C.border}`,
                borderRadius: radius.md,
                fontSize: FONT_SIZES.small,
                fontWeight: 600,
                fontFamily: F.sans,
                cursor: phase === "downloading" ? "not-allowed" : "pointer",
                opacity: phase === "downloading" ? 0.5 : 1,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (phase !== "downloading") {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.borderColor = C.primary;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              {phase === "error"
                ? t("gallery.close") || "Close"
                : t("gallery.cancel")}
            </button>
          )}
          {phase === "ready" || phase === "error" ? (
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 22px",
                background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                color: "#fff",
                border: "none",
                borderRadius: radius.md,
                fontSize: FONT_SIZES.small,
                fontWeight: 700,
                fontFamily: F.sans,
                cursor: "pointer",
                boxShadow: `0 3px 12px ${C.primary}44`,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 6px 18px ${C.primary}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 3px 12px ${C.primary}44`;
              }}
            >
              <FiDownloadCloud size={14} />
              {phase === "error"
                ? t("gallery.retry") || "Retry"
                : t("gallery.download") || "Download"}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DownloadModal;
