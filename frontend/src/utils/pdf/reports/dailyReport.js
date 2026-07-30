// frontend/src/utils/pdf/reports/dailyReport.js
import { createPDF } from "../pdfEngine";
import { encodeText, isAmharic, detectLanguage } from "../language";
import { loadFonts, FONT_NAMES } from "../fontLoader";

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Ethiopian calendar conversion (Gregorian → Ethiopian)
// ─────────────────────────────────────────────────────────────────────────────
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

// Oromo month names
const ETHIOPIAN_MONTHS_OM = [
  "Amajjii",
  "Guraandhala",
  "Bitooteessa",
  "Ebla",
  "Caamsaa",
  "Waxabajjii",
  "Adooleessa",
  "Hagayya",
  "Fuulbana",
  "Onkololeessa",
  "Sadaasa",
  "Muddee",
  "Qormaata",
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

function formatEthiopianDateAmharic(date = new Date()) {
  const { year, day, month } = toEthiopianDate(date);
  const monthName = ETHIOPIAN_MONTHS_AM[month - 1];
  return `${monthName} ${day} ቀን ${year} ዓ.ም`;
}

function formatEthiopianDateOromo(date = new Date()) {
  const { year, day, month } = toEthiopianDate(date);
  const monthName = ETHIOPIAN_MONTHS_OM[month - 1];
  return `${monthName} ${day}, ${year} A.M`;
}

// ✅ Format date based on language
function formatDateForLanguage(dateStr, lang) {
  if (!dateStr) return "N/A";

  const dateObj = new Date(dateStr);

  // For Amharic: Ethiopian calendar in Amharic
  if (lang === "am") {
    return formatEthiopianDateAmharic(dateObj);
  }

  // For Oromo: Ethiopian calendar in Oromo
  if (lang === "om") {
    return formatEthiopianDateOromo(dateObj);
  }

  // For English: Gregorian calendar
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format Ethiopian date for English (used for "Generated On" in English)
function formatEthiopianDateForEnglish(date = new Date()) {
  const { year, day, month } = toEthiopianDate(date);
  const monthNames = [
    "Meskerem",
    "Tikimt",
    "Hidar",
    "Tahsas",
    "Tir",
    "Yekatit",
    "Megabit",
    "Miazia",
    "Genbot",
    "Sene",
    "Hamle",
    "Nehase",
    "Pagume",
  ];
  return `${monthNames[month - 1]} ${day}, ${year} (Ethiopian)`;
}
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ✅ ROOT-CAUSE FIX: mixed-script text rendering
//
// jsPDF's doc.text() applies exactly ONE currently-active font to an entire
// string. The Ethiopic font (NotoSansEthiopic) only embeds glyphs for the
// Ethiopic Unicode block (U+1200–U+137F) — it has no glyphs for Western
// digits ("0"–"9") or most Latin punctuation. Strings like
// "የሪፖርቱ ቀን: ሐምሌ 20 ቀን 2018 ዓ.ም" mix Ethiopic text with Latin digits and
// punctuation, so a single setFont() call can never render the whole thing
// correctly — whichever characters aren't in the active font's glyph table
// render as blank (.notdef), and jsPDF's align:"center" width calculation
// (based on that same single font) gets thrown off for the rest of the line.
//
// This is why:
//  - Pure-Amharic labels/titles (no digits) rendered fine.
//  - Pure-number table cells rendered fine (single script, own font).
//  - Any string mixing "ቀን" + digits + "." (dates) silently failed.
//
// The fix: split the string into runs of same-script characters, render each
// run with its own font (Ethiopic vs Latin/Helvetica), and manually walk the
// x-cursor across runs — including manual centering, since jsPDF's built-in
// align option only works within a single font call.
// ─────────────────────────────────────────────────────────────────────────────

const AMHARIC_CHAR_RE = /[\u1200-\u137F]/;
// Splits into runs of "all-Amharic" vs "everything else" (digits, Latin,
// punctuation, spaces). Adjacent same-type characters are merged into one run.
const SCRIPT_RUN_RE = /[\u1200-\u137F]+|[^\u1200-\u137F]+/g;

function splitIntoScriptRuns(text) {
  const str = String(text ?? "");
  const runs = str.match(SCRIPT_RUN_RE) || [str];
  return runs.map((run) => ({
    text: run,
    isAmharic: AMHARIC_CHAR_RE.test(run),
  }));
}

/**
 * Sets doc's active font to the correct family/style for a given run.
 */
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

/**
 * Draws a string that may mix Amharic and Latin/digit/punctuation characters,
 * switching fonts per script run so every character actually has a glyph to
 * render, and manually computing alignment since jsPDF can't align mixed-font
 * text on its own.
 *
 * @param {jsPDF} doc
 * @param {string} text
 * @param {number} x - reference x coordinate (meaning depends on align)
 * @param {number} y
 * @param {Object} [opts]
 * @param {"left"|"center"|"right"} [opts.align="left"]
 * @param {boolean} [opts.bold=false]
 * @returns {number} total rendered width (in doc units)
 */
function drawMixedScriptText(doc, text, x, y, opts = {}) {
  const { align = "left", bold = false } = opts;

  const runs = splitIntoScriptRuns(text);

  // First pass: measure each run's width using the font that will actually
  // render it (font metrics differ between Ethiopic and Latin fonts).
  const widths = runs.map((run) => {
    setFontForRun(doc, run.isAmharic, bold);
    return doc.getTextWidth(run.text);
  });

  const totalWidth = widths.reduce((sum, w) => sum + w, 0);

  let startX = x;
  if (align === "center") startX = x - totalWidth / 2;
  else if (align === "right") startX = x - totalWidth;

  // Second pass: actually draw, walking the cursor forward per run.
  let cursorX = startX;
  runs.forEach((run, i) => {
    setFontForRun(doc, run.isAmharic, bold);
    doc.text(run.text, cursorX, y, { align: "left" });
    cursorX += widths[i];
  });

  return totalWidth;
}

/**
 * Draws a centered, rotated watermark on the CURRENT page.
 * Manually computes the start point instead of relying on jsPDF's
 * align:"center" + angle combination — that combo doesn't correctly
 * center rotated text; the offset is computed before rotation is
 * applied, so the visual center drifts away from the intended anchor.
 */
function drawWatermark(doc, text, opts = {}) {
  const { angle = 0, fontSize = 50, opacity = 0.25 } = opts;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cx = pageWidth / 2;
  const cy = pageHeight / 2;

  let gStateApplied = false;
  try {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity }));
    gStateApplied = true;
  } catch (e) {
    console.debug("GState opacity unsupported:", e.message);
  }

  doc.setFontSize(fontSize);
  const shade = gStateApplied ? 150 : 225;
  doc.setTextColor(shade, shade, shade);

  const hasAm = isAmharic(text);
  doc.setFont(
    hasAm
      ? doc.__hasEthiopicFont
        ? FONT_NAMES.ethiopic
        : "helvetica"
      : doc.__hasLatinFont
        ? FONT_NAMES.latin
        : "helvetica",
    "normal",
  );

  const textWidth = doc.getTextWidth(text);

  if (angle) {
    const rad = (angle * Math.PI) / 180;
    const startX = cx - (textWidth / 2) * Math.cos(rad);
    const startY = cy + (textWidth / 2) * Math.sin(rad);
    doc.text(encodeText(text), startX, startY, { align: "left", angle });
  } else {
    doc.text(encodeText(text), cx, cy, { align: "center" });
  }

  if (gStateApplied) {
    try {
      doc.restoreGraphicsState();
    } catch (e) {
      console.debug("restoreGraphicsState failed:", e.message);
    }
  }
  doc.setTextColor(0, 0, 0);
}

