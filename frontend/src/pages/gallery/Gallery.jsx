// frontend/src/pages/gallery/Gallery.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiImage,
  FiGrid,
  FiList,
  FiPlus,
  FiSearch,
  FiDownload,
  FiUploadCloud,
  FiFolder,
  FiX,
  FiChevronLeft,
} from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { galleryAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";
import GalleryUpload from "./GalleryUpload";
import GalleryLightbox from "./GalleryLightbox";
import AlbumCard from "./AlbumCard";
import GalleryItemCard from "./GalleryItemCard";
import CreateAlbumModal from "./CreateAlbumModal";

const TABS = ["albums", "all", "loose", "recent", "mostViewed"];
const LEADER_TIER = ["leader", "admin", "superadmin"];

const TAB_LABEL_KEY = {
  albums: "albumsTab",
  all: "allMediaTab",
  loose: "looseUploads",
  recent: "recentTab",
  mostViewed: "mostViewedTab",
};

// ─── Shared inline-style helpers ───────────────────────────
// theme.js's `btn` / `inp` objects use `&:hover` syntax which is a
// CSS-in-JS pattern, not valid for React's style={{}} prop — so we
// hand-roll hover via onMouseEnter/onMouseLeave where it matters.
const primaryBtnStyle = (disabled = false) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
  color: "#fff",
  border: "none",
  borderRadius: radius.md,
  fontSize: FONT_SIZES.small,
  fontWeight: 700,
  fontFamily: F.sans,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  boxShadow: `0 2px 8px ${C.primary}33`,
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
});

const subtleBtnStyle = () => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  background: C.bg,
  color: C.primary,
  border: `1px solid ${C.border}`,
  borderRadius: radius.md,
  fontSize: FONT_SIZES.small,
  fontWeight: 600,
  fontFamily: F.sans,
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
});

const iconBtnStyle = () => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 8,
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: radius.md,
  color: C.primary,
  cursor: "pointer",
  transition: "all 0.15s ease",
});

const inputStyle = () => ({
  width: "100%",
  padding: "8px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: radius.md,
  fontSize: FONT_SIZES.small,
  fontFamily: F.sans,
  color: C.dark,
  background: "#fff",
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  boxSizing: "border-box",
});

const selectStyle = () => ({
  padding: "8px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: radius.md,
  fontSize: FONT_SIZES.small,
  fontFamily: F.sans,
  color: C.dark,
  background: "#fff",
  cursor: "pointer",
  outline: "none",
  transition: "border-color 0.15s ease",
});

