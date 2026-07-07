// backend/src/services/goldenMondayRecordingService.js
//
// ── How recordings are handled ──────────────────────────────────────
//
// Each Monday's presentation can be recorded and uploaded (video, base64
// data-URL, same pattern already used for document uploads). The
// recording is deliberately *temporary*:
//
//   - It's stored on Cloudinary as a video resource, reusing the same
//     credentials/config already set up for the document vault — no new
//     infrastructure needed.
//   - It stays visible/downloadable to staff for `recordingVisibleDays`
//     (default 7 — i.e. "posted for the rest of that week"), configurable
//     per upload by an admin for a longer highlight if needed.
//   - Expiry is enforced two ways, so nothing depends on a single point
//     of failure:
//       1. Lazily, on every read: `session.isRecordingLive()` is checked
//          before a URL is ever handed to the frontend, so an expired
//          recording is invisible even if the sweep job hasn't run yet.
//       2. Actively, by a daily cron sweep (see jobs/goldenMondayScheduler.js)
//          that deletes the Cloudinary asset and clears the DB fields for
//          anything past its expiry, so storage doesn't grow forever.
//   - We store the raw video as `raw`/`video` resource type and keep the
//     Cloudinary `publicId` so the sweep can actually delete the asset,
//     not just hide the link.
//
// Why expire at all instead of keeping everything? Golden Monday is a
// weekly habit-building program, not an archive: the goal is that people
// who miss a session can catch up within the week, not that every talk
// becomes a permanent video library (which also keeps Cloudinary storage
// costs predictable). If a specific talk is worth keeping long-term, an
// admin can re-upload it into the Document Vault, which already has
// versioning/retention built for exactly that purpose.
// ─────────────────────────────────────────────────────────────────────

const cloudinary = require("../config/cloudinary");

const RECORDING_FOLDER =
  process.env.CLOUDINARY_GOLDEN_MONDAY_FOLDER || "golden-monday-recordings";

// ============================================================
// Upload a base64 video to Cloudinary and return what the session
// document needs to store.
// ============================================================
const uploadRecording = async (base64Video, { sessionId, visibleDays = 7 }) => {
  if (!base64Video || typeof base64Video !== "string") {
    throw new Error("Invalid recording data: base64 video string required");
  }

  const result = await cloudinary.uploader.upload(base64Video, {
    folder: RECORDING_FOLDER,
    resource_type: "video",
    public_id: `session-${sessionId}-${Date.now()}`,
    overwrite: false,
  });

  const uploadedAt = new Date();
  const expiresAt = new Date(uploadedAt);
  expiresAt.setDate(expiresAt.getDate() + Number(visibleDays || 7));

  return {
    recordingUrl: result.secure_url,
    recordingPublicId: result.public_id,
    recordingDurationSec: Math.round(result.duration || 0),
    recordingUploadedAt: uploadedAt,
    recordingVisibleDays: Number(visibleDays || 7),
    recordingExpiresAt: expiresAt,
    recordingDeleted: false,
  };
};

// ============================================================
// Delete a recording from Cloudinary (used by the sweep job and by
// manual "remove recording" actions).
// ============================================================
const deleteRecording = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (err) {
    console.warn(
      `[goldenMondayRecordingService] Cloudinary delete failed for ${publicId}:`,
      err.message,
    );
  }
};

// ============================================================
// Sweep: find every session with an expired, not-yet-deleted recording,
// delete the Cloudinary asset, and clear the DB pointer. Called daily
// by the scheduler, and safe to call manually / on demand.
// ============================================================
const sweepExpiredRecordings = async () => {
  const GoldenMondaySession = require("../models/GoldenMondaySession");

  const expired = await GoldenMondaySession.find({
    recordingUrl: { $ne: "" },
    recordingDeleted: false,
    recordingExpiresAt: { $lte: new Date() },
  });

  let cleaned = 0;
  for (const session of expired) {
    await deleteRecording(session.recordingPublicId);
    session.recordingDeleted = true;
    session.recordingUrl = "";
    await session.save();
    cleaned += 1;
  }

  if (cleaned > 0) {
    console.log(
      `[goldenMondayRecordingService] 🧹 Expired & removed ${cleaned} recording(s)`,
    );
  }
  return cleaned;
};

module.exports = {
  uploadRecording,
  deleteRecording,
  sweepExpiredRecordings,
};
