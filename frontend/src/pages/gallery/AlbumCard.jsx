// frontend/src/pages/gallery/AlbumCard.jsx
import { useState } from "react";
import { FiFolder, FiImage, FiVideo, FiTrash2 } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const AlbumCard = ({ album, onOpen, onDelete, canDelete }) => {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);

  const dateLabel = album.programDate
    ? new Date(album.programDate).toLocaleDateString()
    : new Date(album.createdAt).toLocaleDateString();

  const hasCover = Boolean(album.coverImage?.url);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: radius.lg,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: "#fff",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        boxShadow: hovered
          ? "0 6px 24px rgba(13,26,94,0.14)"
          : "0 1px 4px rgba(13,26,94,0.06)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* ── Cover ─────────────────────────────────────── */}
      <button
        onClick={onOpen}
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "16 / 9",
          background: C.bg,
          border: "none",
          padding: 0,
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {hasCover ? (
          <img
            src={album.coverImage.url}
            alt={album.title}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.muted,
              opacity: 0.5,
            }}
          >
            <FiFolder size={44} />
          </div>
        )}

        {/* Photo + video counts */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 4,
          }}
        >
          {album.photoCount > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                background: "rgba(0,0,0,0.65)",
                color: "#fff",
                borderRadius: radius.sm,
                fontSize: FONT_SIZES.tiny,
                fontWeight: 600,
                fontFamily: F.sans,
              }}
            >
              <FiImage size={12} /> {album.photoCount}
            </span>
          )}
          {album.videoCount > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                background: "rgba(0,0,0,0.65)",
                color: "#fff",
                borderRadius: radius.sm,
                fontSize: FONT_SIZES.tiny,
                fontWeight: 600,
                fontFamily: F.sans,
              }}
            >
              <FiVideo size={12} /> {album.videoCount}
            </span>
          )}
        </div>
      </button>

      {/* ── Body ──────────────────────────────────────── */}
      <div style={{ padding: SPACING.md }}>
        <button
          onClick={onOpen}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: F.sans,
          }}
        >
          <h3
            style={{
              fontSize: FONT_SIZES.body,
              fontWeight: 700,
              color: C.dark,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={album.title}
          >
            {album.title}
          </h3>
        </button>

        <p
          style={{
            fontSize: FONT_SIZES.tiny,
            color: C.muted,
            margin: "4px 0 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {dateLabel}
          {album.location ? ` · ${album.location}` : ""}
        </p>

        {album.tags?.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 8,
            }}
          >
            {album.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: radius.pill,
                  background: `${C.primary}14`,
                  color: C.primary,
                  fontWeight: 600,
                  fontFamily: F.sans,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete button ─────────────────────────────── */}
      {canDelete && onDelete && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.2s ease",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(album, false);
            }}
            title={t("gallery.deleteAlbum")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              background: C.red,
              color: "#fff",
              border: "none",
              borderRadius: radius.sm,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#b91c1c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.red;
            }}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AlbumCard;
