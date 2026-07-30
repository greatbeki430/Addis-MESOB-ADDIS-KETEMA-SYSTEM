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

// Gregorian month names for the "Generated On" date, per language
const GREGORIAN_MONTHS_AM = [
  "ጃንዋሪ",
  "ፌብሩዋሪ",
  "ማርች",
  "ኤፕሪል",
  "ሜይ",
  "ጁን",
  "ጁላይ",
  "ኦገስት",
  "ሴፕቴምበር",
  "ኦክቶበር",
  "ኖቬምበር",
  "ዲሴምበር",
];

const GREGORIAN_MONTHS_OM = [
  "Amajjii",
  "Guraandhala",
  "Bitootessa",
  "Ebla",
  "Caamsaa",
  "Waxabajjii",
  "Adooleessa",
  "Hagayya",
  "Fuulbana",
  "Onkololeessa",
  "Sadaasa",
  "Muddee",
];

// ✅ Formats a plain Gregorian date, per language, for "Generated On"
function formatGregorianDateForLanguage(date, lang) {
  const day = date.getDate();
  const year = date.getFullYear();
  const monthIdx = date.getMonth(); // 0–11

  if (lang === "am") {
    return `${GREGORIAN_MONTHS_AM[monthIdx]} ${day}, ${year}`;
  }
  if (lang === "om") {
    return `${GREGORIAN_MONTHS_OM[monthIdx]} ${day}, ${year}`;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ ROOT-CAUSE FIX: mixed-script text rendering
// ─────────────────────────────────────────────────────────────────────────────

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
 */
function drawMixedScriptText(doc, text, x, y, opts = {}) {
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

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Watermark - FIXED: Position adjusted to avoid table header
// ─────────────────────────────────────────────────────────────────────────────
function drawWatermark(doc, text, opts = {}) {
  const { angle = 0, fontSize = 50, opacity = 0.25, yOffset = 30 } = opts;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ✅ Moved down by 30px to avoid table header cutting off the watermark
  const cx = pageWidth / 2;
  const cy = pageHeight / 2 + yOffset;

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
 */
export const generateDailyReportPDF = async (rows, date, t, options = {}) => {
  try {
    console.log("📄 Generating Daily Report PDF...");

    if (!rows || rows.length === 0) {
      throw new Error("No data to export");
    }

    const validRows = rows.filter((r) => r.dept || r.service);

    if (validRows.length === 0) {
      throw new Error("No valid data to export");
    }

    // ─── 🔍 AUTO-DETECT LANGUAGE ───
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

    // ─── Language-specific labels ──────────────────────────────────────────────
    const LABELS = {
      am: {
        title: "ዕለታዊ ሪፖርት",
        subtitle: "የአዲስ መሶብ የአንድ ማዕከል አገልግሎት",
        reportDate: "የሪፖርቱ ቀን",
        generatedOn: "የተዘጋጀበት ቀን",
        preparedBy: "የተዘጋጀው በ",
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
        preparedBy: "Prepared By",
        colNo: "#",
        colDept: "Department",
        colService: "Service",
        colMale: "Male",
        colFemale: "Female",
        colTotal: "Total",
        grandTotal: "Grand Total",
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
        preparedBy: "Kan Qophaa'e",
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

    // ─── Create PDF ────────────────────────────────────────────────────────────
    const engine = createPDF({
      orientation: "landscape",
      theme: "daily",
    });

    const doc = engine.getDoc();

    loadFonts(doc, { silent: false });

    // ─── Helper: Set font based on text content ────────────────────────────────
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

    // ─── Title ────────────────────────────────────────────────────────────────
    setSmartFont(labels.title, true);
    doc.setFontSize(20);
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    doc.text(encodeText(labels.title), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 12;

    // ─── Subtitle ──────────────────────────────────────────────────────────────
    setSmartFont(labels.subtitle, false);
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(encodeText(labels.subtitle), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // ─── ✅ UPDATED: Prepared By Info with Department (not role) ──────────────
    if (options?.preparedBy) {
      // Build the prepared by text - prioritize department over role
      let preparedByText = `${labels.preparedBy}: ${options.preparedBy}`;

      // Collect all parts (department first, then branch)
      const parts = [];

      // ✅ PRIORITY 1: Department (if available and not "N/A")
      if (
        options.preparedByDepartment &&
        options.preparedByDepartment !== "N/A" &&
        options.preparedByDepartment !== "Staff"
      ) {
        parts.push(options.preparedByDepartment);
      }

      // ✅ PRIORITY 2: Branch (if available)
      if (options.preparedByBranch) {
        parts.push(options.preparedByBranch);
      }

      // ✅ ONLY use role as LAST RESORT if no department is available
      if (parts.length === 0 && options.preparedByRole) {
        parts.push(options.preparedByRole);
      }

      if (parts.length > 0) {
        preparedByText += ` (${parts.join(" - ")})`;
      }

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      drawMixedScriptText(doc, preparedByText, pageWidth / 2, yPos, {
        align: "center",
        bold: false,
      });
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    }

    // ─── Report Date ──────────────────────────────────────────────────────────
    const reportDate = date || new Date().toISOString().split("T")[0];
    const formattedReportDate = formatDateForLanguage(reportDate, lang);
    const reportDateText = `${labels.reportDate}: ${formattedReportDate}`;

    console.log(`📅 Report Date (${lang}): ${formattedReportDate}`);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    drawMixedScriptText(doc, reportDateText, pageWidth / 2, yPos, {
      align: "center",
      bold: false,
    });
    yPos += 8;

    // ─── Generated On ──────────────────────────────────────────────────────────
    const currentDate = new Date();
    const generatedOnDate = formatGregorianDateForLanguage(currentDate, lang);
    const generatedOnText = `${labels.generatedOn}: ${generatedOnDate}`;

    console.log(`📅 Generated On (${lang}): ${generatedOnDate}`);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
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

    yPos = doc.lastAutoTable?.finalY + 10 || yPos + 50;

    // ─── Watermark (drawn AFTER the table with yOffset moved down) ────────────
    if (options?.showWatermark) {
      try {
        const watermarkText = options?.watermarkText || labels.title;
        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          // ✅ yOffset: 30px down from center to avoid table header
          drawWatermark(doc, watermarkText, {
            angle: options?.watermarkAngle ?? 0,
            fontSize: options?.watermarkSize || 50,
            opacity: options?.watermarkOpacity ?? 0.25,
            yOffset: 20,
          });
        }
      } catch (watermarkError) {
        console.warn("Watermark addition failed:", watermarkError.message);
      }
    }

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

      if (options?.preparedBy) {
        const preparedFooterText =
          lang === "am"
            ? `ተዘጋጅቷል በ: ${options.preparedBy}`
            : lang === "om"
              ? `Qophaa'e: ${options.preparedBy}`
              : `Prepared by: ${options.preparedBy}`;
        drawMixedScriptText(doc, preparedFooterText, 15, footerY, {
          align: "left",
          bold: false,
        });
      }

      drawMixedScriptText(doc, footerText, pageWidth / 2, footerY, {
        align: "center",
        bold: false,
      });

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
