// frontend/src/components/golden-monday/templates/Geometric.js
//
// Bold and modern: flat color blocks, geometric shapes, and heavy
// typographic hierarchy. Reads as "design-forward" rather than
// "committee-produced".

export const meta = {
  id: "geometric",
  name: "Geometric",
  description: "Bold flat-color blocks with geometric accents",
  thumbnailColor: "#F5C518",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const BLUE = "#0d1a5e";
  const YELLOW = "#F5C518";
  const CREAM = "#FDF6E3";
  const DARK = "#111";

  // ── Background split ──────────────────────────────────────
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, H);

  // Big yellow corner block (top-right)
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W, 480);
  ctx.lineTo(W - 380, 0);
  ctx.closePath();
  ctx.fill();

  // Small cream block (bottom-left)
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, H - 200, 280, 200);

  // ── Logo top-left on a yellow badge ───────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      // Yellow square badge
      ctx.fillStyle = YELLOW;
      ctx.fillRect(40, 40, 200, 200);
      const lw = 160;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, 60, 40 + (200 - lh) / 2, lw, lh);
    } catch (e) {
      console.warn("[Geometric] logo missing:", e.message);
    }
  } else {
    // Fallback badge
    ctx.fillStyle = YELLOW;
    ctx.fillRect(40, 40, 200, 200);
    ctx.fillStyle = BLUE;
    ctx.font = "bold 60px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A·M", 140, 140);
  }

  // ── Committee label on yellow triangle ────────────────────
  ctx.fillStyle = DARK;
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOLDEN MONDAY", W - 40, 100);
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("committee · 2026", W - 40, 135);

  // ── Header (huge, Amharic) ────────────────────────────────
  ctx.fillStyle = CREAM;
  ctx.textAlign = "left";
  ctx.font = "900 56px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ", 40, 320);
  ctx.fillStyle = YELLOW;
  ctx.fillText("ሰኞ ፕሮግራም", 40, 385);
  ctx.fillStyle = CREAM;
  ctx.fillText("ተናጋሪ", 40, 450);

  // ── Presenter photo (bottom-right, half-cropped) ──────────
  const photoX = W - 420;
  const photoY = 520;
  const photoW = 420;
  const photoH = 620;

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
      // Border effect: yellow underline strip
      ctx.fillStyle = YELLOW;
      ctx.fillRect(photoX - 6, photoY - 6, photoW + 12, 12);
      ctx.drawImage(photo, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } catch (e) {
      console.warn("[Geometric] presenter photo failed:", e.message);
    }
  } else {
    ctx.fillStyle = "#243c8a";
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = YELLOW;
    ctx.font = "italic 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Presenter photo", photoX + photoW / 2, photoY + photoH / 2);
  }

  // ── Presenter info (left column, under header) ────────────
  ctx.textAlign = "left";
  const infoX = 40;
  let infoY = 620;

  // Presenter name
  ctx.fillStyle = YELLOW;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("PRESENTER", infoX, infoY);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 34px Georgia, serif";
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

  // Amharic audience line
  ctx.fillStyle = YELLOW;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`,
    infoX,
    infoY,
  );
  infoY += 70;

  // Center + date + time stacked
  ctx.fillStyle = CREAM;
  ctx.font = "bold 24px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", infoX, infoY);
  infoY += 45;

  ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", infoX, infoY);
  infoY += 45;

  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", infoX, infoY);

  // ── Title (bottom-left cream block) ───────────────────────
  if (form.title) {
    ctx.fillStyle = BLUE;
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("TOPIC", 40, H - 130);
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    let title = `"${form.title}"`;
    if (ctx.measureText(title).width > 240) {
      while (ctx.measureText(title + "…").width > 240 && title.length > 15) {
        title = title.slice(0, -1);
      }
      title += "…";
    }
    ctx.fillText(title, 40, H - 80);
  }

  // ── Website (bottom-right, on blue) ───────────────────────
  ctx.fillStyle = YELLOW;
  ctx.font = "italic 20px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - 40, H - 40);
}
