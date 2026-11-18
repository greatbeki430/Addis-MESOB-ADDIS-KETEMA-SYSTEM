// frontend/src/utils/pdfExport.js
// ─────────────────────────────────────────────────────────────────────────────
// Canonical PDF export entry points.
//   • exportForumReportToPDF              — mixed-script safe, Amharic-first
//   • exportDailyReportToPDF              — delegates to ./pdf/reports/dailyReport.js
//   • exportEvaluationReportToPDF         — mixed-script safe, Amharic-first
//   • exportRecognitionCertificateToPDF   — mixed-script safe, Amharic-first
//   • exportBiWeeklyAggregateReportToPDF  — mixed-script safe, Amharic-first
// ─────────────────────────────────────────────────────────────────────────────

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { showErrorToast, showSuccessToast } from "./toastHelper";
import { loadFonts, FONT_NAMES } from "./pdf/fontLoader";
import { isAmharic } from "./pdf/language";
import { drawMixedScriptText } from "./pdf/pdfHelpers";
import { generateDailyReportPDF } from "./pdf/reports/dailyReport";
import { formatEthiopianDate } from "./ethiopianDate"; // ✅ Imported for E.C. date

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

const encodeText = (text) => {
  if (!text) return "";
  return String(text);
};

// ── RESTORE 3: formatTime helper (from original; used by forum header) ──
const formatTime = (timeStr) => {
  if (!timeStr) return "___";
  return timeStr;
};
// ── end RESTORE 3

// ─── MIXED-SCRIPT / HEADER-CELL INFRASTRUCTURE ──────────────
const HEADER_FONT_SIZE = 8.5;

function pickFontFor(doc, raw) {
  const text = String(
    raw && typeof raw === "object" ? (raw.content ?? "") : (raw ?? ""),
  );
  const amharic = isAmharic(text);
  if (amharic) {
    return doc.__hasEthiopicFont ? FONT_NAMES.ethiopic : "helvetica";
  }
  return doc.__hasLatinFont ? FONT_NAMES.latin : "helvetica";
}

function measureHeaderWidth(doc, label, fontName) {
  const text = String(label ?? "");
  try {
    doc.setFont(fontName, "bold");
    doc.setFontSize(HEADER_FONT_SIZE);
    const w = doc.getTextWidth(text);
    if (Number.isFinite(w) && w > 0) return w;
  } catch {
    // fall through to estimate
  }
  const isAm = isAmharic(text);
  const perGlyph = isAm ? 4.2 : 2.2;
  return text.length * perGlyph;
}

function computeNoWrapColumnWidth(doc, label, fontName, minMm = 12) {
  const textMm = measureHeaderWidth(doc, label, fontName);
  const paddingMm = 3;
  return Math.max(minMm, Math.ceil(textMm + paddingMm));
}

function applySharedHeaderFont(doc, data) {
  if (!data?.cell || !data.cell.styles) return;

  const raw = data.cell.raw;

  if (raw && typeof raw === "object" && raw.__signatureImage) {
    data.cell.text = [""];
    return;
  }
  if (raw && typeof raw === "object" && raw.__signatureBlank) {
    data.cell.text = [""];
    return;
  }

  const font = pickFontFor(doc, raw);
  data.cell.styles.font = font;
  data.cell.styles.cellPadding = {
    top: 1.6,
    bottom: 1.6,
    left: 1,
    right: 1,
  };
}

// ─── FORUM REPORT LABELS (HARDCODED AMHARIC) ─────────────────
const AM_LABELS = {
  title: "የአቻ ፎረም ሪፖርት",
  subtitle: "በአዲስ አበባ ከተማ አስተዳደር አዲስ መሶብ · አዲስ ከተማ ማዕከል",
  date: "ቀን",
  time: "ሰዓት",
  team: "ቡድን",
  explanation: "ማብራሪያ",
  aiBlock: "የ AI ማጠቃለያ",
  secPresent: "የተገኙ አባላት",
  secAbsent: "ያልተገኙ አባላት",
  secPrevResults: "ቀዳሚ ውጤቶች",
  secTopics: "የእለቱ ርዕሶች",
  secGaps: "የታዩ ክፍተቶች",
  secAgreements: "የተስማሙባቸው ነጥቦች",
  secSignatures: "ፊርማዎች",
  t1Title: "የስብሰባ ይዘት",
  colNo: "ተ.ቁ",
  colSection: "ክፍል",
  colItem: "ዝርዝር",
  t2Title: "የአባላት ሁኔታ እና ፊርማ",
  colName: "ስም",
  colStatus: "ሁኔታ",
  colReason: "ምክንያት",
  colSignature: "ፊርማ",
  statusPresent: "✓ የተገኙ",
  statusAbsent: "✗ ያልተገኙ",
  footer: "በአዲስ መሶብ የአንድ ማዕከል አገልግሎት የተዘጋጀ",
  page: "ገጽ",
  of: "ከ",
};

