// components/golden-monday/GalleryItem.jsx
import {
  FiFolder,
  FiTrash2,
  FiFile,
  FiFileText,
  FiVideo,
  FiImage,
} from "react-icons/fi";
import { C } from "../../styles/theme";

const getFileTypeIcon = (fileType) => {
  switch (fileType) {
    case "image":
      return <FiImage size={20} />;
    case "pdf":
      return <FiFile size={20} style={{ color: "#e74c3c" }} />;
    case "video":
      return <FiVideo size={20} />;
    case "presentation":
      return <FiFileText size={20} style={{ color: "#f39c12" }} />;
    case "document":
      return <FiFileText size={20} style={{ color: "#3498db" }} />;
    default:
      return <FiFile size={20} />;
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

export default function GalleryItem({
  item,
  viewMode,
  isAdmin,
  onDelete,
  onClick,
}) {
  const isFolder = !item.url && !item.fileType; // Folder doesn't have url or fileType
  const isFile = item.url && item.fileType;
  const isImage = item.fileType === "image";
  const showThumbnail =
    isImage || (item.thumbnailUrl && !item.thumbnailIsGeneric);

  // Grid View
  if (viewMode === "grid") {
    return (
      <div
        onClick={() => onClick(item)}
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          cursor: "pointer",
          aspectRatio: "1/1",
          background: C.bg,
          border: `1px solid ${C.border}`,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.02)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {isFolder ? (
          // ─── FOLDER VIEW ───────────────────────────────────────────
          <>
            <div
              style={{
                width: "100%",
                height: "75%",
                background: C.primary + "11",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
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
                  }}
                />
              ) : (
                <FiFolder size={48} color={C.primary} />
              )}
              {/* Folder overlay icon */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.6)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  color: "#fff",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiFolder size={12} />
                {item.count || 0}
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px",
                background: C.white,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.dark,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.title}
              </div>
              {item.topics && item.topics.length > 0 && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {item.topics[0]}
                  {item.topics.length > 1 && ` +${item.topics.length - 1} more`}
                </div>
              )}
            </div>
          </>
        ) : (
          // ─── FILE VIEW ─────────────────────────────────────────────
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
                  }}
                >
                  {getFileTypeIcon(item.fileType)}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {getFileTypeLabel(item.fileType)}
                  </span>
                </div>
              )}
              {/* File type badge */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.7)",
                  borderRadius: 6,
                  padding: "3px 8px",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}
              >
                {getFileTypeLabel(item.fileType)}
              </div>
              {/* Delete button */}
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
                  }}
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "6px 10px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                color: "#fff",
                fontSize: 11,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "70%",
                }}
              >
                {item.title || item.originalFilename || "Untitled"}
              </span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────────
  return (
    <div
      onClick={() => onClick(item)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: C.white,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 6,
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
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
            <FiFolder size={24} color={C.primary} />
          )
        ) : showThumbnail ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.title || item.originalFilename}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          getFileTypeIcon(item.fileType)
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: C.dark,
            fontSize: 13,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isFolder ? (
            <>
              <FiFolder size={14} style={{ marginRight: 6 }} />
              {item.title}
            </>
          ) : (
            item.title || item.originalFilename || "Untitled"
          )}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          {isFolder
            ? `${item.count || 0} items`
            : `${getFileTypeLabel(item.fileType)} • ${new Date(item.createdAt).toLocaleDateString()}`}
        </div>
      </div>
      {/* Delete button for list view */}
      {isAdmin && isFile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item._id);
          }}
          style={{
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
            flexShrink: 0,
          }}
        >
          <FiTrash2 size={14} />
        </button>
      )}
    </div>
  );
}
