// frontend/src/components/golden-monday/PosterStudio.jsx
//
// Coordinator tool: renders a branded A-MESOB poster from presenter
// data on an HTML canvas, then uploads + posts it to Telegram.
//
// Layout matches the committee's manual design:
//   - Blue background
//   - A-MESOB logo top-left
//   - Amharic header top-center
//   - "Golden monday committee 2026" box top-right
//   - Presenter photo left column (large, framed)
//   - Clock image bottom-left (static asset)
//   - Right column: 📢, presenter name line, center, date, time
//   - Website URL bottom
//
// The canvas is hidden from the user; they see a live preview img.

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  FiX,
  FiSend,
  FiLoader,
  FiRefreshCw,
  FiUpload,
  FiImage,
} from "react-icons/fi";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";

// ─── Canvas dimensions ──────────────────────────────────────────
// Matches the committee's 900×1280 aspect. Larger canvas = sharper
// text and photo, at the cost of base64 upload size.
const POSTER_W = 900;
const POSTER_H = 1280;

// ─── Brand colors (from the sample image) ───────────────────────
const BRAND_BLUE = "#2C3E8F";
const BRAND_GOLD = "#F5C518";
const BRAND_WHITE = "#FFFFFF";

// ─── Static asset URLs ──────────────────────────────────────────
// Drop these files in frontend/public/ so they resolve at runtime.
const LOGO_URL = "/brand/amesob-logo.png";
const CLOCK_URL = "/brand/clock.png";

