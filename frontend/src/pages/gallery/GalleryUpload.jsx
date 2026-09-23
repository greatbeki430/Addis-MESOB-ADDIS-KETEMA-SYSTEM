// frontend/src/pages/gallery/GalleryUpload.jsx
import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiUploadCloud,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { galleryAPI } from "../../services/api";

const MAX_PHOTO_MB = 25;
const MAX_VIDEO_MB = 100; // Cloudinary free-tier per-file limit

// POST one file directly to Cloudinary using the signed params the backend
// issued. Uses XHR (not fetch/axios) specifically to get real upload
// progress events.
const uploadToCloudinary = (file, signature, onProgress) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    // Cloudinary expects: file, then signed params, then api_key + signature.
    // The signature itself is NOT part of what's signed — only its inputs are.
    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", signature.timestamp);
    formData.append("folder", signature.folder);
    formData.append("tags", signature.tags);
    formData.append("signature", signature.signature);

    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;

    xhr.open("POST", url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let body;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error("Cloudinary returned invalid JSON."));
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
      } else {
        reject(
          new Error(
            body?.error?.message || `Cloudinary upload failed (${xhr.status}).`,
          ),
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network error during Cloudinary upload."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    xhr.send(formData);
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
  const [currentFilePct, setCurrentFilePct] = useState(0);

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
    setCurrentFilePct(0);

    let succeeded = 0;
    const errors = [];

    for (const entry of ready) {
      const file = entry.file;
      const mediaType = file.type.startsWith("video/") ? "video" : "photo";

      try {
        // 1. Signature from our backend
        const sigRes = await galleryAPI.getUploadSignature(
          mediaType,
          targetAlbumId === "loose" ? null : targetAlbumId,
        );
        const signature = sigRes.data;

        // 2. Direct upload to Cloudinary, with real progress
        setCurrentFilePct(0);
        const cloudRes = await uploadToCloudinary(
          file,
          signature,
          setCurrentFilePct,
        );

        // 3. Persist metadata
        await galleryAPI.finalizeItem(targetAlbumId, {
          cloudinaryPublicId: cloudRes.public_id,
          cloudinaryUrl: cloudRes.secure_url,
          cloudinaryResourceType: cloudRes.resource_type,
          mediaType,
          fileName: cloudRes.original_filename || file.name,
          fileSize: cloudRes.bytes || file.size,
          mimeType: file.type,
          width: cloudRes.width || 0,
          height: cloudRes.height || 0,
          duration: cloudRes.duration || 0,
          caption,
          capturedAt: capturedAt || undefined,
          tags,
        });

        succeeded += 1;
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        errors.push({ fileName: file.name, error: err.message });
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        setCurrentFilePct(0);
      }
    }

    setUploading(false);

    if (errors.length === 0) {
      onUploaded?.({ success: true, count: succeeded });
    } else if (succeeded === 0) {
      alert(errors[0].error || t("gallery.uploadError"));
    } else {
      alert(
        `${succeeded} uploaded, ${errors.length} failed. First error: ${errors[0].error}`,
      );
      onUploaded?.({ success: true, count: succeeded, failed: errors.length });
    }
  };

  const readyCount = files.filter((f) => f.status === "ready").length;

  return createPortal(
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
            <div className="text-sm text-center text-gray-600 dark:text-gray-300 space-y-1">
              <div>
                {t("gallery.uploadProgress")
                  .replace("{{done}}", progress.done)
                  .replace("{{total}}", progress.total)}
              </div>
              {currentFilePct > 0 && currentFilePct < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${currentFilePct}%` }}
                  />
                </div>
              )}
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
    </div>,
    document.body,
  );
};

export default GalleryUpload;
