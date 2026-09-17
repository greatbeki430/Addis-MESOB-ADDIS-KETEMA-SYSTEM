// frontend/src/components/golden-monday/templates/CeremonialRed.js
//
// A formal, ceremonial look: deep burgundy background with layered
// gold ornamental borders, a large centered portrait inside a gold
// arch, and serif typography throughout. Reads like an official
// invitation or award certificate.

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

  // ── Background: subtle vertical gradient ────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, MAROON);
  bg.addColorStop(0.55, MAROON_LIGHT);
  bg.addColorStop(1, MAROON_DARK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Double gold frame (outer thick, inner thin) ────────────
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, W - 68, H - 68);

  // ── Ornamental corner flourishes ────────────────────────────
  const flourish = (x, y, dx, dy) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dx, dy);

    // L-shaped bracket
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(0, 0);
    ctx.lineTo(60, 0);
    ctx.stroke();

    // Diamond accent at the corner
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 20);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();

    // Small decorative dots
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

  // ── Top logo (centered on a gold medallion) ─────────────────
  const medallionX = W / 2;
  const medallionY = 130;
  const medallionR = 70;

  // Gold disc
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

  // Thin inner ring
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

  // ── Header: "Golden Monday" in small caps over Amharic ──────
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.fillText("Golden Monday", W / 2, 245);

  ctx.fillStyle = CREAM;
  ctx.font = "bold 42px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተናጋሪ", W / 2, 300);

  // Ornamental line under header
  const lineY = 335;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 260, lineY);
  ctx.lineTo(W / 2 - 60, lineY);
  ctx.moveTo(W / 2 + 60, lineY);
  ctx.lineTo(W / 2 + 260, lineY);
  ctx.stroke();

  // Central diamond on the line
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

  // Draw the arch outline (thick gold)
  ctx.save();
  ctx.beginPath();
  // Arch path: semicircle on top + rectangle below
  ctx.moveTo(photoX, photoY + archRadius);
  ctx.arc(photoX + archRadius, photoY + archRadius, archRadius, Math.PI, 0);
  ctx.lineTo(photoX + photoW, photoY + photoH);
  ctx.lineTo(photoX, photoY + photoH);
  ctx.closePath();

  // Fill with a subtle maroon first, in case photo load fails
  ctx.fillStyle = MAROON_DARK;
  ctx.fill();

  // Clip the photo to the arch
  ctx.clip();

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
      console.warn("[CeremonialRed] presenter photo failed:", e.message);
    }
  } else {
    ctx.fillStyle = MAROON_DARK;
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = GOLD;
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText("Presenter photo", W / 2, photoY + photoH / 2);
  }
  ctx.restore();

  // Draw the gold arch outline on top
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

  // Small gold diamond at the arch's apex
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

  // Center
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("CENTER", W / 2, infoY - 30);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 26px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", W / 2, infoY);

  // Small decorative divider between center and date
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 180, infoY + 30);
  ctx.lineTo(W / 2 + 180, infoY + 30);
  ctx.stroke();

  // Date
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("DATE", W / 2, infoY + 75);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", W / 2, infoY + 108);

  // Time (with small "at" ornament)
  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", W / 2, infoY + 150);

  // ── Title band (bottom) ─────────────────────────────────────
  if (form.title) {
    const bandTop = H - 180;

    // Gold ornamental line above the title
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, bandTop);
    ctx.lineTo(W - 100, bandTop);
    ctx.stroke();

    // Central diamond on the line
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
    ctx.fillText(title, W / 2, bandTop + 90);
  }

  // ── Website URL (bottom) ────────────────────────────────────
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
  ctx.fillText(form.websiteUrl, W / 2, H - 55);
}
