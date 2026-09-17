// frontend/src/components/golden-monday/templates/CeremonialRed.js
import {
  // drawRoundedImage,
  drawArchImage,
  // fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "ceremonial-red",
  name: "Ceremonial Red",
  description: "Deep burgundy with ceremonial gold ornaments",
  thumbnailColor: "#7B1818",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const MAROON = "#7B1818";
  const MAROON_DARK = "#4a0d0d";
  const MAROON_LIGHT = "#8f2020";
  const GOLD = "#d4af37";
  const GOLD_LIGHT = "#f5e6a8";
  const CREAM = "#f4ecd8";

  // ── Background gradient ─────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, MAROON);
  bg.addColorStop(0.55, MAROON_LIGHT);
  bg.addColorStop(1, MAROON_DARK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial glow top-center
  const glow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 900);
  glow.addColorStop(0, "rgba(212,175,55,0.14)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Double gold frame (rounded) ─────────────────────────────
  strokeRoundedRect(ctx, 24, 24, W - 48, H - 48, 28, GOLD, 4);
  strokeRoundedRect(ctx, 34, 34, W - 68, H - 68, 22, GOLD_LIGHT, 1);

  // ── Ornamental corner flourishes ────────────────────────────
  const flourish = (x, y, dx, dy) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dx, dy);

    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(0, 0);
    ctx.lineTo(60, 0);
    ctx.stroke();

    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 20);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(80, 0, 3, 0, Math.PI * 2);
    ctx.arc(0, 80, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  flourish(50, 50, 1, 1);
  flourish(W - 50, 50, -1, 1);
  flourish(50, H - 50, 1, -1);
  flourish(W - 50, H - 50, -1, -1);

  // ── Top logo on a gold medallion ────────────────────────────
  const medallionX = W / 2;
  const medallionY = 130;
  const medallionR = 70;

  applySoftShadow(ctx, 24, 10, 0.35);
  const discGrad = ctx.createRadialGradient(
    medallionX - 20,
    medallionY - 20,
    10,
    medallionX,
    medallionY,
    medallionR,
  );
  discGrad.addColorStop(0, GOLD_LIGHT);
  discGrad.addColorStop(1, GOLD);
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(medallionX, medallionY, medallionR, 0, Math.PI * 2);
  ctx.fill();
  clearShadow(ctx);

  ctx.strokeStyle = MAROON_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(medallionX, medallionY, medallionR - 6, 0, Math.PI * 2);
  ctx.stroke();

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const size = 110;
      ctx.drawImage(
        logo,
        medallionX - size / 2,
        medallionY - size / 2,
        size,
        size,
      );
    } catch (e) {
      console.warn("[CeremonialRed] logo missing:", e.message);
    }
  }

  // ── Header ──────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.fillText("Golden Monday", W / 2, 245);

  ctx.fillStyle = CREAM;
  ctx.font = "bold 42px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", W / 2, 300);

  // Ornamental line
  const lineY = 335;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 260, lineY);
  ctx.lineTo(W / 2 - 60, lineY);
  ctx.moveTo(W / 2 + 60, lineY);
  ctx.lineTo(W / 2 + 260, lineY);
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W / 2, lineY - 8);
  ctx.lineTo(W / 2 + 8, lineY);
  ctx.lineTo(W / 2, lineY + 8);
  ctx.lineTo(W / 2 - 8, lineY);
  ctx.closePath();
  ctx.fill();

  // ── Presenter photo inside a gold arch ──────────────────────
  const photoW = 340;
  const photoH = 400;
  const photoX = W / 2 - photoW / 2;
  const photoY = 400;
  const archRadius = photoW / 2;

  // Soft shadow behind the arch
  applySoftShadow(ctx, 28, 14, 0.35);
  ctx.fillStyle = MAROON_DARK;
  ctx.beginPath();
  ctx.moveTo(photoX, photoY + archRadius);
  ctx.arc(photoX + archRadius, photoY + archRadius, archRadius, Math.PI, 0);
  ctx.lineTo(photoX + photoW, photoY + photoH);
  ctx.lineTo(photoX, photoY + photoH);
  ctx.closePath();
  ctx.fill();
  clearShadow(ctx);

  // The photo, clipped to the arch
  await drawArchImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    {
      fallbackColor: MAROON_DARK,
    },
  );

  // Gold arch outline
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(photoX, photoY + archRadius);
  ctx.arc(photoX + archRadius, photoY + archRadius, archRadius, Math.PI, 0);
  ctx.lineTo(photoX + photoW, photoY + photoH);
  ctx.lineTo(photoX, photoY + photoH);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Diamond at the arch's apex
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  ctx.moveTo(W / 2, photoY + 4);
  ctx.lineTo(W / 2 + 10, photoY + 16);
  ctx.lineTo(W / 2, photoY + 28);
  ctx.lineTo(W / 2 - 10, photoY + 16);
  ctx.closePath();
  ctx.fill();

  // ── Presenter name below the arch ───────────────────────────
  const nameY = photoY + photoH + 70;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTED BY", W / 2, nameY - 20);

  ctx.fillStyle = CREAM;
  ctx.font = "bold 34px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`,
    W / 2,
    nameY + 25,
  );

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 24px 'Playfair Display', Georgia, serif";
  ctx.fillText(form.presenterName || "", W / 2, nameY + 65);

  // ── Info block ──────────────────────────────────────────────
  const infoY = nameY + 150;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("CENTER", W / 2, infoY - 30);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 26px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", W / 2, infoY);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 180, infoY + 30);
  ctx.lineTo(W / 2 + 180, infoY + 30);
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("DATE", W / 2, infoY + 75);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", W / 2, infoY + 108);

  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", W / 2, infoY + 150);

  // ── Title band ──────────────────────────────────────────────
  if (form.title) {
    const bandTop = H - 180;

    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, bandTop);
    ctx.lineTo(W - 100, bandTop);
    ctx.stroke();

    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(W / 2, bandTop - 8);
    ctx.lineTo(W / 2 + 8, bandTop);
    ctx.lineTo(W / 2, bandTop + 8);
    ctx.lineTo(W / 2 - 8, bandTop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = GOLD;
    ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
    ctx.fillText("TOPIC OF THE SESSION", W / 2, bandTop + 45);

    ctx.fillStyle = CREAM;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, W - 180), W / 2, bandTop + 90);
  }

  // ── Website ─────────────────────────────────────────────────
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
  ctx.fillText(form.websiteUrl, W / 2, H - 55);
}
