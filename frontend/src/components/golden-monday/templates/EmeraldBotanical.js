// frontend/src/components/golden-monday/templates/EmeraldBotanical.js
//
// Deep emerald green with a gold botanical wreath — a commencement /
// award-ceremony feel. Off-center composition: logo + header sit
// left-aligned at the top, the photo is a rounded square wrapped in
// a hand-drawn leaf wreath, and the info block is a bracketed list
// rather than a filled card (reads like a printed program insert).
import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "emerald-botanical",
  name: "Emerald Botanical",
  description: "Deep green with a gold wreath — ceremonial and warm",
  thumbnailColor: "#0b3d2e",
};

const EMERALD = "#0b3d2e";
const EMERALD_DEEP = "#052018";
const EMERALD_LIGHT = "#144a37";
const GOLD = "#d4af37";
const GOLD_LIGHT = "#e8cf7a";
const CREAM = "#f3ead9";

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;
  const PAD = 56;

  // ── Background ───────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, EMERALD);
  bg.addColorStop(1, EMERALD_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W, 0, 60, W, 0, 900);
  glow.addColorStop(0, "rgba(212,175,55,0.10)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Subtle leaf-tick texture scattered low-opacity across the field
  ctx.save();
  ctx.fillStyle = "rgba(212,175,55,0.05)";
  for (let i = 0; i < 90; i++) {
    const x = (i * 137) % W;
    const y = (i * 211) % H;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i * 0.7) % (Math.PI * 2));
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // ── Oval wreath border ──────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "rgba(212,175,55,0.4)";
  ctx.lineWidth = 2;
  const rx = W / 2 - (PAD - 14);
  const ry = H / 2 - (PAD - 14);
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  const leafCount = 72;
  for (let i = 0; i < leafCount; i++) {
    const ang = (i / leafCount) * Math.PI * 2;
    const x = W / 2 + Math.cos(ang) * rx;
    const y = H / 2 + Math.sin(ang) * ry;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = i % 6 === 0 ? GOLD : "rgba(212,175,55,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // ── Header: logo box + off-center Amharic title ─────────────
  const boxSize = 120;
  applySoftShadow(ctx, 22, 10, 0.35);
  fillRoundedRect(ctx, PAD, PAD, boxSize, boxSize, 18, GOLD);
  clearShadow(ctx);

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = boxSize - 34;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(
        logo,
        PAD + (boxSize - lw) / 2,
        PAD + (boxSize - lh) / 2,
        lw,
        lh,
      );
    } catch (e) {
      console.warn("[EmeraldBotanical] logo missing:", e.message);
    }
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = "bold 38px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", PAD + boxSize + 28, PAD + 66);

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
  const subtitle = form.sessionNumber
    ? `Golden Monday · Session #${form.sessionNumber}`
    : "Golden Monday Program";
  ctx.fillText(subtitle, PAD + boxSize + 28, PAD + 96);

  if (form.subtitle) {
    ctx.fillStyle = "rgba(243,234,217,0.7)";
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.fillText(
      fitText(ctx, form.subtitle, W - PAD - boxSize - 60),
      PAD + boxSize + 28,
      PAD + 122,
    );
  }

  // Leading curved vine from the header box
  ctx.strokeStyle = "rgba(212,175,55,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + boxSize + 20);
  ctx.quadraticCurveTo(
    PAD + 200,
    PAD + boxSize + 60,
    W - PAD,
    PAD + boxSize + 30,
  );
  ctx.stroke();

  // ── Presenter photo — rounded square wrapped in a wreath ────
  const photoW = 420;
  const photoH = 420;
  const photoX = W / 2 - photoW / 2;
  const photoY = 300;

  applySoftShadow(ctx, 30, 16, 0.4);
  fillRoundedRect(ctx, photoX, photoY, photoW, photoH, 22, EMERALD_DEEP);
  clearShadow(ctx);

  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    22,
    { fallbackColor: EMERALD_LIGHT, fallbackText: "Presenter photo" },
  );
  strokeRoundedRect(ctx, photoX, photoY, photoW, photoH, 22, GOLD, 4);

  // Wreath ticks around the photo frame
  ctx.save();
  ctx.fillStyle = "rgba(212,175,55,0.75)";
  const perim = 36;
  for (let i = 0; i < perim; i++) {
    const t = i / perim;
    let px, py, angle;
    if (t < 0.25) {
      px = photoX + (t / 0.25) * photoW;
      py = photoY;
      angle = 0;
    } else if (t < 0.5) {
      px = photoX + photoW;
      py = photoY + ((t - 0.25) / 0.25) * photoH;
      angle = Math.PI / 2;
    } else if (t < 0.75) {
      px = photoX + photoW - ((t - 0.5) / 0.25) * photoW;
      py = photoY + photoH;
      angle = Math.PI;
    } else {
      px = photoX;
      py = photoY + photoH - ((t - 0.75) / 0.25) * photoH;
      angle = -Math.PI / 2;
    }
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Ribbon at the base of the photo
  const ribbonW = photoW * 0.55;
  fillRoundedRect(
    ctx,
    W / 2 - ribbonW / 2,
    photoY + photoH - 16,
    ribbonW,
    32,
    8,
    GOLD,
  );
  ctx.fillStyle = EMERALD_DEEP;
  ctx.font = "bold 15px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PRESENTER", W / 2, photoY + photoH);

  // ── Presenter name / audience / department ──────────────────
  let cursorY = photoY + photoH + 70;
  ctx.fillStyle = CREAM;
  ctx.font = "bold 36px 'Playfair Display', Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.presenterName || "TBD", W - PAD * 2),
    W / 2,
    cursorY,
  );
  cursorY += 46;

  ctx.fillStyle = GOLD;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, W - PAD * 2), W / 2, cursorY);
  cursorY += 38;

  if (form.department) {
    ctx.fillStyle = "rgba(243,234,217,0.65)";
    ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.department, W - PAD * 2), W / 2, cursorY);
    cursorY += 30;
  }

  // ── Info block — bracketed list, centered ───────────────────
  cursorY += 30;
  const rows = [
    { label: "CENTER", value: form.center || "Addis Ketema Center" },
    { label: "DATE", value: form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም." },
    { label: "TIME", value: form.time || "1:30 – 2:30 ከሰዓት" },
  ];
  if (form.weekOf) {
    rows.push({ label: "WEEK OF", value: formatWeekOf(form.weekOf) });
  }

  const bracketW = 460;
  const bracketX = W / 2 - bracketW / 2;
  const rowH = 68;
  const bracketH = rows.length * rowH;

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bracketX, cursorY + 16);
  ctx.lineTo(bracketX, cursorY);
  ctx.lineTo(bracketX + 26, cursorY);
  ctx.moveTo(bracketX + bracketW - 26, cursorY);
  ctx.lineTo(bracketX + bracketW, cursorY);
  ctx.lineTo(bracketX + bracketW, cursorY + 16);
  ctx.moveTo(bracketX, cursorY + bracketH - 16);
  ctx.lineTo(bracketX, cursorY + bracketH);
  ctx.lineTo(bracketX + 26, cursorY + bracketH);
  ctx.moveTo(bracketX + bracketW - 26, cursorY + bracketH);
  ctx.lineTo(bracketX + bracketW, cursorY + bracketH);
  ctx.lineTo(bracketX + bracketW, cursorY + bracketH - 16);
  ctx.stroke();

  let rowY = cursorY + 14;
  rows.forEach((row, i) => {
    ctx.textAlign = "center";
    ctx.fillStyle = GOLD;
    ctx.font = "bold 14px 'Playfair Display', Georgia, serif";
    ctx.fillText(row.label, W / 2, rowY + 8);

    ctx.fillStyle = CREAM;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, row.value, bracketW - 40), W / 2, rowY + 38);

    if (i < rows.length - 1) {
      ctx.strokeStyle = "rgba(212,175,55,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bracketX + 40, rowY + rowH - 12);
      ctx.lineTo(bracketX + bracketW - 40, rowY + rowH - 12);
      ctx.stroke();
    }
    rowY += rowH;
  });

  cursorY += bracketH + 40;

  // ── Title band ───────────────────────────────────────────────
  if (form.title) {
    ctx.fillStyle = GOLD;
    ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
    ctx.fillText("TOPIC OF THE SESSION", W / 2, cursorY);
    cursorY += 34;

    ctx.fillStyle = CREAM;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, `"${form.title}"`, W - PAD * 2 - 30),
      W / 2,
      cursorY,
    );
    cursorY += 36;

    if (form.description) {
      ctx.fillStyle = "rgba(243,234,217,0.7)";
      ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
      ctx.fillText(
        fitText(ctx, form.description, W - PAD * 2 - 60),
        W / 2,
        cursorY,
      );
    }
  }

  // ── Footer ───────────────────────────────────────────────────
  const footerY = H - PAD - 8;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(212,175,55,0.7)";
  ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
  ctx.fillText("· Addis MESOB ·", PAD, footerY);

  if (form.qrDataUrl) {
    try {
      const qr = await loadImage(form.qrDataUrl);
      const qrSize = 50;
      ctx.drawImage(
        qr,
        W / 2 - qrSize / 2,
        footerY - qrSize / 2 - 4,
        qrSize,
        qrSize,
      );
    } catch (e) {
      console.warn("[EmeraldBotanical] QR failed:", e.message);
    }
  }

  ctx.fillStyle = GOLD;
  ctx.font = "italic 19px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(fitText(ctx, form.websiteUrl, 300), W - PAD, footerY);
}

function formatWeekOf(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    console.warn("[EmeraldBotonical] formatWeekOf failed:", e.message);
    return iso;
  }
}
