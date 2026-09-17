// frontend/src/components/golden-monday/templates/ElegantGold.js
//
// A formal, ornamental look: deep navy background, gold flourishes,
// serif English headers, and a large centered presenter portrait.
// Reads as "official ceremony" rather than "weekly bulletin".

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

  // ── Background ────────────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, NAVY);
  grad.addColorStop(1, NAVY_LIGHT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Gold ornamental border ────────────────────────────────
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Corner ornaments
  const corner = (x, y, dx, dy) => {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 30 * dy);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 30 * dx, y);
    ctx.stroke();
  };
  corner(50, 50, 1, 1);
  corner(W - 50, 50, -1, 1);
  corner(50, H - 50, 1, -1);
  corner(W - 50, H - 50, -1, -1);

  // ── Top logo (centered) ───────────────────────────────────
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

  // ── Header with small decorative lines ────────────────────
  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 40px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተናጋሪ", W / 2, 260);

  // Decorative lines flanking the header
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

  // ── Presenter photo (large, centered) ─────────────────────
  const photoW = 380;
  const photoH = 460;
  const photoX = W / 2 - photoW / 2;
  const photoY = 340;

  // Gold frame with offset
  ctx.fillStyle = GOLD;
  ctx.fillRect(photoX - 12, photoY - 12, photoW + 24, photoH + 24);
  ctx.fillStyle = NAVY;
  ctx.fillRect(photoX - 6, photoY - 6, photoW + 12, photoH + 12);

  if (photoSrc) {
    try {
      const photo = await loadImage(photoSrc);
      const targetAspect = photoW / photoH;
      const sourceAspect = photo.width / photo.height;
      let sx = 0,
        sy = 0,
        sw = photo.width,
        sh = photo.height;
      if (sourceAspect > targetAspect) {
        sw = photo.height * targetAspect;
        sx = (photo.width - sw) / 2;
      } else {
        sh = photo.width / targetAspect;
        sy = (photo.height - sh) / 2;
      }
      ctx.drawImage(photo, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } catch (e) {
      console.warn("[ElegantGold] presenter photo failed:", e.message);
    }
  } else {
    ctx.fillStyle = NAVY_LIGHT;
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = GOLD;
    ctx.font = "italic 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Presenter photo", W / 2, photoY + photoH / 2);
  }

  // ── Presenter name (below photo) ──────────────────────────
  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "bold 34px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`,
    W / 2,
    photoY + photoH + 70,
  );

  ctx.font = "italic 26px Georgia, serif";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.fillText(form.presenterName || "", W / 2, photoY + photoH + 115);

  // ── Information row (center, date, time) ──────────────────
  const infoY = photoY + photoH + 190;

  // Center
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("CENTER", W / 2, infoY - 30);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", W / 2, infoY + 5);

  // Divider
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, infoY + 40);
  ctx.lineTo(W / 2 + 200, infoY + 40);
  ctx.stroke();

  // Date
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("DATE", W / 2, infoY + 90);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", W / 2, infoY + 125);

  // Time
  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", W / 2, infoY + 165);

  // ── Presentation title (bottom band) ──────────────────────
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
    let title = `"${form.title}"`;
    if (ctx.measureText(title).width > W - 180) {
      while (
        ctx.measureText(title + "…").width > W - 180 &&
        title.length > 20
      ) {
        title = title.slice(0, -1);
      }
      title += "…";
    }
    ctx.fillText(title, W / 2, H - 60);
  }

  // ── Website URL ───────────────────────────────────────────
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText(form.websiteUrl, W / 2, H - 20);
}
