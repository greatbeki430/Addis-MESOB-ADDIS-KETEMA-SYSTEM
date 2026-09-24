// frontend/src/utils/pdfExport.js
// ─────────────────────────────────────────────────────────────────────────────
// Canonical PDF export entry points.
//   • exportForumReportToPDF              — mixed-script safe, Amharic-first
//   • exportDailyReportToPDF              — delegates to ./pdf/reports/dailyReport.js
//   • exportEvaluationReportToPDF         — mixed-script safe, Amharic-first
//   • exportRecognitionCertificateToPDF   — mixed-script safe, Amharic-first
//   • exportBiWeeklyAggregateReportToPDF  — mixed-script safe, Amharic-first
//
// RULE OF THUMB (see dailyReport.js / goldenMondayReport.js for the same
// pattern): every visible string goes through drawMixedScriptText(), every
// document calls loadFonts() once after creation, and table cells switch
// fonts per-cell in didParseCell.
//
// drawMixedScriptText is imported from ./pdf/pdfHelpers — the shared
// implementation used by dailyReport.js, goldenMondayReport.js and
// reportExport.js. Do NOT define a second copy here.
// ─────────────────────────────────────────────────────────────────────────────

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { showErrorToast, showSuccessToast } from "./toastHelper";
import { loadFonts, FONT_NAMES } from "./pdf/fontLoader";
import { isAmharic } from "./pdf/language";
import { drawMixedScriptText } from "./pdf/pdfHelpers";
import { generateDailyReportPDF } from "./pdf/reports/dailyReport";

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

const getEthiopianDate = (date = new Date()) => {
  const { year, month, day } = toEthiopianDate(date);
  const monthName = ETHIOPIAN_MONTHS_AM[month - 1];
  return `${monthName} ${day} ቀን ${year} ዓ.ም`;
};

// Helper: Ensure text is properly encoded for PDF
const encodeText = (text) => {
  if (!text) return "";
  return String(text);
};

// Helper: header cells are short labels (ተ.ቁ, ክፍል, ዝርዝር, ስም, ሁኔታ …).
// They must never wrap. We mark them via a sentinel so sharedDidParseCell
// can force one line and disable linebreak for that specific cell.
const noWrap = (label) => ({ __noWrap: true, label });
const isNoWrap = (raw) =>
  raw && typeof raw === "object" && raw.__noWrap === true;

// ─── FORUM REPORT LABELS (language-aware) ─────────────────────
// Amharic is the default. `lang` may be "en" or "om" to override.
// No content auto-detection — the caller decides (see exportForumReportToPDF).
function getForumLabels(lang, t) {
  const tf = (key, fallback) => t?.forum?.[key] || fallback;

  const isAm = lang === "am";
  const isOm = lang === "om";

  return {
    title: tf(
      "title",
      isAm ? "የአቻ ፎረም ሪፖርት" : isOm ? "Gabaasa Fooraamii" : "Peer Forum Report",
    ),
    subtitle: tf(
      "subtitle",
      isAm
        ? "በአዲስ አበባ ከተማ አስተዳደር አዲስ መሶብ · አዲስ ከተማ ማዕከል"
        : isOm
          ? "Bulchiinsa Magaalaa Finfinnee · Addis MESOB · Addis Ketema"
          : "Addis Ababa City Admin · Addis MESOB · Addis Ketema Center",
    ),
    date: tf("date", isAm ? "ቀን" : isOm ? "Guyyaa" : "Date"),
    time: isAm ? "ሰዓት" : isOm ? "Yeroo" : "Time",
    team: isAm ? "ቡድን" : isOm ? "Garee" : "Team",
    explanation: tf(
      "explanation",
      isAm ? "ማብራሪያ" : isOm ? "Ibsa" : "Explanation",
    ),
    aiBlock: isAm ? "የ AI ማጠቃለያ" : isOm ? "Cuunfaa AI" : "AI Generated Summary",

    // ─── Section names (row label in the Section column) ────────
    secPresent: tf(
      "presentMembers",
      isAm ? "የተገኙ አባላት" : isOm ? "Miseensota Argaman" : "Present Members",
    ),
    secAbsent: tf(
      "absentMembers",
      isAm ? "ያልተገኙ አባላት" : isOm ? "Miseensota Hin Argamne" : "Absent Members",
    ),
    // Short form — "ያለፈው ስብሰባ ውጤቶች" wrapped inside the content
    // table's Section column at 8pt. "ቀዳሚ ውጤቶች" is the standard
    // short Amharic label and stays on one line.
    secPrevResults: tf(
      "prevResults",
      isAm ? "ቀዳሚ ውጤቶች" : isOm ? "Bu'aa Duraa" : "Previous Results",
    ),
    secTopics: tf(
      "todayTopics",
      isAm ? "የእለቱ ርዕሶች" : isOm ? "Mata-duree Marii" : "Discussion Topics",
    ),
    secGaps: tf(
      "gaps",
      isAm ? "የታዩ ክፍተቶች" : isOm ? "Hanqinaalee" : "Identified Gaps",
    ),
    secAgreements: tf(
      "agreements",
      isAm ? "የተስማሙባቸው ነጥቦች" : isOm ? "Qabxii Walii Galame" : "Agreed Points",
    ),
    secSignatures: tf(
      "signatures",
      isAm ? "ፊርማዎች" : isOm ? "Mallattoo" : "Signatures",
    ),

    // ─── Table 1 (content) column headers ──────────────────────
    t1Title: isAm
      ? "የስብሰባ ይዘት"
      : isOm
        ? "Qabiyyee Walgahii"
        : "Session Content",
    colNo: isAm ? "ተ.ቁ" : isOm ? "Lak." : "#",
    colSection: isAm ? "ክፍል" : isOm ? "Kutaa" : "Section",
    colItem: isAm ? "ዝርዝር" : isOm ? "Ibsa" : "Item",

    // ─── Table 2 (members) column headers ──────────────────────
    t2Title: isAm
      ? "የአባላት ሁኔታ እና ፊርማ"
      : isOm
        ? "Haala Miseensotaa fi Mallattoo"
        : "Members & Signatures",
    colName: isAm ? "ስም" : isOm ? "Maqaa" : "Name",
    colStatus: isAm ? "ሁኔታ" : isOm ? "Haala" : "Status",
    colReason: isAm ? "ምክንያት" : isOm ? "Sababa" : "Reason",
    colSignature: isAm ? "ፊርማ" : isOm ? "Mallattoo" : "Signature",
    statusPresent: isAm ? "✓ የተገኙ" : isOm ? "✓ Argame" : "✓ Present",
    statusAbsent: isAm ? "✗ ያልተገኙ" : isOm ? "✗ Hin argamne" : "✗ Absent",

    footer: isAm
      ? "በአዲስ መሶብ የአንድ ማዕከል አገልግሎት የተዘጋጀ"
      : isOm
        ? "A-MESOB Wiirtuu Tajaajila Iddoo Tokkoo"
        : "Generated by Addis MESOB One-Stop Service Center",
    page: isAm ? "ገጽ" : isOm ? "Fuula" : "Page",
    of: isAm ? "ከ" : isOm ? "keessaa" : "of",
  };
}

