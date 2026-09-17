// frontend/src/components/golden-monday/templates/drawHelpers.js
//
// Small, reusable canvas drawing primitives that the poster templates
// can compose. Keeping them here means every template gets the same
// rounded corners, soft shadows, and text fitting without copying
// that code five times.

/**
 * Draw a rounded rectangle path. Does not fill or stroke — the caller
 * decides whether to fill, stroke, clip, or all three.
 */
export function roundedRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Fill a rounded rectangle in one call.
 */
export function fillRoundedRect(ctx, x, y, w, h, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();
}

/**
 * Stroke a rounded rectangle in one call.
 */
export function strokeRoundedRect(
  ctx,
  x,
  y,
  w,
  h,
  radius,
  color,
  lineWidth = 2,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a soft drop shadow behind a rounded rectangle. Call this BEFORE
 * drawing the panel. Pair it with clearShadow() afterwards so the next
 * element doesn't inherit the shadow state.
 */
export function applySoftShadow(ctx, blur = 24, offsetY = 12, opacity = 0.18) {
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${opacity})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = offsetY;
}

export function clearShadow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draw an image clipped to a rounded rectangle, cover-fit.
 * The image fills the entire box with no distortion: whichever side
 * is longer gets cropped. This is what you want for portraits.
 */
export async function drawRoundedImage(
  ctx,
  loadImage,
  src,
  x,
  y,
  w,
  h,
  radius,
  { fallbackColor = "#e5e7eb", fallbackText = "Photo" } = {},
) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  if (!src) {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "italic 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fallbackText, x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }

  try {
    const img = await loadImage(src);
    const targetAspect = w / h;
    const sourceAspect = img.width / img.height;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    if (sourceAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } catch (e) {
    console.warn("[drawRoundedImage] failed:", e.message);
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

/**
 * Draw an image clipped to a perfect circle, cover-fit.
 */
export async function drawCircleImage(
  ctx,
  loadImage,
  src,
  cx,
  cy,
  radius,
  { fallbackColor = "#e5e7eb" } = {},
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (!src) {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
    return;
  }

  try {
    const img = await loadImage(src);
    const size = radius * 2;
    const targetAspect = 1;
    const sourceAspect = img.width / img.height;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    if (sourceAspect > targetAspect) {
      sw = img.height;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, cx - radius, cy - radius, size, size);
  } catch (e) {
    console.warn("[drawCircleImage] failed:", e.message);
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  ctx.restore();
}

/**
 * Draw an image clipped to an arch: rounded semicircle top, straight
 * sides, flat bottom. Classic for ceremonial / wedding-invitation
 * style portraits.
 */
export async function drawArchImage(
  ctx,
  loadImage,
  src,
  x,
  y,
  w,
  h,
  { fallbackColor = "#e5e7eb" } = {},
) {
  const archRadius = w / 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + archRadius);
  ctx.arc(x + archRadius, y + archRadius, archRadius, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.clip();

  if (!src) {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }

  try {
    const img = await loadImage(src);
    const targetAspect = w / h;
    const sourceAspect = img.width / img.height;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    if (sourceAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } catch (e) {
    console.warn("[drawArchImage] failed:", e.message);
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

/**
 * Wrap a text string into lines that fit inside maxWidth.
 * Returns an array of lines. Caller sets the font BEFORE calling.
 */
export function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Fit a text string to a single line no longer than maxWidth by
 * truncating with an ellipsis. Caller sets the font BEFORE calling.
 */
export function fitText(ctx, text, maxWidth, ellipsis = "…") {
  let s = String(text || "");
  if (ctx.measureText(s).width <= maxWidth) return s;
  while (s.length > 1 && ctx.measureText(s + ellipsis).width > maxWidth) {
    s = s.slice(0, -1);
  }
  return s + ellipsis;
}
