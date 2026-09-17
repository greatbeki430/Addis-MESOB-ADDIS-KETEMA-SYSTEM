// frontend/src/components/golden-monday/templates/StudioTemplate.js
//
// The "Studio" template — a fully customisable poster where the
// coordinator can drag the photo, name, and info blocks anywhere on
// the canvas, and pick from four preset color themes.
//
// The render function receives a `layout` object from the parent
// (see PosterStudio.jsx) that carries:
//
//   {
//     photo:  { x, y, w, h },     // px in canvas space
//     name:   { x, y },           // top-left of the name block
//     info:   { x, y },           // top-left of the info block
//     theme:  "midnight" | "forest" | "sunset" | "mono",
//   }
//
// If `layout` is missing (first open), the template uses default
// positions that match the grid so the coordinator has a coherent
// starting point.

import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "studio",
  name: "Studio",
  description: "Drag-and-drop layout with 4 color themes",
  thumbnailColor: "#7B4DFF",
};

// ─── Preset themes ─────────────────────────────────────────────
// Each theme provides bg / bgDeep / accent / accentSoft / text.
const THEMES = {
  midnight: {
    bg: "#0d1a5e",
    bgDeep: "#060f38",
    accent: "#F5C518",
    accentSoft: "#d4a017",
    text: "#FDF6E3",
  },
  forest: {
    bg: "#0f3d2e",
    bgDeep: "#082318",
    accent: "#d4af37",
    accentSoft: "#b8962a",
    text: "#f5f0dc",
  },
  sunset: {
    bg: "#7B1818",
    bgDeep: "#3d0a0a",
    accent: "#F5A623",
    accentSoft: "#d48819",
    text: "#FFF3E0",
  },
  mono: {
    bg: "#1a1a1a",
    bgDeep: "#000000",
    accent: "#F5F5F5",
    accentSoft: "#C8C8C8",
    text: "#FFFFFF",
  },
};

