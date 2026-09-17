// frontend/src/components/golden-monday/templates/StudioTemplate.js
//
// The "Studio" template — a fully customisable, ceremonial poster
// where the coordinator can drag five blocks (photo, name, info,
// title, badge) anywhere on the canvas, and pick from four presets
// that are structurally distinct, not just recolored.
//
// ─── DESIGN PHILOSOPHY PER THEME ────────────────────────────────
//
// MIDNIGHT — state ceremony / royal decree. Symmetric composition,
// a centered medallion header flanked by rules, a gold double
// hairline border with corner diamonds, an arched photo frame
// topped with a diamond finial, and a centered ribbon for the
// title. Everything is mirrored around the vertical axis to read
// as formal and institutional — the poster equivalent of a state
// seal. Dot-grid texture keeps empty space from feeling dead
// without competing with the gold linework.
//
// FOREST — botanical program / commencement. Asymmetric, warm,
// hand-set. The header is off-center with a leading vine curling
// into the Amharic title; the border is a wreath of leaf ticks
// around an oval; the photo sits in a rounded square wrapped in
// the same wreath motif with a ribbon at its base. The info card
// drops its fill entirely in favor of top/bottom brackets — it
// reads like a printed program insert, not a UI card. Diagonal
// pinstripe texture nods to woven fabric / paper grain.
//
// SUNSET — festival banner / golden-hour warmth. Everything curves:
// an arched hero banner, a circular medallion photo with a double
// ring and a star finial, a title treated as a lower-third arched
// banner with a warm gradient, and three concentric rounded-rect
// borders that echo the arches. A bottom-right radial glow plus a
// scatter of dust motes gives it warmth and depth without a real
// photo background.
//
// MONO — brutalist / editorial poster. Hard edges everywhere: a
// left-aligned header block with a heavy underline bar, a sharp
// rectangular photo with a black outer frame and thin accent
// inner line, an info list of stacked rows with square bullets,
// a solid black title block with reversed-out type, and a single
// heavy black border inset from the edge. Halftone dot texture is
// the only "soft" element, standing in for newsprint. This theme is
// the one built to survive black-and-white printing.
//
// Across all four themes the vertical grid is the same: a ~260px
// hero band, a free zone (~260–1040) where the five draggable
// blocks default to non-overlapping positions, a title band
// (~1040–1180), and a ~100px footer band, all inside a 60px outer
// margin. Layering order is: background texture → ornamental
// border → hero band → draggable blocks (photo, name, info, badge,
// title) → footer band.

import {
  drawRoundedImage,
  drawCircleImage,
  drawArchImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
  wrapText,
} from "./drawHelpers";

export const meta = {
  id: "studio",
  name: "Studio",
  description: "Drag-and-drop ceremonial layout with 4 fully distinct themes",
  thumbnailColor: "#7B4DFF",
};

// ─── Preset themes ─────────────────────────────────────────────
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
// title and badge are new. Old saved layouts (photo/name/info/theme
// only) still work — render() merges each block over these defaults
// independently, so a missing title or badge key just falls back.
export const DEFAULT_STUDIO_LAYOUT = {
  photo: { x: 480, y: 300, w: 360, h: 460 },
  name: { x: 60, y: 320 },
  info: { x: 60, y: 640 },
  badge: { x: 730, y: 800 },
  title: { x: 60, y: 1040 },
  theme: "midnight",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, W, H, loadImage, layout } = helpers;

  const L = {
    ...DEFAULT_STUDIO_LAYOUT,
    ...(layout || {}),
    photo: { ...DEFAULT_STUDIO_LAYOUT.photo, ...(layout?.photo || {}) },
    name: { ...DEFAULT_STUDIO_LAYOUT.name, ...(layout?.name || {}) },
    info: { ...DEFAULT_STUDIO_LAYOUT.info, ...(layout?.info || {}) },
    badge: { ...DEFAULT_STUDIO_LAYOUT.badge, ...(layout?.badge || {}) },
    title: { ...DEFAULT_STUDIO_LAYOUT.title, ...(layout?.title || {}) },
  };

  const T = THEMES[L.theme] || THEMES.midnight;
  const PAD = 60;

  // Layering order (see design philosophy note above):
  // texture → border → hero → draggable blocks → footer.
  drawBackgroundTexture(ctx, L.theme, T, W, H);
  drawOrnamentalBorder(ctx, L.theme, T, W, H, PAD);
  await drawHeroBand(ctx, L.theme, T, helpers, PAD, W);

  await drawPhotoBlock(ctx, L.theme, T, loadImage, photoSrc, L.photo);
  drawNameBlock(ctx, L.theme, T, form, L.name);
  drawInfoCard(ctx, L.theme, T, form, L.info);
  drawBadge(ctx, L.theme, T, form, L.badge);
  drawTitleBlock(ctx, L.theme, T, form, L.title, W);

  await drawFooter(ctx, L.theme, T, form, W, H, PAD, loadImage);
}

