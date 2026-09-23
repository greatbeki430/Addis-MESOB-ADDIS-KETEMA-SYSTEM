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
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

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

// ─── Shared styles ─────────────────────────────────────────
const labelStyle = () => ({
  display: "block",
  fontSize: FONT_SIZES.small,
  fontWeight: 600,
  color: C.dark,
  marginBottom: 6,
  fontFamily: F.sans,
});

const fieldStyle = (disabled = false) => ({
  width: "100%",
  padding: "9px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: radius.md,
  fontSize: FONT_SIZES.body,
  fontFamily: F.sans,
  color: C.dark,
  background: disabled ? C.bg : "#fff",
  cursor: disabled ? "not-allowed" : "text",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
});

const focusHandlers = {
  onFocus: (e) => {
    e.currentTarget.style.borderColor = C.primary;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
  },
  onBlur: (e) => {
    e.currentTarget.style.borderColor = C.border;
    e.currentTarget.style.boxShadow = "none";
  },
};

const BAR_PADDING = `${SPACING.md} ${SPACING.lg}`;

const GalleryUpload = ({
  albumId = null,
  albums = [],
  onClose,
  onUploaded,
}) => {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

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
    setDragOver(false);
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
  const albumLocked = Boolean(albumId);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(13,26,94,0.55)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        padding: SPACING.md,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: radius.xl,
          boxShadow: "0 20px 60px rgba(13,26,94,0.35)",
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: F.sans,
          overflow: "hidden",
        }}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: BAR_PADDING,
            borderBottom: `2px solid ${C.primary}22`,
          }}
        >
          <h2
            style={{
              fontSize: FONT_SIZES.h3,
              fontWeight: 700,
              fontFamily: F.serif,
              color: C.dark,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiUploadCloud size={20} style={{ color: C.primary }} />
            {t("gallery.uploadMedia")}
          </h2>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              background: "transparent",
              border: "none",
              borderRadius: radius.sm,
              color: C.muted,
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.5 : 1,
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.color = C.dark;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.muted;
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: SPACING.lg,
            display: "flex",
            flexDirection: "column",
            gap: SPACING.md,
          }}
        >
          {/* Album selector */}
          <div>
            <label style={labelStyle()}>{t("gallery.album")}</label>
            <select
              value={targetAlbumId}
              onChange={(e) => setTargetAlbumId(e.target.value)}
              disabled={albumLocked || uploading}
              style={{
                ...fieldStyle(albumLocked || uploading),
                cursor: albumLocked || uploading ? "not-allowed" : "pointer",
              }}
              {...(albumLocked || uploading ? {} : focusHandlers)}
            >
              <option value="loose">{t("gallery.looseUploads")}</option>
              {albums.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragOver) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? C.primary : C.border}`,
              borderRadius: radius.lg,
              padding: `${SPACING.xl} ${SPACING.lg}`,
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? `${C.primary}0a` : C.cardBg,
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
          >
            <FiUploadCloud
              size={32}
              style={{
                color: dragOver ? C.primary : C.muted,
                marginBottom: 8,
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <p
              style={{
                fontSize: FONT_SIZES.body,
                color: C.dark,
                margin: 0,
                fontFamily: F.sans,
              }}
            >
              {t("gallery.dragDropHere")}
            </p>
            <p
              style={{
                fontSize: FONT_SIZES.small,
                color: C.muted,
                margin: "4px 0 0",
                fontFamily: F.sans,
              }}
            >
              {t("gallery.dragDropHint")}
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => addFiles(Array.from(e.target.files))}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {files.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING.sm,
                    padding: "8px 10px",
                    borderRadius: radius.md,
                    border: `1px solid ${entry.error ? `${C.red}55` : C.border}`,
                    background: entry.error ? "#fef2f2" : "#fff",
                  }}
                >
                  {entry.preview ? (
                    <img
                      src={entry.preview}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: radius.sm,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: C.bg,
                        borderRadius: radius.sm,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.muted,
                        flexShrink: 0,
                      }}
                    >
                      <FiUploadCloud size={14} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: FONT_SIZES.small,
                        color: C.dark,
                        margin: 0,
                        fontFamily: F.sans,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={entry.file.name}
                    >
                      {entry.file.name}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: C.muted,
                        margin: "2px 0 0",
                        fontFamily: F.sans,
                      }}
                    >
                      {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {entry.error && (
                      <p
                        style={{
                          fontSize: 10,
                          color: C.red,
                          margin: "2px 0 0",
                          fontFamily: F.sans,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FiAlertCircle size={10} /> {entry.error}
                      </p>
                    )}
                  </div>

                  {entry.status === "ready" ? (
                    <button
                      onClick={() => removeFile(idx)}
                      disabled={uploading}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 6,
                        background: "transparent",
                        border: "none",
                        borderRadius: radius.sm,
                        color: C.red,
                        cursor: uploading ? "not-allowed" : "pointer",
                        opacity: uploading ? 0.5 : 1,
                        flexShrink: 0,
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!uploading)
                          e.currentTarget.style.background = "#fee2e2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  ) : (
                    <FiCheck
                      size={16}
                      style={{ color: "#16a34a", flexShrink: 0 }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Shared metadata fields */}
          {files.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: SPACING.sm,
              }}
            >
              <div>
                <label style={labelStyle()}>{t("gallery.caption")}</label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t("gallery.captionPlaceholder")}
                  style={fieldStyle()}
                  {...focusHandlers}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: SPACING.sm,
                }}
              >
                <div>
                  <label style={labelStyle()}>{t("gallery.capturedAt")}</label>
                  <input
                    type="date"
                    value={capturedAt}
                    onChange={(e) => setCapturedAt(e.target.value)}
                    style={fieldStyle()}
                    {...focusHandlers}
                  />
                </div>
                <div>
                  <label style={labelStyle()}>{t("gallery.tags")}</label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t("gallery.tagsPlaceholder")}
                    style={fieldStyle()}
                    {...focusHandlers}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
                padding: `${SPACING.sm} 0`,
              }}
            >
              <div
                style={{
                  fontSize: FONT_SIZES.small,
                  color: C.muted,
                  fontFamily: F.sans,
                }}
              >
                {t("gallery.uploadProgress")
                  .replace("{{done}}", progress.done)
                  .replace("{{total}}", progress.total)}
              </div>
              {currentFilePct > 0 && currentFilePct < 100 && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: 400,
                    height: 6,
                    background: C.bg,
                    borderRadius: radius.pill,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${currentFilePct}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${C.primary}, ${C.light})`,
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: SPACING.sm,
            padding: BAR_PADDING,
            borderTop: `1px solid ${C.border}`,
            background: C.cardBg,
          }}
        >
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              padding: "9px 20px",
              background: "#fff",
              color: C.dark,
              border: `1.5px solid ${C.border}`,
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 600,
              fontFamily: F.sans,
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.borderColor = C.primary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            {t("gallery.cancel")}
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || readyCount === 0}
            style={{
              padding: "9px 22px",
              background:
                uploading || readyCount === 0
                  ? C.muted
                  : `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              color: "#fff",
              border: "none",
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 700,
              fontFamily: F.sans,
              cursor: uploading || readyCount === 0 ? "not-allowed" : "pointer",
              opacity: uploading || readyCount === 0 ? 0.5 : 1,
              boxShadow:
                uploading || readyCount === 0
                  ? "none"
                  : `0 3px 12px ${C.primary}44`,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!uploading && readyCount > 0) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 6px 18px ${C.primary}55`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                uploading || readyCount === 0
                  ? "none"
                  : `0 3px 12px ${C.primary}44`;
            }}
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
