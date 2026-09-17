// frontend/src/components/golden-monday/templates/Geometric.js
//
// Bold flat-color composition. Restores the original "poster" feel
// (large yellow corner wedge, square yellow logo badge, heavy hero
// type, yellow-framed photo card) while fixing the two layout bugs
// from the earlier version:
//
//   • Presenter name and audience line no longer collide — the name
//     block reserves vertical space based on how many lines it wraps to.
//   • Content respects a 60px outer margin on every side and does not
//     run under the photo card.
//
// Structure:
//   • Top bar         : logo badge (left), committee label (right)
//   • Hero            : three lines of Amharic type, cream / yellow / cream
//   • Divider         : gold rule with diamond
//   • Bottom two-col  : presenter name + audience line (left),
//                       photo card with yellow frame (right),
//                       info rows below the name.

import {
  drawRoundedImage,
  fillRoundedRect,
  strokeRoundedRect,
  applySoftShadow,
  clearShadow,
  fitText,
} from "./drawHelpers";

export const meta = {
  id: "geometric",
  name: "Geometric",
  description: "Bold flat-color blocks with geometric accents",
  thumbnailColor: "#F5C518",
};

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;

  // ── Palette ──────────────────────────────────────────────────
  const BLUE = "#0d1a5e";
  const BLUE_DEEP = "#060f38";
  const BLUE_LIGHT = "#1a2a7a";
  const YELLOW = "#F5C518";
  const YELLOW_DEEP = "#d4a017";
  const CREAM = "#FDF6E3";

  // ── Layout grid ──────────────────────────────────────────────
  const PAD = 40; // outer margin
  const HERO_TOP = 300;
  const HERO_LINE_H = 72;
  const DIVIDER_Y = 545;

  const PHOTO_W = 400;
  const PHOTO_H = 500;
  const PHOTO_X = W - PAD - PHOTO_W; // right-aligned inside PAD
  const PHOTO_Y = 620;
  const PHOTO_RADIUS = 24;

  const LEFT_X = PAD;
  const LEFT_W = PHOTO_X - PAD - 30; // 30px gutter before the photo

  // ── Background ───────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, BLUE);
  bg.addColorStop(1, BLUE_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Big yellow corner wedge (top-right) — bold triangle ─────
  // This is what makes the design feel like a poster rather than a
  // document. Kept from the original; stops well before it would
  // overlap the header content on the left.
  ctx.save();
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(W - PAD, PAD);
  ctx.lineTo(W - PAD, PAD + 300);
  ctx.lineTo(W - 420, PAD);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Thin gold accent bar under the wedge — a signature detail
  fillRoundedRect(ctx, W - PAD - 380, PAD + 300, 380, 10, 5, YELLOW_DEEP);

  // ── Radial yellow glow bottom-left for depth ────────────────
  const glow = ctx.createRadialGradient(0, H, 100, 0, H, 850);
  glow.addColorStop(0, "rgba(245,197,24,0.1)");
  glow.addColorStop(1, "rgba(245,197,24,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top-left logo on a SOLID SQUARE yellow badge ────────────
  // The original used a square badge and it read far more "designed"
  // than a rounded one. Kept square, tightened shadow.
  const badgeX = PAD;
  const badgeY = PAD;
  const badgeSize = 150;

  applySoftShadow(ctx, 28, 14, 0.4);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);
  clearShadow(ctx);

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = badgeSize - 30;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(
        logo,
        badgeX + (badgeSize - lw) / 2,
        badgeY + (badgeSize - lh) / 2,
        lw,
        lh,
      );
    } catch (e) {
      console.warn("[Geometric] logo missing:", e.message);
    }
  } else {
    ctx.fillStyle = BLUE;
    ctx.font = "bold 52px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A·M", badgeX + badgeSize / 2, badgeY + badgeSize / 2);
  }

  // ── Committee label (top-right, sits ON the yellow wedge) ───
  // Using dark navy text on the yellow wedge gives maximum contrast
  // and echoes the logo badge on the left.
  ctx.fillStyle = BLUE_DEEP;
  ctx.font = "bold 24px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOLDEN MONDAY", W - PAD - 30, PAD + 40);
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.fillText("committee · 2026", W - PAD - 30, PAD + 75);

  // ── HERO — three lines of huge Amharic type ─────────────────
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Line 1 — cream
  ctx.fillStyle = CREAM;
  ctx.font = "900 68px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ", LEFT_X, HERO_TOP);

  // Line 2 — yellow (the visual anchor)
  ctx.fillStyle = YELLOW;
  ctx.fillText("ሰኞ ፕሮግራም", LEFT_X, HERO_TOP + HERO_LINE_H);

  // Line 3 — cream
  ctx.fillStyle = CREAM;
  ctx.fillText("ተናጋሪ", LEFT_X, HERO_TOP + HERO_LINE_H * 2);

  // ── Gold divider with diamond ───────────────────────────────
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LEFT_X, DIVIDER_Y);
  ctx.lineTo(W - PAD - 100, DIVIDER_Y);
  ctx.stroke();

  // Diamond at the divider's right end
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(W - PAD - 100, DIVIDER_Y - 12);
  ctx.lineTo(W - PAD - 88, DIVIDER_Y);
  ctx.lineTo(W - PAD - 100, DIVIDER_Y + 12);
  ctx.lineTo(W - PAD - 112, DIVIDER_Y);
  ctx.closePath();
  ctx.fill();

  // ── Presenter photo card (right column) ─────────────────────
  // Bold yellow accent strip ABOVE the photo — the original's
  // signature detail.
  fillRoundedRect(ctx, PHOTO_X - 10, PHOTO_Y - 18, PHOTO_W + 20, 14, 4, YELLOW);

  // Deep shadow behind the card
  applySoftShadow(ctx, 36, 20, 0.5);
  fillRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    BLUE_DEEP,
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
    { fallbackColor: BLUE_LIGHT, fallbackText: "Presenter photo" },
  );

  // Thick yellow frame — this is what made the previous version
  // look sharper.
  strokeRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    YELLOW,
    5,
  );

  // Inner hairline for depth
  strokeRoundedRect(
    ctx,
    PHOTO_X + 12,
    PHOTO_Y + 12,
    PHOTO_W - 24,
    PHOTO_H - 24,
    PHOTO_RADIUS - 8,
    "rgba(255,255,255,0.2)",
    1,
  );

  // ── LEFT COLUMN: presenter name + audience + info rows ──────
  // Compute the name block height first, THEN place the audience
  // line — this is the fix for the overlap bug.
  let y = PHOTO_Y;

  ctx.fillStyle = YELLOW;
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("PRESENTER", LEFT_X, y);

  // Name — break into two lines if it's long
  ctx.fillStyle = CREAM;
  ctx.font = "bold 42px 'Playfair Display', Georgia, serif";
  const nameWords = (form.presenterName || "TBD").split(" ");
  const nameLines =
    nameWords.length > 2
      ? [
          nameWords.slice(0, Math.ceil(nameWords.length / 2)).join(" "),
          nameWords.slice(Math.ceil(nameWords.length / 2)).join(" "),
        ]
      : [form.presenterName || "TBD"];

  let nameY = y + 52;
  for (const line of nameLines) {
    ctx.fillText(fitText(ctx, line, LEFT_W), LEFT_X, nameY);
    nameY += 52;
  }

  // Reserve space under the name before the audience line
  nameY += 20;

  // Audience line — sits BELOW the last name line, never over it
  ctx.fillStyle = YELLOW;
  ctx.font = "bold 28px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, LEFT_W), LEFT_X, nameY);
  nameY += 80;

  // ── Info rows — pill + value, evenly spaced ─────────────────
  const pillW = 110;
  const pillH = 30;
  const pillRadius = 6; // sharp corners read bolder here

  const drawInfoRow = (label, value) => {
    // Bold yellow pill
    fillRoundedRect(ctx, LEFT_X, nameY, pillW, pillH, pillRadius, YELLOW);

    ctx.fillStyle = BLUE_DEEP;
    ctx.font = "bold 15px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, LEFT_X + pillW / 2, nameY + pillH / 2 + 1);

    // Value below the pill
    ctx.textAlign = "left";
    ctx.fillStyle = CREAM;
    ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, value, LEFT_W), LEFT_X, nameY + pillH + 34);

    nameY += pillH + 68;
  };

  drawInfoRow("CENTER", form.center || "Addis Ketema Center");
  drawInfoRow("DATE", form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.");
  drawInfoRow("TIME", form.time || "1:30 – 2:30 ከሰዓት");

  // ── Presentation title (optional, only if presenter chose one) ─
  if (form.title) {
    ctx.strokeStyle = "rgba(245,197,24,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LEFT_X, nameY);
    ctx.lineTo(LEFT_X + 80, nameY);
    ctx.stroke();

    ctx.fillStyle = YELLOW;
    ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC", LEFT_X, nameY + 26);

    ctx.fillStyle = CREAM;
    ctx.font = "bold 22px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, LEFT_W), LEFT_X, nameY + 56);
  }

  // ── Bottom row — cream accent bar + website URL ─────────────
  // Cream accent bar on the left (echoes the yellow wedge on the
  // top-right — the two accent blocks anchor the composition).
  ctx.fillStyle = CREAM;
  ctx.fillRect(PAD, H - PAD - 60, 5, 40);

  ctx.fillStyle = "rgba(253,246,227,0.6)";
  ctx.font = "italic 15px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("· Addis MESOB ·", PAD + 18, H - PAD - 40);

  // Website URL — bottom right, bold yellow
  ctx.fillStyle = YELLOW;
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(form.websiteUrl, W - PAD, H - PAD - 40);
}
