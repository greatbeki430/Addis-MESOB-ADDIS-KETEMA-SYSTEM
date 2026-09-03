// components/golden-monday/GalleryItem.jsx
import {
  FiFolder,
  FiTrash2,
  FiFile,
  FiFileText,
  FiVideo,
  FiImage,
  FiPlay,
  FiEye,
  FiInfo,
  FiCalendar,
  FiClock,
  FiStar,
} from "react-icons/fi";
import { C } from "../../styles/theme";
import { useState } from "react";

const getFileTypeIcon = (fileType, size = 20) => {
  switch (fileType) {
    case "image":
      return <FiImage size={size} style={{ color: "#10b981" }} />;
    case "pdf":
      return <FiFile size={size} style={{ color: "#e74c3c" }} />;
    case "video":
      return <FiVideo size={size} style={{ color: "#8b5cf6" }} />;
    case "presentation":
      return <FiFileText size={size} style={{ color: "#f39c12" }} />;
    case "document":
      return <FiFileText size={size} style={{ color: "#3b82f6" }} />;
    default:
      return <FiFile size={size} style={{ color: "#6b7280" }} />;
  }
};

const getFileTypeLabel = (fileType) => {
  const labels = {
    image: "Image",
    pdf: "PDF",
    presentation: "Presentation",
    document: "Document",
    video: "Video",
    other: "File",
  };
  return labels[fileType] || fileType;
};

const getFileTypeColor = (fileType) => {
  const colors = {
    image: "#10b981",
    pdf: "#e74c3c",
    presentation: "#f39c12",
    document: "#3b82f6",
    video: "#8b5cf6",
    other: "#6b7280",
  };
  return colors[fileType] || colors.other;
};

