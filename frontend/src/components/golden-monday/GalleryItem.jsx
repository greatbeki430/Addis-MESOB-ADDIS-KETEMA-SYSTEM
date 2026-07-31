// components/golden-monday/GalleryItem.jsx
import { FiFolder, FiTrash2 } from "react-icons/fi";
import { C } from "../../styles/theme";

export default function GalleryItem({
  item,
  viewMode,
  isAdmin,
  onDelete,
  onClick,
}) {
  const isFolder = !item.url; // Folder doesn't have a direct 'url' property

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
        {/* Cover Image */}
        <img
          src={item.coverPhoto || item.thumbnailUrl || item.url}
          alt={item.title}
          style={{
            width: "100%",
            height: isFolder ? "75%" : "100%",
            objectFit: "cover",
          }}
          loading="lazy"
        />

        {/* Folder Bottom Info */}
        {isFolder && (
          <div
            style={{
              padding: "12px 14px",
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
              <FiFolder
                size={14}
                style={{
                  verticalAlign: "middle",
                  marginRight: 6,
                  color: C.primary,
                }}
              />
              {item.title}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {item.count || 0} images
            </div>
          </div>
        )}

        {/* Photo Bottom Info */}
        {!isFolder && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "6px 10px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              color: "#fff",
              fontSize: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Delete button (if admin and on root view or inside folder) */}
        {isAdmin && !isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item._id);
            }}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
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
    );
  }

  // List View Fallback
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
      <img
        src={item.coverPhoto || item.thumbnailUrl || item.url}
        alt={item.title}
        style={{ width: 50, height: 50, borderRadius: 6, objectFit: "cover" }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: C.dark, fontSize: 13 }}>
          {isFolder && <FiFolder size={14} style={{ marginRight: 6 }} />}
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          {isFolder
            ? `${item.count || 0} images`
            : new Date(item.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
