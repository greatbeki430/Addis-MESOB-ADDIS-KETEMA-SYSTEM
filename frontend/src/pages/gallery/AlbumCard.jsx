// frontend/src/pages/gallery/AlbumCard.jsx
import { FiFolder, FiImage, FiVideo, FiTrash2 } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
const AlbumCard = ({ album, onOpen, onDelete, canDelete }) => {
  const { t } = useLanguage();

  const dateLabel = album.programDate
    ? new Date(album.programDate).toLocaleDateString()
    : new Date(album.createdAt).toLocaleDateString();

  return (
    <div className="group relative rounded-lg overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
      {/* Cover */}
      <button
        onClick={onOpen}
        className="block w-full aspect-video bg-gray-100 dark:bg-gray-900 relative"
      >
        {album.coverImage?.url ? (
          <img
            src={album.coverImage.url}
            alt={album.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FiFolder size={40} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1 text-xs">
          {album.photoCount > 0 && (
            <span className="bg-black/60 text-white rounded px-2 py-0.5 flex items-center gap-1">
              <FiImage size={12} /> {album.photoCount}
            </span>
          )}
          {album.videoCount > 0 && (
            <span className="bg-black/60 text-white rounded px-2 py-0.5 flex items-center gap-1">
              <FiVideo size={12} /> {album.videoCount}
            </span>
          )}
        </div>
      </button>

      {/* Body */}
      <div className="p-3">
        <button onClick={onOpen} className="text-left w-full">
          <h3 className="font-semibold truncate">{album.title}</h3>
        </button>
        <p className="text-xs text-gray-500 mt-0.5">
          {dateLabel}
          {album.location ? ` · ${album.location}` : ""}
        </p>
        {album.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {album.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete button */}
      {canDelete && onDelete && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(album, false);
            }}
            className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"
            title={t("gallery.deleteAlbum")}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AlbumCard;