// ─── EXPORT RECOGNITION CERTIFICATE ────────────────────────
export const exportRecognitionCertificateToPDF = (
  employeeName,
  month,
  teamName,
  score,
  lang = "am",
) => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    loadFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const isAm = lang === "am";
    const isOm = lang === "om";

    const L = {
      title: isAm
        ? "የእውቅና ሰርተፍኬት"
        : isOm
          ? "Waraqaa Ragaa"
          : "Certificate of Recognition",
      presentedTo: isAm
        ? "ይህ ሰርተፍኬት ለ"
        : isOm
          ? "Waraqaan kun kennameef"
          : "This certificate is presented to",
      forMonth: isAm
        ? "ለሚከተለው ወር ጥሩ አፈጻጸም ስላሳዩ"
        : isOm
          ? "Ji'a kanaaf afeerraa gaarii waan qabaaniif"
          : "for outstanding performance during",
      withScore: isAm ? "በውጤት" : isOm ? "Qabxii" : "with a score of",
      team: isAm ? "ቡድን" : isOm ? "Garee" : "Team",
      date: isAm ? "ቀን" : isOm ? "Guyyaa" : "Date",
      signature: isAm ? "ፊርማ" : isOm ? "Mallattoo" : "Signature",
    };

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(1.5);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    doc.setLineWidth(0.5);
    doc.rect(
      margin + 3,
      margin + 3,
      pageWidth - margin * 2 - 6,
      pageHeight - margin * 2 - 6,
    );

    doc.setFontSize(28);
    doc.setTextColor(26, 107, 74);
    drawMixedScriptText(doc, L.title, pageWidth / 2, margin + 30, {
      align: "center",
      bold: true,
    });

    doc.setDrawColor(194, 90, 0);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, margin + 38, pageWidth / 2 + 40, margin + 38);

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    drawMixedScriptText(doc, L.presentedTo, pageWidth / 2, margin + 58, {
      align: "center",
    });

    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    drawMixedScriptText(doc, employeeName || "—", pageWidth / 2, margin + 78, {
      align: "center",
      bold: true,
    });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 60, margin + 82, pageWidth / 2 + 60, margin + 82);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const reasonLine = `${L.forMonth} ${month || "—"} ${L.withScore}: ${score ?? "—"}`;
    drawMixedScriptText(doc, reasonLine, pageWidth / 2, margin + 98, {
      align: "center",
    });

    if (teamName) {
      doc.setFontSize(12);
      doc.setTextColor(26, 107, 74);
      drawMixedScriptText(
        doc,
        `${L.team}: ${teamName}`,
        pageWidth / 2,
        margin + 112,
        { align: "center", bold: true },
      );
    }

    const lineY = pageHeight - margin - 35;
    const leftX = margin + 40;
    const rightX = pageWidth - margin - 40;

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.4);
    doc.line(leftX - 40, lineY, leftX + 40, lineY);
    doc.line(rightX - 40, lineY, rightX + 40, lineY);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    drawMixedScriptText(doc, L.date, leftX, lineY + 5, { align: "center" });
    drawMixedScriptText(doc, L.signature, rightX, lineY + 5, {
      align: "center",
    });

    const gregDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFontSize(8);
    drawMixedScriptText(doc, gregDate, leftX, lineY - 3, {
      align: "center",
    });

    const safeName = String(employeeName || "certificate").replace(
      /[^a-z0-9]/gi,
      "_",
    );
    doc.save(`certificate_${safeName}.pdf`);

    showSuccessToast("📄 Certificate PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Certificate PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};

// ─── EXPORT BI-WEEKLY AGGREGATE REPORT ─────────────────────
export const exportBiWeeklyAggregateReportToPDF = (
  weeklyData,
  startDate,
  endDate,
  teamName,
  lang = "am",
) => {
  try {
    if (!weeklyData || weeklyData.length === 0) {
      showErrorToast("No data to export.");
      return false;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    loadFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    const isAm = lang === "am";
    const isOm = lang === "om";

    const L = {
      title: isAm
        ? "የሁለት ሳምንት ሪፖርት"
        : isOm
          ? "Gabaasa Torban Lama"
          : "Bi-Weekly Report",
      subtitle: isAm
        ? "የአዲስ መሶብ የአንድ ማዕከል አገልግሎት"
        : isOm
          ? "A-MESOB Wiirtuu Tajaajila Iddoo Tokkoo"
          : "A-MESOB One-Stop Service Center",
      team: isAm ? "ቡድን" : isOm ? "Garee" : "Team",
      period: isAm ? "የሪፖርት ጊዜ" : isOm ? "Yeroo" : "Period",
      week: isAm ? "ሳምንት" : isOm ? "Torban" : "Week",
      total: isAm ? "ጠቅላላ" : isOm ? "Waliigala" : "Total",
      details: isAm ? "ዝርዝር" : isOm ? "Bal'ina" : "Details",
      footer: isAm
        ? "በአዲስ መሶብ የተዘጋጀ"
        : isOm
          ? "A-MESOB tiin qophaa'e"
          : "Generated by A-MESOB",
      page: isAm ? "ገጽ" : isOm ? "Fuula" : "Page",
      of: isAm ? "ከ" : isOm ? "keessaa" : "of",
    };

    doc.setFontSize(18);
    doc.setTextColor(26, 107, 74);
    drawMixedScriptText(doc, L.title, pageWidth / 2, yPos, {
      align: "center",
      bold: true,
    });
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    drawMixedScriptText(doc, L.subtitle, pageWidth / 2, yPos, {
      align: "center",
    });
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    if (teamName) {
      doc.setFontSize(11);
      drawMixedScriptText(doc, `${L.team}: ${teamName}`, pageWidth / 2, yPos, {
        align: "center",
        bold: true,
      });
      yPos += 7;
    }

    const periodText = `${L.period}: ${startDate || "—"} — ${endDate || "—"}`;
    doc.setFontSize(10);
    drawMixedScriptText(doc, periodText, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    const headers = [L.week, L.total, L.details];
    const rows = weeklyData.map((w, i) => [
      `${i + 1}`,
      String(w.total ?? 0),
      w.summary || w.details || "—",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: {
        fillColor: [26, 107, 74],
        textColor: [255, 255, 255],
        fontSize: 10,
        halign: "center",
      },
      bodyStyles: { fontSize: 9 },
      didParseCell: (cellData) => {
        const raw = String(cellData.cell.raw ?? "");
        cellData.cell.styles.font = isAmharic(raw)
          ? FONT_NAMES.ethiopic
          : FONT_NAMES.latin;
      },
    });

    yPos = doc.lastAutoTable?.finalY + 10 || yPos + 40;

    const pageCount = doc.internal.getNumberOfPages();
    const footerY = pageHeight - 10;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      drawMixedScriptText(doc, L.footer, pageWidth / 2, footerY, {
        align: "center",
      });
      drawMixedScriptText(
        doc,
        `${L.page} ${i} ${L.of} ${pageCount}`,
        pageWidth - margin,
        footerY,
        { align: "right" },
      );
      doc.setTextColor(0, 0, 0);
    }

    const safeStart = String(startDate || "start").replace(/\//g, "-");
    doc.save(`biweekly_report_${safeStart}.pdf`);

    showSuccessToast("📄 Bi-Weekly Report PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Bi-Weekly PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};

// ─── FORUM REPORT PDF CONSTANTS ─────────────────────────────
// The exact substring the ForumReport page prefixes AI-appended text
// with (see handleApplySuggestion in ForumReport.jsx). Keep in sync.
const AI_MARKER = "📝 AI Generated Summary:";

// Split explanation into (manual text, ai text). If the marker is not
// present, ai text is empty and manual is the whole thing.
const splitExplanationAi = (explanation) => {
  const raw = String(explanation || "");
  const idx = raw.indexOf(AI_MARKER);
  if (idx < 0) return { manual: raw.trim(), ai: "" };
  return {
    manual: raw.slice(0, idx).trim(),
    ai: raw.slice(idx + AI_MARKER.length).trim(),
  };
};

// ─── EXPORT FORUM REPORT (professional two-table layout) ────
//
// The forum report has two genuinely different kinds of content and
// forcing both into one table was the source of every earlier
// iteration's problems. This version splits them:
//
//   • Table 1 — "Session Content". One row per item across
//     explanation, AI block, prev results, topics, gaps, agreements.
//     The Section label appears ONCE per block; subsequent rows of
//     the same block carry an empty Section cell so the label is not
//     repeated. This is the "no redundant rows" behaviour requested.
//
//   • Table 2 — "Members & Signatures". One row per member. Present
//     and absent members live in the same table, distinguished by the
//     Status column. Signature images are placed sequentially into
//     the Signature cell of present members: signature #1 → first
//     present member, #2 → second, etc. Absent members always get a
//     blank Signature cell.
//
// Pagination is natural: Table 2 begins on page 1 if it fits under
// Table 1, otherwise it continues on page 2. Both tables carry the
// same head and body styling, so the split is visually seamless.
export const exportForumReportToPDF = (
  formData,
  t,
  lang = "am",
  teamName = "",
  options = {},
) => {
  try {
    console.log("📄 Generating Forum Report PDF (two-table layout)...");

    const hasData =
      formData?.present?.some((m) => m && m.trim() !== "") ||
      formData?.absent?.some((i) => i?.name && i.name.trim() !== "") ||
      formData?.topics?.some((tp) => tp && tp.trim() !== "") ||
      formData?.gaps?.some((g) => g && g.trim() !== "") ||
      formData?.agreements?.some((a) => a && a.trim() !== "");

    if (!hasData) {
      showErrorToast(
        "No data to export. Please fill in some information first.",
      );
      return false;
    }

    // ─── Language: Amharic default, override only via options.language ──
    const reportLang = ["am", "en", "om"].includes(options?.language)
      ? options.language
      : ["am", "en", "om"].includes(lang)
        ? lang
        : "am";

    const L = getForumLabels(reportLang, t);

    const includeAI = options?.includeAI !== false; // default true

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setProperties({
      title: options?.title || L.title,
      author: options?.author || teamName || "A-MESOB",
      subject: options?.subject || L.subtitle,
      keywords: options?.keywords || "forum, report, meeting",
    });

    loadFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // ─── Header ─────────────────────────────────────────────────
    doc.setFontSize(16);
    doc.setTextColor(26, 107, 74);
    drawMixedScriptText(doc, L.title, pageWidth / 2, yPos, {
      align: "center",
      bold: true,
    });
    doc.setTextColor(0, 0, 0);
    yPos += 7;

    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    drawMixedScriptText(doc, L.subtitle, pageWidth / 2, yPos, {
      align: "center",
    });
    doc.setTextColor(0, 0, 0);
    yPos += 5;

    if (teamName) {
      doc.setFontSize(10);
      drawMixedScriptText(doc, `— ${teamName}`, pageWidth / 2, yPos, {
        align: "center",
        bold: true,
      });
      yPos += 5;
    }

    const dateText = formData?.date || new Date().toISOString().split("T")[0];
    const timeText =
      formData?.timeStart || formData?.timeEnd
        ? `${formData.timeStart || "—"} - ${formData.timeEnd || "—"}`
        : "—";
    doc.setFontSize(9);
    const metaLine = `${L.date}: ${dateText}    |    ${L.time}: ${timeText}`;
    drawMixedScriptText(doc, metaLine, margin, yPos);
    yPos += 5;

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // ─── Shared table styling ──────────────────────────────────
    // Every table in this document uses the same head/body sizing so
    // the two tables read as one continuous report.
    const sharedHeadStyles = {
      fillColor: [26, 107, 74],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
      minCellHeight: 5.5,
      // Default: allow wrapping. Cells flagged as NO_WRAP override this
      // in didParseCell below.
      overflow: "linebreak",
    };
    const sharedBodyStyles = {
      fontSize: 8,
      valign: "middle",
      cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 },
      minCellHeight: 5,
      lineColor: [210, 210, 210],
      lineWidth: 0.1,
    };
    const sharedStyles = {
      overflow: "linebreak",
      lineWidth: 0.1,
      lineColor: [210, 210, 210],
    };
    const sharedDidParseCell = (data) => {
      // Signature cells render an image, not text — leave font alone.
      const raw = data.cell.raw;
      if (raw && typeof raw === "object" && raw.__signatureImage) {
        data.cell.text = [""];
        return;
      }

      // Short header labels (ተ.ቁ, ክፍል …) must never wrap. Their cells
      // are objects with __noWrap:true; unpack the label, force
      // single-line overflow and let the font fall through normally.
      if (isNoWrap(raw)) {
        const label = raw.label;
        data.cell.text = [String(label)];
        data.cell.styles.overflow = "visible";
        data.cell.styles.font = isAmharic(String(label))
          ? doc.__hasEthiopicFont
            ? FONT_NAMES.ethiopic
            : "helvetica"
          : doc.__hasLatinFont
            ? FONT_NAMES.latin
            : "helvetica";
        return;
      }

      const cellText = String(raw ?? "");
      if (isAmharic(cellText)) {
        data.cell.styles.font = doc.__hasEthiopicFont
          ? FONT_NAMES.ethiopic
          : "helvetica";
      } else {
        data.cell.styles.font = doc.__hasLatinFont
          ? FONT_NAMES.latin
          : "helvetica";
      }
    };

    // ─── TABLE 1 — Session Content ──────────────────────────────
    // Rows are built as a flat list. The section label appears on the
    // first row of each block and is left blank for the remaining rows
    // of the same block so nothing repeats.
    const contentRows = [];

    const pushSectionBlock = (sectionLabel, entries) => {
      const items = (entries || []).map((e) => encodeText(e)).filter(Boolean);
      if (items.length === 0) return;
      items.forEach((item, idx) => {
        contentRows.push([
          "", // row number filled in below
          idx === 0 ? encodeText(sectionLabel) : "",
          item,
        ]);
      });
    };

    // Explanation block. Split into manual + AI (AI included only if
    // the caller wants it). Each is its own labeled block.
    const { manual: manualExplanation, ai: aiExplanation } = splitExplanationAi(
      formData?.explanation,
    );

    if (manualExplanation) {
      pushSectionBlock(L.explanation, [manualExplanation]);
    }
    if (includeAI && aiExplanation) {
      pushSectionBlock(L.aiBlock, [aiExplanation]);
    }

    pushSectionBlock(
      L.secPrevResults,
      (formData?.prevResults || []).filter((r) => r && r.trim()),
    );

    pushSectionBlock(
      L.secTopics,
      (formData?.topics || []).filter((tp) => tp && tp.trim()),
    );

    pushSectionBlock(
      L.secGaps,
      (formData?.gaps || []).filter((g) => g && g.trim()),
    );

    pushSectionBlock(
      L.secAgreements,
      (formData?.agreements || []).filter((a) => a && a.trim()),
    );

    // Number the content rows.
    contentRows.forEach((row, i) => {
      row[0] = String(i + 1);
    });

    // ─── TABLE 2 — Members & Signatures ─────────────────────────
    // Present members first (they carry signatures), then absent
    // members. Each member appears exactly once.
    const memberRows = [];

    const presentMembers = (formData?.present || []).filter(
      (m) => m && m.trim(),
    );
    const absentMembers = (formData?.absent || []).filter(
      (i) => i?.name && i.name.trim(),
    );

    const signatureEntries = Array.isArray(formData?.signatures)
      ? formData.signatures
      : [];

    // Signature #i goes into present member #i. If there are fewer
    // signatures than present members, later present members get a
    // blank cell. If there are more, extras are dropped — the report
    // has no place to put a signature that isn't attached to a
    // present member.
    let sigIdx = 0;
    presentMembers.forEach((name) => {
      const sig = signatureEntries[sigIdx];
      const hasSig = sig && String(sig).startsWith("data:image");
      memberRows.push([
        "", // row number filled in below
        encodeText(name),
        encodeText(L.statusPresent),
        "",
        hasSig ? { __signatureImage: sig, __index: sigIdx + 1 } : "",
      ]);
      if (hasSig) sigIdx += 1;
    });

    absentMembers.forEach((entry) => {
      memberRows.push([
        "",
        encodeText(entry.name),
        encodeText(L.statusAbsent),
        encodeText(entry.reason || ""),
        "",
      ]);
    });

    // Number the member rows.
    memberRows.forEach((row, i) => {
      row[0] = String(i + 1);
    });

    // ─── Render Table 1 ─────────────────────────────────────────
    if (contentRows.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(26, 107, 74);
      drawMixedScriptText(doc, L.t1Title, margin, yPos, { bold: true });
      doc.setTextColor(0, 0, 0);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        // Head cells are noWrap-wrapped so short labels stay on one line.
        head: [[noWrap(L.colNo), noWrap(L.colSection), noWrap(L.colItem)]],
        body: contentRows,
        margin: { left: margin, right: margin, bottom: 16 },
        theme: "grid",
        headStyles: sharedHeadStyles,
        bodyStyles: sharedBodyStyles,
        styles: sharedStyles,
        columnStyles: {
          0: { cellWidth: 12, halign: "center" }, // was 9 — too narrow for ተ.ቁ
          1: { cellWidth: 42, halign: "left" },
          2: { cellWidth: "auto", halign: "left" },
        },
        didParseCell: sharedDidParseCell,
      });

      yPos = (doc.lastAutoTable?.finalY || yPos) + 8;
    }

    // ─── Render Table 2 ─────────────────────────────────────────
    // If the members table doesn't have at least ~40mm of room left
    // on the current page, start it on a fresh page. This keeps the
    // header + first several rows together rather than stranding the
    // header at the bottom of page 1.
    if (memberRows.length > 0) {
      const MIN_TABLE_HEIGHT = 40;
      if (yPos > pageHeight - MIN_TABLE_HEIGHT - 16) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(10);
      doc.setTextColor(26, 107, 74);
      drawMixedScriptText(doc, L.t2Title, margin, yPos, { bold: true });
      doc.setTextColor(0, 0, 0);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            noWrap(L.colNo),
            noWrap(L.colName),
            noWrap(L.colStatus),
            noWrap(L.colReason),
            noWrap(L.colSignature),
          ],
        ],
        body: memberRows,
        margin: { left: margin, right: margin, bottom: 16 },
        theme: "grid",
        headStyles: sharedHeadStyles,
        bodyStyles: sharedBodyStyles,
        styles: sharedStyles,
        columnStyles: {
          0: { cellWidth: 12, halign: "center" }, // was 9 — too narrow for ተ.ቁ
          1: { cellWidth: "auto", halign: "left" },
          2: { cellWidth: 32, halign: "center" },
          3: { cellWidth: 40, halign: "left" },
          4: { cellWidth: 32, halign: "center", minCellHeight: 10 },
        },
        didParseCell: sharedDidParseCell,
        didDrawCell: (data) => {
          if (data.column.index !== 4) return;
          const raw = data.row.raw?.[4];
          if (!raw || typeof raw !== "object" || !raw.__signatureImage) return;

          try {
            const cell = data.cell;
            const pad = 1;
            const boxW = cell.width - pad * 2;
            const boxH = cell.height - pad * 2;
            if (boxW <= 0 || boxH <= 0) return;

            // Read natural dimensions to preserve aspect ratio. Falls
            // back to a 4:1 signature-pad ratio if the reader is
            // unavailable.
            let naturalW = 400;
            let naturalH = 100;
            try {
              const props = doc.getImageProperties?.(raw.__signatureImage);
              if (props?.width && props?.height) {
                naturalW = props.width;
                naturalH = props.height;
              }
            } catch {
              // keep fallback
            }

            const scale = Math.min(boxW / naturalW, boxH / naturalH);
            const drawW = naturalW * scale;
            const drawH = naturalH * scale;

            const drawX = cell.x + (cell.width - drawW) / 2;
            const drawY = cell.y + (cell.height - drawH) / 2;

            doc.addImage(
              raw.__signatureImage,
              "PNG",
              drawX,
              drawY,
              drawW,
              drawH,
            );
          } catch (imgErr) {
            console.warn(
              `Could not embed signature #${raw.__index}:`,
              imgErr.message,
            );
          }
        },
      });
    }

    // ─── Footer with page numbers ──────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = pageHeight - 10;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      drawMixedScriptText(doc, L.footer, pageWidth / 2, footerY, {
        align: "center",
      });
      drawMixedScriptText(
        doc,
        `${L.page} ${i} ${L.of} ${pageCount}`,
        pageWidth - margin,
        footerY,
        { align: "right" },
      );
      doc.setTextColor(0, 0, 0);
    }

    const safeDate = String(dateText).replace(/\//g, "-");
    doc.save(`forum_report_${safeDate}.pdf`);

    console.log("✅ Forum Report PDF generated successfully!");
    showSuccessToast("📄 Forum Report PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Forum Report PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};

// ─── EXPORT DAILY REPORT ─────────────────────────────────────
// Delegates to the canonical, mixed-script safe implementation in
// ./pdf/reports/dailyReport.js. This shim exists so older call sites
// (which import `exportDailyReportToPDF` from this file) keep working.
// The dailyReport generator is Amharic-first, uses drawMixedScriptText
// everywhere, and supports all three languages via options.language.
export const exportDailyReportToPDF = async (rows, date, t, options = {}) => {
  try {
    console.log("📄 Generating Daily Report PDF (delegating)...");

    if (!rows || rows.length === 0) {
      showErrorToast("No data to export. Please add some data first.");
      return false;
    }

    // Pass `t` through as-is; dailyReport.js reads labels from its own
    // internal LABELS table (already Amharic-first) and uses `options.language`
    // to pick the language. We forward whatever the caller gave us.
    await generateDailyReportPDF(rows, date, t, options);

    showSuccessToast("📄 Daily Report PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Daily Report PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};

// ─── EXPORT EVALUATION REPORT ───────────────────────────────
export const exportEvaluationReportToPDF = (
  scores,
  members,
  totalScores,
  bestPerformer,
  t,
  comments = {},
  signatures = {},
  includeAINarrative = false,
  aiNarrative = "",
  preparedBy = "",
  branchName = "",
) => {
  try {
    console.log("📄 Generating Evaluation Report PDF...");

    if (!members || members.length === 0) {
      showErrorToast("No members to evaluate. Please add some members first.");
      return false;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    loadFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    const amharicTitle = "የሥራ አፈጻጸም ሪፖርት";
    doc.setFontSize(22);
    drawMixedScriptText(doc, amharicTitle, pageWidth / 2, yPos, {
      align: "center",
      bold: true,
    });
    yPos += 10;

    const amharicSubtitle = "የአዲስ አበባ ከተማ አስተዳደር · የህዝብ አገልግሎት ቢሮ";
    doc.setFontSize(11);
    drawMixedScriptText(doc, amharicSubtitle, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 7;

    const englishSubtitle =
      "Addis Ababa City Administration · Public Service Bureau";
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    drawMixedScriptText(doc, englishSubtitle, pageWidth / 2, yPos, {
      align: "center",
    });
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    const now = new Date();
    const ethiopianDate = getEthiopianDate(now);
    const gregorianDate = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const preparedByName = preparedBy || t?.evaluation?.preparedBy || "አስተዳዳሪ";
    const branch = branchName || t?.evaluation?.branchName || "አዲስ ከተማ ቅርንጫፍ";

    const amharicInfoLine = `የሪፖርት ቀን: ${ethiopianDate} | ሪፖርት ያዘጋጀው: ${preparedByName} | ቅርንጫፍ: ${branch}`;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    drawMixedScriptText(doc, amharicInfoLine, margin, yPos, { bold: true });
    yPos += 6;

    const englishInfoLine = `Report Date: ${gregorianDate} (GC) | Prepared By: ${preparedByName} | Branch: ${branch}`;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    drawMixedScriptText(doc, englishInfoLine, margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    doc.setFillColor(26, 107, 74);
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    drawMixedScriptText(doc, "የቡድን አፈጻጸም ማጠቃለያ", margin + 2, yPos, {
      bold: true,
    });
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const memberTotals = members.map((m) => ({
      name: m,
      total: totalScores(m),
    }));
    const sortedMembers = [...memberTotals].sort((a, b) => b.total - a.total);

    const tableHeaders = ["#", "የአባል ስም", "ውጤት", "ደረጃ", "ፊርማ", "ሁኔታ", "አስተያየት"];
    const tableBody = sortedMembers.map((m, idx) => {
      const rank =
        idx === 0
          ? "🥇 1ኛ"
          : idx === 1
            ? "🥈 2ኛ"
            : idx === 2
              ? "🥉 3ኛ"
              : `#${idx + 1}`;
      const signatureData = signatures?.[m.name] || null;
      const hasSignature =
        signatureData && signatureData.startsWith("data:image");
      const comment = comments?.[m.name] || "";
      let statusText = hasSignature
        ? "✅ ተፈርሟል"
        : comment
          ? "📝 አስተያየት"
          : "⏳ በመጠበቅ ላይ";
      return [
        idx + 1,
        encodeText(m.name),
        m.total,
        rank,
        hasSignature
          ? { content: "signature", signature: signatureData }
          : "✗ አልተፈረመም",
        statusText,
        encodeText(comment),
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [tableHeaders],
      body: tableBody,
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: {
        fillColor: [26, 107, 74],
        textColor: [255, 255, 255],
        fontSize: 9,
        font: FONT_NAMES.ethiopic,
        halign: "center",
      },
      bodyStyles: { fontSize: 8, halign: "center" },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto", halign: "left" },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 30, halign: "center", minCellHeight: 14 },
        5: { cellWidth: 22, halign: "center" },
        6: { cellWidth: "auto", halign: "left", fontSize: 7 },
      },
      rowHeight: 16,
      styles: { font: FONT_NAMES.ethiopic, overflow: "linebreak" },
      didParseCell: (cellData) => {
        const raw =
          typeof cellData.cell.raw === "string" ? cellData.cell.raw : "";
        cellData.cell.styles.font = isAmharic(raw)
          ? FONT_NAMES.ethiopic
          : FONT_NAMES.latin;
        if (cellData.column.index === 4) {
          const rowData = cellData.row.raw;
          if (rowData && Array.isArray(rowData)) {
            const cell = rowData[4];
            if (
              typeof cell === "object" &&
              cell &&
              cell.content === "signature"
            ) {
              cellData.cell.styles.cellWidth = 30;
              cellData.cell.styles.minCellHeight = 14;
              cellData.cell.styles.halign = "center";
              cellData.cell.text = [""];
            } else {
              cellData.cell.styles.halign = "center";
            }
          }
        }
      },
      didDrawCell: (tableData) => {
        if (tableData.column.index === 4) {
          const rowData = tableData.row.raw;
          if (rowData && Array.isArray(rowData)) {
            const cellData = rowData[4];
            if (
              typeof cellData === "object" &&
              cellData &&
              cellData.signature
            ) {
              try {
                const cellWidth = tableData.cell.width;
                const cellHeight = tableData.cell.height;
                const imgWidth = Math.min(cellWidth - 8, 25);
                const imgHeight = Math.min(cellHeight - 8, 12);
                const offsetX = (cellWidth - imgWidth) / 2;
                const offsetY = (cellHeight - imgHeight) / 2;
                doc.addImage(
                  cellData.signature,
                  "PNG",
                  tableData.cell.x + offsetX,
                  tableData.cell.y + offsetY,
                  imgWidth,
                  imgHeight,
                );
              } catch (imgError) {
                console.warn("Could not add signature image:", imgError);
                doc.setFontSize(8);
                doc.setTextColor(26, 107, 74);
                doc.setFont(FONT_NAMES.latin, "bold");
                doc.text(
                  "✓",
                  tableData.cell.x + tableData.cell.width / 2,
                  tableData.cell.y + 8,
                  { align: "center" },
                );
              }
            }
          }
        }
      },
    });

    yPos = doc.lastAutoTable?.finalY + 12 || yPos + 20;

    const FOOTER_RESERVED = 24;

    if (bestPerformer) {
      const avgScore =
        sortedMembers.length > 0
          ? Math.round(
              sortedMembers.reduce((sum, m) => sum + m.total, 0) /
                sortedMembers.length,
            )
          : 0;

      const cardH = 26;
      if (yPos + cardH > pageHeight - FOOTER_RESERVED) {
        doc.addPage();
        yPos = margin;
      }

      const cardX = margin;
      const cardY = yPos;
      const cardW = pageWidth - margin * 2;

      doc.setFillColor(240, 247, 244);
      doc.setDrawColor(26, 107, 74);
      doc.setLineWidth(0.4);
      doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, "FD");

      const textX = cardX + 8;
      doc.setFontSize(13);
      doc.setTextColor(26, 107, 74);
      drawMixedScriptText(
        doc,
        `🏆 ምርጥ አፈጻጸም: ${encodeText(bestPerformer)}`,
        textX,
        cardY + 11,
        { bold: true },
      );
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      drawMixedScriptText(
        doc,
        `Best Performer: ${encodeText(bestPerformer)}`,
        textX,
        cardY + 19,
      );

      const badgeX = cardX + cardW - 8;
      doc.setFontSize(12);
      doc.setTextColor(26, 107, 74);
      drawMixedScriptText(
        doc,
        `📊 አማካይ ውጤት: ${avgScore} / 100`,
        badgeX,
        cardY + 11,
        { align: "right", bold: true },
      );
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      drawMixedScriptText(
        doc,
        `Average Score: ${avgScore} / 100`,
        badgeX,
        cardY + 19,
        { align: "right" },
      );

      doc.setTextColor(0, 0, 0);
      yPos = cardY + cardH + 10;
    }

    if (includeAINarrative && aiNarrative) {
      let cleanNarrative = aiNarrative
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/O- U/g, "")
        .replace(/O-U/g, "")
        .replace(/\/\d+\/points\//g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      cleanNarrative = encodeText(cleanNarrative);

      doc.setFont(FONT_NAMES.ethiopic, "normal");
      doc.setFontSize(10);
      const maxWidth = pageWidth - margin * 2 - 5;
      const lines = doc.splitTextToSize(cleanNarrative, maxWidth);

      if (lines.length === 0) return;

      if (yPos + 20 > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      drawMixedScriptText(doc, "የአፈጻጸም ትንተና ማጠቃለያ", margin, yPos, {
        bold: true,
      });
      yPos += 7;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      drawMixedScriptText(doc, "Performance Analysis Summary", margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      let linesPerPage = Math.floor((pageHeight - yPos - 30) / 5);
      let lineIndex = 0;

      while (lineIndex < lines.length) {
        const remainingLines = lines.length - lineIndex;
        const chunkSize = Math.min(remainingLines, linesPerPage);
        const chunk = lines.slice(lineIndex, lineIndex + chunkSize);

        const chunkHeight = chunk.length * 5 + 10;
        if (yPos + chunkHeight > pageHeight - 30 && lineIndex > 0) {
          doc.addPage();
          yPos = margin;
          doc.setFontSize(12);
          drawMixedScriptText(doc, "የአፈጻጸም ትንተና ማጠቃለያ (ቀጣይ)", margin, yPos, {
            bold: true,
          });
          yPos += 8;
          linesPerPage = Math.floor((pageHeight - yPos - 30) / 5);
        }

        chunk.forEach((line, idx) => {
          drawMixedScriptText(doc, line, margin, yPos + idx * 5, {
            align: "left",
          });
        });
        yPos += chunkHeight + 6;
        lineIndex += chunkSize;
      }
    }

    const pageCount = doc.internal.getNumberOfPages();
    const footerY = pageHeight - 14;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      const amharicFooter = `የአዲስ አበባ ከተማ አስተዳደር · የህዝብ አገልግሎት ቢሮ | ${ethiopianDate} | ገጽ ${i}/${pageCount}`;
      drawMixedScriptText(doc, amharicFooter, pageWidth / 2, footerY, {
        align: "center",
      });

      const englishFooter = `Addis Ababa City Administration · Public Service Bureau | ${gregorianDate} | Page ${i}/${pageCount}`;
      drawMixedScriptText(doc, englishFooter, pageWidth / 2, footerY + 5, {
        align: "center",
      });
    }

    doc.save(`evaluation_report_${ethiopianDate.replace(/\//g, "-")}.pdf`);
    console.log("✅ Evaluation Report PDF generated successfully!");
    showSuccessToast("📄 Evaluation Report PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Evaluation Report PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};
