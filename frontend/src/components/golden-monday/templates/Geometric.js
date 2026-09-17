// frontend/src/components/golden-monday/templates/Geometric.js
import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "geometric",
  name: "Geometric",
  description: "Bold flat-color blocks with geometric accents",
  thumbnailColor: "#F5C518",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const BLUE = "#0d1a5e";
  const BLUE_DEEP = "#060f38";
  const YELLOW = "#F5C518";
  const CREAM = "#FDF6E3";
  const DARK = "#111";

  // ── Background: layered blue ────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, BLUE);
  bg.addColorStop(1, BLUE_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Big yellow corner block (top-right, rounded) ────────────
  ctx.save();
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(W - 40, 40);
  ctx.lineTo(W - 40, 440);
  ctx.lineTo(W - 380, 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Small yellow accent circle behind the header
  ctx.fillStyle = "rgba(245,197,24,0.15)";
  ctx.beginPath();
  ctx.arc(120, 320, 80, 0, Math.PI * 2);
  ctx.fill();

  // ── Cream bottom-left block (rounded) ───────────────────────
  fillRoundedRect(ctx, 0, H - 220, 340, 220, 24, CREAM);

  // ── Logo on a yellow rounded badge ──────────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      applySoftShadow(ctx, 24, 12, 0.28);
      fillRoundedRect(ctx, 40, 40, 200, 200, 32, YELLOW);
      clearShadow(ctx);
      const lw = 140;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, 40 + (200 - lw) / 2, 40 + (200 - lh) / 2, lw, lh);
    } catch (e) {
      console.warn("[Geometric] logo missing:", e.message);
    }
  } else {
    applySoftShadow(ctx, 24, 12, 0.28);
    fillRoundedRect(ctx, 40, 40, 200, 200, 32, YELLOW);
    clearShadow(ctx);
    ctx.fillStyle = BLUE;
    ctx.font = "bold 60px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A·M", 140, 140);
  }

  // ── Committee label ────────────────────────────────────────
  ctx.fillStyle = DARK;
  ctx.font = "bold 22px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOLDEN MONDAY", W - 60, 100);
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.fillText("committee · 2026", W - 60, 135);

  // ── Header (huge Amharic) ──────────────────────────────────
  ctx.fillStyle = CREAM;
  ctx.textAlign = "left";
  ctx.font = "900 56px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ", 40, 320);
  ctx.fillStyle = YELLOW;
  ctx.fillText("ሰኞ ፕሮግራም", 40, 385);
  ctx.fillStyle = CREAM;
  ctx.fillText("ተናጋሪ", 40, 450);

  // ── Presenter photo (rounded, bold frame) ───────────────────
  const photoX = W - 420;
  const photoY = 520;
  const photoW = 420;
  const photoH = 620;
  const photoRadius = 32;

  // Bold yellow underline strip behind the photo (offset up)
  fillRoundedRect(ctx, photoX - 10, photoY - 10, photoW + 20, 12, 6, YELLOW);

  // Soft shadow behind the photo
  applySoftShadow(ctx, 30, 16, 0.35);
  fillRoundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius, BLUE_DEEP);
  clearShadow(ctx);

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

  // Rounded border around the photo
  strokeRoundedRect(
    ctx,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    YELLOW,
    4,
  );

  // ── Presenter info (left column) ────────────────────────────
  ctx.textAlign = "left";
  const infoX = 40;
  let infoY = 640;

  ctx.fillStyle = YELLOW;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTER", infoX, infoY);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 34px 'Playfair Display', Georgia, serif";
  const nameWords = (form.presenterName || "TBD").split(" ");
  if (nameWords.length > 2) {
    const mid = Math.ceil(nameWords.length / 2);
    ctx.fillText(nameWords.slice(0, mid).join(" "), infoX, infoY + 42);
    ctx.fillText(nameWords.slice(mid).join(" "), infoX, infoY + 82);
    infoY += 120;
  } else {
    ctx.fillText(form.presenterName || "TBD", infoX, infoY + 42);
    infoY += 80;
  }

  ctx.fillStyle = YELLOW;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`,
    infoX,
    infoY,
  );
  infoY += 70;

  // Small yellow pill behind "CENTER"
  fillRoundedRect(ctx, infoX, infoY - 14, 100, 26, 13, YELLOW);
  ctx.fillStyle = BLUE;
  ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
  ctx.fillText("CENTER", infoX + 16, infoY + 4);

  ctx.fillStyle = CREAM;
  ctx.font = "bold 26px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", infoX, infoY + 42);
  infoY += 80;

  fillRoundedRect(ctx, infoX, infoY - 14, 80, 26, 13, YELLOW);
  ctx.fillStyle = BLUE;
  ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
  ctx.fillText("DATE", infoX + 16, infoY + 4);

  ctx.fillStyle = CREAM;
  ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", infoX, infoY + 42);
  infoY += 80;

  fillRoundedRect(ctx, infoX, infoY - 14, 80, 26, 13, YELLOW);
  ctx.fillStyle = BLUE;
  ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
  ctx.fillText("TIME", infoX + 20, infoY + 4);

  ctx.fillStyle = CREAM;
  ctx.font = "bold 22px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", infoX, infoY + 42);

  // ── Title (bottom-left cream block) ─────────────────────────
  if (form.title) {
    ctx.fillStyle = BLUE;
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText("TOPIC", 40, H - 130);
    ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, 300), 40, H - 90);
  }

  // ── Website URL ─────────────────────────────────────────────
  ctx.fillStyle = YELLOW;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - 40, H - 40);
}
