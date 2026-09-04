// backend/src/middleware/galleryUpload.js
// Multer config for the bulk multi-file-type gallery upload. Uses the
// same memoryStorage pattern already proven in uploadRoutes.js.
//
// Multer only supports ONE fileSize ceiling for the whole request, so we
// set it to the largest allowed (video) here, then enforce the real
// per-type ceilings in the route handler after each file is fully
// received and its true type is known via magic-number sniffing.

const multer = require("multer");

const MAX_FILES_PER_UPLOAD = 20;
const MULTER_HARD_CEILING_BYTES = 100 * 1024 * 1024; // 100MB — video's limit

const ALLOWED_MIME_PREFIXES_OR_TYPES = [
  "image/", // covers jpeg/png/webp/gif etc.
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/",
];

const isAllowedMime = (mimetype) =>
  ALLOWED_MIME_PREFIXES_OR_TYPES.some((allowed) =>
    allowed.endsWith("/") ? mimetype.startsWith(allowed) : mimetype === allowed,
  );
const storage = multer.memoryStorage();

const galleryUpload = multer({
  storage: storage,
  limits: {
    fileSize: MULTER_HARD_CEILING_BYTES,
    files: MAX_FILES_PER_UPLOAD,
  },
  fileFilter: (req, file, cb) => {
    console.log(
      "🔍 [MULTER] File received:",
      file.originalname,
      file.mimetype,
      file.size,
    );
    if (isAllowedMime(file.mimetype)) {
      cb(null, true);
    } else {
      console.log(
        "❌ [MULTER] Rejected file:",
        file.originalname,
        file.mimetype,
      );
      cb(
        new Error(
          `UNSUPPORTED_FILE_TYPE:${file.originalname}:${file.mimetype}`,
        ),
      );
    }
  },
});

// Real, per-family size ceilings — enforced manually in the route after
// upload (see note above on why multer alone can't do this).
const SIZE_LIMITS_BYTES = {
  image: 10 * 1024 * 1024,
  pdf: 10 * 1024 * 1024,
  presentation: 10 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  other: 10 * 1024 * 1024,
};

module.exports = { galleryUpload, SIZE_LIMITS_BYTES, MAX_FILES_PER_UPLOAD };
