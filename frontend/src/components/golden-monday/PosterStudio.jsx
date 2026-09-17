// frontend/src/components/golden-monday/PosterStudio.jsx
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  FiMove,
} from "react-icons/fi";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import {
  TEMPLATES,
  TEMPLATE_ORDER,
  DEFAULT_TEMPLATE,
  DEFAULT_STUDIO_LAYOUT,
} from "./templates";
import {
  formatEthiopianDate,
  todayGregorianISODate,
} from "../../utils/ethiopianDate";

// ─── Canvas dimensions ──────────────────────────────────────────
const POSTER_W = 900;
const POSTER_H = 1280;

// ─── Static asset URLs ──────────────────────────────────────────
const LOGO_URL = "/brand/amesob-logo.png";
const CLOCK_URL = "/brand/clock.png";

// ─── Studio template theme options ──────────────────────────────
const STUDIO_THEMES = [
  { id: "midnight", label: "Midnight", swatch: "#0d1a5e" },
  { id: "forest", label: "Forest", swatch: "#0f3d2e" },
  { id: "sunset", label: "Sunset", swatch: "#7B1818" },
  { id: "mono", label: "Mono", swatch: "#1a1a1a" },
];

// ─── Snap grid (px in canvas space) ─────────────────────────────
const SNAP_GRID = 20;

// ─── Draggable block list ───────────────────────────────────────
// One list drives the drag handler, the reset, the overlay rects,
// and the JSX map below. Adding a new draggable block means adding
// one entry here and one entry in DEFAULT_STUDIO_LAYOUT, nothing
// else. Kept in module scope because it's static.
const STUDIO_BLOCKS = ["photo", "name", "info", "badge", "title"];

