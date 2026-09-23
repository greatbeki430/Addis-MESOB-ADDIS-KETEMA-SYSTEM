// frontend/src/pages/gallery/ConfirmDeleteModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const BAR_PADDING = `${SPACING.md} ${SPACING.lg}`;

/**
 * Confirm-delete modal for gallery items and albums.
 *
 * Props:
 *   open             boolean
 *   onClose          () => void
 *   onConfirm        ({ hard, reason }) => Promise<void> | void
 *   kind             "item" | "album"
 *   title            string   — display name
 *   subtitle         string?  — e.g. "Photo · 2.4 MB" or "12 items"
 *   thumbnailUrl     string?  — cover or first-item thumbnail
 *   canHardDelete    boolean  — superadmin only; shows the "permanent" toggle
 */
const ConfirmDeleteModal = ({
  open,
  onClose,
  onConfirm,
  kind = "item",
  title,
  subtitle,
  thumbnailUrl,
  canHardDelete = false,
}) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [hard, setHard] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm({ hard, reason });
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    setReason("");
    setHard(false);
    onClose();
  };

  const isAlbum = kind === "album";

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
        if (e.target === e.currentTarget) handleClose();
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
            borderBottom: `2px solid ${C.red}33`,
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
            <FiAlertTriangle size={20} style={{ color: C.red }} />
            {isAlbum
              ? t("gallery.confirmDeleteAlbumTitle") || "Delete this album?"
              : t("gallery.confirmDeleteTitle") || "Delete this item?"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              background: "transparent",
              border: "none",
              borderRadius: radius.sm,
              color: C.muted,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.color = C.dark;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.muted;
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div
          style={{
            padding: SPACING.lg,
            display: "flex",
            flexDirection: "column",
            gap: SPACING.md,
          }}
        >
          {/* Preview row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.md,
              padding: SPACING.sm,
              borderRadius: radius.md,
              background: C.cardBg,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                overflow: "hidden",
                background: C.bg,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.muted,
              }}
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <FiTrash2 size={24} />
              )}
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
                title={title}
              >
                {title}
              </p>
              {subtitle && (
                <p
                  style={{
                    fontSize: FONT_SIZES.small,
                    color: C.muted,
                    margin: "4px 0 0",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Explanation */}
          <p
            style={{
              fontSize: FONT_SIZES.small,
              color: C.muted,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {hard
              ? t("gallery.confirmHardDeleteBody") ||
                "This cannot be undone. The file will be removed from storage."
              : isAlbum
                ? t("gallery.confirmDeleteAlbumBody") ||
                  "The album and its contents will be moved to trash. Superadmins can permanently delete later."
                : t("gallery.confirmDeleteBody") ||
                  "It will be moved to trash. Superadmins can permanently delete it later."}
          </p>

          {/* Hard-delete toggle (superadmin only) */}
          {canHardDelete && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: busy ? "not-allowed" : "pointer",
                padding: "10px 12px",
                borderRadius: radius.md,
                background: hard ? "#fef2f2" : "#fff",
                border: `1.5px solid ${hard ? C.red : C.border}`,
                transition: "all 0.15s ease",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={hard}
                onChange={(e) => setHard(e.target.checked)}
                disabled={busy}
                style={{
                  accentColor: C.red,
                  width: 16,
                  height: 16,
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              />
              <span
                style={{
                  fontSize: FONT_SIZES.small,
                  fontWeight: 600,
                  color: hard ? C.red : C.dark,
                }}
              >
                {t("gallery.confirmHardDeleteTitle") ||
                  "Permanently delete (cannot be undone)"}
              </span>
            </label>
          )}

          {/* Reason field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: FONT_SIZES.small,
                fontWeight: 600,
                color: C.dark,
                marginBottom: 6,
              }}
            >
              {t("gallery.deleteReason") || "Reason (optional)"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                t("gallery.deleteReasonPlaceholder") ||
                "Why are you deleting this?"
              }
              rows={2}
              disabled={busy}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: `1.5px solid ${C.border}`,
                borderRadius: radius.md,
                fontSize: FONT_SIZES.body,
                fontFamily: F.sans,
                color: C.dark,
                background: busy ? C.bg : "#fff",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                minHeight: 60,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
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
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            style={{
              padding: "9px 20px",
              background: "#fff",
              color: C.dark,
              border: `1.5px solid ${C.border}`,
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 600,
              fontFamily: F.sans,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.borderColor = C.primary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            {t("gallery.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 22px",
              background: C.red,
              color: "#fff",
              border: "none",
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 700,
              fontFamily: F.sans,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              boxShadow: `0 3px 12px ${C.red}44`,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 6px 18px ${C.red}55`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 3px 12px ${C.red}44`;
            }}
          >
            <FiTrash2 size={14} />
            {busy
              ? t("gallery.uploading")
              : hard
                ? t("gallery.confirmHardDeleteTitle") || "Delete permanently"
                : t("gallery.delete") || "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDeleteModal;
