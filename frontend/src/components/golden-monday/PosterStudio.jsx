// frontend/src/components/golden-monday/PosterStudio.jsx
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
  FiCheck,
} from "react-icons/fi";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { TEMPLATES, TEMPLATE_ORDER, DEFAULT_TEMPLATE } from "./templates";

// ─── Canvas dimensions ──────────────────────────────────────────
const POSTER_W = 900;
const POSTER_H = 1280;

// ─── Static asset URLs ──────────────────────────────────────────
const LOGO_URL = "/brand/amesob-logo.png";
const CLOCK_URL = "/brand/clock.png";

export default function PosterStudio({ isOpen, onClose, session, onPosted }) {
  // ── Form state ──────────────────────────────────────────────
  const [form, setForm] = useState({
    presenterName: "",
    title: "",
    center: "Addis Ketema Center",
    ethiopianDate: "",
    time: "1:30 - 2:30 ከሰዓት",
    audienceLine: "",
    websiteUrl: "addis.mesobcenter.et",
  });

  // ── Photo state ─────────────────────────────────────────────
  const [photoSrc, setPhotoSrc] = useState(null);

  // ── Template picker ─────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);

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
        ethiopianDate: "",
      }));

      if (session.presenterPhotoUrl) {
        setPhotoSrc(session.presenterPhotoUrl);
      } else {
        setPhotoSrc(null);
      }
      setPreviewUrl(null);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isOpen, session]);

  // ── Image loader ────────────────────────────────────────────
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
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

      // Reset any lingering state from the previous render
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, POSTER_W, POSTER_H);
      ctx.globalAlpha = 1;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      const template =
        TEMPLATES[selectedTemplate] || TEMPLATES[DEFAULT_TEMPLATE];

      await template.render(ctx, {
        form,
        photoSrc,
        assets: {
          logo: LOGO_URL,
          clock: CLOCK_URL,
        },
        W: POSTER_W,
        H: POSTER_H,
        loadImage,
      });

      const dataUrl = canvas.toDataURL("image/png", 0.92);
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error("[PosterStudio] render failed:", err);
    } finally {
      setRendering(false);
    }
  }, [form, photoSrc, selectedTemplate, loadImage]);

  // Re-render whenever form, photo, or template changes
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(renderPoster, 200);
    return () => clearTimeout(timer);
  }, [isOpen, form, photoSrc, selectedTemplate, renderPoster]);

  // ── Photo upload ────────────────────────────────────────────
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

  // ── Submit ──────────────────────────────────────────────────
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
  }, [session, previewUrl, onPosted, onClose]);

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
      {/* ✅ Invisible text — forces Google Fonts to load before the
          canvas tries to render. Without these, the first poster of
          a session falls back to system serif fonts until some other
          part of the app happens to use Noto Serif Ethiopic or
          Playfair Display in the DOM. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          fontFamily: "'Noto Serif Ethiopic', serif",
          fontSize: 1,
        }}
      >
        ወርቃማ
      </span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          fontFamily: "'Playfair Display', serif",
          fontSize: 1,
        }}
      >
        Golden
      </span>

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

        {/* Body: two columns */}
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
            {/* Template picker */}
            <Field label="Design template">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {TEMPLATE_ORDER.map((id) => {
                  const t = TEMPLATES[id];
                  const active = selectedTemplate === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedTemplate(id)}
                      title={t.meta.description}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: active
                          ? `2px solid ${C.primary}`
                          : `1.5px solid ${C.border}`,
                        background: active ? `${C.primary}08` : "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: F.sans,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 32,
                          borderRadius: 4,
                          background: t.meta.thumbnailColor,
                          border: "1px solid rgba(0,0,0,0.1)",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: active ? 700 : 600,
                            color: C.dark,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {t.meta.name}
                          {active && <FiCheck size={12} color={C.primary} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

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
              {/*
    The title is chosen by the assigned presenter (via the Telegram DM
    or the rotation panel). Admins coordinate the poster but don't
    author the title — that keeps the "peer-led" spirit intact and
    prevents accidental overwrites. See Policy A in the release notes.
  */}
              <div
                style={{
                  ...inputStyle,
                  background: "#f9fafb",
                  color: form.title ? C.dark : C.muted,
                  fontStyle: form.title ? "normal" : "italic",
                  display: "flex",
                  alignItems: "center",
                  minHeight: 38,
                  cursor: "not-allowed",
                }}
                title={
                  form.title
                    ? "Chosen by the presenter — read-only here"
                    : "The presenter hasn't chosen a title yet"
                }
              >
                {form.title || "Presenter has not chosen a title yet"}
              </div>

              {!form.title && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#b45309",
                    marginTop: 6,
                    lineHeight: 1.4,
                  }}
                >
                  💡 The assigned presenter chooses the title from the Telegram
                  DM or the rotation panel. If they haven't yet, use{" "}
                  <strong>Re-send Presenter DM</strong> in the rotation panel to
                  nudge them.
                </p>
              )}
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
                    flexDirection: "column",
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

        {/* Hidden canvas */}
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
