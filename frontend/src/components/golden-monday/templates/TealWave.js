// frontend/src/components/golden-monday/templates/TealWave.js
//
// Contemporary teal/cyan gradient with soft wave shapes top and
// bottom — the most "modern SaaS product launch" of the templates,
// contrasting with the ceremonial gold/navy ones. Circular photo,
// clean pill-based info rows, coral accent for warmth.
import {
  drawCircleImage,
  fillRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "teal-wave",
  name: "Teal Wave",
  description: "Modern teal gradient with soft wave shapes",
  thumbnailColor: "#0d5c63",
};

const TEAL = "#0d5c63";
const TEAL_DEEP = "#063a3f";
const TEAL_LIGHT = "#14828c";
const CORAL = "#ff9466";
const CYAN = "#7fe7e0";
const WHITE = "#f5fdfc";

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;
  const PAD = 50;

  // ── Background gradient ─────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, TEAL);
  bg.addColorStop(1, TEAL_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Top wave ─────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = "rgba(127,231,224,0.12)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 160);
  ctx.quadraticCurveTo(W * 0.25, 220, W * 0.5, 170);
  ctx.quadraticCurveTo(W * 0.75, 120, W, 180);
  ctx.lineTo(W, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Bottom wave ──────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = "rgba(255,148,102,0.08)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H - 150);
  ctx.quadraticCurveTo(W * 0.3, H - 210, W * 0.55, H - 160);
  ctx.quadraticCurveTo(W * 0.8, H - 110, W, H - 170);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Header ───────────────────────────────────────────────────
  const boxSize = 108;
  applySoftShadow(ctx, 22, 10, 0.3);
  fillRoundedRect(ctx, PAD, PAD, boxSize, boxSize, 26, WHITE);
  clearShadow(ctx);

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = boxSize - 30;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(
        logo,
        PAD + (boxSize - lw) / 2,
        PAD + (boxSize - lh) / 2,
        lw,
        lh,
      );
    } catch (e) {
      console.warn("[TealWave] logo missing:", e.message);
    }
  }

  // Session chip, top-right
  if (form.sessionNumber) {
    const chipW = 150;
    const chipH = 40;
    fillRoundedRect(
      ctx,
      W - PAD - chipW,
      PAD,
      chipW,
      chipH,
      20,
      "rgba(255,148,102,0.18)",
    );
    ctx.strokeStyle = CORAL;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(W - PAD - chipW, PAD, chipW, chipH, 20)
      : null;
    ctx.fillStyle = CORAL;
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `SESSION #${form.sessionNumber}`,
      W - PAD - chipW / 2,
      PAD + chipH / 2,
    );
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  ctx.font = "bold 38px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", PAD + boxSize + 26, PAD + 48);

  ctx.fillStyle = CYAN;
  ctx.font = "16px sans-serif";
  ctx.fillText("Golden Monday Program", PAD + boxSize + 26, PAD + 74);

  if (form.subtitle) {
    ctx.fillStyle = "rgba(245,253,252,0.7)";
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.fillText(
      fitText(ctx, form.subtitle, W - PAD - boxSize - 60),
      PAD + boxSize + 26,
      PAD + 98,
    );
  }

  // ── Presenter photo — circular, clean ring ───────────────────
  const cx = W / 2;
  const cy = 470;
  const r = 200;

  applySoftShadow(ctx, 34, 18, 0.4);
  ctx.fillStyle = TEAL_DEEP;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  clearShadow(ctx);

  await drawCircleImage(ctx, loadImage, photoSrc, cx, cy, r, {
    fallbackColor: TEAL_LIGHT,
  });

  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = CORAL;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, Math.PI, Math.PI * 1.55);
  ctx.stroke();

  // ── Presenter name ───────────────────────────────────────────
  let cursorY = cy + r + 70;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE;
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(
    fitText(ctx, form.presenterName || "TBD", W - PAD * 2),
    W / 2,
    cursorY,
  );
  cursorY += 48;

  ctx.fillStyle = CYAN;
  ctx.font = "bold 27px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, W - PAD * 2), W / 2, cursorY);
  cursorY += 38;

  if (form.department) {
    ctx.fillStyle = "rgba(245,253,252,0.7)";
    ctx.font = "16px sans-serif";
    ctx.fillText(fitText(ctx, form.department, W - PAD * 2), W / 2, cursorY);
    cursorY += 32;
  }

  // ── Info pills — horizontal row of three ─────────────────────
  cursorY += 30;
  const pillGap = 16;
  const pillW = (Math.min(W - PAD * 2, 720) - pillGap * 2) / 3;
  const pillH = 100;
  let pillX = W / 2 - (pillW * 3 + pillGap * 2) / 2;

  const rows = [
    { label: "CENTER", value: form.center || "Addis Ketema Center" },
    { label: "DATE", value: form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም." },
    { label: "TIME", value: form.time || "1:30 – 2:30 ከሰዓት" },
  ];
  rows.forEach((row) => {
    fillRoundedRect(
      ctx,
      pillX,
      cursorY,
      pillW,
      pillH,
      22,
      "rgba(245,253,252,0.08)",
    );
    ctx.strokeStyle = "rgba(127,231,224,0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pillX, cursorY, pillW, pillH); // rounded-ish visual fallback fine

    ctx.fillStyle = CORAL;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(row.label, pillX + pillW / 2, cursorY + 26);

    ctx.fillStyle = WHITE;
    ctx.font = "bold 19px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, row.value, pillW - 24),
      pillX + pillW / 2,
      cursorY + 62,
    );
    pillX += pillW + pillGap;
  });
  cursorY += pillH + 26;

  if (form.weekOf) {
    ctx.fillStyle = "rgba(245,253,252,0.6)";
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.fillText("Week of " + formatWeekOf(form.weekOf), W / 2, cursorY);
    cursorY += 28;
  }

  // ── Title band ───────────────────────────────────────────────
  if (form.title) {
    cursorY += 20;
    const bw = Math.min(W - PAD * 2, 720);
    const bh = form.description ? 130 : 96;
    const bx = W / 2 - bw / 2;

    fillRoundedRect(ctx, bx, cursorY, bw, bh, 24, "rgba(255,148,102,0.14)");
    ctx.strokeStyle = "rgba(255,148,102,0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, cursorY, bw, bh);

    ctx.fillStyle = CORAL;
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("TOPIC OF THE SESSION", W / 2, cursorY + 28);

    ctx.fillStyle = WHITE;
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, bw - 60), W / 2, cursorY + 62);

    if (form.description) {
      ctx.fillStyle = "rgba(245,253,252,0.75)";
      ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
      ctx.fillText(
        fitText(ctx, form.description, bw - 60),
        W / 2,
        cursorY + 96,
      );
    }
  }

  // ── Footer ───────────────────────────────────────────────────
  const footerY = H - PAD - 4;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(245,253,252,0.55)";
  ctx.font = "14px sans-serif";
  ctx.fillText("Addis MESOB", PAD, footerY);

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
      console.warn("[TealWave] QR failed:", e.message);
    }
  } else {
    ctx.fillStyle = CORAL;
    [-14, 0, 14].forEach((dx) => {
      ctx.beginPath();
      ctx.arc(W / 2 + dx, footerY - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.fillStyle = CYAN;
  ctx.font = "bold 18px sans-serif";
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
    console.log("[TealWave] formatWeekOf failed:", e.message);
    return iso;
  }
}
