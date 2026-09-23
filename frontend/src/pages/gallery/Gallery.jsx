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
import { useLanguage } from "../../constants/translations";
import { galleryAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
      className={
        viewMode === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          : "flex flex-col gap-2"
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiImage /> {t("gallery.title")}
          </h1>
          <p className="text-sm text-gray-500">{t("gallery.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-800"
            title={viewMode === "grid" ? "List view" : "Grid view"}
          >
            {viewMode === "grid" ? <FiList /> : <FiGrid />}
          </button>

          {canUpload && (
            <>
              <button
                onClick={() => setShowCreateAlbum(true)}
                className="flex items-center gap-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              >
                <FiPlus /> {t("gallery.createAlbum")}
              </button>
              <button
                onClick={() => {
                  setUploadAlbumId(openAlbum?._id || null);
                  setShowUpload(true);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                <FiUploadCloud /> {t("gallery.upload")}
              </button>
            </>
          )}
        </div>
      </div>

      {openAlbum && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setOpenAlbum(null)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <FiChevronLeft /> {t("gallery.albums")}
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-semibold">{openAlbum.title}</span>
          {openAlbum.programDate && (
            <span className="text-xs text-gray-500">
              · {new Date(openAlbum.programDate).toLocaleDateString()}
            </span>
          )}
          {openAlbum.location && (
            <span className="text-xs text-gray-500">
              · {openAlbum.location}
            </span>
          )}
        </div>
      )}

      {!openAlbum && (
        <div className="flex flex-wrap gap-1 border-b mb-4">
          {TABS.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${
                tab === tabKey
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t(`gallery.${TAB_LABEL_KEY[tabKey]}`)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("gallery.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">{t("gallery.allMedia")}</option>
          <option value="photo">{t("gallery.photos")}</option>
          <option value="video">{t("gallery.videos")}</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="newest">{t("gallery.sortNewest")}</option>
          <option value="oldest">{t("gallery.sortOldest")}</option>
          <option value="mostViewed">{t("gallery.sortMostViewed")}</option>
        </select>

        {selectedIds.size > 0 && (
          <>
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-1 px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700"
            >
              <FiDownload />{" "}
              {t("gallery.downloadSelected").replace(
                "{{count}}",
                selectedIds.size,
              )}
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm"
            >
              <FiX /> {t("gallery.clearSelection")}
            </button>
          </>
        )}

        {items.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="px-3 py-2 text-sm rounded border hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {allSelected ? t("gallery.clearSelection") : t("gallery.selectAll")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          {t("gallery.uploading")}
        </div>
      ) : error ? (
        <div className="py-16 text-center text-red-600">
          {error}
          <button
            onClick={() => (tab === "albums" ? loadAlbums() : loadItems())}
            className="ml-3 underline"
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

const EmptyState = ({ icon, text, action }) => (
  <div className="py-16 text-center text-gray-500">
    <div className="text-4xl mb-2 flex justify-center">{icon}</div>
    <p>{text}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default Gallery;
