// frontend/src/components/golden-monday/templates/SunsetFestival.js
//
// Warm festival-banner feel: an orange-to-crimson gradient, an arched
// hero band, and a circular medallion photo with sun-ray spokes. Every
// major element curves — arches, circles, scalloped rules — to give
// the poster a golden-hour, celebratory warmth.
import {
  drawCircleImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "sunset-festival",
  name: "Sunset Festival",
  description: "Warm gradient with a sunburst medallion photo",
  thumbnailColor: "#E8672C",
};

const SUNSET_TOP = "#F5A623";
const SUNSET_MID = "#E8672C";
const SUNSET_DEEP = "#6b1530";
const GOLD = "#FFD873";
const CREAM = "#FFF3E0";

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;
  const PAD = 50;

  // ── Background gradient ─────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, SUNSET_TOP);
  bg.addColorStop(0.45, SUNSET_MID);
  bg.addColorStop(1, SUNSET_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial glow behind the medallion position
  const glow = ctx.createRadialGradient(W / 2, 560, 60, W / 2, 560, 500);
  glow.addColorStop(0, "rgba(255,216,115,0.25)");
  glow.addColorStop(1, "rgba(255,216,115,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Deterministic dust scatter (no Math.random, so re-renders match)
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 120; i++) {
    const x = (i * 53) % W;
    const y = (i * 97) % H;
    ctx.beginPath();
    ctx.arc(x, y, (i % 3) + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ── Three concentric arched borders ─────────────────────────
  [
    [PAD - 24, "rgba(255,216,115,0.55)", 40, 2],
    [PAD - 14, "rgba(255,216,115,0.35)", 26, 2],
    [PAD - 4, "rgba(255,216,115,0.2)", 14, 1],
  ].forEach(([inset, color, radius, lw]) => {
    strokeRoundedRect(
      ctx,
      inset,
      inset,
      W - inset * 2,
      H - inset * 2,
      radius,
      color,
      lw,
    );
  });

  // ── Arched hero banner ──────────────────────────────────────
  const bannerH = 230;
  const bannerGrad = ctx.createLinearGradient(0, 0, 0, bannerH);
  bannerGrad.addColorStop(0, "rgba(255,216,115,0.28)");
  bannerGrad.addColorStop(1, "rgba(255,216,115,0)");
  ctx.fillStyle = bannerGrad;
  ctx.beginPath();
  ctx.moveTo(0, bannerH);
  ctx.lineTo(0, 100);
  ctx.quadraticCurveTo(W / 2, -20, W, 100);
  ctx.lineTo(W, bannerH);
  ctx.closePath();
  ctx.fill();

  // Logo badge, top-left
  const badgeR = 58;
  applySoftShadow(ctx, 22, 10, 0.35);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(PAD + badgeR, 76, badgeR, 0, Math.PI * 2);
  ctx.fill();
  clearShadow(ctx);

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = badgeR * 1.1;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, PAD + badgeR - lw / 2, 76 - lh / 2, lw, lh);
    } catch (e) {
      console.warn("[SunsetFestival] logo missing:", e.message);
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = CREAM;
  ctx.font = "bold 42px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", W / 2 + 40, 150);

  ctx.fillStyle = "rgba(255,243,224,0.85)";
  ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
  const subtitle = form.sessionNumber
    ? `Golden Monday Program · Session #${form.sessionNumber}`
    : "Golden Monday Program";
  ctx.fillText(subtitle, W / 2 + 40, 182);

  if (form.subtitle) {
    ctx.fillStyle = GOLD;
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.subtitle, W - 200), W / 2 + 40, 206);
  }

  // Scalloped rule under the banner
  ctx.strokeStyle = "rgba(255,216,115,0.5)";
  ctx.lineWidth = 1.5;
  [30, 50, 70].forEach((r) => {
    ctx.beginPath();
    ctx.arc(W / 2, bannerH, r, Math.PI, Math.PI * 2);
    ctx.stroke();
  });

  // ── Presenter photo — circular medallion with sun-ray spokes ─
  const cx = W / 2;
  const cy = 545;
  const r = 195;

  // Sun-ray spokes behind the medallion
  ctx.save();
  ctx.strokeStyle = "rgba(255,216,115,0.4)";
  ctx.lineWidth = 3;
  const rays = 24;
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * (r + 14), cy + Math.sin(ang) * (r + 14));
    ctx.lineTo(cx + Math.cos(ang) * (r + 34), cy + Math.sin(ang) * (r + 34));
    ctx.stroke();
  }
  ctx.restore();

  applySoftShadow(ctx, 30, 16, 0.4);
  ctx.fillStyle = SUNSET_DEEP;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  clearShadow(ctx);

  await drawCircleImage(ctx, loadImage, photoSrc, cx, cy, r, {
    fallbackColor: "rgba(255,216,115,0.15)",
  });

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,216,115,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  ctx.stroke();

  // Star at the apex
  drawStar(ctx, cx, cy - r - 10, 10, GOLD);

  // ── Presenter name / audience / department ──────────────────
  let cursorY = cy + r + 70;
  ctx.fillStyle = CREAM;
  ctx.font = "bold 38px 'Playfair Display', Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.presenterName || "TBD", W - PAD * 2),
    W / 2,
    cursorY,
  );
  cursorY += 48;

  ctx.fillStyle = GOLD;
  ctx.font = "bold 27px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, W - PAD * 2), W / 2, cursorY);
  cursorY += 38;

  if (form.department) {
    ctx.fillStyle = "rgba(255,243,224,0.7)";
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.department, W - PAD * 2), W / 2, cursorY);
    cursorY += 30;
  }

  // ── Info ribbon — three curved cells ────────────────────────
  cursorY += 30;
  const cellW = 250;
  const cellH = 96;
  const totalW = cellW * 3 - 20;
  let cellX = W / 2 - totalW / 2;

  const rows = [
    { label: "CENTER", value: form.center || "Addis Ketema Center" },
    { label: "DATE", value: form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም." },
    { label: "TIME", value: form.time || "1:30 – 2:30 ከሰዓት" },
  ];
  rows.forEach((row) => {
    fillRoundedRect(
      ctx,
      cellX,
      cursorY,
      cellW - 20,
      cellH,
      18,
      "rgba(255,216,115,0.15)",
    );
    strokeRoundedRect(
      ctx,
      cellX,
      cursorY,
      cellW - 20,
      cellH,
      18,
      "rgba(255,216,115,0.4)",
      1,
    );

    ctx.fillStyle = GOLD;
    ctx.font = "bold 14px 'Playfair Display', Georgia, serif";
    ctx.fillText(row.label, cellX + (cellW - 20) / 2, cursorY + 28);

    ctx.fillStyle = CREAM;
    ctx.font = "bold 20px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, row.value, cellW - 44),
      cellX + (cellW - 20) / 2,
      cursorY + 62,
    );
    cellX += cellW;
  });
  cursorY += cellH + 20;

  if (form.weekOf) {
    ctx.fillStyle = "rgba(255,243,224,0.6)";
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText("Week of " + formatWeekOf(form.weekOf), W / 2, cursorY);
    cursorY += 30;
  }

  // ── Title — lower-third arched banner ───────────────────────
  if (form.title) {
    cursorY += 20;
    const bw = Math.min(W - PAD * 2, 720);
    const bh = form.description ? 130 : 100;
    const bx = W / 2 - bw / 2;

    const tGrad = ctx.createLinearGradient(bx, cursorY, bx + bw, cursorY);
    tGrad.addColorStop(0, "rgba(255,216,115,0.9)");
    tGrad.addColorStop(1, "rgba(232,103,44,0.9)");

    ctx.beginPath();
    ctx.moveTo(bx, cursorY + bh);
    ctx.lineTo(bx, cursorY + 20);
    ctx.quadraticCurveTo(bx + bw / 2, cursorY - 16, bx + bw, cursorY + 20);
    ctx.lineTo(bx + bw, cursorY + bh);
    ctx.closePath();
    ctx.fillStyle = tGrad;
    ctx.fill();

    ctx.fillStyle = SUNSET_DEEP;
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, `"${form.title}"`, bw - 60),
      bx + bw / 2,
      cursorY + 46,
    );

    if (form.description) {
      ctx.fillStyle = "rgba(107,21,48,0.85)";
      ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
      ctx.fillText(
        fitText(ctx, form.description, bw - 60),
        bx + bw / 2,
        cursorY + 84,
      );
    }
  }

  // ── Footer ───────────────────────────────────────────────────
  const footerY = H - PAD - 4;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,243,224,0.6)";
  ctx.font = "italic 14px 'Playfair Display', Georgia, serif";
  ctx.fillText("· Addis MESOB ·", PAD, footerY);

  if (form.qrDataUrl) {
    try {
      const qr = await loadImage(form.qrDataUrl);
      const qrSize = 48;
      ctx.drawImage(
        qr,
        W / 2 - qrSize / 2,
        footerY - qrSize / 2 - 4,
        qrSize,
        qrSize,
      );
    } catch (e) {
      console.warn("[SunsetFestival] QR failed:", e.message);
    }
  }

  ctx.fillStyle = GOLD;
  ctx.font = "italic 19px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(fitText(ctx, form.websiteUrl, 300), W - PAD, footerY);
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.3, cy - r * 0.3);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx + r * 0.3, cy + r * 0.3);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.3, cy + r * 0.3);
  ctx.lineTo(cx - r, cy);
  ctx.lineTo(cx - r * 0.3, cy - r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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
    console.warn("[SunsetFestival] formatWeekOf failed:", e.message);
    return iso;
  }
}
