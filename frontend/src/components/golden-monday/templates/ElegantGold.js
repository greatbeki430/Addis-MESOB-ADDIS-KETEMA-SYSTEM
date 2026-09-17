// frontend/src/components/golden-monday/templates/ElegantGold.js
import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "elegant-gold",
  name: "Elegant Gold",
  description: "Formal navy & gold with ornamental flourishes",
  thumbnailColor: "#0d1a5e",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const NAVY = "#0d1a5e";
  const NAVY_LIGHT = "#1a2670";
  const GOLD = "#d4af37";
  const GOLD_LIGHT = "#f5e6a8";
  const CREAM = "#f4f1e6";

  // ── Background gradient ─────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, NAVY);
  grad.addColorStop(1, NAVY_LIGHT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft gold radial highlight at top-center
  const glow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 800);
  glow.addColorStop(0, "rgba(212,175,55,0.12)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Gold ornamental border with rounded corners ─────────────
  strokeRoundedRect(ctx, 30, 30, W - 60, H - 60, 24, GOLD, 3);
  strokeRoundedRect(ctx, 40, 40, W - 80, H - 80, 20, GOLD_LIGHT, 1);

  // Corner ornaments
  const corner = (x, y, dx, dy) => {
    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 30 * dy);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 30 * dx, y);
    ctx.stroke();
    ctx.restore();
  };
  corner(60, 60, 1, 1);
  corner(W - 60, 60, -1, 1);
  corner(60, H - 60, 1, -1);
  corner(W - 60, H - 60, -1, -1);

  // ── Top logo (centered) ─────────────────────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = 130;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, W / 2 - lw / 2, 70, lw, lh);
    } catch (e) {
      console.warn("[ElegantGold] logo missing:", e.message);
    }
  }

  // ── Header with decorative lines ────────────────────────────
  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 40px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", W / 2, 260);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 260);
  ctx.lineTo(220, 260);
  ctx.moveTo(W - 220, 260);
  ctx.lineTo(W - 120, 260);
  ctx.stroke();

  // Diamond accent under header
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W / 2, 285);
  ctx.lineTo(W / 2 + 8, 293);
  ctx.lineTo(W / 2, 301);
  ctx.lineTo(W / 2 - 8, 293);
  ctx.closePath();
  ctx.fill();

  // ── Presenter photo — rounded rectangle with soft shadow ────
  const photoW = 380;
  const photoH = 460;
  const photoX = W / 2 - photoW / 2;
  const photoY = 340;
  const photoRadius = 20;

  // Soft shadow behind the frame
  applySoftShadow(ctx, 30, 14, 0.35);
  fillRoundedRect(
    ctx,
    photoX - 12,
    photoY - 12,
    photoW + 24,
    photoH + 24,
    photoRadius + 6,
    "#0a1240",
  );
  clearShadow(ctx);

  // Gold frame (thick ring)
  fillRoundedRect(
    ctx,
    photoX - 12,
    photoY - 12,
    photoW + 24,
    photoH + 24,
    photoRadius + 6,
    GOLD,
  );

  // Navy inset
  fillRoundedRect(
    ctx,
    photoX - 6,
    photoY - 6,
    photoW + 12,
    photoH + 12,
    photoRadius + 2,
    NAVY,
  );

  // The photo, clipped to a rounded rectangle
  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    { fallbackColor: NAVY_LIGHT, fallbackText: "Presenter photo" },
  );

  // Small diamond accent at the top of the photo frame
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  ctx.moveTo(W / 2, photoY - 28);
  ctx.lineTo(W / 2 + 12, photoY - 16);
  ctx.lineTo(W / 2, photoY - 4);
  ctx.lineTo(W / 2 - 12, photoY - 16);
  ctx.closePath();
  ctx.fill();

  // ── Presenter name ──────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "bold 34px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`,
    W / 2,
    photoY + photoH + 70,
  );

  ctx.font = "italic 26px 'Playfair Display', Georgia, serif";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.fillText(form.presenterName || "", W / 2, photoY + photoH + 115);

  // ── Info block ──────────────────────────────────────────────
  const infoY = photoY + photoH + 190;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("CENTER", W / 2, infoY - 30);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", W / 2, infoY + 5);

  // Gold divider with a small diamond at center
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, infoY + 40);
  ctx.lineTo(W / 2 - 12, infoY + 40);
  ctx.moveTo(W / 2 + 12, infoY + 40);
  ctx.lineTo(W / 2 + 200, infoY + 40);
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W / 2, infoY + 33);
  ctx.lineTo(W / 2 + 7, infoY + 40);
  ctx.lineTo(W / 2, infoY + 47);
  ctx.lineTo(W / 2 - 7, infoY + 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("DATE", W / 2, infoY + 90);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", W / 2, infoY + 125);

  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", W / 2, infoY + 165);

  // ── Title band (bottom) ─────────────────────────────────────
  if (form.title) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, H - 140);
    ctx.lineTo(W - 120, H - 140);
    ctx.stroke();

    ctx.fillStyle = GOLD;
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("TOPIC", W / 2, H - 105);

    ctx.fillStyle = CREAM;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, W - 180), W / 2, H - 60);
  }

  // ── Website URL ─────────────────────────────────────────────
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText(form.websiteUrl, W / 2, H - 20);
}
