// frontend/src/components/golden-monday/templates/ClassicBlue.js
import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "classic-blue",
  name: "Classic Blue",
  description: "The committee's original blue & gold layout",
  thumbnailColor: "#2C3E8F",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const BRAND_BLUE = "#2C3E8F";
  const BRAND_BLUE_DEEP = "#1a2764";
  const BRAND_GOLD = "#F5C518";
  const BRAND_WHITE = "#FFFFFF";

  // ── Layout constants (single source of truth) ───────────────
  // Keeping these named makes it obvious where each block lives and
  // easy to retune without hunting through the drawing code.
  const PAD = 40; // outer margin
  const HEADER_Y = 90; // baseline of the top Amharic header
  const LOGO_W = 170;
  const BADGE_W = 220;
  const BADGE_H = 140;

  const PHOTO_X = PAD;
  const PHOTO_Y = 230;
  const PHOTO_W = W / 2 - 50;
  const PHOTO_H = 540;
  const PHOTO_RADIUS = 28;

  // Right column: bounded box, not a floating center point.
  // LEFT = start, RIGHT = end. All right-side text is drawn
  // between these two x-coordinates.
  const RIGHT_LEFT = PHOTO_X + PHOTO_W + 30; // ≈ 450
  const RIGHT_RIGHT = W - PAD; // 860
  const RIGHT_WIDTH = RIGHT_RIGHT - RIGHT_LEFT;
  const RIGHT_CENTER = RIGHT_LEFT + RIGHT_WIDTH / 2;

  // ── Background: subtle vertical gradient ────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BRAND_BLUE);
  bg.addColorStop(1, BRAND_BLUE_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial highlight top-right
  const glow = ctx.createRadialGradient(W, 0, 100, W, 0, 900);
  glow.addColorStop(0, "rgba(245,197,24,0.10)");
  glow.addColorStop(1, "rgba(245,197,24,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top-left logo ────────────────────────────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = LOGO_W;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, PAD, 40, lw, lh);
    } catch (e) {
      console.warn("[ClassicBlue] logo missing:", e.message);
    }
  }

  // ── Committee badge (top-right) ─────────────────────────────
  // Draw it FIRST, then size the header around its left edge so
  // they can never overlap.
  const badgeX = W - PAD - BADGE_W;
  const badgeY = 40;

  applySoftShadow(ctx, 20, 8, 0.25);
  fillRoundedRect(
    ctx,
    badgeX,
    badgeY,
    BADGE_W,
    BADGE_H,
    18,
    "rgba(0,0,0,0.20)",
  );
  clearShadow(ctx);
  strokeRoundedRect(ctx, badgeX, badgeY, BADGE_W, BADGE_H, 18, BRAND_GOLD, 2);

  ctx.fillStyle = BRAND_GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 24px 'Playfair Display', Georgia, serif";
  ctx.fillText("Golden monday", badgeX + BADGE_W / 2, badgeY + 40);
  ctx.fillText("committee", badgeX + BADGE_W / 2, badgeY + 76);
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.fillText("· 2026 ·", badgeX + BADGE_W / 2, badgeY + 112);

  // ── Top-center Amharic header ───────────────────────────────
  // Available horizontal space: from the right edge of the logo
  // to the left edge of the badge, minus a small gutter on each side.
  const headerLeft = PAD + LOGO_W + 20;
  const headerRight = badgeX - 20;
  const headerWidth = headerRight - headerLeft;
  const headerCenter = headerLeft + headerWidth / 2;

  ctx.fillStyle = BRAND_GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Try 34px first; if it doesn't fit, shrink down to 24px.
  let headerFont = 34;
  const headerText = "የወርቃማ ሰኞ ፕሮግራም ተረኛ";
  while (headerFont > 24) {
    ctx.font = `bold ${headerFont}px 'Noto Serif Ethiopic', 'Nyala', serif`;
    if (ctx.measureText(headerText).width <= headerWidth) break;
    headerFont -= 2;
  }
  ctx.font = `bold ${headerFont}px 'Noto Serif Ethiopic', 'Nyala', serif`;
  ctx.fillText(fitText(ctx, headerText, headerWidth), headerCenter, HEADER_Y);

  // ── Presenter photo (rounded, shadowed, framed) ─────────────
  applySoftShadow(ctx, 30, 16, 0.28);
  fillRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    "#0d1447",
  );
  clearShadow(ctx);

  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    { fallbackColor: "#243c8a", fallbackText: "Presenter photo" },
  );

  strokeRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    BRAND_GOLD,
    3,
  );

  // ── Clock (bottom-left) ─────────────────────────────────────
  if (assets.clock) {
    try {
      const clock = await loadImage(assets.clock);
      const cw = 400;
      const ch = (clock.height / clock.width) * cw;
      ctx.drawImage(clock, -20, H - ch + 20, cw, ch);
    } catch (e) {
      console.warn("[ClassicBlue] clock missing:", e.message);
    }
  }

  // ── Right column (bounded, fit-tested, vertically spaced) ───
  // Every line below is drawn with textAlign="center" at
  // RIGHT_CENTER, and every string is passed through fitText
  // against RIGHT_WIDTH so it can never overflow.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Megaphone — sits above the audience line
  ctx.font = "72px serif";
  ctx.fillText("📢", RIGHT_CENTER, 380);

  // Audience line (Amharic)
  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 32px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, RIGHT_WIDTH), RIGHT_CENTER, 470);

  // Center name (serif italic)
  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "italic bold 40px 'Playfair Display', Georgia, serif";
  const centerName = form.center || "Addis Ketema Center";
  ctx.fillText(fitText(ctx, centerName, RIGHT_WIDTH), RIGHT_CENTER, 590);

  // Gold divider under the center
  fillRoundedRect(
    ctx,
    RIGHT_CENTER - RIGHT_WIDTH / 2 + 20,
    620,
    RIGHT_WIDTH - 40,
    5,
    3,
    BRAND_GOLD,
  );

  // Ethiopian date
  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 32px 'Noto Serif Ethiopic', 'Nyala', serif";
  const ethDate = form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.";
  ctx.fillText(fitText(ctx, ethDate, RIGHT_WIDTH), RIGHT_CENTER, 700);

  // Time
  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "italic bold 30px 'Playfair Display', Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.time || "1:30 – 2:30 ከሰዓት", RIGHT_WIDTH),
    RIGHT_CENTER,
    770,
  );

  // ── Title ribbon (bottom, full width, bounded) ──────────────
  if (form.title) {
    const ribbonX = PAD;
    const ribbonY = H - 200;
    const ribbonW = W - PAD * 2;
    const ribbonH = 100;

    applySoftShadow(ctx, 22, 10, 0.24);
    fillRoundedRect(
      ctx,
      ribbonX,
      ribbonY,
      ribbonW,
      ribbonH,
      18,
      "rgba(0,0,0,0.28)",
    );
    clearShadow(ctx);
    strokeRoundedRect(
      ctx,
      ribbonX,
      ribbonY,
      ribbonW,
      ribbonH,
      18,
      BRAND_GOLD,
      2,
    );

    ctx.fillStyle = BRAND_GOLD;
    ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC OF THE SESSION", ribbonX + 24, ribbonY + 32);

    ctx.fillStyle = BRAND_WHITE;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, form.title, ribbonW - 48),
      ribbonX + 24,
      ribbonY + 70,
    );
  }

  // ── Website URL (bottom-right, fit-tested) ──────────────────
  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  // Sit the URL above the ribbon if the ribbon is present, otherwise
  // flush to the bottom padding.
  const urlY = form.title ? H - 220 : H - 40;
  ctx.fillText(fitText(ctx, form.websiteUrl, RIGHT_WIDTH), W - PAD, urlY);
}
