// frontend/src/components/golden-monday/templates/RoyalPurple.js
//
// Regal violet & gold — a symmetric, formally-mirrored composition
// with a diamond-studded double frame, a crown-style header ornament,
// and an arched photo topped with a jewel finial. The most "state
// occasion" of the templates.
import {
  drawArchImage,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "royal-purple",
  name: "Royal Purple",
  description: "Regal violet & gold with a jeweled frame",
  thumbnailColor: "#3b0764",
};

const PURPLE = "#3b0764";
const PURPLE_DEEP = "#1e0338";
const PURPLE_LIGHT = "#5b1a8f";
const GOLD = "#d4af37";
const GOLD_LIGHT = "#f0d97a";
const LILAC = "#e6d5f5";

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;
  const PAD = 48;

  // ── Background ───────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, PURPLE);
  bg.addColorStop(0.55, PURPLE_LIGHT);
  bg.addColorStop(1, PURPLE_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, 850);
  glow.addColorStop(0, "rgba(212,175,55,0.14)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Double frame with diamond studs ─────────────────────────
  strokeRoundedRect(
    ctx,
    PAD - 22,
    PAD - 22,
    W - (PAD - 22) * 2,
    H - (PAD - 22) * 2,
    26,
    GOLD,
    3,
  );
  strokeRoundedRect(
    ctx,
    PAD - 12,
    PAD - 12,
    W - (PAD - 12) * 2,
    H - (PAD - 12) * 2,
    20,
    GOLD_LIGHT,
    1,
  );

  const studSpacing = 90;
  ctx.fillStyle = GOLD;
  for (let x = PAD - 22 + studSpacing; x < W - PAD; x += studSpacing) {
    drawDiamond(ctx, x, PAD - 22, 5);
    drawDiamond(ctx, x, H - PAD + 22, 5);
  }
  for (let y = PAD - 22 + studSpacing; y < H - PAD; y += studSpacing) {
    drawDiamond(ctx, PAD - 22, y, 5);
    drawDiamond(ctx, W - PAD + 22, y, 5);
  }
  [
    [PAD - 22, PAD - 22],
    [W - PAD + 22, PAD - 22],
    [PAD - 22, H - PAD + 22],
    [W - PAD + 22, H - PAD + 22],
  ].forEach(([cx, cy]) => drawDiamond(ctx, cx, cy, 11));

  // ── Crown-style header ornament ─────────────────────────────
  const crownY = 110;
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, crownY + 14);
  ctx.lineTo(W / 2 - 40, crownY - 18);
  ctx.lineTo(W / 2 - 15, crownY + 4);
  ctx.lineTo(W / 2, crownY - 26);
  ctx.lineTo(W / 2 + 15, crownY + 4);
  ctx.lineTo(W / 2 + 40, crownY - 18);
  ctx.lineTo(W / 2 + 60, crownY + 14);
  ctx.stroke();
  drawDiamond(ctx, W / 2, crownY - 26, 6);
  ctx.restore();

  // Logo medallion
  const medR = 62;
  applySoftShadow(ctx, 24, 10, 0.35);
  const medGrad = ctx.createRadialGradient(
    W / 2 - 20,
    190,
    8,
    W / 2,
    200,
    medR,
  );
  medGrad.addColorStop(0, GOLD_LIGHT);
  medGrad.addColorStop(1, GOLD);
  ctx.fillStyle = medGrad;
  ctx.beginPath();
  ctx.arc(W / 2, 200, medR, 0, Math.PI * 2);
  ctx.fill();
  clearShadow(ctx);

  ctx.strokeStyle = PURPLE_DEEP;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, 200, medR - 6, 0, Math.PI * 2);
  ctx.stroke();

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const size = 96;
      ctx.drawImage(logo, W / 2 - size / 2, 200 - size / 2, size, size);
    } catch (e) {
      console.warn("[RoyalPurple] logo missing:", e.message);
    }
  }

  // ── Header text ──────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 19px 'Playfair Display', Georgia, serif";
  const sub = form.sessionNumber
    ? `Golden Monday · Session #${form.sessionNumber}`
    : "Golden Monday";
  ctx.fillText(sub, W / 2, 300);

  ctx.fillStyle = LILAC;
  ctx.font = "bold 40px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", W / 2, 348);

  if (form.subtitle) {
    ctx.fillStyle = "rgba(230,213,245,0.7)";
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.subtitle, W - PAD * 2 - 100), W / 2, 378);
  }

  // Decorative line
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 260, 402);
  ctx.lineTo(W / 2 - 50, 402);
  ctx.moveTo(W / 2 + 50, 402);
  ctx.lineTo(W / 2 + 260, 402);
  ctx.stroke();
  drawDiamond(ctx, W / 2, 402, 7);

  // ── Presenter photo — gold arch with jewel finial ────────────
  const photoW = 340;
  const photoH = 400;
  const photoX = W / 2 - photoW / 2;
  const photoY = 440;
  const archR = photoW / 2;

  applySoftShadow(ctx, 28, 14, 0.4);
  ctx.fillStyle = PURPLE_DEEP;
  ctx.beginPath();
  ctx.moveTo(photoX, photoY + archR);
  ctx.arc(photoX + archR, photoY + archR, archR, Math.PI, 0);
  ctx.lineTo(photoX + photoW, photoY + photoH);
  ctx.lineTo(photoX, photoY + photoH);
  ctx.closePath();
  ctx.fill();
  clearShadow(ctx);

  await drawArchImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    {
      fallbackColor: PURPLE_LIGHT,
    },
  );

  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(photoX, photoY + archR);
  ctx.arc(photoX + archR, photoY + archR, archR, Math.PI, 0);
  ctx.lineTo(photoX + photoW, photoY + photoH);
  ctx.lineTo(photoX, photoY + photoH);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  drawDiamond(ctx, W / 2, photoY + 8, 11);

  // ── Presenter name ───────────────────────────────────────────
  let cursorY = photoY + photoH + 62;
  ctx.fillStyle = GOLD;
  ctx.font = "italic 19px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTED BY", W / 2, cursorY);
  cursorY += 42;

  ctx.fillStyle = LILAC;
  ctx.font = "bold 34px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, W - PAD * 2), W / 2, cursorY);
  cursorY += 44;

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 25px 'Playfair Display', Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.presenterName || "", W - PAD * 2),
    W / 2,
    cursorY,
  );
  cursorY += 36;

  if (form.department) {
    ctx.fillStyle = "rgba(230,213,245,0.65)";
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.department, W - PAD * 2), W / 2, cursorY);
    cursorY += 30;
  }

  // ── Info block ───────────────────────────────────────────────
  cursorY += 30;
  ctx.fillStyle = GOLD;
  ctx.font = "italic 16px Georgia, serif";
  ctx.fillText("CENTER", W / 2, cursorY);
  cursorY += 30;
  ctx.fillStyle = LILAC;
  ctx.font = "bold 24px Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.center || "Addis Ketema Center", W - PAD * 2),
    W / 2,
    cursorY,
  );
  cursorY += 34;

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 170, cursorY);
  ctx.lineTo(W / 2 - 10, cursorY);
  ctx.moveTo(W / 2 + 10, cursorY);
  ctx.lineTo(W / 2 + 170, cursorY);
  ctx.stroke();
  drawDiamond(ctx, W / 2, cursorY, 6);
  cursorY += 40;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 16px Georgia, serif";
  ctx.fillText("DATE", W / 2, cursorY);
  cursorY += 28;
  ctx.fillStyle = LILAC;
  ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText(
    fitText(ctx, form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.", W - PAD * 2),
    W / 2,
    cursorY,
  );
  cursorY += 40;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.time || "1:30 – 2:30 ከሰዓት", W - PAD * 2),
    W / 2,
    cursorY,
  );
  cursorY += 32;

  if (form.weekOf) {
    ctx.fillStyle = "rgba(230,213,245,0.6)";
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.fillText("Week of " + formatWeekOf(form.weekOf), W / 2, cursorY);
    cursorY += 28;
  }

  // ── Title band ───────────────────────────────────────────────
  if (form.title) {
    cursorY += 22;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, cursorY);
    ctx.lineTo(W - 90, cursorY);
    ctx.stroke();
    drawDiamond(ctx, W / 2, cursorY, 7);
    cursorY += 40;

    ctx.fillStyle = GOLD;
    ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
    ctx.fillText("TOPIC OF THE SESSION", W / 2, cursorY);
    cursorY += 34;

    ctx.fillStyle = LILAC;
    ctx.font = "bold 25px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, `"${form.title}"`, W - PAD * 2 - 40),
      W / 2,
      cursorY,
    );
    cursorY += 32;

    if (form.description) {
      ctx.fillStyle = "rgba(230,213,245,0.7)";
      ctx.font = "italic 14px 'Playfair Display', Georgia, serif";
      ctx.fillText(
        fitText(ctx, form.description, W - PAD * 2 - 60),
        W / 2,
        cursorY,
      );
    }
  }

  // ── Footer ───────────────────────────────────────────────────
  const footerY = H - PAD - 4;
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
      console.warn("[RoyalPurple] QR failed:", e.message);
      drawDiamond(ctx, W / 2, footerY, 7);
    }
  } else {
    ctx.fillStyle = GOLD;
    drawDiamond(ctx, W / 2, footerY, 7);
  }

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "italic 19px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(fitText(ctx, form.websiteUrl, 300), W - PAD, footerY);
}

function drawDiamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
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
    console.log("[RoyalPurple] formatWeekOf failed:", e.message);
    return iso;
  }
}