function getForumLabels(lang, t) {
  if (lang === "en" || lang === "om") {
    const tf = (key, fallback) => t?.forum?.[key] || fallback;
    const isOm = lang === "om";
    return {
      title: tf("title", isOm ? "Gabaasa Fooraamii" : "Peer Forum Report"),
      subtitle: tf(
        "subtitle",
        isOm
          ? "Bulchiinsa Magaalaa Finfinnee · Addis MESOB"
          : "Addis Ababa City Admin",
      ),
      date: tf("date", isOm ? "Guyyaa" : "Date"),
      time: isOm ? "Yeroo" : "Time",
      team: isOm ? "Garee" : "Team",
      explanation: tf("explanation", isOm ? "Ibsa" : "Explanation"),
      aiBlock: isOm ? "Cuunfaa AI" : "AI Summary",
      secPresent: tf(
        "presentMembers",
        isOm ? "Miseensota Argaman" : "Present Members",
      ),
      secAbsent: tf(
        "absentMembers",
        isOm ? "Miseensota Hin Argamne" : "Absent Members",
      ),
      secPrevResults: tf(
        "prevResults",
        isOm ? "Bu'aa Duraa" : "Previous Results",
      ),
      secTopics: tf(
        "todayTopics",
        isOm ? "Mata-duree Marii" : "Discussion Topics",
      ),
      secGaps: tf("gaps", isOm ? "Hanqinaalee" : "Identified Gaps"),
      secAgreements: tf(
        "agreements",
        isOm ? "Qabxii Walii Galame" : "Agreed Points",
      ),
      secSignatures: tf("signatures", isOm ? "Mallattoo" : "Signatures"),
      t1Title: isOm ? "Qabiyyee Walgahii" : "Session Content",
      colNo: isOm ? "Lak." : "#",
      colSection: isOm ? "Kutaa" : "Section",
      colItem: isOm ? "Ibsa" : "Item",
      t2Title: isOm ? "Haala Miseensotaa" : "Members & Signatures",
      colName: isOm ? "Maqaa" : "Name",
      colStatus: isOm ? "Haala" : "Status",
      colReason: isOm ? "Sababa" : "Reason",
      colSignature: isOm ? "Mallattoo" : "Signature",
      statusPresent: isOm ? "✓ Argame" : "✓ Present",
      statusAbsent: isOm ? "✗ Hin argamne" : "✗ Absent",
      footer: isOm ? "A-MESOB Wiirtuu Tajaajila" : "Generated by Addis MESOB",
      page: isOm ? "Fuula" : "Page",
      of: isOm ? "keessaa" : "of",
    };
  }
  return AM_LABELS;
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
    drawMixedScriptText(doc, gregDate, leftX, lineY - 3, { align: "center" });

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
        if (!cellData?.cell || !cellData.cell.styles) return;
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
const AI_MARKER = "📝 AI Generated Summary:";
const splitExplanationAi = (explanation) => {
  const raw = String(explanation || "");
  const idx = raw.indexOf(AI_MARKER);
  if (idx < 0) return { manual: raw.trim(), ai: "" };
  return {
    manual: raw.slice(0, idx).trim(),
    ai: raw.slice(idx + AI_MARKER.length).trim(),
  };
};

const FORUM_TABLE_COLS = 6;
const FORUM_SIGNATURE_COL = 5;

function buildForumRows(L, formData, includeAI) {
  const rows = [];
  let sectionNumber = 1;

  const pushContentBlock = (sectionLabel, entries) => {
    const items = (entries || []).map((e) => encodeText(e)).filter(Boolean);
    if (items.length === 0) return;
    const rowCount = items.length;

    items.forEach((item, idx) => {
      rows.push([
        idx === 0 ? String(sectionNumber) : "",
        idx === 0
          ? { content: encodeText(sectionLabel), rowSpan: rowCount }
          : "",
        {
          content: item,
          colSpan: FORUM_TABLE_COLS - 2,
          styles: { halign: "left" },
        },
      ]);
    });
    sectionNumber++;
  };

  const { manual: manualExplanation, ai: aiExplanation } = splitExplanationAi(
    formData?.explanation,
  );
  if (manualExplanation) pushContentBlock(L.explanation, [manualExplanation]);
  if (includeAI && aiExplanation) pushContentBlock(L.aiBlock, [aiExplanation]);
  pushContentBlock(
    L.secPrevResults,
    (formData?.prevResults || []).filter((r) => r && r.trim()),
  );
  pushContentBlock(
    L.secTopics,
    (formData?.topics || []).filter((tp) => tp && tp.trim()),
  );
  pushContentBlock(
    L.secGaps,
    (formData?.gaps || []).filter((g) => g && g.trim()),
  );
  pushContentBlock(
    L.secAgreements,
    (formData?.agreements || []).filter((a) => a && a.trim()),
  );

  const presentMembers = (formData?.present || []).filter((m) => m && m.trim());
  const absentMembers = (formData?.absent || []).filter(
    (i) => i?.name && i.name.trim(),
  );
  const signatureEntries = Array.isArray(formData?.signatures)
    ? formData.signatures
    : [];

  if (presentMembers.length > 0) {
    const rowCount = presentMembers.length;
    let sigIdx = 0;
    presentMembers.forEach((name, idx) => {
      const sig = signatureEntries[sigIdx];
      const hasSig = sig && String(sig).startsWith("data:image");
      rows.push([
        idx === 0 ? String(sectionNumber) : "",
        idx === 0
          ? { content: encodeText(L.secPresent), rowSpan: rowCount }
          : "",
        encodeText(name),
        encodeText(L.statusPresent),
        "",
        hasSig
          ? { __signatureImage: sig, __index: sigIdx + 1 }
          : { __signatureBlank: true, __name: name },
      ]);
      if (hasSig) sigIdx += 1;
    });
    sectionNumber++;
  }

  if (absentMembers.length > 0) {
    const rowCount = absentMembers.length;
    absentMembers.forEach((entry, idx) => {
      rows.push([
        idx === 0 ? String(sectionNumber) : "",
        idx === 0
          ? { content: encodeText(L.secAbsent), rowSpan: rowCount }
          : "",
        encodeText(entry.name),
        encodeText(L.statusAbsent),
        encodeText(entry.reason || ""),
        "",
      ]);
    });
    sectionNumber++;
  }
  return rows;
}

// ─── EXPORT FORUM REPORT ─────────────────
export const exportForumReportToPDF = (
  formData,
  t,
  lang = "am",
  teamName = "",
  options = {},
) => {
  try {
    console.log("📄 Generating Forum Report PDF (single merged table)...");

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

    const reportLang = ["am", "en", "om"].includes(options?.language)
      ? options.language
      : "am";
    const L = getForumLabels(reportLang, t);
    const includeAI = options?.includeAI !== false;

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

    // ✅ Ethiopian Calendar Conversion
    const dateText = formData?.date || new Date().toISOString().split("T")[0];
    const ethDateText = formatEthiopianDate(dateText, "am");
    const timeText =
      formData?.timeStart || formData?.timeEnd
        ? `${formatTime(formData.timeStart)} - ${formatTime(formData.timeEnd)}`
        : "___ - ___";

    doc.setFontSize(9);
    const metaLine = `${L.date}: ${ethDateText} (${dateText})    |    ${L.time}: ${timeText}`;
    drawMixedScriptText(doc, metaLine, margin, yPos);
    yPos += 5;

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // ─── Table styling ─────────────────────────────────────────
    const sharedHeadStyles = {
      fillColor: [26, 107, 74],
      textColor: [255, 255, 255],
      fontSize: HEADER_FONT_SIZE,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
      minCellHeight: 5.5,
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
      if (!data?.cell || !data.cell.styles) return;
      data.cell.styles.valign = "middle"; // ✅ Fixes text alignment in rowSpanned cells
      const raw = data.cell.raw;
      if (
        raw &&
        typeof raw === "object" &&
        (raw.__signatureImage || raw.__signatureBlank)
      ) {
        data.cell.text = [""];
        return;
      }
      applySharedHeaderFont(doc, data);
    };

    const tableRows = buildForumRows(L, formData, includeAI);
    const noFont = isAmharic(String(L.colNo))
      ? FONT_NAMES.ethiopic
      : FONT_NAMES.latin;
    const noColWidth = computeNoWrapColumnWidth(doc, L.colNo, noFont, 12);
    const detailHeader = `${L.colItem} / ${L.colName}`;

    // ─── Render the ONE table ──────────────────────────────────
    autoTable(doc, {
      startY: yPos,
      head: [
        [
          L.colNo,
          L.colSection,
          detailHeader,
          L.colStatus,
          L.colReason,
          L.colSignature,
        ],
      ],
      body: tableRows,
      margin: { left: margin, right: margin, bottom: 16 },
      theme: "plain", // ✅ Custom borders to handle rowSpan perfectly
      headStyles: sharedHeadStyles,
      bodyStyles: sharedBodyStyles,
      styles: sharedStyles,
      columnStyles: {
        0: { cellWidth: noColWidth, halign: "center" },
        1: { cellWidth: 34, halign: "left" },
        2: { cellWidth: "auto", halign: "left" },
        3: { cellWidth: 26, halign: "center" },
        4: { cellWidth: 32, halign: "left" },
        5: { cellWidth: 30, halign: "center", minCellHeight: 10 },
      },
      didParseCell: sharedDidParseCell,
      didDrawCell: (data) => {
        // ✅ 1. DRAW CUSTOM BORDERS
        if (data.section === "body" || data.section === "head") {
          doc.setDrawColor(210, 210, 210);
          doc.setLineWidth(0.1);
          const { x, y, width, height } = data.cell;

          doc.line(x, y, x + width, y); // top
          doc.line(x, y + height, x + width, y + height); // bottom
          doc.line(x, y, x, y + height); // left
          doc.line(x + width, y, x + width, y + height); // right

          // ✅ 2. ERASE INNER HORIZONTAL LINES FOR MERGED CELLS
          let isRowSpanned = false;
          if (
            data.section === "body" &&
            (data.column.index === 0 || data.column.index === 1)
          ) {
            const raw = data.cell.raw;
            isRowSpanned =
              raw && typeof raw === "object" && raw.rowSpan && raw.rowSpan > 1;

            if (isRowSpanned) {
              doc.setDrawColor(255, 255, 255); // White to erase
              doc.setLineWidth(0.5);
              doc.line(x + 0.1, y + height, x + width - 0.1, y + height);
            }
          }

          // Erase empty cell bottom borders under merged blocks
          if (
            data.section === "body" &&
            !isRowSpanned &&
            data.cell.raw === ""
          ) {
            const rowData = data.row.raw;
            if (
              rowData[0] === "" ||
              (rowData[1] &&
                typeof rowData[1] === "object" &&
                rowData[1].rowSpan)
            ) {
              doc.setDrawColor(255, 255, 255);
              doc.setLineWidth(0.5);
              doc.line(x + 0.1, y + height, x + width - 0.1, y + height);
            }
          }
        }

        // ✅ 3. SIGNATURE LOGIC
        if (data.section !== "body") return;
        if (data.column.index !== FORUM_SIGNATURE_COL) return;
        const raw = data.row.raw?.[FORUM_SIGNATURE_COL];

        if (raw && typeof raw === "object" && raw.__signatureBlank) {
          try {
            const cell = data.cell;
            const pad = 1;
            const lineY = cell.y + cell.height - pad - 1.5;
            const leftX = cell.x + pad + 1;
            const rightX = cell.x + cell.width - pad - 1;
            doc.setDrawColor(120, 120, 120);
            doc.setLineWidth(0.15);
            doc.line(leftX, lineY, rightX, lineY);
          } catch (lineErr) {
            console.warn("Could not draw signature blank:", lineErr.message);
          }
          return;
        }

        if (!raw || typeof raw !== "object" || !raw.__signatureImage) return;

        try {
          const cell = data.cell;
          const pad = 1;
          const boxW = cell.width - pad * 2;
          const boxH = cell.height - pad * 2;
          if (boxW <= 0 || boxH <= 0) return;

          let naturalW = 400;
          let naturalH = 100;
          try {
            const props = doc.getImageProperties?.(raw.__signatureImage);
            if (props?.width && props?.height) {
              naturalW = props.width;
              naturalH = props.height;
            }
          } catch {}

          const scale = Math.min(boxW / naturalW, boxH / naturalH);
          const drawW = naturalW * scale;
          const drawH = naturalH * scale;
          const drawX = cell.x + (cell.width - drawW) / 2;
          const drawY = cell.y + (cell.height - drawH) / 2;

          doc.addImage(raw.__signatureImage, "PNG", drawX, drawY, drawW, drawH);
        } catch (imgErr) {
          console.warn(
            `Could not embed signature #${raw.__index}:`,
            imgErr.message,
          );
        }
      },
    });

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
      const footerLeft = `Generated by Addis MESOB One-Stop Service Center · ${getEthiopianDate()}`;
      drawMixedScriptText(doc, footerLeft, margin, footerY, { align: "left" });

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
export const exportDailyReportToPDF = async (rows, date, t, options = {}) => {
  try {
    console.log("📄 Generating Daily Report PDF (delegating)...");
    if (!rows || rows.length === 0) {
      showErrorToast("No data to export. Please add some data first.");
      return false;
    }
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
        if (!cellData?.cell || !cellData.cell.styles) return;
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
