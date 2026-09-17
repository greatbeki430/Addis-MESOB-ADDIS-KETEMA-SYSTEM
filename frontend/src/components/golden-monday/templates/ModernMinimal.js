// frontend/src/components/golden-monday/templates/ModernMinimal.js
//
// A cleaner, modern take: off-white background, deep navy accents,
// presenter photo on the right, and the information hierarchy
// flowing down the left. Airy, editorial, restrained.

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

  // ── Background ────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ── Top blue ribbon (thin) ────────────────────────────────
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 12);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 12, W, 3);

  // ── Top-left logo ─────────────────────────────────────────
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

  // ── Small "committee" label top-right ─────────────────────
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 20px Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOLDEN MONDAY", W - 60, 70);
  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("committee 2026", W - 60, 100);

  // ── Big Amharic heading ───────────────────────────────────
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "bold 44px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ", 60, 240);
  ctx.fillText("ፕሮግራም ተናጋሪ", 60, 300);

  // Thin accent line under heading
  ctx.fillStyle = ACCENT;
  ctx.fillRect(60, 330, 120, 4);

  // ── Presenter photo (right side) ──────────────────────────
  const photoX = W - 480;
  const photoY = 380;
  const photoW = 420;
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
      // Drop shadow
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#fff";
      ctx.fillRect(photoX - 8, photoY - 8, photoW + 16, photoH + 16);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.drawImage(photo, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } catch (e) {
      console.warn("[ModernMinimal] presenter photo failed:", e.message);
    }
  } else {
    ctx.fillStyle = "#e5e1d8";
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = "#999";
    ctx.font = "italic 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Presenter photo", photoX + photoW / 2, photoY + photoH / 2);
  }

  // ── Presenter name (left column, below heading) ───────────
  ctx.textAlign = "left";
  ctx.fillStyle = GOLD;
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText("PRESENTED BY", 60, 420);

  ctx.fillStyle = INK;
  ctx.font = "bold 36px Georgia, serif";
  // Split long names onto two lines
  const nameWords = (form.presenterName || "TBD").split(" ");
  if (nameWords.length > 3) {
    const mid = Math.ceil(nameWords.length / 2);
    ctx.fillText(nameWords.slice(0, mid).join(" "), 60, 470);
    ctx.fillText(nameWords.slice(mid).join(" "), 60, 515);
  } else {
    ctx.fillText(form.presenterName || "TBD", 60, 470);
  }

  // Presenter audience line (Amharic)
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`,
    60,
    590,
  );

  // ── Metadata block (left column, lower) ───────────────────
  let y = 720;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("CENTER", 60, y);
  ctx.fillStyle = INK;
  ctx.font = "bold 26px Georgia, serif";
  ctx.fillText(form.center || "Addis Ketema Center", 60, y + 36);
  y += 90;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("DATE", 60, y);
  ctx.fillStyle = INK;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", 60, y + 36);
  y += 90;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("TIME", 60, y);
  ctx.fillStyle = INK;
  ctx.font = "bold 26px Georgia, serif";
  ctx.fillText(form.time || "1:30 – 2:30 ከሰዓት", 60, y + 36);

  // ── Presentation title (bottom band) ──────────────────────
  if (form.title) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, H - 160, W, 160);
    ctx.fillStyle = "#fff";
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText("TOPIC", 60, H - 100);
    ctx.font = "bold 30px 'Noto Serif Ethiopic', 'Nyala', serif";
    // Truncate if too long
    let title = `"${form.title}"`;
    if (ctx.measureText(title).width > W - 120) {
      while (
        ctx.measureText(title + "…").width > W - 120 &&
        title.length > 20
      ) {
        title = title.slice(0, -1);
      }
      title += "…";
    }
    ctx.fillText(title, 60, H - 55);
  }

  // ── Website URL bottom-right ──────────────────────────────
  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - 60, H - 30);
}