/**
 * Generate Daily Report PDF with full Amharic support
 * @param {Array} rows - Array of report rows with dept, service, male, female, total
 * @param {string} date - Report date string
 * @param {Object} t - Translation function object
 * @param {Object} options - Additional options for PDF generation
 */
export const generateDailyReportPDF = async (rows, date, t, options = {}) => {
  try {
    console.log("📄 Generating Daily Report PDF...");

    if (!rows || rows.length === 0) {
      throw new Error("No data to export");
    }

    // Filter valid rows
    const validRows = rows.filter((r) => r.dept || r.service);

    if (validRows.length === 0) {
      throw new Error("No valid data to export");
    }

    // ─── 🔍 AUTO-DETECT LANGUAGE USING detectLanguage ───
    const sampleText = validRows
      .slice(0, 5)
      .map((r) => (r.dept || "") + " " + (r.service || ""))
      .join(" ");

    const detected = detectLanguage(sampleText);
    console.log(`🔍 Detected language from content: ${detected}`);

    let lang = options?.language || "am";

    if (!options?.language) {
      if (detected === "amharic") {
        lang = "am";
        console.log(`🔍 Auto-detected Amharic content, using Amharic font`);
      } else if (detected === "english") {
        lang = "en";
        console.log(`🔍 Auto-detected English content, using English font`);
      } else if (detected === "mixed") {
        lang = "am";
        console.log(`🔍 Mixed content detected, defaulting to Amharic font`);
      } else {
        lang = "am";
        console.log(`🔍 Language not detected, defaulting to Amharic`);
      }
    } else {
      console.log(`📄 Using user-specified language: ${lang.toUpperCase()}`);
    }
    // ─── END OF AUTO-DETECTION ───

    // Language-specific labels
    const LABELS = {
      am: {
        title: "ዕለታዊ ሪፖርት",
        subtitle: "የአዲስ መሶብ የአንድ ማዕከል አገልግሎት",
        reportDate: "የሪፖርቱ ቀን",
        generatedOn: "የተዘጋጀበት ቀን",
        colNo: "ተ.ቁ",
        colDept: "ዘርፍ",
        colService: "አገልግሎት",
        colMale: "ወንድ",
        colFemale: "ሴት",
        colTotal: "ድምር",
        grandTotal: "ጠቅላላ ድምር",
        footer: "በአዲስ መሶብ የአንድ ማዕከል አገልግሎት ማእከል የተዘጋጀ",
        generatedBy: "ገጽ",
        of: "ከ",
        page: "ገጽ",
      },
      en: {
        title: "DAILY REPORT",
        subtitle: "A-MESOB ONE-STOP SERVICE CENTER",
        reportDate: "REPORT DATE: ",
        generatedOn: "REPORTED ON: ",
        colNo: "#",
        colDept: "Department",
        colService: "Service",
        colMale: "Male",
        colFemale: "Female",
        colTotal: "Total",
        grandTotal: "Grand Total",
        // footer: "Reported by A-MESOB One-Stop Service Center",
        footer: "PREPARED BY A-MESOB ONE-STOP SERVICE CENTER!",
        generatedBy: "Page",
        of: "of",
        page: "Page",
      },
      om: {
        title: "GABAASA GUYYAA GUYYAA",
        subtitle: "WIIRTUU TAJAAJILA IDDOO TOKKOO (A-MESOB)",
        reportDate: "GUYYAA GABAASAA: ",
        generatedOn: "GUYYAA ITTI QOPHAA'E: ",
        colNo: "#",
        colDept: "Kutaa",
        colService: "Tajaajila",
        colMale: "Dhiira",
        colFemale: "Dubartii",
        colTotal: "Waliigala",
        grandTotal: "Waliigala Guutuu",
        footer: "A-MESOB WIIRTUU TAJAAJILA 1FFAATIIN KAN QOPHAA'E!",
        generatedBy: "Fuula",
        of: "keessaa",
        page: "Fuula",
      },
    };

    const labels = LABELS[lang] || LABELS.am;

    // Create PDF engine with daily theme
    const engine = createPDF({
      orientation: "landscape",
      theme: "daily",
    });

    const doc = engine.getDoc();

    loadFonts(doc, { silent: false });

    // ─── Helper: Set font based on text content (single-script strings) ───
    const setSmartFont = (text, bold = false) => {
      try {
        const hasAmharic = isAmharic(text);
        const style = bold ? "bold" : "normal";

        if (hasAmharic) {
          if (doc.__hasEthiopicFont) {
            doc.setFont(FONT_NAMES.ethiopic, style);
          } else {
            console.warn(
              "⚠️ Ethiopic font not available, using helvetica for Amharic text",
            );
            doc.setFont("helvetica", style);
          }
        } else {
          if (doc.__hasLatinFont) {
            doc.setFont(FONT_NAMES.latin, style);
          } else {
            doc.setFont("helvetica", style);
          }
        }
      } catch (error) {
        console.warn("Font fallback:", error.message);
        doc.setFont("helvetica", bold ? "bold" : "normal");
      }
    };

    // ─── Set document metadata ────────────────────────────────────────────────
    try {
      doc.setProperties({
        title: `${labels.title} - ${date}`,
        author: options?.author || "A-MESOB One-Stop Service Center",
        subject:
          options?.subject || `${labels.title} (${labels.reportDate}: ${date})`,
        keywords: options?.keywords || "daily, report, service, Amharic",
        creator: "A-MESOB PDF Generator",
      });
    } catch (metadataError) {
      console.debug("Could not set document metadata:", metadataError.message);
    }

    // ─── Title (single-script — plain setSmartFont + doc.text is fine) ──────
    setSmartFont(labels.title, true);
    doc.setFontSize(20);
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    doc.text(encodeText(labels.title), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 12;

    // ─── Subtitle (single-script) ────────────────────────────────────────────
    setSmartFont(labels.subtitle, false);
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(encodeText(labels.subtitle), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // ─── Report Date (MIXED SCRIPT — this is the string that was invisible) ─
    const reportDate = date || new Date().toISOString().split("T")[0];

    // ✅ Format date based on language
    const formattedReportDate = formatDateForLanguage(reportDate, lang);
    const reportDateText = `${labels.reportDate}: ${formattedReportDate}`;

    console.log(`📅 Report Date (${lang}): ${formattedReportDate}`);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    // ✅ FIX: use drawMixedScriptText instead of setSmartFont()+doc.text().
    // It renders each script run (Amharic vs digits/punctuation) with its
    // own font instead of forcing the whole string through one font that's
    // missing glyphs for the digits.
    drawMixedScriptText(doc, reportDateText, pageWidth / 2, yPos, {
      align: "center",
      bold: false,
    });
    yPos += 8;

    // ─── ✅ Generated On (Ethiopian calendar for all languages) ──────────────
    const currentDate = new Date();
    let generatedOnDate;

    // ✅ Use Ethiopian calendar for all languages
    if (lang === "am") {
      generatedOnDate = formatEthiopianDateAmharic(currentDate);
    } else if (lang === "om") {
      generatedOnDate = formatEthiopianDateOromo(currentDate);
    } else {
      // English: Use Ethiopian date with clear label
      generatedOnDate = formatEthiopianDateForEnglish(currentDate);
    }

    const generatedOnText = `${labels.generatedOn}: ${generatedOnDate}`;

    console.log(`📅 Generated On (${lang}): ${generatedOnDate}`);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    // ✅ Same mixed-script fix applied here (this string also mixes Amharic
    // labels/month names with digits and periods).
    drawMixedScriptText(doc, generatedOnText, pageWidth / 2, yPos, {
      align: "center",
      bold: false,
    });
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // ─── Draw separator line ──────────────────────────────────────────────────
    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    // ─── Watermark (drawn BEHIND the table, since draw order = paint order) ───
    if (options?.showWatermark) {
      try {
        drawWatermark(doc, options?.watermarkText || labels.title, {
          angle: options?.watermarkAngle ?? 0,
          fontSize: options?.watermarkSize || 50,
        });
      } catch (watermarkError) {
        console.warn("Watermark addition failed:", watermarkError.message);
      }
    }

    // ─── Calculate Totals ─────────────────────────────────────────────────────
    const grandTotal = validRows.reduce(
      (sum, row) => sum + (row.total || 0),
      0,
    );
    const grandMale = validRows.reduce((sum, row) => sum + (row.male || 0), 0);
    const grandFemale = validRows.reduce(
      (sum, row) => sum + (row.female || 0),
      0,
    );

    // ─── Table ─────────────────────────────────────────────────────────────────
    const head = [
      [
        labels.colNo,
        labels.colDept,
        labels.colService,
        labels.colMale,
        labels.colFemale,
        labels.colTotal,
      ],
    ];

    const body = validRows.map((row, idx) => [
      `${idx + 1}`,
      encodeText(row.dept || "—"),
      encodeText(row.service || "—"),
      row.male || 0,
      row.female || 0,
      row.total || 0,
    ]);

    const foot = [
      ["", "", labels.grandTotal, grandMale, grandFemale, grandTotal],
    ];

    const autoTable = (await import("jspdf-autotable")).default;

    autoTable(doc, {
      startY: yPos,
      head: head,
      body: body,
      foot: foot,
      margin: { left: 15, right: 15 },
      theme: options?.tableTheme || "striped",
      headStyles: {
        fillColor: [26, 107, 74],
        textColor: [255, 255, 255],
        fontSize: options?.headerFontSize || 10,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: options?.bodyFontSize || 9,
        cellPadding: 4,
        halign: "center",
        valign: "middle",
      },
      footStyles: {
        fillColor: [240, 247, 244],
        textColor: [26, 107, 74],
        fontStyle: "bold",
        fontSize: options?.footerFontSize || 10,
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 18, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 25, halign: "center" },
        5: { cellWidth: 30, halign: "center" },
      },
      didParseCell: (data) => {
        const cellText = String(data.cell.raw || "");
        const hasAmharic = /[\u1200-\u137F]/.test(cellText);

        if (hasAmharic) {
          data.cell.styles.font = doc.__hasEthiopicFont
            ? FONT_NAMES.ethiopic
            : "helvetica";
        } else {
          data.cell.styles.font = doc.__hasLatinFont
            ? FONT_NAMES.latin
            : "helvetica";
        }

        data.cell.raw = encodeText(cellText);
      },
      styles: {
        font: doc.__hasLatinFont ? FONT_NAMES.latin : "helvetica",
      },
      pageBreak: "auto",
      tableWidth: "auto",
    });

    // ─── Watermark on any extra pages the table spilled onto ──────────────────
    // (these pages didn't exist yet when the watermark above was drawn, so this
    // unavoidably paints on top for pages 2+ — rare in practice for this report)
    const totalPages = doc.internal.getNumberOfPages();
    if (options?.showWatermark && totalPages > 1) {
      for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p);
        drawWatermark(doc, options?.watermarkText || labels.title, {
          angle: options?.watermarkAngle ?? 0,
          fontSize: options?.watermarkSize || 50,
        });
      }
      doc.setPage(1);
    }

    yPos = doc.lastAutoTable?.finalY + 10 || yPos + 50;

    // ─── Add Watermark if requested ──────────────────────────────────────────
    // if (options?.showWatermark) {
    //   try {
    //     const watermarkText = options?.watermarkText || labels.title;
    //     const pageCount = doc.internal.getNumberOfPages();

    //     for (let i = 1; i <= pageCount; i++) {
    //       doc.setPage(i);

    //       let gStateApplied = false;
    //       try {
    //         doc.saveGraphicsState();
    //         doc.setGState(new doc.GState({ opacity: 0.25 }));
    //         gStateApplied = true;
    //       } catch (gStateError) {
    //         console.debug(
    //           "GState opacity unsupported, falling back to light color:",
    //           gStateError.message,
    //         );
    //       }

    //       doc.setFontSize(options?.watermarkSize || 50);
    //       doc.setTextColor(
    //         gStateApplied ? 150 : 225,
    //         gStateApplied ? 150 : 225,
    //         gStateApplied ? 150 : 225,
    //       );
    //       // ✅ Watermark text can also mix scripts depending on options;
    //       // use the same safe renderer. Note: jsPDF's rotated-text "angle"
    //       // option only applies within a single doc.text() call, so runs
    //       // sharing one rotation still need to be positioned along the
    //       // rotated axis — for a centered single-line watermark this is
    //       // rare in practice (watermark text is usually single-script),
    //       // but drawMixedScriptText still measures/draws correctly for the
    //       // common case. If you pass a genuinely mixed watermark string
    //       // together with `angle`, prefer keeping the watermark text
    //       // single-script.
    //       if (options?.watermarkAngle) {
    //         setSmartFont(watermarkText, false);
    //         doc.text(
    //           encodeText(watermarkText),
    //           doc.internal.pageSize.getWidth() / 2,
    //           doc.internal.pageSize.getHeight() / 2,
    //           {
    //             align: "center",
    //             angle: options.watermarkAngle,
    //           },
    //         );
    //       } else {
    //         drawMixedScriptText(
    //           doc,
    //           watermarkText,
    //           doc.internal.pageSize.getWidth() / 2,
    //           doc.internal.pageSize.getHeight() / 2,
    //           { align: "center", bold: false },
    //         );
    //       }

    //       if (gStateApplied) {
    //         try {
    //           doc.restoreGraphicsState();
    //         } catch (restoreError) {
    //           console.debug(
    //             "restoreGraphicsState failed:",
    //             restoreError.message,
    //           );
    //         }
    //       }
    //     }
    //     doc.setTextColor(0, 0, 0);
    //   } catch (watermarkError) {
    //     console.warn("Watermark addition failed:", watermarkError.message);
    //   }
    // }

    // ─── Footer ────────────────────────────────────────────────────────────────
    const footerText = options?.footerText || labels.footer;
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = doc.internal.pageSize.getHeight() - 12;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      // Footer text is generally single-script, but mixed-safe rendering
      // costs nothing here either.
      drawMixedScriptText(doc, footerText, pageWidth / 2, footerY, {
        align: "center",
        bold: false,
      });

      // Page X of Y is Latin/digits only — plain doc.text is fine.
      setSmartFont(`${labels.page} ${i} ${labels.of} ${pageCount}`, false);
      doc.text(
        `${labels.page} ${i} ${labels.of} ${pageCount}`,
        pageWidth - 15,
        footerY,
        { align: "right" },
      );
    }

    // ─── Save ──────────────────────────────────────────────────────────────────
    const safeDate = reportDate.replace(/\//g, "-");
    const langSuffix = lang === "am" ? "_am" : lang === "om" ? "_om" : "_en";
    const filename =
      options?.filename || `AMESOB_DailyReport${langSuffix}_${safeDate}.pdf`;
    engine.save(filename);

    console.log(
      `✅ Daily Report PDF generated successfully in ${lang.toUpperCase()}!`,
    );
    console.log(`📄 Saved as: ${filename}`);
    console.log(
      `📊 Total rows: ${validRows.length}, Grand total: ${grandTotal}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Daily Report PDF Error:", error.message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
};

export default generateDailyReportPDF;
