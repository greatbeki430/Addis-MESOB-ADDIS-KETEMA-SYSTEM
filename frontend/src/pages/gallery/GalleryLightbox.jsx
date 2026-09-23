// frontend/src/pages/gallery/GalleryLightbox.jsx
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEdit2,
  FiZap,
  FiRotateCcw,
  FiSave,
} from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { galleryAPI } from "../../services/api";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

// ─── Shared styles for the dark overlay ────────────────────
const topBarButtonStyle = () => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 8,
  background: "transparent",
  border: "none",
  borderRadius: radius.md,
  color: "#fff",
  cursor: "pointer",
  transition: "background 0.15s ease",
});

const navButtonStyle = (side) => ({
  position: "absolute",
  [side]: 16,
  top: "50%",
  transform: "translateY(-50%)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 12,
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  cursor: "pointer",
  transition: "background 0.15s ease",
});

const editFieldStyle = () => ({
  width: "100%",
  padding: "9px 12px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: radius.md,
  color: "#fff",
  fontSize: FONT_SIZES.body,
  fontFamily: F.sans,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, background 0.15s ease",
});

const aiButtonStyle = (color) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 12px",
  background: color,
  color: "#fff",
  border: "none",
  borderRadius: radius.md,
  fontSize: FONT_SIZES.tiny,
  fontWeight: 600,
  fontFamily: F.sans,
  cursor: "pointer",
  transition: "transform 0.15s ease, opacity 0.15s ease",
});