// ════════════════════════════════════════════════════════════════
// BACKGROUND TEXTURE
// ════════════════════════════════════════════════════════════════
function drawBackgroundTexture(ctx, theme, T, W, H) {
  const base = ctx.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, T.bg);
  base.addColorStop(1, T.bgDeep);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  switch (theme) {
    case "midnight": {
      // 40px dot grid.
      ctx.fillStyle = hexAlpha(T.accent, 0.05);
      for (let y = 20; y < H; y += 40) {
        for (let x = 20; x < W; x += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "forest": {
      // Diagonal pinstripes at 45deg, ~6px apart.
      ctx.strokeStyle = hexAlpha(T.accent, 0.06);
      ctx.lineWidth = 2;
      for (let d = -H; d < W; d += 6) {
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(d + H, H);
        ctx.stroke();
      }
      break;
    }
    case "sunset": {
      const glow = ctx.createRadialGradient(W, H, 60, W, H, 900);
      glow.addColorStop(0, hexAlpha(T.accent, 0.18));
      glow.addColorStop(1, hexAlpha(T.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Deterministic dust scatter (no Math.random so re-renders match).
      ctx.fillStyle = hexAlpha("#FFFFFF", 0.05);
      for (let i = 0; i < 140; i++) {
        const x = (i * 53) % W;
        const y = (i * 97) % H;
        const r = (i % 3) + 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "mono": {
      // Coarse halftone-style dot field.
      ctx.fillStyle = hexAlpha("#FFFFFF", 0.035);
      for (let y = 0; y < H; y += 10) {
        const offset = (y / 10) % 2 === 0 ? 0 : 5;
        for (let x = offset; x < W; x += 10) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════
// ORNAMENTAL BORDER
// ════════════════════════════════════════════════════════════════
function drawOrnamentalBorder(ctx, theme, T, W, H, PAD) {
  ctx.save();
  switch (theme) {
    case "midnight": {
      strokeRoundedRect(
        ctx,
        PAD - 20,
        PAD - 20,
        W - (PAD - 20) * 2,
        H - (PAD - 20) * 2,
        26,
        hexAlpha(T.accent, 0.8),
        2,
      );
      strokeRoundedRect(
        ctx,
        PAD - 12,
        PAD - 12,
        W - (PAD - 12) * 2,
        H - (PAD - 12) * 2,
        20,
        hexAlpha(T.accent, 0.35),
        1,
      );
      ctx.fillStyle = T.accent;
      const corners = [
        [PAD - 20, PAD - 20],
        [W - PAD + 20, PAD - 20],
        [PAD - 20, H - PAD + 20],
        [W - PAD + 20, H - PAD + 20],
      ];
      corners.forEach(([cx, cy]) => drawDiamond(ctx, cx, cy, 9));
      break;
    }
    case "forest": {
      ctx.strokeStyle = hexAlpha(T.accent, 0.5);
      ctx.lineWidth = 2;
      const rx = W / 2 - (PAD - 10);
      const ry = H / 2 - (PAD - 10);
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      const leafCount = 64;
      for (let i = 0; i < leafCount; i++) {
        const ang = (i / leafCount) * Math.PI * 2;
        const x = W / 2 + Math.cos(ang) * rx;
        const y = H / 2 + Math.sin(ang) * ry;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = hexAlpha(T.accent, i % 5 === 0 ? 0.5 : 0.25);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "sunset": {
      strokeRoundedRect(
        ctx,
        PAD - 24,
        PAD - 24,
        W - (PAD - 24) * 2,
        H - (PAD - 24) * 2,
        40,
        hexAlpha(T.accent, 0.55),
        2,
      );
      strokeRoundedRect(
        ctx,
        PAD - 14,
        PAD - 14,
        W - (PAD - 14) * 2,
        H - (PAD - 14) * 2,
        26,
        hexAlpha(T.accent, 0.35),
        2,
      );
      strokeRoundedRect(
        ctx,
        PAD - 4,
        PAD - 4,
        W - (PAD - 4) * 2,
        H - (PAD - 4) * 2,
        14,
        hexAlpha(T.accent, 0.2),
        1,
      );
      break;
    }
    case "mono": {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 6;
      ctx.strokeRect(
        PAD - 20,
        PAD - 20,
        W - (PAD - 20) * 2,
        H - (PAD - 20) * 2,
      );
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════
// HERO BAND (identity block, not draggable — same rationale as the
// original: the poster should always read as Golden Monday no
// matter where the coordinator drags the content blocks)
// ════════════════════════════════════════════════════════════════
async function drawHeroBand(ctx, theme, T, helpers, PAD, W) {
  const { assets, loadImage, form } = helpers;
  const subtitle = form.sessionNumber
    ? "Golden Monday Program · Session #" + form.sessionNumber
    : "Golden Monday Program";

  let logoImg = null;
  if (assets.logo) {
    try {
      logoImg = await loadImage(assets.logo);
    } catch (e) {
      console.warn("[StudioTemplate] logo missing:", e.message);
    }
  }

  ctx.save();
  switch (theme) {
    case "midnight": {
      const cx = W / 2;
      const badgeR = 60;

      applySoftShadow(ctx, 26, 12, 0.35);
      ctx.fillStyle = T.accent;
      ctx.beginPath();
      ctx.arc(cx, 90, badgeR, 0, Math.PI * 2);
      ctx.fill();
      clearShadow(ctx);

      ctx.strokeStyle = T.bgDeep;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, 90, badgeR - 6, 0, Math.PI * 2);
      ctx.stroke();

      if (logoImg) {
        const lw = badgeR * 1.1;
        const lh = (logoImg.height / logoImg.width) * lw;
        ctx.drawImage(logoImg, cx - lw / 2, 90 - lh / 2, lw, lh);
      }

      fillRoundedRect(ctx, PAD, 86, cx - badgeR - 20 - PAD, 3, 2, T.accent);
      fillRoundedRect(
        ctx,
        cx + badgeR + 20,
        86,
        W - PAD - (cx + badgeR + 20),
        3,
        2,
        T.accent,
      );

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = T.text;
      ctx.font = "bold 42px 'Noto Serif Ethiopic', 'Nyala', serif";
      ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", cx, 190);

      ctx.fillStyle = hexAlpha(T.accent, 0.85);
      ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
      ctx.fillText(subtitle, cx, 224);
      break;
    }
    case "forest": {
      const boxX = PAD;
      const boxY = 40;
      const boxSize = 120;

      applySoftShadow(ctx, 20, 10, 0.3);
      fillRoundedRect(ctx, boxX, boxY, boxSize, boxSize, 18, T.accent);
      clearShadow(ctx);

      if (logoImg) {
        const lw = boxSize - 36;
        const lh = (logoImg.height / logoImg.width) * lw;
        ctx.drawImage(
          logoImg,
          boxX + (boxSize - lw) / 2,
          boxY + (boxSize - lh) / 2,
          lw,
          lh,
        );
      }

      ctx.strokeStyle = hexAlpha(T.accent, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + boxSize + 10, boxY + boxSize / 2);
      ctx.quadraticCurveTo(
        boxX + boxSize + 60,
        boxY + 10,
        boxX + boxSize + 140,
        boxY + 30,
      );
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = T.text;
      ctx.font = "bold 40px 'Noto Serif Ethiopic', 'Nyala', serif";
      ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", boxX + boxSize + 30, boxY + 70);

      ctx.fillStyle = hexAlpha(T.accent, 0.9);
      ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
      ctx.fillText(subtitle, boxX + boxSize + 30, boxY + 100);

      drawDottedLine(ctx, PAD, 210, W - PAD, 210, hexAlpha(T.accent, 0.5));
      break;
    }
    case "sunset": {
      const bannerH = 220;
      const grad = ctx.createLinearGradient(0, 0, 0, bannerH);
      grad.addColorStop(0, hexAlpha(T.accent, 0.22));
      grad.addColorStop(1, hexAlpha(T.accent, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, bannerH);
      ctx.lineTo(0, 90);
      ctx.quadraticCurveTo(W / 2, -20, W, 90);
      ctx.lineTo(W, bannerH);
      ctx.closePath();
      ctx.fill();

      const badgeR = 54;
      applySoftShadow(ctx, 22, 10, 0.3);
      ctx.fillStyle = T.accent;
      ctx.beginPath();
      ctx.arc(PAD + badgeR, 70, badgeR, 0, Math.PI * 2);
      ctx.fill();
      clearShadow(ctx);

      if (logoImg) {
        const lw = badgeR * 1.1;
        const lh = (logoImg.height / logoImg.width) * lw;
        ctx.drawImage(logoImg, PAD + badgeR - lw / 2, 70 - lh / 2, lw, lh);
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = T.text;
      ctx.font = "bold 40px 'Noto Serif Ethiopic', 'Nyala', serif";
      ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", W / 2 + 40, 150);

      ctx.fillStyle = hexAlpha(T.text, 0.85);
      ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
      ctx.fillText(subtitle, W / 2 + 40, 182);

      ctx.strokeStyle = hexAlpha(T.accent, 0.4);
      ctx.lineWidth = 1.5;
      [30, 50, 70].forEach((r) => {
        ctx.beginPath();
        ctx.arc(W / 2, bannerH, r, Math.PI, Math.PI * 2);
        ctx.stroke();
      });
      break;
    }
    case "mono": {
      const boxSize = 110;
      ctx.fillStyle = "#000000";
      ctx.fillRect(PAD, 40, boxSize, boxSize);

      if (logoImg) {
        const lw = boxSize - 30;
        const lh = (logoImg.height / logoImg.width) * lw;
        ctx.drawImage(
          logoImg,
          PAD + (boxSize - lw) / 2,
          40 + (boxSize - lh) / 2,
          lw,
          lh,
        );
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = T.text;
      ctx.font = "bold 38px 'Noto Serif Ethiopic', 'Nyala', serif";
      ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", PAD + boxSize + 30, 90);

      ctx.fillStyle = hexAlpha(T.text, 0.7);
      ctx.font = "18px 'Playfair Display', Georgia, serif";
      ctx.fillText(subtitle, PAD + boxSize + 30, 120);

      ctx.fillStyle = T.accent;
      ctx.fillRect(PAD, 150, W - PAD * 2, 8);
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════
// DRAGGABLE: PHOTO
// ════════════════════════════════════════════════════════════════
async function drawPhotoBlock(ctx, theme, T, loadImage, photoSrc, box) {
  const { x, y, w, h } = box;
  switch (theme) {
    case "midnight": {
      applySoftShadow(ctx, 30, 16, 0.4);
      fillRoundedRect(ctx, x, y, w, h, 0, T.bgDeep);
      clearShadow(ctx);
      await drawArchImage(ctx, loadImage, photoSrc, x, y, w, h, {
        fallbackColor: hexAlpha(T.accent, 0.15),
        fallbackText: "Presenter photo",
      });
      strokeArchPath(ctx, x, y, w, h, T.accent, 4);
      ctx.fillStyle = T.accent;
      drawDiamond(ctx, x + w / 2, y - 4, 9);
      break;
    }
    case "forest": {
      applySoftShadow(ctx, 26, 14, 0.35);
      fillRoundedRect(ctx, x, y, w, h, 20, T.bgDeep);
      clearShadow(ctx);
      await drawRoundedImage(ctx, loadImage, photoSrc, x, y, w, h, 20, {
        fallbackColor: hexAlpha(T.accent, 0.15),
        fallbackText: "Presenter photo",
      });
      strokeRoundedRect(ctx, x, y, w, h, 20, T.accent, 4);
      drawWreathTicks(ctx, x, y, w, h, T.accent);
      const ribbonW = w * 0.5;
      fillRoundedRect(
        ctx,
        x + (w - ribbonW) / 2,
        y + h - 14,
        ribbonW,
        28,
        6,
        T.accent,
      );
      break;
    }
    case "sunset": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) / 2;
      applySoftShadow(ctx, 28, 14, 0.4);
      ctx.fillStyle = T.bgDeep;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      clearShadow(ctx);
      await drawCircleImage(ctx, loadImage, photoSrc, cx, cy, r, {
        fallbackColor: hexAlpha(T.accent, 0.15),
        fallbackText: "Presenter photo",
      });
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = hexAlpha(T.accent, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.stroke();
      drawStar(ctx, cx, cy - r - 4, 8, T.accent);
      break;
    }
    case "mono": {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
      await drawRoundedImage(ctx, loadImage, photoSrc, x, y, w, h, 0, {
        fallbackColor: hexAlpha(T.accent, 0.15),
        fallbackText: "Presenter photo",
      });
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
      break;
    }
    default:
      break;
  }
}

// ════════════════════════════════════════════════════════════════
// DRAGGABLE: NAME
// ════════════════════════════════════════════════════════════════
function drawNameBlock(ctx, theme, T, form, box) {
  const { x, y } = box;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.fillStyle = T.accent;
  ctx.font =
    theme === "mono"
      ? "bold 16px sans-serif"
      : "italic 18px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTER", x, y);

  ctx.fillStyle = T.text;
  ctx.font =
    theme === "mono"
      ? "bold 34px sans-serif"
      : "bold 36px 'Playfair Display', Georgia, serif";
  const nameWords = (form.presenterName || "TBD").split(" ");
  let afterNameY;
  if (nameWords.length > 2) {
    const mid = Math.ceil(nameWords.length / 2);
    ctx.fillText(nameWords.slice(0, mid).join(" "), x, y + 42);
    ctx.fillText(nameWords.slice(mid).join(" "), x, y + 88);
    afterNameY = y + 88;
  } else {
    ctx.fillText(form.presenterName || "TBD", x, y + 42);
    afterNameY = y + 42;
  }

  let cursorY = afterNameY + 46;

  if (form.subtitle) {
    ctx.fillStyle = hexAlpha(T.text, 0.85);
    ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.subtitle, 420), x, cursorY);
    cursorY += 30;
  }

  ctx.fillStyle = T.accent;
  ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, 420), x, cursorY);
  cursorY += 34;

  if (form.department) {
    ctx.fillStyle = hexAlpha(T.text, 0.6);
    ctx.font = "16px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.department, 420), x, cursorY);
    cursorY += 24;
  }

  if (form.weekOf) {
    ctx.fillStyle = hexAlpha(T.accent, 0.7);
    ctx.font = "italic 14px 'Playfair Display', Georgia, serif";
    ctx.fillText("Week of " + formatWeekOf(form.weekOf), x, cursorY);
  }
}

// ════════════════════════════════════════════════════════════════
// DRAGGABLE: INFO CARD (always CENTER / DATE / TIME — three cells
// matches the "ribbon of three" and bracketed-list treatments below)
// ════════════════════════════════════════════════════════════════
function drawInfoCard(ctx, theme, T, form, box) {
  const rows = [
    { label: "CENTER", value: form.center || "Addis Ketema Center" },
    { label: "DATE", value: form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም." },
    { label: "TIME", value: form.time || "1:30 – 2:30 ከሰዓት" },
  ];
  switch (theme) {
    case "midnight":
      drawInfoCardRoundedHairline(ctx, T, rows, box);
      break;
    case "forest":
      drawInfoCardBracketed(ctx, T, rows, box);
      break;
    case "sunset":
      drawInfoCardRibbon(ctx, T, rows, box);
      break;
    case "mono":
      drawInfoCardStackedBullets(ctx, T, rows, box);
      break;
    default:
      drawInfoCardRoundedHairline(ctx, T, rows, box);
  }
}

function drawInfoCardRoundedHairline(ctx, T, rows, box) {
  const { x, y } = box;
  const infoW = 380;
  const rowH = 76;
  const infoH = 40 + rows.length * rowH;

  applySoftShadow(ctx, 20, 10, 0.25);
  fillRoundedRect(
    ctx,
    x - 20,
    y - 20,
    infoW,
    infoH,
    20,
    hexAlpha(T.accent, 0.08),
  );
  clearShadow(ctx);
  strokeRoundedRect(
    ctx,
    x - 20,
    y - 20,
    infoW,
    infoH,
    20,
    hexAlpha(T.accent, 0.25),
    1,
  );
  strokeRoundedRect(
    ctx,
    x - 14,
    y - 14,
    infoW - 12,
    infoH - 12,
    16,
    hexAlpha(T.accent, 0.15),
    1,
  );

  let ry = y;
  for (const row of rows) {
    const pillW = 90;
    const pillH = 22;
    fillRoundedRect(ctx, x, ry, pillW, pillH, 11, T.accent);
    ctx.fillStyle = T.bgDeep;
    ctx.font = "bold 12px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(row.label, x + pillW / 2, ry + pillH / 2 + 1);

    ctx.textAlign = "left";
    ctx.fillStyle = T.text;
    ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, row.value, infoW - 40), x, ry + pillH + 26);
    ry += rowH;
  }
}

function drawInfoCardBracketed(ctx, T, rows, box) {
  const { x, y } = box;
  const w = 380;
  const rowH = 68;
  const h = rows.length * rowH;

  ctx.strokeStyle = T.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 4 + 16);
  ctx.lineTo(x - 10, y - 4);
  ctx.lineTo(x - 10 + 24, y - 4);
  ctx.moveTo(x - 10 + w + 20 - 24, y - 4);
  ctx.lineTo(x - 10 + w + 20, y - 4);
  ctx.lineTo(x - 10 + w + 20, y - 4 + 16);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 10, y + h + 4 - 16);
  ctx.lineTo(x - 10, y + h + 4);
  ctx.lineTo(x - 10 + 24, y + h + 4);
  ctx.moveTo(x - 10 + w + 20 - 24, y + h + 4);
  ctx.lineTo(x - 10 + w + 20, y + h + 4);
  ctx.lineTo(x - 10 + w + 20, y + h + 4 - 16);
  ctx.stroke();

  let ry = y;
  for (const row of rows) {
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = hexAlpha(T.accent, 0.9);
    ctx.font = "bold 13px 'Playfair Display', Georgia, serif";
    ctx.fillText(row.label, x, ry + 16);

    ctx.fillStyle = T.text;
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, row.value, w - 20), x, ry + 46);

    if (ry + rowH < y + h) {
      ctx.strokeStyle = hexAlpha(T.accent, 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, ry + 58);
      ctx.lineTo(x + w - 20, ry + 58);
      ctx.stroke();
    }
    ry += rowH;
  }
}

function drawInfoCardRibbon(ctx, T, rows, box) {
  const { x, y } = box;
  const cellW = 240;
  const cellH = 90;
  const gap = 10;
  let cx = x;

  rows.forEach((row) => {
    fillRoundedRect(
      ctx,
      cx,
      y,
      cellW - gap,
      cellH,
      14,
      hexAlpha(T.accent, 0.12),
    );
    strokeRoundedRect(
      ctx,
      cx,
      y,
      cellW - gap,
      cellH,
      14,
      hexAlpha(T.accent, 0.4),
      1,
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = T.accent;
    ctx.font = "bold 13px 'Playfair Display', Georgia, serif";
    ctx.fillText(row.label, cx + (cellW - gap) / 2, y + 28);

    ctx.fillStyle = T.text;
    ctx.font = "bold 19px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, row.value, cellW - gap - 24),
      cx + (cellW - gap) / 2,
      y + 60,
    );
    cx += cellW;
  });
}

function drawInfoCardStackedBullets(ctx, T, rows, box) {
  const { x, y } = box;
  const rowH = 58;
  let ry = y;

  for (const row of rows) {
    ctx.fillStyle = T.accent;
    ctx.fillRect(x, ry + 4, 14, 14);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hexAlpha(T.text, 0.6);
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(row.label, x + 26, ry + 3);

    ctx.fillStyle = T.text;
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, row.value, 500), x + 26, ry + 30);
    ry += rowH;
  }
}

// ════════════════════════════════════════════════════════════════
// DRAGGABLE: BADGE — shows form.sessionNumber. If it's missing we
// show a generic "GM" monogram rather than hiding the badge: an
// empty circle/hexagon reads as a layout bug, while "GM" still
// looks intentional on a poster with no session number set yet.
// ════════════════════════════════════════════════════════════════
function drawBadge(ctx, theme, T, form, box) {
  const { x, y } = box;
  const label = form.sessionNumber ? "#" + form.sessionNumber : "GM";
  const r = 46;

  switch (theme) {
    case "midnight": {
      applySoftShadow(ctx, 16, 8, 0.3);
      ctx.fillStyle = T.accent;
      ctx.beginPath();
      ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = T.bgDeep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + r, y + r, r - 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = T.bgDeep;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 22px 'Playfair Display', Georgia, serif";
      ctx.fillText(label, x + r, y + r + 1);
      break;
    }
    case "forest": {
      drawHexagon(ctx, x + r, y + r, r, T.accent);
      drawWreathTicks(ctx, x, y, r * 2, r * 2, T.accent);
      ctx.fillStyle = T.bgDeep;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 20px 'Playfair Display', Georgia, serif";
      ctx.fillText(label, x + r, y + r + 1);
      break;
    }
    case "sunset": {
      drawScallopCircle(ctx, x + r, y + r, r, T.accent);
      ctx.fillStyle = T.bgDeep;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 20px 'Playfair Display', Georgia, serif";
      ctx.fillText(label, x + r, y + r + 1);
      break;
    }
    case "mono": {
      ctx.save();
      ctx.translate(x + r, y + r);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#000000";
      ctx.fillRect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
      ctx.restore();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(label, x + r, y + r + 1);
      break;
    }
    default:
      break;
  }
}

// ════════════════════════════════════════════════════════════════
// DRAGGABLE: TITLE — only drawn if form.title is set (same rule as
// the original). Wraps to at most two lines; a very long title's
// second line is itself truncated with an ellipsis rather than
// growing a third line and risking overflow.
// ════════════════════════════════════════════════════════════════
function drawTitleBlock(ctx, theme, T, form, box, W) {
  if (!form.title) return;

  const { x, y } = box;
  const available = W - 2 * 60;

  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  let lines = wrapText(ctx, form.title, Math.min(available - 40, 680));
  if (lines.length > 2) {
    lines = [
      lines[0],
      fitText(ctx, lines.slice(1).join(" "), Math.min(available - 40, 680)),
    ];
  }

  switch (theme) {
    case "midnight": {
      const ribbonW = Math.min(available, 640);
      const ribbonH = 30 + lines.length * 36;
      const rx = W / 2 - ribbonW / 2;

      applySoftShadow(ctx, 18, 8, 0.3);
      fillRoundedRect(ctx, rx, y, ribbonW, ribbonH, 14, T.accent);
      clearShadow(ctx);

      fillRoundedRect(
        ctx,
        60,
        y + ribbonH / 2 - 1,
        rx - 70,
        2,
        1,
        hexAlpha(T.accent, 0.6),
      );
      fillRoundedRect(
        ctx,
        rx + ribbonW + 10,
        y + ribbonH / 2 - 1,
        W - 60 - (rx + ribbonW + 10),
        2,
        1,
        hexAlpha(T.accent, 0.6),
      );

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = T.bgDeep;
      ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
      lines.forEach((line, i) => ctx.fillText(line, W / 2, y + 22 + i * 36));

      if (form.description) {
        ctx.fillStyle = hexAlpha(T.text, 0.8);
        ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
        ctx.fillText(
          fitText(ctx, form.description, ribbonW - 40),
          W / 2,
          y + ribbonH + 22,
        );
      }
      break;
    }
    case "forest": {
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      fillRoundedRect(ctx, x, y, 90, 26, 13, T.accent);
      ctx.fillStyle = T.bgDeep;
      ctx.font = "bold 13px 'Playfair Display', Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TOPIC", x + 45, y + 13);

      ctx.strokeStyle = hexAlpha(T.accent, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 45, y + 26);
      ctx.lineTo(x + 45, y + 40);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = T.text;
      ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
      lines.forEach((line, i) => ctx.fillText(line, x, y + 58 + i * 34));

      if (form.description) {
        ctx.fillStyle = hexAlpha(T.text, 0.7);
        ctx.font = "16px 'Playfair Display', Georgia, serif";
        ctx.fillText(
          fitText(ctx, form.description, available - 40),
          x,
          y + 58 + lines.length * 34 + 22,
        );
      }
      break;
    }
    case "sunset": {
      const bannerW = Math.min(available, 720);
      const bannerH = 40 + lines.length * 34;
      const bx = W / 2 - bannerW / 2;

      const grad = ctx.createLinearGradient(bx, y, bx + bannerW, y);
      grad.addColorStop(0, hexAlpha(T.accent, 0.9));
      grad.addColorStop(1, hexAlpha(T.accentSoft, 0.9));

      ctx.beginPath();
      ctx.moveTo(bx, y + bannerH);
      ctx.lineTo(bx, y + 18);
      ctx.quadraticCurveTo(bx + bannerW / 2, y - 14, bx + bannerW, y + 18);
      ctx.lineTo(bx + bannerW, y + bannerH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = T.text;
      ctx.font = "bold 25px 'Noto Serif Ethiopic', 'Nyala', serif";
      lines.forEach((line, i) =>
        ctx.fillText(line, bx + bannerW / 2, y + 30 + i * 32),
      );

      if (form.description) {
        ctx.fillStyle = hexAlpha(T.text, 0.75);
        ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
        ctx.fillText(
          fitText(ctx, form.description, bannerW - 40),
          bx + bannerW / 2,
          y + bannerH + 18,
        );
      }
      break;
    }
    case "mono": {
      const blockW = Math.min(available, 680);
      const blockH = 30 + lines.length * 36;

      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, blockW, blockH);

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 25px sans-serif";
      lines.forEach((line, i) => ctx.fillText(line, x + 20, y + 22 + i * 34));

      if (form.description) {
        ctx.fillStyle = hexAlpha(T.text, 0.75);
        ctx.font = "16px 'Playfair Display', Georgia, serif";
        ctx.fillText(
          fitText(ctx, form.description, blockW - 40),
          x + 20,
          y + blockH + 22,
        );
      }
      break;
    }
    default:
      break;
  }
}

// ════════════════════════════════════════════════════════════════
// FOOTER BAND
// ════════════════════════════════════════════════════════════════
async function drawFooter(ctx, theme, T, form, W, H, PAD, loadImage) {
  const footerH = 100;
  const fy = H - footerH;

  switch (theme) {
    case "midnight":
      fillRoundedRect(
        ctx,
        PAD - 20,
        fy,
        W - (PAD - 20) * 2,
        footerH - 20,
        16,
        hexAlpha(T.accent, 0.06),
      );
      break;
    case "forest":
      ctx.strokeStyle = hexAlpha(T.accent, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD - 20, fy);
      ctx.lineTo(W - PAD + 20, fy);
      ctx.stroke();
      break;
    case "sunset":
      fillRoundedRect(
        ctx,
        PAD - 20,
        fy,
        W - (PAD - 20) * 2,
        footerH - 20,
        30,
        hexAlpha(T.accent, 0.08),
      );
      break;
    case "mono":
      ctx.fillStyle = "#000000";
      ctx.fillRect(PAD - 20, fy, W - (PAD - 20) * 2, 4);
      break;
    default:
      break;
  }

  const midY = fy + footerH / 2 - 14;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = hexAlpha(T.accent, 0.8);
  ctx.font =
    theme === "mono"
      ? "bold 13px sans-serif"
      : "italic 14px 'Playfair Display', Georgia, serif";
  ctx.fillText("ADDIS MESOB", PAD, midY - 16);
  ctx.strokeStyle = hexAlpha(T.accent, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, midY);
  ctx.lineTo(PAD + 120, midY);
  ctx.stroke();

  ctx.textAlign = "right";
  ctx.fillStyle = T.accent;
  ctx.font =
    theme === "mono"
      ? "bold 16px sans-serif"
      : "italic 18px 'Playfair Display', Georgia, serif";
  ctx.fillText(form.websiteUrl || "addis.mesobcenter.et", W - PAD, midY);

  const cx = W / 2;
  if (form.qrDataUrl) {
    try {
      const qr = await loadImage(form.qrDataUrl);
      const qrSize = 60;
      ctx.drawImage(qr, cx - qrSize / 2, midY - qrSize / 2, qrSize, qrSize);
    } catch (e) {
      console.warn("[StudioTemplate] QR code failed to load:", e.message);
      drawFooterCenterpiece(ctx, theme, T, cx, midY);
    }
  } else {
    drawFooterCenterpiece(ctx, theme, T, cx, midY);
  }
}

function drawFooterCenterpiece(ctx, theme, T, cx, cy) {
  switch (theme) {
    case "midnight":
      ctx.fillStyle = T.accent;
      drawDiamond(ctx, cx, cy, 7);
      break;
    case "forest":
      ctx.fillStyle = hexAlpha(T.accent, 0.8);
      [-14, 0, 14].forEach((dx) => {
        ctx.beginPath();
        ctx.arc(cx + dx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    case "sunset":
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, Math.PI, Math.PI * 2);
      ctx.stroke();
      break;
    case "mono":
      ctx.fillStyle = "#000000";
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      break;
    default:
      break;
  }
}

// ════════════════════════════════════════════════════════════════
// SHARED DRAWING PRIMITIVES
// ════════════════════════════════════════════════════════════════
function drawDiamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.3, cy - r * 0.3);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx + r * 0.3, cy + r * 0.3);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.3, cy + r * 0.3);
  ctx.lineTo(cx - r, cy);
  ctx.lineTo(cx - r * 0.3, cy - r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHexagon(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 3) * i - Math.PI / 2;
    const px = cx + r * Math.cos(ang);
    const py = cy + r * Math.sin(ang);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawScallopCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  const scallops = 14;
  ctx.beginPath();
  for (let i = 0; i < scallops; i++) {
    const ang = (i / scallops) * Math.PI * 2;
    const nextAng = ((i + 1) / scallops) * Math.PI * 2;
    const midAng = (ang + nextAng) / 2;
    const px = cx + r * Math.cos(ang);
    const py = cy + r * Math.sin(ang);
    const bumpX = cx + (r + 6) * Math.cos(midAng);
    const bumpY = cy + (r + 6) * Math.sin(midAng);
    if (i === 0) ctx.moveTo(px, py);
    ctx.quadraticCurveTo(
      bumpX,
      bumpY,
      cx + r * Math.cos(nextAng),
      cy + r * Math.sin(nextAng),
    );
  }
  ctx.closePath();
  ctx.fill();
}

function drawWreathTicks(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = hexAlpha(color, 0.7);
  const perimeterPoints = 28;
  for (let i = 0; i < perimeterPoints; i++) {
    const t = i / perimeterPoints;
    let px, py, angle;
    if (t < 0.25) {
      px = x + (t / 0.25) * w;
      py = y;
      angle = 0;
    } else if (t < 0.5) {
      px = x + w;
      py = y + ((t - 0.25) / 0.25) * h;
      angle = Math.PI / 2;
    } else if (t < 0.75) {
      px = x + w - ((t - 0.5) / 0.25) * w;
      py = y + h;
      angle = Math.PI;
    } else {
      px = x;
      py = y + h - ((t - 0.75) / 0.25) * h;
      angle = -Math.PI / 2;
    }
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function strokeArchPath(ctx, x, y, w, h, color, lineWidth) {
  const r = w / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 2 * Math.PI);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.restore();
}

function drawDottedLine(ctx, x1, y1, x2, y2, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function formatWeekOf(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    console.log("[StudioTemplate] formatWeekOf failed:", e.message);
    return iso;
  }
}

// ─── Small helper — hex → rgba string ──────────────────────────
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