export default function PosterStudio({ isOpen, onClose, session, onPosted }) {
  // ── Form state ──────────────────────────────────────────────
  // Note: ethiopianDate is NOT in here. It's derived from
  // gregorianDate at render time, with a manual override stored
  // separately so the two paths don't fight each other.
  //
  // Optional fields (sessionNumber, subtitle, department,
  // description, weekOf, qrDataUrl) are declared here with empty
  // defaults so the Studio template always gets a full shape and
  // the input elements below stay controlled.
  const [form, setForm] = useState({
    presenterName: "",
    title: "",
    subtitle: "",
    department: "",
    description: "",
    sessionNumber: "",
    weekOf: "",
    qrDataUrl: "",
    center: "Addis Ketema Center",
    time: "1:30 - 2:30 ከሰዓት",
    audienceLine: "",
    websiteUrl: "addis.mesobcenter.et",
  });

  // ── Date state ──────────────────────────────────────────────
  const [gregorianDate, setGregorianDate] = useState(todayGregorianISODate);
  const [ethiopianOverride, setEthiopianOverride] = useState("");

  const derivedEthiopianDate = useMemo(
    () => formatEthiopianDate(gregorianDate, "am"),
    [gregorianDate],
  );
  const ethiopianDate = ethiopianOverride || derivedEthiopianDate;

  // ── Photo ───────────────────────────────────────────────────
  const [photoSrc, setPhotoSrc] = useState(null);

  // ── Template picker ─────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);

  // ── Studio layout state (only used by the Studio template) ──
  // Initialised from DEFAULT_STUDIO_LAYOUT so any block added there
  // is picked up here without having to update both places.
  const [studioLayout, setStudioLayout] = useState(() => ({
    photo: { ...DEFAULT_STUDIO_LAYOUT.photo },
    name: { ...DEFAULT_STUDIO_LAYOUT.name },
    info: { ...DEFAULT_STUDIO_LAYOUT.info },
    badge: { ...DEFAULT_STUDIO_LAYOUT.badge },
    title: { ...DEFAULT_STUDIO_LAYOUT.title },
    theme: DEFAULT_STUDIO_LAYOUT.theme,
  }));

  // ── Preview + submit state ──────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [posting, setPosting] = useState(false);

  const [previewSize, setPreviewSize] = useState({ w: 400, h: 569 });

  const canvasRef = useRef(null);

  const previewScale = previewSize.w / POSTER_W;

  // ── Initialise form from session ────────────────────────────
  // Pre-populates any optional field the session carries. Missing
  // fields stay as their empty default — the template treats empty
  // strings as "don't draw this".
  useEffect(() => {
    if (!isOpen || !session) return;

    const timeoutId = setTimeout(() => {
      setForm((f) => ({
        ...f,
        presenterName: session.presenterName || "",
        title: session.presentationTitle || "",
        subtitle: session.presenterTitle || f.subtitle,
        department: session.presenterDepartment || f.department,
        description: session.presentationDescription || f.description,
        sessionNumber:
          session.sessionNumber !== undefined && session.sessionNumber !== null
            ? String(session.sessionNumber)
            : f.sessionNumber,
        weekOf: session.weekOf || f.weekOf,
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

  // ── Render token guard ──────────────────────────────────────
  const renderTokenRef = useRef(0);

  const renderPoster = useCallback(async () => {
    if (!canvasRef.current) return;

    const myToken = ++renderTokenRef.current;
    const isStale = () => renderTokenRef.current !== myToken;

    setRendering(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (isStale()) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, POSTER_W, POSTER_H);
      ctx.globalAlpha = 1;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      const template =
        TEMPLATES[selectedTemplate] || TEMPLATES[DEFAULT_TEMPLATE];

      const formForTemplate = {
        ...form,
        ethiopianDate,
      };

      await template.render(ctx, {
        form: formForTemplate,
        photoSrc,
        assets: {
          logo: LOGO_URL,
          clock: CLOCK_URL,
        },
        W: POSTER_W,
        H: POSTER_H,
        loadImage,
        layout: selectedTemplate === "studio" ? studioLayout : undefined,
      });

      if (isStale()) return;

      const dataUrl = canvas.toDataURL("image/png", 0.92);
      setPreviewUrl(dataUrl);
    } catch (err) {
      if (!isStale()) {
        console.error("[PosterStudio] render failed:", err);
      }
    } finally {
      if (!isStale()) {
        setRendering(false);
      }
    }
  }, [
    form,
    ethiopianDate,
    photoSrc,
    selectedTemplate,
    studioLayout,
    loadImage,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(renderPoster, 200);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    form,
    ethiopianDate,
    photoSrc,
    selectedTemplate,
    studioLayout,
    renderPoster,
  ]);

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

  // ── Drag handling ───────────────────────────────────────────
  // Single ref tracks the active drag; move/up listeners are
  // registered inside handleDragStart and cleaned up on release.
  // A block-name lookup replaces the old chained ternary so adding
  // a block only requires extending STUDIO_BLOCKS and the defaults.
  const dragRef = useRef(null);

  const handleDragStart = useCallback(
    (target) => (e) => {
      e.preventDefault();
      e.stopPropagation();

      const point = e.touches ? e.touches[0] : e;

      const block = studioLayout[target];
      if (!block) return;

      dragRef.current = {
        target,
        startX: point.clientX,
        startY: point.clientY,
        originX: block.x,
        originY: block.y,
      };

      const onMove = (moveEvent) => {
        const drag = dragRef.current;
        if (!drag) return;

        if (moveEvent.cancelable) moveEvent.preventDefault();

        const movePoint = moveEvent.touches ? moveEvent.touches[0] : moveEvent;
        const dx = (movePoint.clientX - drag.startX) / previewScale;
        const dy = (movePoint.clientY - drag.startY) / previewScale;

        let nx = drag.originX + dx;
        let ny = drag.originY + dy;

        // Clamp per block. The lower bound of 180 on y keeps every
        // draggable out of the fixed hero band.
        if (drag.target === "photo") {
          const { w, h } = studioLayout.photo;
          nx = Math.max(0, Math.min(POSTER_W - w, nx));
          ny = Math.max(180, Math.min(POSTER_H - h, ny));
        } else if (drag.target === "badge") {
          nx = Math.max(0, Math.min(POSTER_W - 100, nx));
          ny = Math.max(180, Math.min(POSTER_H - 100, ny));
        } else if (drag.target === "title") {
          nx = Math.max(20, Math.min(POSTER_W - 300, nx));
          ny = Math.max(180, Math.min(POSTER_H - 120, ny));
        } else {
          nx = Math.max(20, Math.min(POSTER_W - 200, nx));
          ny = Math.max(180, Math.min(POSTER_H - 100, ny));
        }

        if (moveEvent.shiftKey) {
          nx = Math.round(nx / SNAP_GRID) * SNAP_GRID;
          ny = Math.round(ny / SNAP_GRID) * SNAP_GRID;
        }

        setStudioLayout((prev) => {
          const next = { ...prev };
          if (drag.target === "photo") {
            next.photo = { ...prev.photo, x: nx, y: ny };
          } else {
            next[drag.target] = { x: nx, y: ny };
          }
          return next;
        });
      };

      const onEnd = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onEnd);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onEnd);
    },
    [previewScale, studioLayout],
  );

  // ── Reset studio layout ─────────────────────────────────────
  const resetStudioLayout = useCallback(() => {
    setStudioLayout({
      photo: { ...DEFAULT_STUDIO_LAYOUT.photo },
      name: { ...DEFAULT_STUDIO_LAYOUT.name },
      info: { ...DEFAULT_STUDIO_LAYOUT.info },
      badge: { ...DEFAULT_STUDIO_LAYOUT.badge },
      title: { ...DEFAULT_STUDIO_LAYOUT.title },
      theme: DEFAULT_STUDIO_LAYOUT.theme,
    });
  }, []);

  // ── Is the Studio template active? ──────────────────────────
  const isStudio = selectedTemplate === "studio";

  // ── Preview overlay rects ───────────────────────────────────
  // Sizes approximate the visual bounds of each drawn block, scaled
  // from canvas space to preview pixel space.
  const overlayRects = useMemo(() => {
    const s = previewScale;
    return {
      photo: {
        left: studioLayout.photo.x * s,
        top: studioLayout.photo.y * s,
        width: studioLayout.photo.w * s,
        height: studioLayout.photo.h * s,
      },
      name: {
        left: studioLayout.name.x * s,
        top: studioLayout.name.y * s,
        width: 400 * s,
        height: 200 * s,
      },
      info: {
        left: (studioLayout.info.x - 20) * s,
        top: (studioLayout.info.y - 20) * s,
        width: 380 * s,
        height: 260 * s,
      },
      badge: {
        left: studioLayout.badge.x * s,
        top: studioLayout.badge.y * s,
        width: 92 * s,
        height: 92 * s,
      },
      title: {
        left: (studioLayout.title.x - 20) * s,
        top: (studioLayout.title.y - 20) * s,
        width: 700 * s,
        height: 120 * s,
      },
    };
  }, [studioLayout, previewScale]);

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
      {/* Invisible text — forces Google Fonts to load before the
          canvas renders. */}
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

        {/* Body */}
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

            {/* Studio-only controls: theme + reset */}
            {isStudio && (
              <>
                <Field label="Colour theme">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {STUDIO_THEMES.map((th) => {
                      const active = studioLayout.theme === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() =>
                            setStudioLayout((prev) => ({
                              ...prev,
                              theme: th.id,
                            }))
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: active
                              ? `2px solid ${C.primary}`
                              : `1.5px solid ${C.border}`,
                            background: active ? `${C.primary}08` : "#fff",
                            cursor: "pointer",
                            fontFamily: F.sans,
                            fontSize: 12,
                            fontWeight: active ? 700 : 500,
                            color: C.dark,
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: th.swatch,
                              border: "1px solid rgba(0,0,0,0.15)",
                              flexShrink: 0,
                            }}
                          />
                          {th.label}
                          {active && <FiCheck size={12} color={C.primary} />}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#eef2ff",
                    border: `1px solid ${C.primary}22`,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.primary,
                      fontWeight: 600,
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FiMove size={12} />
                    Drag the poster pieces to reposition them
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      lineHeight: 1.5,
                    }}
                  >
                    Click and drag the <strong>photo</strong>,{" "}
                    <strong>name</strong>, <strong>info card</strong>,{" "}
                    <strong>badge</strong>, or <strong>title</strong> in the
                    preview. Hold <strong>Shift</strong> while dragging to snap
                    to a 20px grid.
                  </div>
                  <button
                    onClick={resetStudioLayout}
                    style={{
                      marginTop: 8,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.primary}33`,
                      background: "#fff",
                      color: C.primary,
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: F.sans,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiRefreshCw size={11} />
                    Reset layout
                  </button>
                </div>
              </>
            )}

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

            {/* ─── Optional fields, read by the Studio template only ─── */}
            {/* These are new. Other templates ignore them. */}
            {isStudio && (
              <>
                <Field label="Session number">
                  <input
                    type="number"
                    value={form.sessionNumber}
                    onChange={(e) =>
                      setForm({ ...form, sessionNumber: e.target.value })
                    }
                    placeholder="e.g. 42"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Subtitle (under presenter name)">
                  <input
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm({ ...form, subtitle: e.target.value })
                    }
                    placeholder="Optional — e.g. Distinguished Lecturer"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Department">
                  <input
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    placeholder="Optional — e.g. Urban Planning"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Description (short)">
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Optional — one line under the topic"
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </Field>
              </>
            )}

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

            <Field label="Date">
              <input
                type="date"
                value={gregorianDate}
                onChange={(e) => {
                  setGregorianDate(e.target.value);
                  setEthiopianOverride("");
                }}
                style={inputStyle}
              />

              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f5f7ff",
                  border: `1px solid ${C.primary}22`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}
                >
                  Ethiopian calendar
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.dark,
                  }}
                >
                  {ethiopianDate || "—"}
                </div>
              </div>

              <details style={{ marginTop: 6 }}>
                <summary
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  Override manually
                </summary>
                <input
                  value={ethiopianOverride}
                  onChange={(e) => setEthiopianOverride(e.target.value)}
                  placeholder={derivedEthiopianDate || "e.g. ኅዳር 25, 2018 ዓ.ም."}
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              </details>
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
                    zIndex: 3,
                    borderRadius: 8,
                    pointerEvents: "none",
                  }}
                >
                  <FiLoader
                    size={28}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                </div>
              )}

              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Poster preview"
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      setPreviewSize({
                        w: el.clientWidth,
                        h: el.clientHeight,
                      });
                    }}
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                      display: "block",
                    }}
                  />

                  {/* Drag overlay — only when Studio is active.
                      The list of overlays is derived from
                      STUDIO_BLOCKS so adding a block to that array
                      lights up a drag handle here automatically. */}
                  {isStudio &&
                    STUDIO_BLOCKS.map((key) => ({
                      key,
                      rect: overlayRects[key],
                      label: key.charAt(0).toUpperCase() + key.slice(1),
                    })).map((item) => (
                      <div
                        key={item.key}
                        onMouseDown={handleDragStart(item.key)}
                        onTouchStart={handleDragStart(item.key)}
                        title={`Drag to reposition the ${item.label}`}
                        style={{
                          position: "absolute",
                          left: item.rect.left,
                          top: item.rect.top,
                          width: item.rect.width,
                          height: item.rect.height,
                          border: "2px dashed rgba(123,77,255,0.7)",
                          borderRadius: 10,
                          cursor: "grab",
                          background: "rgba(123,77,255,0.06)",
                          zIndex: 2,
                          touchAction: "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(123,77,255,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(123,77,255,0.06)";
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: -10,
                            left: 8,
                            background: "#7B4DFF",
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 999,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            pointerEvents: "none",
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    ))}
                </>
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
