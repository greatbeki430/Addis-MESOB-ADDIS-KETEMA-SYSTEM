// frontend/src/components/golden-monday/templates/Geometric.js
//
// Bold modern layout: flat color blocks, geometric accents, and a
// two-column lower half. Everything is padded away from the edges
// and the presenter info and photo never overlap.
//
// Layout:
//   • Top bar: logo badge (left), committee label (right)
//   • Hero: large Amharic header, three lines
//   • Gold divider with diamond
//   • Two columns below:
//       - left  : presenter name, audience line, three info rows
//       - right : rounded photo card with a bold yellow frame
//   • Footer: website URL, right-aligned

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
  // Every element below uses these constants so retuning the
  // composition is one place, not twenty.
  const PAD = 60; // outer margin — the "not tied to edges" gap
  const HERO_TOP = 280; // baseline of the first hero line
  const HERO_LINE_H = 68; // line height between hero lines
  const DIVIDER_Y = 530; // y of the gold divider + diamond

  const PHOTO_W = 400;
  const PHOTO_H = 520;
  const PHOTO_X = W - PAD - PHOTO_W;
  const PHOTO_Y = 620;
  const PHOTO_RADIUS = 32;

  // Left column for presenter info — bounded, so text wraps/truncates
  // instead of running underneath the photo.
  const LEFT_X = PAD;
  const LEFT_W = PHOTO_X - PAD - 40; // 40px gutter between columns

  // ── Background ───────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, BLUE);
  bg.addColorStop(1, BLUE_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Yellow corner wedge (top-right, rounded) ─────────────────
  // A soft diagonal wedge reads as a "branded corner" without the
  // hard triangle that was in the previous version.
  ctx.save();
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(W - PAD, PAD);
  ctx.lineTo(W - PAD, PAD + 240);
  ctx.quadraticCurveTo(W - 340, PAD + 260, W - 400, PAD);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // A thin gold accent rectangle peeking out from the corner wedge
  // for depth.
  fillRoundedRect(ctx, W - PAD - 280, PAD - 4, 320, 10, 5, YELLOW_DEEP);

  // ── Subtle radial glow bottom-left for depth ────────────────
  const glow = ctx.createRadialGradient(0, H, 100, 0, H, 800);
  glow.addColorStop(0, "rgba(245,197,24,0.08)");
  glow.addColorStop(1, "rgba(245,197,24,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top-left logo on a rounded yellow badge ─────────────────
  const badgeX = PAD;
  const badgeY = PAD - 20;
  const badgeSize = 130;
  const badgeRadius = 28;

  applySoftShadow(ctx, 24, 12, 0.35);
  fillRoundedRect(
    ctx,
    badgeX,
    badgeY,
    badgeSize,
    badgeSize,
    badgeRadius,
    YELLOW,
  );
  clearShadow(ctx);

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = badgeSize - 40;
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
    ctx.font = "bold 44px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A·M", badgeX + badgeSize / 2, badgeY + badgeSize / 2);
  }

  // ── Committee label (top-right) ─────────────────────────────
  ctx.fillStyle = BLUE_DEEP;
  ctx.font = "bold 22px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOLDEN MONDAY", W - PAD - 20, PAD + 20);
  ctx.fillStyle = BLUE;
  ctx.font = "italic 18px 'Playfair Display', Georgia, serif";
  ctx.fillText("committee · 2026", W - PAD - 20, PAD + 50);

  // ── Hero header (three lines, generous spacing) ─────────────
  // All three lines share the same left edge — this gives the hero
  // a "column" feel rather than a scattered one.
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Line 1 — cream
  ctx.fillStyle = CREAM;
  ctx.font = "900 62px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ", PAD, HERO_TOP);

  // Line 2 — yellow (the visual anchor of the whole poster)
  ctx.fillStyle = YELLOW;
  ctx.fillText("ሰኞ ፕሮግራም", PAD, HERO_TOP + HERO_LINE_H);

  // Line 3 — cream
  ctx.fillStyle = CREAM;
  ctx.fillText("ተናጋሪ", PAD, HERO_TOP + HERO_LINE_H * 2);

  // ── Gold divider with diamond ───────────────────────────────
  // Sits between the hero and the two-column content below.
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, DIVIDER_Y);
  ctx.lineTo(W - PAD - 100, DIVIDER_Y);
  ctx.stroke();

  // Diamond at the divider's right end
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(W - PAD - 100, DIVIDER_Y - 10);
  ctx.lineTo(W - PAD - 90, DIVIDER_Y);
  ctx.lineTo(W - PAD - 100, DIVIDER_Y + 10);
  ctx.lineTo(W - PAD - 110, DIVIDER_Y);
  ctx.closePath();
  ctx.fill();

  // ── Presenter photo card (right column) ─────────────────────
  // Yellow accent strip peeking above the photo — reads as a
  // designed offset, not a random line.
  fillRoundedRect(ctx, PHOTO_X - 10, PHOTO_Y - 16, PHOTO_W + 20, 12, 6, YELLOW);

  // Soft shadow behind the photo
  applySoftShadow(ctx, 32, 18, 0.45);
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

  // Bold yellow frame
  strokeRoundedRect(
    ctx,
    PHOTO_X,
    PHOTO_Y,
    PHOTO_W,
    PHOTO_H,
    PHOTO_RADIUS,
    YELLOW,
    4,
  );

  // Small inner accent — thin white line inset just inside the frame
  strokeRoundedRect(
    ctx,
    PHOTO_X + 10,
    PHOTO_Y + 10,
    PHOTO_W - 20,
    PHOTO_H - 20,
    PHOTO_RADIUS - 8,
    "rgba(255,255,255,0.15)",
    1,
  );

  // ── Left column: presenter info ─────────────────────────────
  let y = PHOTO_Y;

  // Label "PRESENTER"
  ctx.fillStyle = YELLOW;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.fillText("PRESENTER", LEFT_X, y + 20);

  // Presenter name — allow up to two lines within LEFT_W
  ctx.fillStyle = CREAM;
  ctx.font = "bold 38px 'Playfair Display', Georgia, serif";
  const nameWords = (form.presenterName || "TBD").split(" ");
  if (nameWords.length > 2) {
    const mid = Math.ceil(nameWords.length / 2);
    const line1 = nameWords.slice(0, mid).join(" ");
    const line2 = nameWords.slice(mid).join(" ");
    ctx.fillText(fitText(ctx, line1, LEFT_W), LEFT_X, y + 70);
    ctx.fillText(fitText(ctx, line2, LEFT_W), LEFT_X, y + 116);
    y += 160;
  } else {
    ctx.fillText(
      fitText(ctx, form.presenterName || "TBD", LEFT_W),
      LEFT_X,
      y + 70,
    );
    y += 120;
  }

  // Audience line (Amharic) — bounded
  ctx.fillStyle = YELLOW;
  ctx.font = "bold 26px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, LEFT_W), LEFT_X, y + 20);
  y += 90;

  // ── Info rows: pill label + value ───────────────────────────
  // Each row is: a small yellow pill with a white (blue text) label,
  // then the value below. Spacing is uniform.
  const pillW = 110;
  const pillH = 28;
  const pillRadius = 14;

  const drawInfoRow = (label, value) => {
    // Pill
    fillRoundedRect(ctx, LEFT_X, y, pillW, pillH, pillRadius, YELLOW);

    ctx.fillStyle = BLUE_DEEP;
    ctx.font = "bold 14px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, LEFT_X + pillW / 2, y + pillH / 2 + 1);

    // Value — left aligned under the pill
    ctx.textAlign = "left";
    ctx.fillStyle = CREAM;
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, value, LEFT_W), LEFT_X, y + pillH + 30);

    y += pillH + 60;
  };

  drawInfoRow("CENTER", form.center || "Addis Ketema Center");
  drawInfoRow("DATE", form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም.");
  drawInfoRow("TIME", form.time || "1:30 – 2:30 ከሰዓት");

  // ── Presentation title (only if the presenter chose one) ────
  // Sits in the whitespace at the bottom, right under the info rows.
  if (form.title) {
    // Small divider above the title
    ctx.strokeStyle = "rgba(245,197,24,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LEFT_X, y);
    ctx.lineTo(LEFT_X + 60, y);
    ctx.stroke();

    ctx.fillStyle = YELLOW;
    ctx.font = "italic 14px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("TOPIC", LEFT_X, y + 24);

    ctx.fillStyle = CREAM;
    ctx.font = "bold 20px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, `"${form.title}"`, LEFT_W), LEFT_X, y + 52);
  }

  // ── Cream footer accent — small, bottom-left ────────────────
  // A minimal cream block grounds the composition without covering
  // any content. Sized to sit in the leftover whitespace.
  fillRoundedRect(ctx, PAD, H - PAD - 8, 60, 8, 4, CREAM);

  // ── Website URL (bottom-right) ──────────────────────────────
  ctx.fillStyle = YELLOW;
  ctx.font = "italic 20px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(form.websiteUrl, W - PAD, H - PAD);

  // ── Committee mark (bottom-left of the URL row) ─────────────
  // A tiny brand tag so the poster doesn't feel bottom-heavy on the
  // right. Kept minimal.
  ctx.fillStyle = "rgba(245,197,24,0.6)";
  ctx.font = "italic 14px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("· Addis MESOB ·", PAD, H - PAD);
}