// ─── Default layout ────────────────────────────────────────────
// Used when the coordinator hasn't dragged anything yet. Same
// bounding box rules as the other templates (60px outer margin).
export const DEFAULT_STUDIO_LAYOUT = {
  photo: { x: 500, y: 620, w: 360, h: 460 },
  name: { x: 60, y: 620 },
  info: { x: 60, y: 900 },
  theme: "midnight",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage, layout } = helpers;

  // Merge the incoming layout over the defaults so missing fields
  // (e.g. a coordinator who only dragged the photo) still get sane
  // positions.
  const L = {
    ...DEFAULT_STUDIO_LAYOUT,
    ...(layout || {}),
    photo: { ...DEFAULT_STUDIO_LAYOUT.photo, ...(layout?.photo || {}) },
    name: { ...DEFAULT_STUDIO_LAYOUT.name, ...(layout?.name || {}) },
    info: { ...DEFAULT_STUDIO_LAYOUT.info, ...(layout?.info || {}) },
  };

  const T = THEMES[L.theme] || THEMES.midnight;

  // ── Background ───────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, T.bg);
  bg.addColorStop(1, T.bgDeep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial accent glow top-right
  const glow = ctx.createRadialGradient(W, 0, 80, W, 0, 900);
  glow.addColorStop(0, hexAlpha(T.accent, 0.1));
  glow.addColorStop(1, hexAlpha(T.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top header band (fixed, not draggable) ──────────────────
  // The header is identity — keeping it consistent no matter where
  // the coordinator puts the content ensures the poster still reads
  // as "Golden Monday".
  const PAD = 60;

  // Logo on an accent badge, top-left
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const badgeSize = 130;
      const badgeRadius = 28;

      applySoftShadow(ctx, 22, 10, 0.3);
      fillRoundedRect(
        ctx,
        PAD,
        PAD - 20,
        badgeSize,
        badgeSize,
        badgeRadius,
        T.accent,
      );
      clearShadow(ctx);

      const lw = badgeSize - 40;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(
        logo,
        PAD + (badgeSize - lw) / 2,
        PAD - 20 + (badgeSize - lh) / 2,
        lw,
        lh,
      );
    } catch (e) {
      console.warn("[StudioTemplate] logo missing:", e.message);
    }
  }

  // Amharic header — sits in the middle of the top band
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = T.accent;
  ctx.font = "bold 38px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", W / 2 + 60, 100);

  // Committee label top-right
  ctx.fillStyle = hexAlpha(T.accent, 0.7);
  ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText("committee · 2026", W - PAD, 100);

  // Thin accent rule under the header
  fillRoundedRect(ctx, PAD, 165, W - PAD * 2, 3, 2, T.accent);

  // ── Draggable photo ─────────────────────────────────────────
  // Sits wherever the coordinator last dragged it. The yellow/cream
  // strip that used to sit above the photo is replaced by a thin
  // accent outline so it reads as "draggable" without clutter.
  applySoftShadow(ctx, 32, 18, 0.4);
  fillRoundedRect(
    ctx,
    L.photo.x,
    L.photo.y,
    L.photo.w,
    L.photo.h,
    28,
    T.bgDeep,
  );
  clearShadow(ctx);

  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    L.photo.x,
    L.photo.y,
    L.photo.w,
    L.photo.h,
    28,
    {
      fallbackColor: hexAlpha(T.accent, 0.15),
      fallbackText: "Presenter photo",
    },
  );

  strokeRoundedRect(
    ctx,
    L.photo.x,
    L.photo.y,
    L.photo.w,
    L.photo.h,
    28,
    T.accent,
    3,
  );

  // ── Draggable name block ────────────────────────────────────
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.fillStyle = T.accent;
  ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTER", L.name.x, L.name.y);

  ctx.fillStyle = T.text;
  ctx.font = "bold 36px 'Playfair Display', Georgia, serif";
  const nameWords = (form.presenterName || "TBD").split(" ");
  if (nameWords.length > 2) {
    const mid = Math.ceil(nameWords.length / 2);
    ctx.fillText(nameWords.slice(0, mid).join(" "), L.name.x, L.name.y + 42);
    ctx.fillText(nameWords.slice(mid).join(" "), L.name.x, L.name.y + 88);
  } else {
    ctx.fillText(form.presenterName || "TBD", L.name.x, L.name.y + 42);
  }

  // Audience line (Amharic) directly under the name
  ctx.fillStyle = T.accent;
  ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(
    fitText(ctx, audienceLine, 400),
    L.name.x,
    L.name.y + (nameWords.length > 2 ? 140 : 94),
  );

  // ── Draggable info block ────────────────────────────────────
  // A rounded card holding CENTER / DATE / TIME in three neat rows.
  // Drawn as one unit so the coordinator can position the whole
  // cluster rather than fumbling three separate rows.
  const infoW = 380;
  const infoH = 240;

  applySoftShadow(ctx, 20, 10, 0.25);
  fillRoundedRect(
    ctx,
    L.info.x - 20,
    L.info.y - 20,
    infoW,
    infoH,
    20,
    hexAlpha(T.accent, 0.08),
  );
  clearShadow(ctx);
  strokeRoundedRect(
    ctx,
    L.info.x - 20,
    L.info.y - 20,
    infoW,
    infoH,
    20,
    hexAlpha(T.accent, 0.25),
    1,
  );

  // Three rows inside the card
  const rows = [
    { label: "CENTER", value: form.center || "Addis Ketema Center" },
    { label: "DATE", value: form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም." },
    { label: "TIME", value: form.time || "1:30 – 2:30 ከሰዓት" },
  ];

  let ry = L.info.y;
  for (const row of rows) {
    // Small accent pill label
    const pillW = 90;
    const pillH = 22;
    fillRoundedRect(ctx, L.info.x, ry, pillW, pillH, 11, T.accent);

    ctx.fillStyle = T.bgDeep;
    ctx.font = "bold 12px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(row.label, L.info.x + pillW / 2, ry + pillH / 2 + 1);

    // Value
    ctx.textAlign = "left";
    ctx.fillStyle = T.text;
    ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, row.value, infoW - 40),
      L.info.x,
      ry + pillH + 26,
    );

    ry += 76;
  }

  // ── Presentation title (bottom band, only if chosen) ────────
  if (form.title) {
    ctx.fillStyle = T.accent;
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC OF THE SESSION", PAD, H - 130);

    ctx.fillStyle = T.text;
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, form.title, W - PAD * 2), PAD, H - 95);
  }

  // ── Footer — website + brand tag ────────────────────────────
  ctx.fillStyle = T.accent;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - PAD, H - PAD);

  ctx.fillStyle = hexAlpha(T.accent, 0.6);
  ctx.font = "italic 14px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("· Addis MESOB ·", PAD, H - PAD);
}

// ─── Small helper — hex → rgba string ──────────────────────────
// Lets us reuse a hex color at arbitrary opacity without pulling in
// a color library.
function hexAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
