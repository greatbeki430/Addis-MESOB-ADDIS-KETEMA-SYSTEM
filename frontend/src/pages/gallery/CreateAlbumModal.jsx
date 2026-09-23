// frontend/src/pages/gallery/CreateAlbumModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiFolder } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { galleryAPI } from "../../services/api";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const PROGRAM_TYPES = [
  "training",
  "workshop",
  "meeting",
  "ceremony",
  "field_visit",
  "awareness",
  "other",
];

const TYPE_LABEL_KEY = {
  training: "typeTraining",
  workshop: "typeWorkshop",
  meeting: "typeMeeting",
  ceremony: "typeCeremony",
  field_visit: "typeFieldVisit",
  awareness: "typeAwareness",
  other: "typeOther",
};

// ─── Shared styles ─────────────────────────────────────────
const fieldStyle = () => ({
  width: "100%",
  padding: "9px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: radius.md,
  fontSize: FONT_SIZES.body,
  fontFamily: F.sans,
  color: C.dark,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
});

const labelStyle = () => ({
  display: "block",
  fontSize: FONT_SIZES.small,
  fontWeight: 600,
  color: C.dark,
  marginBottom: 6,
  fontFamily: F.sans,
});

const CreateAlbumModal = ({ onClose, onCreated }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: "",
    description: "",
    programDate: "",
    location: "",
    programType: "other",
    tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError(t("gallery.albumTitle") + " required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await galleryAPI.createAlbum({
        title: form.title.trim(),
        description: form.description.trim(),
        programDate: form.programDate || undefined,
        location: form.location.trim(),
        programType: form.programType,
        tags: form.tags,
      });
      onCreated?.(res.data.album);
    } catch (e) {
      setError(e?.response?.data?.message || t("gallery.uploadError"));
    } finally {
      setSaving(false);
    }
  };

  // Focus ring helper — reused on every input/select/textarea
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
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: radius.xl,
          boxShadow: "0 20px 60px rgba(13,26,94,0.35)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: F.sans,
        }}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${SPACING.md}px ${SPACING.lg}px`,
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
            <FiFolder size={20} style={{ color: C.primary }} />
            {t("gallery.createAlbum")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              background: "transparent",
              border: "none",
              borderRadius: radius.sm,
              color: C.muted,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.5 : 1,
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
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
          {error && (
            <div
              style={{
                fontSize: FONT_SIZES.small,
                color: C.red,
                background: "#fee2e2",
                padding: "10px 14px",
                borderRadius: radius.md,
                border: `1px solid ${C.red}44`,
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle()}>{t("gallery.albumTitle")} *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t("gallery.albumTitlePlaceholder")}
              style={fieldStyle()}
              autoFocus
              {...focusHandlers}
            />
          </div>

          <div>
            <label style={labelStyle()}>{t("gallery.albumDescription")}</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("gallery.albumDescriptionPlaceholder")}
              rows={3}
              style={{
                ...fieldStyle(),
                resize: "vertical",
                minHeight: 72,
              }}
              {...focusHandlers}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: SPACING.md,
            }}
          >
            <div>
              <label style={labelStyle()}>{t("gallery.programDate")}</label>
              <input
                type="date"
                value={form.programDate}
                onChange={(e) => set("programDate", e.target.value)}
                style={fieldStyle()}
                {...focusHandlers}
              />
            </div>
            <div>
              <label style={labelStyle()}>{t("gallery.programType")}</label>
              <select
                value={form.programType}
                onChange={(e) => set("programType", e.target.value)}
                style={{
                  ...fieldStyle(),
                  cursor: "pointer",
                }}
                {...focusHandlers}
              >
                {PROGRAM_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`gallery.${TYPE_LABEL_KEY[pt]}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle()}>{t("gallery.programLocation")}</label>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder={t("gallery.programLocationPlaceholder")}
              style={fieldStyle()}
              {...focusHandlers}
            />
          </div>

          <div>
            <label style={labelStyle()}>{t("gallery.tags")}</label>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder={t("gallery.tagsPlaceholder")}
              style={fieldStyle()}
              {...focusHandlers}
            />
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: SPACING.sm,
            padding: `${SPACING.md}px ${SPACING.lg}px`,
            borderTop: `1px solid ${C.border}`,
            background: C.cardBg,
            borderRadius: `0 0 ${radius.xl}px ${radius.xl}px`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "9px 20px",
              background: "#fff",
              color: C.dark,
              border: `1.5px solid ${C.border}`,
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 600,
              fontFamily: F.sans,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
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
            type="submit"
            disabled={saving}
            style={{
              padding: "9px 22px",
              background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              color: "#fff",
              border: "none",
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 700,
              fontFamily: F.sans,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              boxShadow: `0 3px 12px ${C.primary}44`,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 6px 18px ${C.primary}55`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 3px 12px ${C.primary}44`;
            }}
          >
            {saving ? t("gallery.uploading") : t("gallery.createAlbum")}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

export default CreateAlbumModal;
