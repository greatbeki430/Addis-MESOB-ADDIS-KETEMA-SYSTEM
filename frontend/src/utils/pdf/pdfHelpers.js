// frontend/src/utils/pdf/pdfHelpers.js
import { FONT_NAMES } from "./fontLoader";

// ─── ETHIOPIAN CALENDAR HELPERS ─────────────────────────────
const ETHIOPIAN_MONTHS_AM = [
  "መስከረም",
  "ጥቅምት",
  "ህዳር",
  "ታህሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
];

const JDN_EPOCH_OFFSET_AMETE_MIHRET = 1723856;

function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function toEthiopianDate(date = new Date()) {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  const offsetDays = jdn - JDN_EPOCH_OFFSET_AMETE_MIHRET;
  const r = offsetDays % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor(offsetDays / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

export const getEthiopianDate = (date = new Date()) => {
  const { year, month, day } = toEthiopianDate(date);
  const monthName = ETHIOPIAN_MONTHS_AM[month - 1];
  return `${monthName} ${day} ቀን ${year} ዓ.ም`;
};

// ─── TEXT HELPERS ─────────────────────────────────────────────
export const encodeText = (text) => {
  if (!text) return "";
  return String(text);
};

// ─── MIXED-SCRIPT TEXT RENDERING ─────────────────────────────
const AMHARIC_CHAR_RE = /[\u1200-\u137F]/;
const SCRIPT_RUN_RE = /[\u1200-\u137F]+|[^\u1200-\u137F]+/g;

function splitIntoScriptRuns(text) {
  const str = String(text ?? "");
  const runs = str.match(SCRIPT_RUN_RE) || [str];
  return runs.map((run) => ({
    text: run,
    isAmharic: AMHARIC_CHAR_RE.test(run),
  }));
}

function setFontForRun(doc, isAmharicRun, bold) {
  const style = bold ? "bold" : "normal";
  try {
    if (isAmharicRun) {
      doc.setFont(
        doc.__hasEthiopicFont ? FONT_NAMES.ethiopic : "helvetica",
        style,
      );
    } else {
      doc.setFont(doc.__hasLatinFont ? FONT_NAMES.latin : "helvetica", style);
    }
  } catch (error) {
    console.warn("Font fallback while drawing mixed text:", error.message);
    doc.setFont("helvetica", style);
  }
}

export function drawMixedScriptText(doc, text, x, y, opts = {}) {
  const { align = "left", bold = false } = opts;
  const runs = splitIntoScriptRuns(text);

  const widths = runs.map((run) => {
    setFontForRun(doc, run.isAmharic, bold);
    return doc.getTextWidth(run.text);
  });

  const totalWidth = widths.reduce((sum, w) => sum + w, 0);

  let startX = x;
  if (align === "center") startX = x - totalWidth / 2;
  else if (align === "right") startX = x - totalWidth;

  let cursorX = startX;
  runs.forEach((run, i) => {
    setFontForRun(doc, run.isAmharic, bold);
    doc.text(run.text, cursorX, y, { align: "left" });
    cursorX += widths[i];
  });

  return totalWidth;
}
