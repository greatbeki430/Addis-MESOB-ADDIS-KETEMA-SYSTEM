// backend/src/services/galleryDedupService.js
// Two-tier duplicate detection:
//  - Every file type: exact SHA-256 match on raw bytes.
//  - Images only: perceptual hash (pHash) + Hamming distance, catching
//    visually-similar-but-not-byte-identical re-uploads. This can produce
//    false positives on genuinely different photos that happen to look
//    similar (e.g. two shots of the same group a few seconds apart) — a
//    tradeoff you asked for explicitly. PHASH_DISTANCE_THRESHOLD is the
//    dial to loosen/tighten that tradeoff after seeing real results.

const crypto = require("crypto");
const sharp = require("sharp");
const blockhash = require("blockhash-core");
const GoldenMondayGallery = require("../models/GoldenMondayGallery");

// Lower = stricter (fewer false positives, more missed near-duplicates).
// Starting point only — tune after watching real uploads.
const PHASH_DISTANCE_THRESHOLD = 12;
const PHASH_BITS = 16; // blockhash-core's block grid size

const computeContentHash = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

// Returns null (not a hash) if the buffer isn't a decodable image — this
// is intentional fail-open behavior: a hashing failure should never block
// an upload, it should just skip perceptual dedup for that file.
const computePerceptualHash = async (buffer) => {
  try {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(256, 256, { fit: "fill" })
      .toBuffer({ resolveWithObject: true });

    const imageData = { data, width: info.width, height: info.height };
    return blockhash.bmvbhash(imageData, PHASH_BITS);
  } catch (err) {
    console.warn(
      "[galleryDedup] Perceptual hash failed, skipping:",
      err.message,
    );
    return null;
  }
};

const hammingDistance = (hashA, hashB) => {
  if (!hashA || !hashB || hashA.length !== hashB.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance++;
  }
  return distance;
};

/**
 * Looks for a duplicate within the same fileType subfolder only — a PDF
 * and an image are never compared against each other.
 */
const findDuplicateInFolder = async ({
  folderId,
  fileType,
  contentHash,
  perceptualHash,
}) => {
  // Exact match first — cheap and unambiguous.
  const exactMatch = await GoldenMondayGallery.findOne({
    folder: folderId,
    contentHash,
  });
  if (exactMatch) return { match: exactMatch, reason: "exact" };

  if (fileType === "image" && perceptualHash) {
    const candidates = await GoldenMondayGallery.find({
      folder: folderId,
      fileType: "image",
      perceptualHash: { $ne: "" },
    }).select("perceptualHash title originalFilename url thumbnailUrl");

    for (const candidate of candidates) {
      const distance = hammingDistance(
        perceptualHash,
        candidate.perceptualHash,
      );
      if (distance <= PHASH_DISTANCE_THRESHOLD) {
        return { match: candidate, reason: "similar", distance };
      }
    }
  }

  return { match: null, reason: null };
};

module.exports = {
  computeContentHash,
  computePerceptualHash,
  hammingDistance,
  findDuplicateInFolder,
  PHASH_DISTANCE_THRESHOLD,
};