export default function PosterStudio({ isOpen, onClose, session, onPosted }) {
  // ── Form state (initialised from the session) ───────────────
  const [form, setForm] = useState({
    presenterName: "",
    title: "",
    center: "Addis Ketema Center",
    ethiopianDate: "",
    time: "1:30 - 2:30 ከሰዓት",
    audienceLine: "", // "ከአቶ ታሪኩ ጉሉማ ጋር" style
    websiteUrl: "addis.mesobcenter.et",
  });

  // ── Photo state ─────────────────────────────────────────────
  // By default we pull the presenter's Cloudinary photo. The
  // coordinator can override with a local file if they want.
  const [photoSrc, setPhotoSrc] = useState(null);

  // ── Preview + submit state ──────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [posting, setPosting] = useState(false);

  const canvasRef = useRef(null);

  // ── Initialise form from session when opened ────────────────
  useEffect(() => {
    if (!isOpen || !session) return;

    const timeoutId = setTimeout(() => {
      setForm((f) => ({
        ...f,
        presenterName: session.presenterName || "",
        title: session.presentationTitle || "",
        ethiopianDate: "", // coordinator fills; conversion not attempted here
      }));

      // Prefer the session's cached photo URL
      if (session.presenterPhotoUrl) {
        setPhotoSrc(session.presenterPhotoUrl);
      } else {
        setPhotoSrc(null);
      }
      setPreviewUrl(null);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isOpen, session]);

  // ── Load an image from a URL or a File ──────────────────────
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Cloudinary URLs are on a different origin, so we need
      // crossOrigin="anonymous" for canvas readback to work. If the
      // CDN doesn't send CORS headers, this will fail — in that case
      // the user must upload a local file instead.
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error("[PosterStudio] image load error:", e);
        reject(new Error("Failed to load image: " + (src || "unknown")));
      };
      img.src = src;
    });
  }, []);

  // ── Render the poster onto the canvas ───────────────────────
  const renderPoster = useCallback(async () => {
    if (!canvasRef.current) return;
    setRendering(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Solid brand background
      ctx.fillStyle = BRAND_BLUE;
      ctx.fillRect(0, 0, POSTER_W, POSTER_H);

      // ── Top-left logo ─────────────────────────────────────
      try {
        const logo = await loadImage(LOGO_URL);
        // Draw at natural aspect; fits ~180px wide
        const lw = 180;
        const lh = (logo.height / logo.width) * lw;
        ctx.drawImage(logo, 40, 40, lw, lh);
      } catch (e) {
        console.warn("[PosterStudio] logo missing:", e.message);
      }

      // ── Top-center Amharic header ─────────────────────────
      ctx.fillStyle = BRAND_GOLD;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 34px 'Noto Sans Ethiopic', 'Nyala', serif";
      ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተናጋሪ", POSTER_W / 2 + 40, 90);

      // ── Top-right "committee" box ─────────────────────────
      const boxX = POSTER_W - 260;
      const boxY = 40;
      const boxW = 220;
      const boxH = 140;
      ctx.strokeStyle = BRAND_GOLD;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = BRAND_GOLD;
      ctx.font = "bold 28px Georgia, serif";
      ctx.fillText("Golden monday", boxX + boxW / 2, boxY + 40);
      ctx.fillText("committee", boxX + boxW / 2, boxY + 75);
      ctx.fillText("2026", boxX + boxW / 2, boxY + 115);

      // ── Presenter photo (left, framed) ────────────────────
      const photoX = 20;
      const photoY = 230;
      const photoW = POSTER_W / 2 - 30;
      const photoH = 560;
      if (photoSrc) {
        try {
          const photo = await loadImage(photoSrc);
          // Cover-fit: crop source to target aspect
          const targetAspect = photoW / photoH;
          const sourceAspect = photo.width / photo.height;
          let sx = 0,
            sy = 0,
            sw = photo.width,
            sh = photo.height;
          if (sourceAspect > targetAspect) {
            sw = photo.height * targetAspect;
            sx = (photo.width - sw) / 2;
          } else {
            sh = photo.width / targetAspect;
            sy = (photo.height - sh) / 2;
          }
          ctx.drawImage(photo, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
          // Thin gold frame
          ctx.strokeStyle = BRAND_GOLD;
          ctx.lineWidth = 2;
          ctx.strokeRect(photoX, photoY, photoW, photoH);
        } catch (e) {
          console.warn("[PosterStudio] presenter photo failed:", e.message);
        }
      } else {
        // Placeholder rectangle with instructions
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(photoX, photoY, photoW, photoH);
        ctx.fillStyle = BRAND_WHITE;
        ctx.font = "italic 20px sans-serif";
        ctx.fillText(
          "Presenter photo",
          photoX + photoW / 2,
          photoY + photoH / 2,
        );
      }

      // ── Clock (bottom-left) ───────────────────────────────
      try {
        const clock = await loadImage(CLOCK_URL);
        const cw = 420;
        const ch = (clock.height / clock.width) * cw;
        ctx.drawImage(clock, -20, POSTER_H - ch + 20, cw, ch);
      } catch (e) {
        console.warn("[PosterStudio] clock missing:", e.message);
      }

      // ── Right column ──────────────────────────────────────
      const rightX = POSTER_W / 2 + 60;
      ctx.textAlign = "left";

      // 📢 megaphone emoji
      ctx.font = "70px serif";
      ctx.fillText("📢", rightX + 80, 420);

      // Presenter audience line ("ከአቶ ታሪኩ ጉሉማ ጋር")
      ctx.fillStyle = BRAND_GOLD;
      ctx.font = "bold 32px 'Noto Sans Ethiopic', 'Nyala', serif";
      ctx.textAlign = "center";
      const audienceLine =
        form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
      ctx.fillText(audienceLine, rightX + 180, 530);

      // Center name
      ctx.font = "italic bold 40px Georgia, serif";
      ctx.fillText(form.center || "Addis Ketema Center", rightX + 180, 700);

      // Gold divider
      ctx.fillStyle = BRAND_GOLD;
      ctx.fillRect(rightX + 20, 730, 320, 6);

      // Ethiopian date
      ctx.font = "bold 34px 'Noto Sans Ethiopic', 'Nyala', serif";
      ctx.fillText(
        form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.",
        rightX + 180,
        810,
      );

      // Time
      ctx.font = "italic bold 30px Georgia, serif";
      ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", rightX + 180, 880);

      // ── Title (below clock, small) ────────────────────────
      if (form.title) {
        ctx.fillStyle = BRAND_WHITE;
        ctx.font = "bold 26px 'Noto Sans Ethiopic', 'Nyala', serif";
        ctx.textAlign = "left";
        ctx.fillText(`"${form.title}"`, 40, POSTER_H - 130);
      }

      // ── Website URL (bottom-right) ────────────────────────
      ctx.fillStyle = BRAND_GOLD;
      ctx.font = "italic 22px Georgia, serif";
      ctx.textAlign = "right";
      ctx.fillText(form.websiteUrl, POSTER_W - 40, POSTER_H - 40);

      // ── Export to preview image ───────────────────────────
      const dataUrl = canvas.toDataURL("image/png", 0.92);
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error("[PosterStudio] render failed:", err);
    } finally {
      setRendering(false);
    }
  }, [form, photoSrc, loadImage]);

  // Re-render whenever the form or photo changes
  useEffect(() => {
    if (!isOpen) return;
    // Small debounce so typing doesn't re-render on every keystroke
    const timer = setTimeout(renderPoster, 200);
    return () => clearTimeout(timer);
  }, [isOpen, form, photoSrc, renderPoster]);

  // ── Handle local photo upload ───────────────────────────────
  const handlePhotoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoSrc(reader.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Submit: upload the rendered poster + post to Telegram ───
  const handlePost = useCallback(async () => {
    if (!session?._id) return;
    if (!previewUrl) {
      alert("Poster has not been rendered yet.");
      return;
    }

    setPosting(true);
    try {
      const res = await goldenMondayAPI.postWithPoster(session._id, {
        posterDataUrl: previewUrl,
      });
      if (onPosted) await onPosted();
      if (onClose) onClose();
      // Toast handled by the parent component
      return res;
    } catch (err) {
      console.error("[PosterStudio] post failed:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to post the poster.",
      );
    } finally {
      setPosting(false);
    }
  }, [session, previewUrl, form, onPosted, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483000,
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 1100,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: F.serif,
                fontSize: 20,
                color: C.dark,
              }}
            >
              🎨 Poster Studio
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
              Customise and post the branded Golden Monday poster
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: C.muted,
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body: two columns — form on left, preview on right */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 0,
            overflow: "hidden",
          }}
        >
          {/* ─── Left: form ─── */}
          <div
            style={{
              padding: 20,
              overflowY: "auto",
              borderRight: `1px solid ${C.border}`,
            }}
          >
            <Field label="Presenter name">
              <input
                value={form.presenterName}
                onChange={(e) =>
                  setForm({ ...form, presenterName: e.target.value })
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Presentation title">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Audience line (Amharic)">
              <input
                value={form.audienceLine}
                onChange={(e) =>
                  setForm({ ...form, audienceLine: e.target.value })
                }
                placeholder="e.g. ከአቶ ታሪኩ ጉሉማ ጋር"
                style={inputStyle}
              />
            </Field>

            <Field label="Center">
              <input
                value={form.center}
                onChange={(e) => setForm({ ...form, center: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Ethiopian date">
              <input
                value={form.ethiopianDate}
                onChange={(e) =>
                  setForm({ ...form, ethiopianDate: e.target.value })
                }
                placeholder="e.g. ኅዳር 25, 2018 ዓ.ም."
                style={inputStyle}
              />
            </Field>

            <Field label="Time">
              <input
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Website URL">
              <input
                value={form.websiteUrl}
                onChange={(e) =>
                  setForm({ ...form, websiteUrl: e.target.value })
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Presenter photo">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${C.border}`,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <FiUpload size={14} />
                  Upload override
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                </label>
                {photoSrc && (
                  <button
                    onClick={() => {
                      setPhotoSrc(session?.presenterPhotoUrl || null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.muted,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <FiRefreshCw size={12} /> Use session photo
                  </button>
                )}
              </div>
              {!photoSrc && (
                <p style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>
                  ⚠️ No presenter photo available. Upload one to proceed.
                </p>
              )}
            </Field>
          </div>

          {/* ─── Right: preview ─── */}
          <div
            style={{
              padding: 20,
              background: "#f5f7fa",
              overflowY: "auto",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 400,
              }}
            >
              {rendering && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    borderRadius: 8,
                  }}
                >
                  <FiLoader
                    size={28}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                </div>
              )}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Poster preview"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                  }}
                />
              ) : (
                <div
                  style={{
                    aspectRatio: `${POSTER_W}/${POSTER_H}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    background: "#fff",
                    border: `2px dashed ${C.border}`,
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  <FiImage size={32} style={{ marginBottom: 8 }} />
                  <div>Rendering poster…</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            background: "#fafafa",
          }}
        >
          <button
            onClick={onClose}
            disabled={posting}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontWeight: 600,
              fontSize: 13,
              cursor: posting ? "not-allowed" : "pointer",
              fontFamily: F.sans,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={posting || !previewUrl}
            style={{
              padding: "10px 26px",
              borderRadius: 10,
              border: "none",
              background:
                posting || !previewUrl
                  ? C.border
                  : "linear-gradient(135deg, #f5c518, #d4a017)",
              color: posting || !previewUrl ? C.muted : C.dark,
              fontWeight: 700,
              fontSize: 13,
              cursor: posting || !previewUrl ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: F.sans,
            }}
          >
            {posting ? (
              <FiLoader
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <FiSend size={14} />
            )}
            {posting ? "Posting…" : "Post to Telegram"}
          </button>
        </div>

        {/* Hidden canvas used for rendering */}
        <canvas
          ref={canvasRef}
          width={POSTER_W}
          height={POSTER_H}
          style={{ display: "none" }}
        />
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#1a3aad",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid #e5e7eb",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};
