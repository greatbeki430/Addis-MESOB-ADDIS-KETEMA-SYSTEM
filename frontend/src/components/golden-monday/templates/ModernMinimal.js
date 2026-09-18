// frontend/src/components/golden-monday/templates/ModernMinimal.js
//
// Editorial, whitespace-driven layout. The enhancement keeps the
// original "quiet magazine page" feel — no heavy ornamentation —
// but adds: a session-number mark, an optional subtitle/description,
// a department + week-of line, a fourth info card slot, a refined
// hairline border, and a footer that supports a QR code.
import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
  // wrapText,
} from "./drawHelpers";

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
  const CARD = "#ffffff";
  const CARD_BORDER = "#e7e1d2";

  // ── Background ──────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const tint = ctx.createLinearGradient(0, 0, W, H);
  tint.addColorStop(0, "rgba(13,26,94,0.02)");
  tint.addColorStop(1, "rgba(184,134,11,0.05)");
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);

  // Fine hairline grid — very low opacity, purely textural, reads
  // as "printed on quality paper" rather than decorative.
  ctx.strokeStyle = "rgba(26,31,54,0.025)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Full-frame hairline border, inset — gives the poster an edge
  // without adding visual weight.
  strokeRoundedRect(ctx, 24, 24, W - 48, H - 48, 4, "rgba(26,31,54,0.08)", 1);

  // ── Top accent bar ──────────────────────────────────────────
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 12);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 12, W, 3);

  // ── Top-left logo ───────────────────────────────────────────
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

  // ── Committee label + session number (top-right) ────────────
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOLDEN MONDAY", W - 60, 70);

  ctx.fillStyle = GOLD;
  ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
  const sessionLabel = form.sessionNumber
    ? `session #${form.sessionNumber} · 2026`
    : "committee · 2026";
  ctx.fillText(sessionLabel, W - 60, 100);

  // Small session-number chip, right-aligned under the label, only
  // when a number exists — avoids an empty placeholder mark.
  if (form.sessionNumber) {
    const chipW = 46;
    const chipH = 24;
    fillRoundedRect(ctx, W - 60 - chipW, 118, chipW, chipH, 12, ACCENT);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "#" + form.sessionNumber,
      W - 60 - chipW / 2,
      118 + chipH / 2 + 1,
    );
    ctx.textAlign = "right";
  }

  // ── Amharic heading (two lines) ─────────────────────────────
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "bold 46px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ", 60, 250);
  ctx.fillText("ፕሮግራም ተረኛ", 60, 312);

  fillRoundedRect(ctx, 60, 340, 120, 5, 3, ACCENT);

  // Optional English subtitle line under the rule — a short tagline
  // for the session, e.g. "An evening of shared knowledge".
  if (form.subtitle) {
    ctx.fillStyle = "rgba(26,31,54,0.6)";
    ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.subtitle, W / 2 - 120), 60, 372);
  }

  // ── Presenter photo: rounded card (right column) ────────────
  const photoX = W - 500;
  const photoY = 400;
  const photoW = 440;
  const photoH = 440;
  const photoRadius = 32;

  applySoftShadow(ctx, 34, 16, 0.16);
  fillRoundedRect(
    ctx,
    photoX - 12,
    photoY - 12,
    photoW + 24,
    photoH + 24,
    photoRadius + 4,
    CARD,
  );
  clearShadow(ctx);

  fillRoundedRect(
    ctx,
    photoX - 12,
    photoY + photoH + 12 + 6,
    photoW + 24,
    6,
    3,
    GOLD,
  );

  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    { fallbackColor: "#e5e1d8", fallbackText: "Presenter photo" },
  );

  strokeRoundedRect(
    ctx,
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    "rgba(0,0,0,0.06)",
    1,
  );

  // Small corner tick marks on the photo card — a light editorial
  // touch, not a full ornamental frame.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  const tick = 18;
  [
    [photoX - 12, photoY - 12, 1, 1],
    [photoX + photoW + 12, photoY - 12, -1, 1],
    [photoX - 12, photoY + photoH + 12, 1, -1],
    [photoX + photoW + 12, photoY + photoH + 12, -1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * tick);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * tick, cy);
    ctx.stroke();
  });

  // ── Presenter name / role (left column) ─────────────────────
  ctx.textAlign = "left";

  ctx.fillStyle = GOLD;
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTED BY", 60, 430);

  ctx.fillStyle = INK;
  ctx.font = "bold 38px 'Playfair Display', Georgia, serif";
  const nameWidth = W / 2 - 140;
  ctx.fillText(fitText(ctx, form.presenterName || "TBD", nameWidth), 60, 480);

  ctx.fillStyle = ACCENT;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audience = form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audience, nameWidth), 60, 550);

  // Optional department line, small and quiet, under the audience line
  let nameBlockBottom = 550;
  if (form.department) {
    ctx.fillStyle = "rgba(26,31,54,0.55)";
    ctx.font = "16px 'Playfair Display', Georgia, serif";
    ctx.fillText(fitText(ctx, form.department, nameWidth), 60, 582);
    nameBlockBottom = 582;
  }

  // ── Info cards (left column) ────────────────────────────────
  let y = nameBlockBottom + 90;
  const cardX = 60;
  const cardW = W / 2 - 140;
  const cardH = 82;
  const cardRadius = 16;

  const drawInfoCard = (label, value) => {
    applySoftShadow(ctx, 16, 6, 0.08);
    fillRoundedRect(ctx, cardX, y, cardW, cardH, cardRadius, CARD);
    clearShadow(ctx);
    strokeRoundedRect(ctx, cardX, y, cardW, cardH, cardRadius, CARD_BORDER, 1);

    fillRoundedRect(ctx, cardX + 12, y + 18, 4, cardH - 36, 2, GOLD);

    ctx.fillStyle = GOLD;
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText(label, cardX + 30, y + 30);

    ctx.fillStyle = INK;
    ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, value, cardW - 50), cardX + 30, y + 62);

    y += cardH + 14;
  };

  drawInfoCard("CENTER", form.center || "Addis Ketema Center");
  drawInfoCard("DATE", form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.");
  drawInfoCard("TIME", form.time || "1:30 – 2:30 ከሰዓት");

  // Optional 4th card — week-of, only when provided, so posters
  // without it keep the original three-card rhythm.
  if (form.weekOf) {
    drawInfoCard("WEEK OF", formatWeekOf(form.weekOf));
  }

  // ── Title band (bottom) ─────────────────────────────────────
  if (form.title) {
    const hasDescription = Boolean(form.description);
    const bandH = hasDescription ? 220 : 180;
    const bandY = H - bandH;

    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, bandY, W, bandH);

    ctx.fillStyle = GOLD;
    ctx.fillRect(0, bandY, W, 4);

    ctx.beginPath();
    ctx.moveTo(W / 2, bandY - 10);
    ctx.lineTo(W / 2 + 12, bandY + 2);
    ctx.lineTo(W / 2, bandY + 14);
    ctx.lineTo(W / 2 - 12, bandY + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = GOLD;
    ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC", 60, bandY + 55);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 30px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, W - 120), 60, bandY + 110);

    if (hasDescription) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
      ctx.fillText(fitText(ctx, form.description, W - 120), 60, bandY + 150);
    }
  }

  // ── Footer: brand mark (left) + QR or mark (center) + URL ───
  const footerY = form.title ? H - (form.description ? 30 : 30) : H - 40;

  ctx.textAlign = "left";
  ctx.fillStyle = form.title ? "rgba(255,255,255,0.7)" : "rgba(26,31,54,0.5)";
  ctx.font = "italic 14px 'Playfair Display', Georgia, serif";
  ctx.fillText("Addis MESOB", 60, footerY);

  if (form.qrDataUrl) {
    try {
      const qr = await loadImage(form.qrDataUrl);
      const qrSize = 48;
      ctx.drawImage(
        qr,
        W / 2 - qrSize / 2,
        footerY - qrSize / 2 - 6,
        qrSize,
        qrSize,
      );
    } catch (e) {
      console.warn("[ModernMinimal] QR code failed to load:", e.message);
    }
  }

  ctx.fillStyle = GOLD;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - 60, footerY);
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
    console.log("[ModernMinimal] formatWeekOf failed:", e.message);
    return iso;
  }
}