const GalleryLightbox = ({
  items,
  current,
  onClose,
  onNavigate,
  onDownload,
  canEdit,
  onUpdated,
}) => {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(current?.caption || "");
  const [tags, setTags] = useState((current?.tags || []).join(", "));
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [previousCurrentId, setPreviousCurrentId] = useState(current?._id);

  // Reset the draft while rendering the new item instead of synchronously
  // updating state from an effect. This is the React-recommended way to
  // "reset state when a prop changes" — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (current?._id !== previousCurrentId) {
    setPreviousCurrentId(current?._id);
    setCaption(current?.caption || "");
    setTags((current?.tags || []).join(", "));
    setEditing(false);
  }

  const index = items.findIndex((i) => i._id === current?._id);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < items.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(items[index - 1]);
  }, [hasPrev, index, items, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(items[index + 1]);
  }, [hasNext, index, items, onNavigate]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (editing) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editing, goPrev, goNext, onClose]);

  if (!current) return null;

  const isVideo = current.mediaType === "video";

  const handleSave = async () => {
    setBusy(true);
    try {
      const res = await galleryAPI.updateItem(current._id, {
        caption,
        tags,
      });
      onUpdated?.(res.data.item);
      setEditing(false);
    } catch (e) {
      alert(e?.response?.data?.message || t("gallery.uploadError"));
    } finally {
      setBusy(false);
    }
  };

  const handleAiEdit = async (operation) => {
    if (isVideo) {
      alert(t("gallery.aiPhotoOnly"));
      return;
    }
    setAiBusy(true);
    try {
      const res = await galleryAPI.aiEdit(current._id, operation);
      onUpdated?.(res.data.item);
    } catch (e) {
      alert(e?.response?.data?.message || t("gallery.aiNotAvailable"));
    } finally {
      setAiBusy(false);
    }
  };

  const handleRestore = async () => {
    setAiBusy(true);
    try {
      const res = await galleryAPI.restoreOriginal(current._id);
      onUpdated?.(res.data.item);
    } catch (e) {
      alert(e?.response?.data?.message || t("gallery.uploadError"));
    } finally {
      setAiBusy(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.96)",
        display: "flex",
        flexDirection: "column",
        fontFamily: F.sans,
      }}
    >
      {/* ── Top bar ───────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.small,
            opacity: 0.8,
            fontFamily: F.sans,
          }}
        >
          {index + 1} {t("gallery.of")} {items.length}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => onDownload(current)}
            title={t("gallery.download")}
            style={topBarButtonStyle()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiDownload size={18} />
          </button>
          {canEdit && (
            <button
              onClick={() => setEditing((v) => !v)}
              title={t("gallery.edit")}
              style={{
                ...topBarButtonStyle(),
                background: editing ? "rgba(255,255,255,0.18)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = editing
                  ? "rgba(255,255,255,0.18)"
                  : "transparent";
              }}
            >
              <FiEdit2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            title={t("gallery.close")}
            style={topBarButtonStyle()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* ── Media area ────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minHeight: 0,
        }}
      >
        {hasPrev && (
          <button
            onClick={goPrev}
            style={navButtonStyle("left")}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
          >
            <FiChevronLeft size={28} />
          </button>
        )}

        {isVideo ? (
          <video
            key={current._id}
            src={current.fileUrl}
            controls
            autoPlay
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              display: "block",
            }}
          />
        ) : (
          <img
            key={current._id}
            src={current.fileUrl}
            alt={current.caption || current.fileName}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        )}

        {hasNext && (
          <button
            onClick={goNext}
            style={navButtonStyle("right")}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
          >
            <FiChevronRight size={28} />
          </button>
        )}
      </div>

      {/* ── Bottom panel — caption, tags, AI editing ──── */}
      <div
        style={{
          background: "rgba(0,0,0,0.75)",
          color: "#fff",
          padding: `${SPACING.md}px ${SPACING.md}px`,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {editing ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: SPACING.sm,
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t("gallery.captionPlaceholder")}
              style={editFieldStyle()}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                e.currentTarget.style.background = "rgba(255,255,255,0.14)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("gallery.tagsPlaceholder")}
              style={editFieldStyle()}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                e.currentTarget.style.background = "rgba(255,255,255,0.14)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: SPACING.sm,
              }}
            >
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: "7px 14px",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: radius.md,
                  fontSize: FONT_SIZES.small,
                  fontFamily: F.sans,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
              >
                {t("gallery.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={busy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: radius.md,
                  fontSize: FONT_SIZES.small,
                  fontWeight: 700,
                  fontFamily: F.sans,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <FiSave size={14} />{" "}
                {busy ? t("gallery.uploading") : t("gallery.save")}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {current.caption && (
              <p
                style={{
                  fontSize: FONT_SIZES.body,
                  margin: "0 0 6px",
                  color: "#fff",
                  fontFamily: F.sans,
                }}
              >
                {current.caption}
              </p>
            )}
            {current.tags?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginBottom: SPACING.sm,
                }}
              >
                {current.tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: radius.pill,
                      background: "rgba(255,255,255,0.12)",
                      color: "#fff",
                      fontFamily: F.sans,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {canEdit && !isVideo && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: SPACING.sm,
                  marginTop: SPACING.sm,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => handleAiEdit("background_removed")}
                  disabled={aiBusy}
                  style={{
                    ...aiButtonStyle(C.purple),
                    opacity: aiBusy ? 0.5 : 1,
                    cursor: aiBusy ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!aiBusy)
                      e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FiZap size={12} /> {t("gallery.removeBackground")}
                </button>
                <button
                  onClick={() => handleAiEdit("enhanced")}
                  disabled={aiBusy}
                  style={{
                    ...aiButtonStyle(C.light),
                    opacity: aiBusy ? 0.5 : 1,
                    cursor: aiBusy ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!aiBusy)
                      e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FiZap size={12} /> {t("gallery.enhancePhoto")}
                </button>
                {current.aiEdited && (
                  <button
                    onClick={handleRestore}
                    disabled={aiBusy}
                    style={{
                      ...aiButtonStyle("rgba(255,255,255,0.12)"),
                      opacity: aiBusy ? 0.5 : 1,
                      cursor: aiBusy ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!aiBusy)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.22)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.12)";
                    }}
                  >
                    <FiRotateCcw size={12} /> {t("gallery.restoreOriginal")}
                  </button>
                )}
                {aiBusy && (
                  <span
                    style={{
                      fontSize: FONT_SIZES.tiny,
                      opacity: 0.7,
                      alignSelf: "center",
                      fontFamily: F.sans,
                    }}
                  >
                    {t("gallery.aiProcessing")}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default GalleryLightbox;
