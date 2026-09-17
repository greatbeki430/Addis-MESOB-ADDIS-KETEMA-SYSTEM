// frontend/src/components/golden-monday/templates/ClassicBlue.js
//
// The original "committee blue" template — matches the manual design
// the coordinators used to produce in Photoshop. Blue background,
// gold headers, framed presenter photo, clock illustration bottom-left.

export const meta = {
  id: "classic-blue",
  name: "Classic Blue",
  description: "The committee's original blue & gold layout",
  thumbnailColor: "#2C3E8F",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const BRAND_BLUE = "#2C3E8F";
  const BRAND_GOLD = "#F5C518";
  const BRAND_WHITE = "#FFFFFF";

  // ── Background ────────────────────────────────────────────
  ctx.fillStyle = BRAND_BLUE;
  ctx.fillRect(0, 0, W, H);

  // ── Top-left logo ─────────────────────────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = 180;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, 40, 40, lw, lh);
    } catch (e) {
      console.warn("[ClassicBlue] logo missing:", e.message);
    }
  }

  // ── Top-center Amharic header ─────────────────────────────
  ctx.fillStyle = BRAND_GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 34px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተናጋሪ", W / 2 + 40, 90);

  // ── Top-right committee box ───────────────────────────────
  const boxX = W - 260;
  const boxY = 40;
  const boxW = 220;
  const boxH = 140;
  ctx.strokeStyle = BRAND_GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText("Golden monday", boxX + boxW / 2, boxY + 40);
  ctx.fillText("committee", boxX + boxW / 2, boxY + 75);
  ctx.fillText("2026", boxX + boxW / 2, boxY + 115);

  // ── Presenter photo (left, framed) ────────────────────────
  const photoX = 20;
  const photoY = 230;
  const photoW = W / 2 - 30;
  const photoH = 560;

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
      ctx.strokeStyle = BRAND_GOLD;
      ctx.lineWidth = 2;
      ctx.strokeRect(photoX, photoY, photoW, photoH);
    } catch (e) {
      console.warn("[ClassicBlue] presenter photo failed:", e.message);
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = BRAND_WHITE;
    ctx.font = "italic 20px sans-serif";
    ctx.fillText("Presenter photo", photoX + photoW / 2, photoY + photoH / 2);
  }

  // ── Clock (bottom-left) ───────────────────────────────────
  if (assets.clock) {
    try {
      const clock = await loadImage(assets.clock);
      const cw = 420;
      const ch = (clock.height / clock.width) * cw;
      ctx.drawImage(clock, -20, H - ch + 20, cw, ch);
    } catch (e) {
      console.warn("[ClassicBlue] clock missing:", e.message);
    }
  }

  // ── Right column ──────────────────────────────────────────
  const rightX = W / 2 + 60;
  ctx.textAlign = "left";

  ctx.font = "70px serif";
  ctx.fillText("📢", rightX + 80, 420);

  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 32px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.textAlign = "center";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(audienceLine, rightX + 180, 530);

  ctx.font = "italic bold 40px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", rightX + 180, 700);

  ctx.fillStyle = BRAND_GOLD;
  ctx.fillRect(rightX + 20, 730, 320, 6);

  ctx.font = "bold 34px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", rightX + 180, 810);

  ctx.font = "italic bold 30px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", rightX + 180, 880);

  // ── Title (below clock) ───────────────────────────────────
  if (form.title) {
    ctx.fillStyle = BRAND_WHITE;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.textAlign = "left";
    ctx.fillText(`"${form.title}"`, 40, H - 130);
  }

  // ── Website URL ───────────────────────────────────────────
  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "italic 22px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - 40, H - 40);
}
