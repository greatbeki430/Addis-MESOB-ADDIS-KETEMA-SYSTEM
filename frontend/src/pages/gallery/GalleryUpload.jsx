// frontend/src/pages/gallery/GalleryUpload.jsx
import { useState, useRef, useCallback } from "react";
import {
  FiX,
  FiUploadCloud,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { useLanguage } from "../../constants/translations";
import { galleryAPI } from "../../services/api";

const MAX_PHOTO_MB = 25;
const MAX_VIDEO_MB = 200;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const GalleryUpload = ({
  albumId = null,
  albums = [],
  onClose,
  onUploaded,
}) => {
  const { t } = useLanguage();
  const inputRef = useRef(null);

  const [targetAlbumId, setTargetAlbumId] = useState(albumId || "loose");
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const addFiles = useCallback(
    (incoming) => {
      const next = [];
      for (const f of incoming) {
        const isImage = f.type.startsWith("image/");
        const isVideo = f.type.startsWith("video/");
        if (!isImage && !isVideo) {
          next.push({
            file: f,
            status: "error",
            error: t("gallery.unsupportedType"),
          });
          continue;
        }
        const maxMB = isVideo ? MAX_VIDEO_MB : MAX_PHOTO_MB;
        if (f.size > maxMB * 1024 * 1024) {
          next.push({
            file: f,
            status: "error",
            error: `${t("gallery.fileTooLarge")} (max ${maxMB}MB)`,
          });
          continue;
        }
        next.push({
          file: f,
          preview: isImage ? URL.createObjectURL(f) : null,
          status: "ready",
          error: null,
        });
      }
      setFiles((prev) => [...prev, ...next]);
    },
    [t],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    const ready = files.filter((f) => f.status === "ready");
    if (ready.length === 0) return;

    setUploading(true);
    setProgress({ done: 0, total: ready.length });

    const payload = [];
    for (const entry of ready) {
      try {
        const b64 = await fileToBase64(entry.file);
        payload.push({
          file: b64,
          fileName: entry.file.name,
          caption,
          capturedAt: capturedAt || undefined,
          tags,
        });
      } catch {
        /* skip */
      }
    }

    try {
      const res = await galleryAPI.uploadItems(targetAlbumId, payload);
      setProgress({ done: ready.length, total: ready.length });
      onUploaded?.(res.data);
    } catch (e) {
      alert(e?.response?.data?.message || t("gallery.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const readyCount = files.filter((f) => f.status === "ready").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h2 className="font-semibold flex items-center gap-2">
            <FiUploadCloud /> {t("gallery.uploadMedia")}
          </h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gallery.album")}
            </label>
            <select
              value={targetAlbumId}
              onChange={(e) => setTargetAlbumId(e.target.value)}
              disabled={!!albumId || uploading}
              className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="loose">{t("gallery.looseUploads")}</option>
              {albums.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition"
          >
            <FiUploadCloud className="mx-auto text-3xl text-gray-400 mb-2" />
            <p className="text-sm">{t("gallery.dragDropHere")}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t("gallery.dragDropHint")}
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files))}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded border dark:border-gray-700"
                >
                  {entry.preview ? (
                    <img
                      src={entry.preview}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <FiUploadCloud size={14} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{entry.file.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {entry.error && (
                      <p className="text-[10px] text-red-600 flex items-center gap-1">
                        <FiAlertCircle size={10} /> {entry.error}
                      </p>
                    )}
                  </div>
                  {entry.status === "ready" ? (
                    <button
                      onClick={() => removeFile(idx)}
                      disabled={uploading}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  ) : (
                    <FiCheck className="text-green-600" />
                  )}
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("gallery.caption")}
                </label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t("gallery.captionPlaceholder")}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("gallery.capturedAt")}
                  </label>
                  <input
                    type="date"
                    value={capturedAt}
                    onChange={(e) => setCapturedAt(e.target.value)}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("gallery.tags")}
                  </label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t("gallery.tagsPlaceholder")}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="text-sm text-center text-gray-600 dark:text-gray-300">
              {t("gallery.uploadProgress")
                .replace("{{done}}", progress.done)
                .replace("{{total}}", progress.total)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t("gallery.cancel")}
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || readyCount === 0}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading
              ? t("gallery.uploading")
              : `${t("gallery.upload")} (${readyCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryUpload;
