// frontend/src/components/golden-monday/templates/ModernMinimal.js
import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "modern-minimal",
  name: "Modern Minimal",
  description: "Editorial layout with generous whitespace",
  thumbnailColor: "#F8F6F1",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const BG = "#F8F6F1";
  const INK = "#1a1f36";
  const ACCENT = "#0d1a5e";
  const GOLD = "#b8860b";
  const CARD = "#ffffff";
  const CARD_BORDER = "#e7e1d2";

  // ── Background ──────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Soft diagonal tint for depth
  const tint = ctx.createLinearGradient(0, 0, W, H);
  tint.addColorStop(0, "rgba(13,26,94,0.02)");
  tint.addColorStop(1, "rgba(184,134,11,0.05)");
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent bar ──────────────────────────────────────────
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 12);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 12, W, 3);

  // ── Top-left logo ───────────────────────────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = 140;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, 60, 50, lw, lh);
    } catch (e) {
      console.warn("[ModernMinimal] logo missing:", e.message);
    }
  }

  // ── Committee label (top-right) ─────────────────────────────
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOLDEN MONDAY", W - 60, 70);
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
  ctx.fillText("committee · 2026", W - 60, 100);

  // ── Amharic heading (two lines) ─────────────────────────────
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "bold 46px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ", 60, 250);
  ctx.fillText("ፕሮግራም ተረኛ", 60, 312);

  fillRoundedRect(ctx, 60, 340, 120, 5, 3, ACCENT);

  // ── Presenter photo: rounded card (right column) ────────────
  const photoX = W - 500;
  const photoY = 400;
  const photoW = 440;
  const photoH = 440;
  const photoRadius = 32;

  // Soft drop-shadow card behind
  applySoftShadow(ctx, 34, 16, 0.16);
  fillRoundedRect(
    ctx,
    photoX - 12,
    photoY - 12,
    photoW + 24,
    photoH + 24,
    photoRadius + 4,
    CARD,
  );
  clearShadow(ctx);

  // A gold strip accent under the card
  fillRoundedRect(
    ctx,
    photoX - 12,
    photoY + photoH + 12 + 6,
    photoW + 24,
    6,
    3,
    GOLD,
  );

  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    { fallbackColor: "#e5e1d8", fallbackText: "Presenter photo" },
  );

  // Subtle inner border on the photo
  strokeRoundedRect(
    ctx,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    "rgba(0,0,0,0.06)",
    1,
  );

  // ── Presenter name / role (left column) ─────────────────────
  ctx.textAlign = "left";

  ctx.fillStyle = GOLD;
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTED BY", 60, 430);

  ctx.fillStyle = INK;
  ctx.font = "bold 38px 'Playfair Display', Georgia, serif";
  const nameWidth = W / 2 - 140;
  ctx.fillText(fitText(ctx, form.presenterName || "TBD", nameWidth), 60, 480);

  ctx.fillStyle = ACCENT;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audience = form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audience, nameWidth), 60, 550);

  // ── Info cards (left column) ────────────────────────────────
  let y = 640;
  const cardX = 60;
  const cardW = W / 2 - 140;
  const cardH = 82;
  const cardRadius = 16;

  const drawInfoCard = (label, value) => {
    applySoftShadow(ctx, 16, 6, 0.08);
    fillRoundedRect(ctx, cardX, y, cardW, cardH, cardRadius, CARD);
    clearShadow(ctx);
    strokeRoundedRect(ctx, cardX, y, cardW, cardH, cardRadius, CARD_BORDER, 1);

    // Small gold accent bar on the left edge of the card
    fillRoundedRect(ctx, cardX + 12, y + 18, 4, cardH - 36, 2, GOLD);

    ctx.fillStyle = GOLD;
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText(label, cardX + 30, y + 30);

    ctx.fillStyle = INK;
    ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, value, cardW - 50), cardX + 30, y + 62);

    y += cardH + 14;
  };

  drawInfoCard("CENTER", form.center || "Addis Ketema Center");
  drawInfoCard("DATE", form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.");
  drawInfoCard("TIME", form.time || "1:30 – 2:30 ከሰዓት");

  // ── Title band (bottom) ─────────────────────────────────────
  if (form.title) {
    const bandH = 180;
    const bandY = H - bandH;

    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, bandY, W, bandH);

    ctx.fillStyle = GOLD;
    ctx.fillRect(0, bandY, W, 4);

    // Small gold diamond accent at top-center of the band
    ctx.beginPath();
    ctx.moveTo(W / 2, bandY - 10);
    ctx.lineTo(W / 2 + 12, bandY + 2);
    ctx.lineTo(W / 2, bandY + 14);
    ctx.lineTo(W / 2 - 12, bandY + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = GOLD;
    ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC", 60, bandY + 55);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 30px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, W - 120), 60, bandY + 110);
  }

  // ── Website URL (bottom-right) ──────────────────────────────
  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  const urlY = form.title ? H - 30 : H - 40;
  ctx.fillText(form.websiteUrl, W - 60, urlY);
}
