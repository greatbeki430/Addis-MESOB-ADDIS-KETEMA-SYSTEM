// frontend/src/components/golden-monday/templates/MonochromeEditorial.js
//
// Brutalist black-and-white poster — hard edges, a heavy left-aligned
// masthead, a sharp-cornered photo with a thick black frame, and a
// solid black title block with reversed-out type. Built to survive
// black-and-white printing: every element still reads without color.
import { drawRoundedImage, fitText, wrapText } from "./drawHelpers";

export const meta = {
  id: "monochrome-editorial",
  name: "Monochrome Editorial",
  description: "Bold black & white brutalist poster",
  thumbnailColor: "#111111",
};

const BLACK = "#0a0a0a";
const WHITE = "#f7f7f5";
const GRAY = "#8a8a86";

export async function render(ctx, helpers) {
  const { form, photoSrc, assets, W, H, loadImage } = helpers;
  const PAD = 50;

  // ── Background ───────────────────────────────────────────────
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, W, H);

  // Halftone dot field, very low opacity
  ctx.save();
  ctx.fillStyle = "rgba(10,10,10,0.03)";
  for (let y = 0; y < H; y += 9) {
    const offset = (y / 9) % 2 === 0 ? 0 : 4.5;
    for (let x = offset; x < W; x += 9) {
      ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.restore();

  // Heavy single black border, inset
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 6;
  ctx.strokeRect(PAD - 24, PAD - 24, W - (PAD - 24) * 2, H - (PAD - 24) * 2);

  // ── Masthead: logo block + heavy underline ──────────────────
  const boxSize = 100;
  ctx.fillStyle = BLACK;
  ctx.fillRect(PAD, PAD, boxSize, boxSize);

  if (assets.logo) {
    try {
      const logo = await loadImage(assets.logo);
      const lw = boxSize - 28;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(
        logo,
        PAD + (boxSize - lw) / 2,
        PAD + (boxSize - lh) / 2,
        lw,
        lh,
      );
    } catch (e) {
      console.warn("[MonochromeEditorial] logo missing:", e.message);
    }
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = BLACK;
  ctx.font = "bold 40px 'Noto Serif Ethiopic', 'Nyala', serif";
  ctx.fillText("የወርቃማ ሰኞ ፕሮግራም ተረኛ", PAD + boxSize + 26, PAD + 46);

  ctx.fillStyle = GRAY;
  ctx.font = "bold 15px sans-serif";
  const sub = form.sessionNumber
    ? `GOLDEN MONDAY · SESSION #${form.sessionNumber}`
    : "GOLDEN MONDAY PROGRAM";
  ctx.fillText(sub.toUpperCase(), PAD + boxSize + 26, PAD + 74);

  ctx.fillStyle = BLACK;
  ctx.fillRect(PAD, PAD + boxSize + 18, W - PAD * 2, 8);

  if (form.subtitle) {
    ctx.fillStyle = "rgba(10,10,10,0.6)";
    ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
    ctx.fillText(
      fitText(ctx, form.subtitle, W - PAD * 2),
      PAD,
      PAD + boxSize + 46,
    );
  }

  // ── Presenter photo — sharp rectangle, thick frame ──────────
  const photoW = 380;
  const photoH = 460;
  const photoX = PAD;
  const photoY = PAD + boxSize + 80;

  ctx.fillStyle = BLACK;
  ctx.fillRect(photoX - 10, photoY - 10, photoW + 20, photoH + 20);

  await drawRoundedImage(
    ctx,
    loadImage,
    photoSrc,
    photoX,
    photoY,
    photoW,
    photoH,
    0,
    { fallbackColor: "#d8d8d4", fallbackText: "Presenter photo" },
  );

  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.strokeRect(photoX + 8, photoY + 8, photoW - 16, photoH - 16);

  // ── Right column: name / info stacked rows ───────────────────
  const rightX = photoX + photoW + 40;
  const rightW = W - PAD - rightX;
  let ry = photoY;

  ctx.fillStyle = GRAY;
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("PRESENTED BY", rightX, ry);
  ry += 40;

  ctx.fillStyle = BLACK;
  ctx.font = "bold 40px sans-serif";
  const nameWords = (form.presenterName || "TBD").split(" ");
  if (nameWords.length > 2) {
    const mid = Math.ceil(nameWords.length / 2);
    ctx.fillText(
      fitText(ctx, nameWords.slice(0, mid).join(" "), rightW),
      rightX,
      ry,
    );
    ry += 46;
    ctx.fillText(
      fitText(ctx, nameWords.slice(mid).join(" "), rightW),
      rightX,
      ry,
    );
    ry += 46;
  } else {
    ctx.fillText(fitText(ctx, form.presenterName || "TBD", rightW), rightX, ry);
    ry += 46;
  }

  ctx.fillStyle = BLACK;
  ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
  const audienceLine =
    form.audienceLine || `ከ ${form.presenterName || "አቅራቢ"} ጋር`;
  ctx.fillText(fitText(ctx, audienceLine, rightW), rightX, ry + 8);
  ry += 46;

  if (form.department) {
    ctx.fillStyle = GRAY;
    ctx.font = "16px sans-serif";
    ctx.fillText(fitText(ctx, form.department, rightW), rightX, ry);
    ry += 40;
  } else {
    ry += 14;
  }

  // Info rows — stacked with square bullets
  const rows = [
    { label: "CENTER", value: form.center || "Addis Ketema Center" },
    { label: "DATE", value: form.ethiopianDate || "መስከረም 1, 2018 ዓ.ም." },
    { label: "TIME", value: form.time || "1:30 – 2:30 ከሰዓት" },
  ];
  if (form.weekOf) {
    rows.push({ label: "WEEK OF", value: formatWeekOf(form.weekOf) });
  }

  rows.forEach((row) => {
    ctx.fillStyle = BLACK;
    ctx.fillRect(rightX, ry, 14, 14);

    ctx.fillStyle = GRAY;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(row.label, rightX + 24, ry + 11);
    ry += 30;

    ctx.fillStyle = BLACK;
    ctx.font = "bold 24px 'Noto Serif Ethiopic', 'Nyala', serif";
    ctx.fillText(fitText(ctx, row.value, rightW - 24), rightX + 24, ry);
    ry += 44;
  });

  // ── Title — solid black block, reversed-out type ───────────
  if (form.title) {
    const titleY = photoY + photoH + 50;
    ctx.font = "bold 26px sans-serif";
    let lines = wrapText(ctx, form.title, W - PAD * 2 - 40);
    if (lines.length > 2) {
      lines = [
        lines[0],
        fitText(ctx, lines.slice(1).join(" "), W - PAD * 2 - 40),
      ];
    }
    const blockH = 40 + lines.length * 36 + (form.description ? 30 : 0);

    ctx.fillStyle = BLACK;
    ctx.fillRect(PAD, titleY, W - PAD * 2, blockH);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("TOPIC OF THE SESSION", PAD + 20, titleY + 22);

    ctx.font = "bold 27px 'Noto Serif Ethiopic', 'Nyala', serif";
    lines.forEach((line, i) => {
      ctx.fillText(line, PAD + 20, titleY + 56 + i * 36);
    });

    if (form.description) {
      ctx.fillStyle = "rgba(247,247,245,0.75)";
      ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
      ctx.fillText(
        fitText(ctx, form.description, W - PAD * 2 - 40),
        PAD + 20,
        titleY + 56 + lines.length * 36 + 6,
      );
    }
  }

  // ── Footer ───────────────────────────────────────────────────
  const footerY = H - PAD - 10;
  ctx.fillStyle = BLACK;
  ctx.fillRect(PAD, footerY - 24, W - PAD * 2, 4);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = BLACK;
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("ADDIS MESOB", PAD, footerY);

  if (form.qrDataUrl) {
    try {
      const qr = await loadImage(form.qrDataUrl);
      const qrSize = 54;
      ctx.drawImage(
        qr,
        W / 2 - qrSize / 2,
        footerY - qrSize + 6,
        qrSize,
        qrSize,
      );
    } catch (e) {
      console.warn("[MonochromeEditorial] QR failed:", e.message);
    }
  } else {
    ctx.fillStyle = BLACK;
    ctx.fillRect(W / 2 - 4, footerY - 10, 8, 8);
  }

  ctx.fillStyle = BLACK;
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
    console.log("[MonochromeEditorial] formatWeekOf failed:", e.message);
    return iso;
  }
}
