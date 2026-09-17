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

  // ── Background: subtle vertical gradient ────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BRAND_BLUE);
  bg.addColorStop(1, BRAND_BLUE_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Subtle radial highlight top-right ───────────────────────
  const glow = ctx.createRadialGradient(W, 0, 100, W, 0, 900);
  glow.addColorStop(0, "rgba(245,197,24,0.10)");
  glow.addColorStop(1, "rgba(245,197,24,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top-left logo ────────────────────────────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = 170;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, 40, 40, lw, lh);
    } catch (e) {
      console.warn("[ClassicBlue] logo missing:", e.message);
    }
  }

  // ── Top-center Amharic header ────────────────────────────────
  ctx.fillStyle = BRAND_GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 34px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተናጋሪ", W / 2 + 40, 90);

  // ── Top-right committee badge (rounded) ─────────────────────
  const badgeX = W - 250;
  const badgeY = 40;
  const badgeW = 210;
  const badgeH = 130;

  applySoftShadow(ctx, 20, 8, 0.25);
  fillRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 18, "rgba(0,0,0,0.20)");
  clearShadow(ctx);
  strokeRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 18, BRAND_GOLD, 2);

  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 26px 'Playfair Display', Georgia, serif";
  ctx.fillText("Golden monday", badgeX + badgeW / 2, badgeY + 38);
  ctx.fillText("committee", badgeX + badgeW / 2, badgeY + 72);
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.fillText("· 2026 ·", badgeX + badgeW / 2, badgeY + 105);

  // ── Presenter photo (rounded, shadowed, framed) ─────────────
  const photoX = 40;
  const photoY = 230;
  const photoW = W / 2 - 50;
  const photoH = 540;
  const photoRadius = 28;

  // Outer soft shadow
  applySoftShadow(ctx, 30, 16, 0.28);
  fillRoundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius, "#0d1447");
  clearShadow(ctx);

  // The photo itself
  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    { fallbackColor: "#243c8a", fallbackText: "Presenter photo" },
  );

  // Gold frame
  strokeRoundedRect(
    ctx,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    BRAND_GOLD,
    3,
  );

  // ── Clock (bottom-left) ──────────────────────────────────────
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

  // ── Right column ─────────────────────────────────────────────
  const rightX = W / 2 + 60;

  ctx.textAlign = "left";
  ctx.font = "72px serif";
  ctx.fillText("📢", rightX + 60, 400);

  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 32px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.textAlign = "center";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(audienceLine, rightX + 180, 500);

  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "italic bold 40px 'Playfair Display', Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", rightX + 180, 620);

  fillRoundedRect(ctx, rightX + 40, 650, 280, 5, 3, BRAND_GOLD);

  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 32px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", rightX + 180, 730);

  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "italic bold 30px 'Playfair Display', Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", rightX + 180, 800);

  // ── Title ribbon at the bottom ──────────────────────────────
  if (form.title) {
    const ribbonX = 40;
    const ribbonY = H - 200;
    const ribbonW = W - 80;
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
    ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC OF THE SESSION", ribbonX + 24, ribbonY + 34);

    ctx.fillStyle = BRAND_WHITE;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, form.title, ribbonW - 48),
      ribbonX + 24,
      ribbonY + 72,
    );
  }

  // ── Website URL ──────────────────────────────────────────────
  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - 40, H - 40);
}