export default function GalleryItem({
  item,
  viewMode,
  isAdmin,
  onDelete,
  onClick,
}) {
  const [isHovering, setIsHovering] = useState(false);

  const isFolder = !item.url && !item.fileType;
  const isFile = item.url && item.fileType;
  const isImage = item.fileType === "image";
  const isVideo = item.fileType === "video";
  const showThumbnail =
    isImage || (item.thumbnailUrl && !item.thumbnailIsGeneric);
  const fileColor = getFileTypeColor(item.fileType);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
  };

  // Grid View - Enhanced with animations
  if (viewMode === "grid") {
    return (
      <div
        onClick={() => onClick(item)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          cursor: "pointer",
          aspectRatio: "1/1",
          background: C.white,
          border: `1px solid ${isHovering ? C.primary : C.border}`,
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: isHovering
            ? "scale(1.04) translateY(-4px)"
            : "scale(1) translateY(0)",
          boxShadow: isHovering
            ? `0 12px 40px rgba(0,0,0,0.15), 0 0 0 2px ${C.primary}33`
            : "0 2px 8px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isFolder ? (
          // ─── ENHANCED FOLDER VIEW ──────────────────────────────────
          <>
            <div
              style={{
                width: "100%",
                height: "70%",
                background: isHovering
                  ? `linear-gradient(135deg, ${C.primary}22, ${C.primary}11)`
                  : `${C.primary}11`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                transition: "background 0.3s ease",
              }}
            >
              {item.coverPhoto ? (
                <img
                  src={item.coverPhoto}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.5s ease",
                    transform: isHovering ? "scale(1.08)" : "scale(1)",
                  }}
                />
              ) : (
                <FiFolder
                  size={64}
                  color={C.primary}
                  style={{
                    transition: "all 0.3s ease",
                    transform: isHovering
                      ? "scale(1.1) rotate(-5deg)"
                      : "scale(1) rotate(0)",
                  }}
                />
              )}

              {/* Count badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 12,
                  padding: "4px 12px",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.3s ease",
                  transform: isHovering ? "scale(1.05)" : "scale(1)",
                }}
              >
                <FiFolder size={12} />
                {item.count || 0} items
              </div>

              {/* Topics badge */}
              {item.topics && item.topics.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 8,
                    padding: "3px 10px",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 500,
                    maxWidth: "60%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.topics[0]}
                  {item.topics.length > 1 && ` +${item.topics.length - 1}`}
                </div>
              )}
            </div>
            <div
              style={{
                padding: "12px 14px",
                background: isHovering ? `${C.primary}05` : C.white,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderTop: `1px solid ${C.border}`,
                transition: "background 0.3s ease",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: C.dark,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiFolder size={14} color={C.primary} />
                {item.title}
              </div>
              {item.weekOf && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  <FiCalendar size={10} style={{ marginRight: 4 }} />
                  {formatDate(item.weekOf)}
                </div>
              )}
            </div>
          </>
        ) : isFile ? (
          // ─── ENHANCED FILE VIEW ────────────────────────────────────
          <>
            <div
              style={{
                width: "100%",
                height: "100%",
                background: showThumbnail ? "transparent" : C.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {showThumbnail ? (
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title || item.originalFilename}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.5s ease",
                    transform: isHovering ? "scale(1.08)" : "scale(1)",
                  }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    color: C.muted,
                    transition: "all 0.3s ease",
                    transform: isHovering ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {getFileTypeIcon(item.fileType, 40)}
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: fileColor }}
                  >
                    {getFileTypeLabel(item.fileType)}
                  </span>
                </div>
              )}

              {/* Video play icon overlay */}
              {isVideo && showThumbnail && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "50%",
                    width: 56,
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    transition: "all 0.3s ease",
                    transform: isHovering
                      ? "translate(-50%, -50%) scale(1.15)"
                      : "translate(-50%, -50%) scale(1)",
                    boxShadow: isHovering
                      ? "0 0 40px rgba(139, 92, 246, 0.4)"
                      : "none",
                  }}
                >
                  <FiPlay size={28} style={{ marginLeft: 4 }} />
                </div>
              )}

              {/* File type badge with color */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: `1px solid ${fileColor}44`,
                  transition: "all 0.3s ease",
                  transform: isHovering ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span style={{ color: fileColor }}>●</span>
                {getFileTypeLabel(item.fileType)}
              </div>

              {/* Delete button - enhanced */}
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item._id);
                  }}
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
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
                    transform: isHovering ? "scale(1.1)" : "scale(1)",
                    boxShadow: isHovering
                      ? "0 4px 12px rgba(239,68,68,0.4)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                    e.currentTarget.style.transform = "scale(1.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.9)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiTrash2 size={14} />
                </button>
              )}

              {/* Quick info overlay on hover */}
              {isHovering && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 48,
                    left: 8,
                    right: 8,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "#fff",
                    animation: "fadeInUp 0.3s ease",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiInfo size={10} />
                    {item.category || "Uncategorized"}
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiClock size={10} />
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "8px 12px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                color: "#fff",
                fontSize: 11,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.3s ease",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "65%",
                  fontWeight: 500,
                }}
              >
                {item.title || item.originalFilename || "Untitled"}
              </span>
              <span
                style={{
                  fontSize: 10,
                  opacity: 0.8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiCalendar size={10} />
                {formatDate(item.createdAt)}
              </span>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // ─── ENHANCED LIST VIEW ────────────────────────────────────────────
  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        borderRadius: 12,
        border: `1px solid ${isHovering ? C.primary : C.border}`,
        background: isHovering ? `${C.primary}05` : C.white,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isHovering ? "translateX(4px)" : "translateX(0)",
        boxShadow: isHovering ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
        position: "relative",
      }}
    >
      {/* Left indicator bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderRadius: "12px 0 0 12px",
          background: isFolder ? C.primary : fileColor,
          transition: "all 0.3s ease",
          opacity: isHovering ? 1 : 0.3,
        }}
      />

      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          background: isHovering ? `${C.primary}11` : C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          transition: "all 0.3s ease",
          transform: isHovering ? "scale(1.05)" : "scale(1)",
        }}
      >
        {isFolder ? (
          item.coverPhoto ? (
            <img
              src={item.coverPhoto}
              alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <FiFolder size={28} color={C.primary} />
          )
        ) : showThumbnail ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.title || item.originalFilename}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          getFileTypeIcon(item.fileType, 28)
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: C.dark,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isFolder ? (
            <>
              <FiFolder size={14} color={C.primary} />
              {item.title}
            </>
          ) : (
            item.title || item.originalFilename || "Untitled"
          )}
          {isVideo && (
            <span
              style={{
                fontSize: 9,
                background: "#8b5cf6",
                color: "#fff",
                padding: "1px 8px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              VIDEO
            </span>
          )}
          {isImage && (
            <span
              style={{
                fontSize: 9,
                background: "#10b981",
                color: "#fff",
                padding: "1px 8px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              IMAGE
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: C.muted,
            flexWrap: "wrap",
          }}
        >
          {isFolder ? (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FiFolder size={12} />
                {item.count || 0} items
              </span>
              {item.topics && item.topics.length > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <FiStar size={12} />
                  {item.topics[0]}
                </span>
              )}
            </>
          ) : (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {getFileTypeIcon(item.fileType, 12)}
                {getFileTypeLabel(item.fileType)}
              </span>
              {item.size && <span>{getFileSize(item.size)}</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FiCalendar size={12} />
                {formatDate(item.createdAt)}
              </span>
              {item.category && item.category !== "other" && (
                <span
                  style={{
                    background: `${C.primary}15`,
                    color: C.primary,
                    padding: "1px 8px",
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                >
                  {item.category}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action buttons - enhanced */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {isFile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.url, "_blank");
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: isHovering ? `${C.primary}15` : "transparent",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              opacity: isHovering ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${C.primary}25`;
              e.currentTarget.style.color = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isHovering
                ? `${C.primary}15`
                : "transparent";
              e.currentTarget.style.color = C.muted;
            }}
          >
            <FiEye size={16} />
          </button>
        )}

        {isAdmin && isFile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item._id);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: isHovering ? "#fee2e2" : "transparent",
              border: "none",
              color: isHovering ? "#dc2626" : C.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              opacity: isHovering ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fecaca";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isHovering
                ? "#fee2e2"
                : "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <FiTrash2 size={16} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
