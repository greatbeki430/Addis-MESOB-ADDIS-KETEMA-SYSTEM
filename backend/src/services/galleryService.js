// backend/src/services/galleryService.js
// Cloudinary helpers for Gallery photos and videos.

const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

// ─── Config ────────────────────────────────────────────────
const PHOTO_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const VIDEO_MAX_BYTES = 100 * 1024 * 1024; // 100 MB (Cloudinary free-tier per-file cap)

const GALLERY_ROOT_FOLDER = "gallery";

// How long a signature is valid before the client must re-request it.
// Short on purpose — the client gets one just before it starts uploading.
const SIGNATURE_TTL_SECONDS = 10 * 60; // 10 minutes

// ─── Mime → media type ─────────────────────────────────────
const getMediaType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  return null;
};

// ─── Cloudinary resource_type per media type ───────────────
const cloudResourceType = (mediaType) =>
  mediaType === "video" ? "video" : "image";

// ─── Build a Cloudinary thumbnail URL for a video ──────────
const buildVideoThumbnailUrl = (secureUrl) => {
  if (!secureUrl) return "";
  return secureUrl
    .replace(/\.(mp4|mov|webm|mkv|avi|m4v)$/i, ".jpg")
    .replace("/upload/", "/upload/so_0,w_600,h_400,c_fill,q_auto,f_auto/");
};

// ─── Build a Cloudinary thumbnail URL for a photo ──────────
const buildPhotoThumbnailUrl = (secureUrl) => {
  if (!secureUrl) return "";
  return secureUrl.replace(
    "/upload/",
    "/upload/w_600,h_400,c_fill,q_auto,f_auto/",
  );
};

// ─── Compute the folder an item belongs in ─────────────────
const computeFolder = (albumId) =>
  albumId
    ? `${GALLERY_ROOT_FOLDER}/albums/${albumId}`
    : `${GALLERY_ROOT_FOLDER}/loose`;

// ─── Sign a direct upload ──────────────────────────────────
// Returns everything the browser needs to POST a file directly to
// Cloudinary's upload API. No file bytes ever touch this server.
//
// Cloudinary's signature spec: take all params that will be sent in the
// upload request (EXCEPT file, api_key, and cloud_name), sort keys
// alphabetically, join as `k=v&k=v`, append the API secret, sha1 the whole
// string. The client sends the same params plus the signature + api_key.
const signUpload = ({ mediaType, albumId, userId }) => {
  const resourceType = cloudResourceType(mediaType);
  const folder = computeFolder(albumId);
  const timestamp = Math.floor(Date.now() / 1000);

  // Params that will be included in the signature. Keep this list in
  // sync with what GalleryUpload.jsx sends in its FormData — Cloudinary
  // rejects the upload if the signature doesn't cover every signed param.
  const paramsToSign = {
    folder,
    timestamp,
    // A per-user, per-album tag lets us audit and bulk-clean later.
    tags: `gallery,${mediaType},user_${userId}`,
  };

  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(toSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    resourceType, // "image" | "video"
    folder,
    tags: paramsToSign.tags,
    maxBytes: mediaType === "video" ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES,
    expiresInSeconds: SIGNATURE_TTL_SECONDS,
  };
};

// ─── Verify a Cloudinary public_id actually exists ─────────
// Called during finalize so the client can't invent metadata for a file
// that was never uploaded. `resource_type` is required because
// image and video share the same public_id namespace.
const verifyCloudinaryAsset = async (publicId, mediaType) => {
  const result = await cloudinary.api.resource(publicId, {
    resource_type: cloudResourceType(mediaType),
  });
  return result;
};

// ─── Delete one file from Cloudinary ───────────────────────
const deleteGalleryFile = async (publicId, mediaType = "photo") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: cloudResourceType(mediaType),
      invalidate: true,
    });
  } catch (err) {
    console.warn(
      `[galleryService] Cloudinary delete failed for ${publicId}:`,
      err.message,
    );
  }
};

module.exports = {
  signUpload,
  verifyCloudinaryAsset,
  deleteGalleryFile,
  getMediaType,
  buildVideoThumbnailUrl,
  buildPhotoThumbnailUrl,
  computeFolder,
  cloudResourceType,
  PHOTO_MAX_BYTES,
  VIDEO_MAX_BYTES,
  SIGNATURE_TTL_SECONDS,
};