const Gallery = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const canUpload = LEADER_TIER.includes(user?.role);
  const canDelete = ["admin", "superadmin"].includes(user?.role);

  const [tab, setTab] = useState("albums");
  const [viewMode, setViewMode] = useState("grid");
  const [openAlbum, setOpenAlbum] = useState(null);
  const [lightboxItem, setLightboxItem] = useState(null);

  const [albums, setAlbums] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadAlbumId, setUploadAlbumId] = useState(null);

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await galleryAPI.listAlbums({ search });
      setAlbums(res.data.albums || []);
    } catch (e) {
      setError(e?.response?.data?.message || t("gallery.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  const loadItems = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError("");
      try {
        const params = { mediaType, search };
        if (opts.albumId) params.album = opts.albumId;
        if (tab === "loose") params.album = "loose";

        const res = await galleryAPI.listItems(params);
        let list = res.data.items || [];

        if (sortBy === "oldest") {
          list = [...list].reverse();
        } else if (sortBy === "mostViewed") {
          list = [...list].sort(
            (a, b) => (b.viewCount || 0) - (a.viewCount || 0),
          );
        }

        setItems(list);
      } catch (e) {
        setError(e?.response?.data?.message || t("gallery.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [mediaType, search, sortBy, tab, t],
  );

  useEffect(() => {
    if (openAlbum) return;
    const load = tab === "albums" ? loadAlbums : loadItems;
    const timeoutId = setTimeout(() => {
      load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [tab, openAlbum, loadAlbums, loadItems]);

  useEffect(() => {
    if (!openAlbum) return;

    const timeoutId = setTimeout(() => {
      loadItems({ albumId: openAlbum._id });
    }, 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAlbum, mediaType, sortBy]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items, selectedIds],
  );

  const toggleSelectAll = () => {
    if (allSelected) clearSelection();
    else setSelectedIds(new Set(items.map((i) => i._id)));
  };

  const openLightbox = async (item) => {
    setLightboxItem(item);
    try {
      await galleryAPI.incrementView(item._id);
    } catch {
      /* silent */
    }
  };

  const handleDownloadOne = async (item) => {
    try {
      await galleryAPI.incrementDownload(item._id);
    } catch {
      /* silent */
    }
    const a = document.createElement("a");
    a.href = item.fileUrl;
    a.download = item.fileName || `${item.mediaType}-${item._id}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await galleryAPI.bulkDownload({
        itemIds: Array.from(selectedIds),
        albumId: openAlbum?._id || null,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${openAlbum?.title || "gallery"}-media.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert(t("gallery.uploadError"));
    }
  };

  const handleDeleteItem = async (item, hard = false) => {
    const confirmMsg = hard
      ? t("gallery.confirmHardDeleteBody")
      : t("gallery.confirmDeleteBody");
    if (!window.confirm(confirmMsg)) return;
    try {
      await galleryAPI.deleteItem(item._id, { hard });
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      if (openAlbum) {
        setOpenAlbum((a) =>
          a
            ? {
                ...a,
                itemCount: Math.max(0, a.itemCount - 1),
                photoCount:
                  item.mediaType === "photo"
                    ? Math.max(0, a.photoCount - 1)
                    : a.photoCount,
                videoCount:
                  item.mediaType === "video"
                    ? Math.max(0, a.videoCount - 1)
                    : a.videoCount,
              }
            : a,
        );
      }
    } catch (e) {
      alert(e?.response?.data?.message || t("gallery.uploadError"));
    }
  };

  const handleDeleteAlbum = async (album, hard = false) => {
    if (!window.confirm(t("gallery.confirmDeleteBody"))) return;
    try {
      await galleryAPI.deleteAlbum(album._id, { hard });
      setAlbums((prev) => prev.filter((a) => a._id !== album._id));
      if (openAlbum?._id === album._id) setOpenAlbum(null);
    } catch (e) {
      alert(e?.response?.data?.message || t("gallery.uploadError"));
    }
  };

  const renderAlbumGrid = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
        gap: SPACING.lg,
      }}
    >
      {albums.map((album) => (
        <AlbumCard
          key={album._id}
          album={album}
          onOpen={() => setOpenAlbum(album)}
          onDelete={canUpload ? handleDeleteAlbum : null}
          canDelete={canDelete}
        />
      ))}
    </div>
  );

  const renderItemGrid = () => (
    <div
      style={
        viewMode === "grid"
          ? {
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 160px), 1fr))",
              gap: SPACING.md,
            }
          : {
              display: "flex",
              flexDirection: "column",
              gap: SPACING.sm,
            }
      }
    >
      {items.map((item) => (
        <GalleryItemCard
          key={item._id}
          item={item}
          viewMode={viewMode}
          selected={selectedIds.has(item._id)}
          onToggleSelect={() => toggleSelect(item._id)}
          onOpen={() => openLightbox(item)}
          onDownload={() => handleDownloadOne(item)}
          onDelete={canUpload ? () => handleDeleteItem(item) : null}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        padding: SPACING.lg,
        maxWidth: 1400,
        margin: "0 auto",
        fontFamily: F.sans,
        color: C.dark,
      }}
    >
      {/* ── Header row ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: FONT_SIZES.h2,
              fontWeight: 800,
              fontFamily: F.serif,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: C.dark,
            }}
          >
            <FiImage size={24} style={{ color: C.primary }} />
            {t("gallery.title")}
          </h1>
          <p
            style={{
              fontSize: FONT_SIZES.small,
              color: C.muted,
              margin: "4px 0 0",
            }}
          >
            {t("gallery.subtitle")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            style={iconBtnStyle()}
            title={viewMode === "grid" ? "List view" : "Grid view"}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            {viewMode === "grid" ? <FiList /> : <FiGrid />}
          </button>

          {canUpload && (
            <>
              <button
                onClick={() => setShowCreateAlbum(true)}
                style={subtleBtnStyle()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = C.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <FiPlus /> {t("gallery.createAlbum")}
              </button>
              <button
                onClick={() => {
                  setUploadAlbumId(openAlbum?._id || null);
                  setShowUpload(true);
                }}
                style={primaryBtnStyle()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 4px 14px ${C.primary}55`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 2px 8px ${C.primary}33`;
                }}
              >
                <FiUploadCloud /> {t("gallery.upload")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Album breadcrumb ──────────────────────────── */}
      {openAlbum && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: SPACING.md,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setOpenAlbum(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              color: C.primary,
              fontSize: FONT_SIZES.small,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              fontFamily: F.sans,
              textDecoration: "underline",
            }}
          >
            <FiChevronLeft size={14} /> {t("gallery.albums")}
          </button>
          <span style={{ color: C.muted, fontSize: FONT_SIZES.small }}>/</span>
          <span
            style={{
              fontWeight: 700,
              color: C.dark,
              fontSize: FONT_SIZES.body,
            }}
          >
            {openAlbum.title}
          </span>
          {openAlbum.programDate && (
            <span style={{ fontSize: FONT_SIZES.tiny, color: C.muted }}>
              · {new Date(openAlbum.programDate).toLocaleDateString()}
            </span>
          )}
          {openAlbum.location && (
            <span style={{ fontSize: FONT_SIZES.tiny, color: C.muted }}>
              · {openAlbum.location}
            </span>
          )}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────── */}
      {!openAlbum && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: SPACING.md,
          }}
        >
          {TABS.map((tabKey) => {
            const active = tab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                style={{
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${active ? C.primary : "transparent"}`,
                  marginBottom: -1,
                  fontSize: FONT_SIZES.small,
                  fontWeight: active ? 700 : 500,
                  fontFamily: F.sans,
                  color: active ? C.primary : C.muted,
                  cursor: "pointer",
                  transition: "color 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = C.dark;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = C.muted;
                }}
              >
                {t(`gallery.${TAB_LABEL_KEY[tabKey]}`)}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Filter row ────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: SPACING.sm,
          marginBottom: SPACING.md,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 220 }}>
          <FiSearch
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.muted,
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("gallery.searchPlaceholder")}
            style={{
              ...inputStyle(),
              paddingLeft: 34,
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

        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          style={selectStyle()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.primary;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          <option value="all">{t("gallery.allMedia")}</option>
          <option value="photo">{t("gallery.photos")}</option>
          <option value="video">{t("gallery.videos")}</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={selectStyle()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.primary;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          <option value="newest">{t("gallery.sortNewest")}</option>
          <option value="oldest">{t("gallery.sortOldest")}</option>
          <option value="mostViewed">{t("gallery.sortMostViewed")}</option>
        </select>

        {selectedIds.size > 0 && (
          <>
            <button
              onClick={handleBulkDownload}
              style={{
                ...primaryBtnStyle(),
                background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FiDownload />{" "}
              {t("gallery.downloadSelected").replace(
                "{{count}}",
                selectedIds.size,
              )}
            </button>
            <button
              onClick={clearSelection}
              style={subtleBtnStyle()}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.bg;
              }}
            >
              <FiX /> {t("gallery.clearSelection")}
            </button>
          </>
        )}

        {items.length > 0 && (
          <button
            onClick={toggleSelectAll}
            style={subtleBtnStyle()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.bg;
            }}
          >
            {allSelected ? t("gallery.clearSelection") : t("gallery.selectAll")}
          </button>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      {loading ? (
        <div
          style={{
            padding: "64px 0",
            textAlign: "center",
            color: C.muted,
            fontSize: FONT_SIZES.body,
          }}
        >
          {t("gallery.uploading")}
        </div>
      ) : error ? (
        <div
          style={{
            padding: "64px 0",
            textAlign: "center",
            color: C.red,
            fontSize: FONT_SIZES.body,
          }}
        >
          {error}
          <button
            onClick={() => (tab === "albums" ? loadAlbums() : loadItems())}
            style={{
              marginLeft: 12,
              background: "none",
              border: "none",
              color: C.primary,
              textDecoration: "underline",
              cursor: "pointer",
              fontFamily: F.sans,
              fontSize: FONT_SIZES.small,
            }}
          >
            {t("gallery.retry")}
          </button>
        </div>
      ) : tab === "albums" && !openAlbum ? (
        albums.length === 0 ? (
          <EmptyState
            icon={<FiFolder />}
            text={t("gallery.emptyAlbums")}
            action={
              canUpload
                ? {
                    label: t("gallery.createAlbum"),
                    onClick: () => setShowCreateAlbum(true),
                  }
                : null
            }
          />
        ) : (
          renderAlbumGrid()
        )
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FiImage />}
          text={openAlbum ? t("gallery.emptyAlbum") : t("gallery.noResults")}
          action={
            canUpload
              ? {
                  label: t("gallery.uploadMedia"),
                  onClick: () => {
                    setUploadAlbumId(openAlbum?._id || null);
                    setShowUpload(true);
                  },
                }
              : null
          }
        />
      ) : (
        renderItemGrid()
      )}

      {/* ── Modals ────────────────────────────────────── */}
      {showCreateAlbum && (
        <CreateAlbumModal
          onClose={() => setShowCreateAlbum(false)}
          onCreated={(album) => {
            setAlbums((prev) => [album, ...prev]);
            setShowCreateAlbum(false);
          }}
        />
      )}

      {showUpload && (
        <GalleryUpload
          albumId={uploadAlbumId}
          albums={albums}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            if (openAlbum) loadItems({ albumId: openAlbum._id });
            else if (tab === "albums") loadAlbums();
            else loadItems();
          }}
        />
      )}

      {lightboxItem && (
        <GalleryLightbox
          items={items}
          current={lightboxItem}
          onClose={() => setLightboxItem(null)}
          onNavigate={(item) => setLightboxItem(item)}
          onDownload={handleDownloadOne}
          canEdit={canUpload && lightboxItem.mediaType === "photo"}
          onUpdated={(updated) =>
            setItems((prev) =>
              prev.map((i) => (i._id === updated._id ? updated : i)),
            )
          }
        />
      )}
    </div>
  );
};

// ─── Empty state ───────────────────────────────────────────
const EmptyState = ({ icon, text, action }) => (
  <div
    style={{
      padding: "64px 0",
      textAlign: "center",
      color: C.muted,
      fontFamily: F.sans,
    }}
  >
    <div
      style={{
        fontSize: 44,
        marginBottom: SPACING.sm,
        display: "flex",
        justifyContent: "center",
        color: C.primary,
        opacity: 0.45,
      }}
    >
      {icon}
    </div>
    <p style={{ fontSize: FONT_SIZES.body, margin: 0 }}>{text}</p>
    {action && (
      <button
        onClick={action.onClick}
        style={{
          marginTop: SPACING.md,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
          color: "#fff",
          border: "none",
          borderRadius: radius.md,
          fontSize: FONT_SIZES.small,
          fontWeight: 700,
          fontFamily: F.sans,
          cursor: "pointer",
          boxShadow: `0 2px 8px ${C.primary}33`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = `0 4px 14px ${C.primary}55`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `0 2px 8px ${C.primary}33`;
        }}
      >
        {action.label}
      </button>
    )}
  </div>
);

export default Gallery;
