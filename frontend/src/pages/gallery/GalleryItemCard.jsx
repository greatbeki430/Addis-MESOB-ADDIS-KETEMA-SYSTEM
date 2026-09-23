// frontend/src/pages/gallery/GalleryItemCard.jsx
import { FiVideo, FiDownload, FiTrash2, FiCheck } from "react-icons/fi";
import { useLanguage } from "../../constants/translations";

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

  if (viewMode === "list") {
    return (
      <div
        className={`flex items-center gap-3 p-2 rounded border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
          selected ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="accent-blue-600"
        />
        <div
          onClick={onOpen}
          className="w-20 h-14 rounded overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0 cursor-pointer relative"
        >
          <img
            src={thumb}
            alt={item.caption || item.fileName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isVideo && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
              <FiVideo />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {item.caption || item.fileName || t(`gallery.${item.mediaType}`)}
          </p>
          <p className="text-xs text-gray-500">
            {item.uploadedByName} ·{" "}
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onDownload}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title={t("gallery.download")}
        >
          <FiDownload />
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
            title={t("gallery.delete")}
          >
            <FiTrash2 />
          </button>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`group relative aspect-square rounded-lg overflow-hidden border dark:border-gray-700 bg-gray-100 dark:bg-gray-900 cursor-pointer ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={onOpen}
    >
      <img
        src={thumb}
        alt={item.caption || item.fileName}
        className="w-full h-full object-cover group-hover:scale-105 transition"
        loading="lazy"
      />

      {isVideo && (
        <>
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-3xl">
            ▶
          </div>
          {item.duration > 0 && (
            <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
              {formatDuration(item.duration)}
            </span>
          )}
        </>
      )}

      {/* Selection checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
          selected
            ? "bg-blue-600 border-blue-600 text-white"
            : "bg-black/40 border-white/70 text-transparent opacity-0 group-hover:opacity-100"
        }`}
      >
        <FiCheck size={12} />
      </button>

      {/* Hover actions */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-1.5 rounded bg-black/60 text-white hover:bg-black/80"
          title={t("gallery.download")}
        >
          <FiDownload size={12} />
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded bg-red-600/80 text-white hover:bg-red-700"
            title={t("gallery.delete")}
          >
            <FiTrash2 size={12} />
          </button>
        )}
      </div>

      {/* Caption overlay */}
      {item.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 truncate">
          {item.caption}
        </div>
      )}
    </div>
  );
};

export default GalleryItemCard;
