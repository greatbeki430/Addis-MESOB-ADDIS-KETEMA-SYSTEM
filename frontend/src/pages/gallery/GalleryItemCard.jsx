// frontend/src/pages/gallery/GalleryItemCard.jsx
import { useState } from "react";
import { FiVideo, FiDownload, FiTrash2, FiCheck } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const GalleryItemCard = ({
  item,
  viewMode = "grid",
  selected,
  onToggleSelect,
  onOpen,
  onDownload,
  onDelete,
}) => {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);

  const isVideo = item.mediaType === "video";
  const thumb = item.thumbnailUrl || item.fileUrl;

  const formatDuration = (s) => {
    if (!s) return "";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════
  if (viewMode === "list") {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING.sm,
          padding: SPACING.sm,
          borderRadius: radius.md,
          border: `1px solid ${selected ? C.primary : C.border}`,
          background: hovered && !selected ? C.cardBg : "#fff",
          boxShadow: selected ? `0 0 0 2px ${C.primary}44` : "none",
          transition: "background 0.15s ease, border-color 0.15s ease",
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          style={{
            width: 16,
            height: 16,
            accentColor: C.primary,
            cursor: "pointer",
            flexShrink: 0,
          }}
        />

        <div
          onClick={onOpen}
          style={{
            width: 80,
            height: 56,
            borderRadius: radius.md,
            overflow: "hidden",
            background: C.bg,
            flexShrink: 0,
            cursor: "pointer",
            position: "relative",
          }}
        >
          <img
            src={thumb}
            alt={item.caption || item.fileName}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {isVideo && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.32)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <FiVideo size={18} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: FONT_SIZES.body,
              fontWeight: 600,
              color: C.dark,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: F.sans,
            }}
            title={item.caption || item.fileName}
          >
            {item.caption || item.fileName || t(`gallery.${item.mediaType}`)}
          </p>
          <p
            style={{
              fontSize: FONT_SIZES.tiny,
              color: C.muted,
              margin: "2px 0 0",
              fontFamily: F.sans,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.uploadedByName} ·{" "}
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={onDownload}
          title={t("gallery.download")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
            background: "transparent",
            border: "none",
            borderRadius: radius.sm,
            color: C.muted,
            cursor: "pointer",
            flexShrink: 0,
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.bg;
            e.currentTarget.style.color = C.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = C.muted;
          }}
        >
          <FiDownload size={16} />
        </button>

        {onDelete && (
          <button
            onClick={onDelete}
            title={t("gallery.delete")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
              background: "transparent",
              border: "none",
              borderRadius: radius.sm,
              color: C.red,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiTrash2 size={16} />
          </button>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // GRID VIEW
  // ════════════════════════════════════════════════════════
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: radius.lg,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: C.bg,
        cursor: "pointer",
        boxShadow: selected ? `0 0 0 2px ${C.primary}` : "none",
        transition: "box-shadow 0.15s ease",
      }}
    >
      <img
        src={thumb}
        alt={item.caption || item.fileName}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transform: hovered ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.35s ease",
        }}
      />

      {/* Video overlay + duration */}
      {isVideo && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 30,
              pointerEvents: "none",
            }}
          >
            ▶
          </div>
          {item.duration > 0 && (
            <span
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                padding: "2px 6px",
                background: "rgba(0,0,0,0.72)",
                color: "#fff",
                borderRadius: radius.sm,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: F.sans,
                pointerEvents: "none",
              }}
            >
              {formatDuration(item.duration)}
            </span>
          )}
        </>
      )}

      {/* Selection checkbox — top-left */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        style={{
          position: "absolute",
          top: 6,
          left: 6,
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: `2px solid ${selected ? C.primary : "rgba(255,255,255,0.75)"}`,
          background: selected ? C.primary : "rgba(0,0,0,0.4)",
          color: selected ? "#fff" : "transparent",
          cursor: "pointer",
          padding: 0,
          opacity: selected || hovered ? 1 : 0,
          transition: "opacity 0.15s ease, background 0.15s ease",
        }}
      >
        <FiCheck size={12} />
      </button>

      {/* Hover actions — top-right */}
      <div
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          display: "flex",
          gap: 4,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          title={t("gallery.download")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            border: "none",
            borderRadius: radius.sm,
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.85)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.6)";
          }}
        >
          <FiDownload size={12} />
        </button>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title={t("gallery.delete")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              background: "rgba(220,38,38,0.85)",
              color: "#fff",
              border: "none",
              borderRadius: radius.sm,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.red;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(220,38,38,0.85)";
            }}
          >
            <FiTrash2 size={12} />
          </button>
        )}
      </div>

      {/* Caption overlay — bottom */}
      {item.caption && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: `${SPACING.md}px 8px 6px`,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))",
            color: "#fff",
            fontSize: FONT_SIZES.tiny,
            fontFamily: F.sans,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            pointerEvents: "none",
          }}
        >
          {item.caption}
        </div>
      )}
    </div>
  );
};

export default GalleryItemCard;
