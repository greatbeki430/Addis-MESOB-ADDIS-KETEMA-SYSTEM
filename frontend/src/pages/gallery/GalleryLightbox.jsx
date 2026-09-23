// frontend/src/pages/gallery/GalleryLightbox.jsx
import { useEffect, useState, useCallback } from "react";
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
  // updating state from an effect.
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

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="text-sm opacity-80">
          {index + 1} {t("gallery.of")} {items.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload(current)}
            className="p-2 rounded hover:bg-white/10"
            title={t("gallery.download")}
          >
            <FiDownload />
          </button>
          {canEdit && (
            <button
              onClick={() => setEditing((v) => !v)}
              className="p-2 rounded hover:bg-white/10"
              title={t("gallery.edit")}
            >
              <FiEdit2 />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10"
            title={t("gallery.close")}
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Media area */}
      <div className="flex-1 flex items-center justify-center relative">
        {hasPrev && (
          <button
            onClick={goPrev}
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
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
            className="max-h-full max-w-full"
          />
        ) : (
          <img
            key={current._id}
            src={current.fileUrl}
            alt={current.caption || current.fileName}
            className="max-h-full max-w-full object-contain"
          />
        )}

        {hasNext && (
          <button
            onClick={goNext}
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <FiChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom panel — caption + tags + AI editing */}
      <div className="bg-black/70 text-white px-4 py-3 border-t border-white/10">
        {editing ? (
          <div className="space-y-2 max-w-3xl mx-auto">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t("gallery.captionPlaceholder")}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("gallery.tagsPlaceholder")}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20"
              >
                {t("gallery.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={busy}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
              >
                <FiSave /> {busy ? t("gallery.uploading") : t("gallery.save")}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {current.caption && (
              <p className="text-sm mb-1">{current.caption}</p>
            )}
            {current.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {current.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {canEdit && !isVideo && (
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => handleAiEdit("background_removed")}
                  disabled={aiBusy}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  <FiZap /> {t("gallery.removeBackground")}
                </button>
                <button
                  onClick={() => handleAiEdit("enhanced")}
                  disabled={aiBusy}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FiZap /> {t("gallery.enhancePhoto")}
                </button>
                {current.aiEdited && (
                  <button
                    onClick={handleRestore}
                    disabled={aiBusy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  >
                    <FiRotateCcw /> {t("gallery.restoreOriginal")}
                  </button>
                )}
                {aiBusy && (
                  <span className="text-xs opacity-70 self-center">
                    {t("gallery.aiProcessing")}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryLightbox;
