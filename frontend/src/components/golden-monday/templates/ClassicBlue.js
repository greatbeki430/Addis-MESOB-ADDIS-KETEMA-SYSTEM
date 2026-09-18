// frontend/src/components/golden-monday/templates/ClassicBlue.js
//
// The committee's ceremonial blue & gold original, enhanced with a
// full decorative frame, a session-number seal, optional subtitle/
// description/department/week-of lines, a fourth right-column row,
// and a richer footer that supports a QR code. The bounded-box
// layout discipline of the original (named constants, fitText on
// every string) is preserved and extended to the new content.
import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "classic-blue",
  name: "Classic Blue",
  description: "The committee's original blue & gold layout",
  thumbnailColor: "#2C3E8F",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  const BRAND_BLUE = "#2C3E8F";
  const BRAND_BLUE_DEEP = "#1a2764";
  const BRAND_GOLD = "#F5C518";
  const BRAND_WHITE = "#FFFFFF";

  // ── Layout constants (single source of truth) ───────────────
  const PAD = 40;
  const HEADER_Y = 90;
  const LOGO_W = 170;
  const BADGE_W = 220;
  const BADGE_H = 140;

  const PHOTO_X = PAD;
  const PHOTO_Y = 230;
  const PHOTO_W = W / 2 - 50;
  const PHOTO_H = 540;
  const PHOTO_RADIUS = 28;

  const RIGHT_LEFT = PHOTO_X + PHOTO_W + 30;
  const RIGHT_RIGHT = W - PAD;
  const RIGHT_WIDTH = RIGHT_RIGHT - RIGHT_LEFT;
  const RIGHT_CENTER = RIGHT_LEFT + RIGHT_WIDTH / 2;

  // ── Background: subtle vertical gradient ────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BRAND_BLUE);
  bg.addColorStop(1, BRAND_BLUE_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W, 0, 100, W, 0, 900);
  glow.addColorStop(0, "rgba(245,197,24,0.10)");
  glow.addColorStop(1, "rgba(245,197,24,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Full decorative frame — double hairline + corner diamonds.
  // Gives the poster a defined ceremonial edge, consistent with the
  // Studio template's midnight border.
  strokeRoundedRect(ctx, 18, 18, W - 36, H - 36, 22, "rgba(245,197,24,0.7)", 2);
  strokeRoundedRect(
    ctx,
    26,
    26,
    W - 52,
    H - 52,
    16,
    "rgba(245,197,24,0.28)",
    1,
  );
  ctx.fillStyle = BRAND_GOLD;
  [
    [18, 18],
    [W - 18, 18],
    [18, H - 18],
    [W - 18, H - 18],
  ].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 8, cy);
    ctx.closePath();
    ctx.fill();
  });

  // ── Top-left logo ────────────────────────────────────────────
  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = LOGO_W;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, PAD, 40, lw, lh);
    } catch (e) {
      console.warn("[ClassicBlue] logo missing:", e.message);
    }
  }

  // ── Committee badge (top-right), now with a session-number seal
  const badgeX = W - PAD - BADGE_W;
  const badgeY = 40;

  applySoftShadow(ctx, 20, 8, 0.25);
  fillRoundedRect(
    ctx,
    badgeX,
    badgeY,
    BADGE_W,
    BADGE_H,
    18,
    "rgba(0,0,0,0.20)",
  );
  clearShadow(ctx);
  strokeRoundedRect(ctx, badgeX, badgeY, BADGE_W, BADGE_H, 18, BRAND_GOLD, 2);

  ctx.fillStyle = BRAND_GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 24px 'Playfair Display', Georgia, serif";
  ctx.fillText("Golden monday", badgeX + BADGE_W / 2, badgeY + 40);
  ctx.fillText("committee", badgeX + BADGE_W / 2, badgeY + 76);
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.fillText(
    form.sessionNumber ? `· session #${form.sessionNumber} ·` : "· 2026 ·",
    badgeX + BADGE_W / 2,
    badgeY + 112,
  );

  // Small gold seal at the badge's top-right corner, only when a
  // session number exists — a circular numeral mark that echoes the
  // Studio "badge" block without competing with the badge text.
  if (form.sessionNumber) {
    const sealR = 24;
    const sealCx = badgeX + BADGE_W;
    const sealCy = badgeY;
    ctx.fillStyle = BRAND_GOLD;
    ctx.beginPath();
    ctx.arc(sealCx, sealCy, sealR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = BRAND_BLUE_DEEP;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sealCx, sealCy, sealR - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = BRAND_BLUE_DEEP;
    ctx.font = "bold 16px 'Playfair Display', Georgia, serif";
    ctx.fillText("#" + form.sessionNumber, sealCx, sealCy + 1);
  }

  // ── Top-center Amharic header ───────────────────────────────
  const headerLeft = PAD + LOGO_W + 20;
  const headerRight = badgeX - 20;
  const headerWidth = headerRight - headerLeft;
  const headerCenter = headerLeft + headerWidth / 2;

  ctx.fillStyle = BRAND_GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let headerFont = 34;
  const headerText = "የወርቃማ ሰኞ ፕሮግራም ተረኛ";
  while (headerFont > 24) {
    ctx.font = `bold ${headerFont}px 'Noto Serif Ethiopic', 'Nyala', serif`;
    if (ctx.measureText(headerText).width <= headerWidth) break;
    headerFont -= 2;
  }
  ctx.font = `bold ${headerFont}px 'Noto Serif Ethiopic', 'Nyala', serif`;
  ctx.fillText(fitText(ctx, headerText, headerWidth), headerCenter, HEADER_Y);

  // Optional English subtitle under the header, bounded the same way
  if (form.subtitle) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText(
      fitText(ctx, form.subtitle, headerWidth),
      headerCenter,
      HEADER_Y + 26,
    );
  }

  // ── Presenter photo (rounded, shadowed, framed) ─────────────
  applySoftShadow(ctx, 30, 16, 0.28);
  fillRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    "#0d1447",
  );
  clearShadow(ctx);

  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    { fallbackColor: "#243c8a", fallbackText: "Presenter photo" },
  );

  strokeRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    BRAND_GOLD,
    3,
  );

  // Inner accent hairline — a second, tighter gold line inside the
  // photo frame for a "double rim" ceremonial look.
  strokeRoundedRect(
    ctx,
    PHOTO_X + 10,
    PHOTO_Y + 10,
    PHOTO_W - 20,
    PHOTO_H - 20,
    PHOTO_RADIUS - 8,
    "rgba(245,197,24,0.35)",
    1,
  );

  // Presenter name banner across the bottom of the photo, plus an
  // optional department line — keeps identity attached to the photo
  // itself, matching how formal programs caption a portrait.
  const nameBannerH = form.department ? 96 : 70;
  fillRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y + PHOTO_H - nameBannerH,
    PHOTO_W,
    nameBannerH,
    0,
    "rgba(6,15,56,0.72)",
  );
  ctx.textAlign = "center";
  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "bold 24px 'Playfair Display', Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.presenterName || "TBD", PHOTO_W - 40),
    PHOTO_X + PHOTO_W / 2,
    PHOTO_Y + PHOTO_H - nameBannerH + 34,
  );
  if (form.department) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.fillText(
      fitText(ctx, form.department, PHOTO_W - 40),
      PHOTO_X + PHOTO_W / 2,
      PHOTO_Y + PHOTO_H - nameBannerH + 62,
    );
  }

  // ── Clock (bottom-left) ─────────────────────────────────────
  if (assets.clock) {
    try {
      const clock = await loadImage(assets.clock);
      const cw = 400;
      const ch = (clock.height / clock.width) * cw;
      ctx.drawImage(clock, -20, H - ch + 20, cw, ch);
    } catch (e) {
      console.warn("[ClassicBlue] clock missing:", e.message);
    }
  }

  // ── Right column (bounded, fit-tested, vertically spaced) ───
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "72px serif";
  ctx.fillText("📢", RIGHT_CENTER, 380);

  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 32px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, RIGHT_WIDTH), RIGHT_CENTER, 470);

  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "italic bold 40px 'Playfair Display', Georgia, serif";
  const centerName = form.center || "Addis Ketema Center";
  ctx.fillText(fitText(ctx, centerName, RIGHT_WIDTH), RIGHT_CENTER, 590);

  fillRoundedRect(
    ctx,
    RIGHT_CENTER - RIGHT_WIDTH / 2 + 20,
    620,
    RIGHT_WIDTH - 40,
    5,
    3,
    BRAND_GOLD,
  );

  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "bold 32px 'Noto Serif Ethiopic', 'Nyala', serif";
  const ethDate = form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.";
  ctx.fillText(fitText(ctx, ethDate, RIGHT_WIDTH), RIGHT_CENTER, 700);

  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "italic bold 30px 'Playfair Display', Georgia, serif";
  ctx.fillText(
    fitText(ctx, form.time || "1:30 – 2:30 ከሰዓት", RIGHT_WIDTH),
    RIGHT_CENTER,
    770,
  );

  // Optional week-of line — a small closing row under time, only
  // drawn when provided so the original vertical rhythm holds when
  // it's absent.
  if (form.weekOf) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
    ctx.fillText(
      fitText(ctx, "Week of " + formatWeekOf(form.weekOf), RIGHT_WIDTH),
      RIGHT_CENTER,
      812,
    );
  }

  // ── Title ribbon (bottom, full width, bounded) ──────────────
  if (form.title) {
    const hasDescription = Boolean(form.description);
    const ribbonX = PAD;
    const ribbonH = hasDescription ? 138 : 100;
    const ribbonY = H - ribbonH - 100;
    const ribbonW = W - PAD * 2;

    applySoftShadow(ctx, 22, 10, 0.24);
    fillRoundedRect(
      ctx,
      ribbonX,
      ribbonY,
      ribbonW,
      ribbonH,
      18,
      "rgba(0,0,0,0.28)",
    );
    clearShadow(ctx);
    strokeRoundedRect(
      ctx,
      ribbonX,
      ribbonY,
      ribbonW,
      ribbonH,
      18,
      BRAND_GOLD,
      2,
    );

    ctx.fillStyle = BRAND_GOLD;
    ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC OF THE SESSION", ribbonX + 24, ribbonY + 32);

    ctx.fillStyle = BRAND_WHITE;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(
      fitText(ctx, form.title, ribbonW - 48),
      ribbonX + 24,
      ribbonY + 70,
    );

    if (hasDescription) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "italic 17px 'Playfair Display', Georgia, serif";
      ctx.fillText(
        fitText(ctx, form.description, ribbonW - 48),
        ribbonX + 24,
        ribbonY + 106,
      );
    }
  }

  // ── Footer: brand mark (left) + QR or seal (center) + URL ───
  const footerY = form.title ? H - 40 : H - 40;

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
  ctx.fillText("· Addis MESOB ·", PAD, footerY);

  if (form.qrDataUrl) {
    try {
      const qr = await loadImage(form.qrDataUrl);
      const qrSize = 52;
      ctx.drawImage(
        qr,
        W / 2 - qrSize / 2,
        footerY - qrSize / 2 - 4,
        qrSize,
        qrSize,
      );
    } catch (e) {
      console.warn("[ClassicBlue] QR code failed to load:", e.message);
      drawFooterDiamond(ctx, W / 2, footerY, BRAND_GOLD);
    }
  } else {
    drawFooterDiamond(ctx, W / 2, footerY, BRAND_GOLD);
  }

  ctx.fillStyle = BRAND_GOLD;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(fitText(ctx, form.websiteUrl, RIGHT_WIDTH), W - PAD, footerY);
}

function drawFooterDiamond(ctx, cx, cy, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx + 6, cy);
  ctx.lineTo(cx, cy + 6);
  ctx.lineTo(cx - 6, cy);
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
    console.log("[ClassicBlue] formatWeekOf failed:", e.message);
    return iso;
  }
}
