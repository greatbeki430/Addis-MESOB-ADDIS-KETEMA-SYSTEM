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
import { isAmharic, detectLanguage } from "./pdf/language";
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

// ─── FORUM REPORT LABELS (language-aware) ─────────────────────
// Amharic is the primary language. English and Afan Oromo are honored
// when `lang` says so. Falls back to `t.forum.*` translations first,
// then to hardcoded strings.
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
    presentMembers: tf(
      "presentMembers",
      isAm ? "የተገኙ አባላት" : isOm ? "Miseensota Argaman" : "Present Members",
    ),
    absentMembers: tf(
      "absentMembers",
      isAm ? "ያልተገኙ አባላት" : isOm ? "Miseensota Hin Argamne" : "Absent Members",
    ),
    prevResults: tf(
      "prevResults",
      isAm
        ? "ያለፈው ስብሰባ ውጤቶች"
        : isOm
          ? "Bu'aa Walgahii Darbee"
          : "Previous Results",
    ),
    topics: tf(
      "todayTopics",
      isAm ? "የእለቱ ርዕሶች" : isOm ? "Mata-duree Marii" : "Discussion Topics",
    ),
    explanation: tf(
      "explanation",
      isAm ? "ማብራሪያ" : isOm ? "Ibsa" : "Explanation",
    ),
    gaps: tf(
      "gaps",
      isAm ? "የታዩ ክፍተቶች" : isOm ? "Hanqinaalee" : "Identified Gaps",
    ),
    agreements: tf(
      "agreements",
      isAm ? "የተስማሙባቸው ነጥቦች" : isOm ? "Qabxii Walii Galame" : "Agreed Points",
    ),
    signatures: tf(
      "signatures",
      isAm ? "ፊርማዎች" : isOm ? "Mallattoo" : "Signatures",
    ),
    signatureN: tf(
      "signatureN",
      isAm ? "ኛ ፊርማ" : isOm ? " Mallattoo" : "th Signature",
    ),
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

    // ─── Border frame ──────────────────────────────────────
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

    // ─── Title ─────────────────────────────────────────────
    doc.setFontSize(28);
    doc.setTextColor(26, 107, 74);
    drawMixedScriptText(doc, L.title, pageWidth / 2, margin + 30, {
      align: "center",
      bold: true,
    });

    doc.setDrawColor(194, 90, 0);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, margin + 38, pageWidth / 2 + 40, margin + 38);

    // ─── Presented to ──────────────────────────────────────
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    drawMixedScriptText(doc, L.presentedTo, pageWidth / 2, margin + 58, {
      align: "center",
    });

    // ─── Name ──────────────────────────────────────────────
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    drawMixedScriptText(doc, employeeName || "—", pageWidth / 2, margin + 78, {
      align: "center",
      bold: true,
    });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 60, margin + 82, pageWidth / 2 + 60, margin + 82);

    // ─── Reason ────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const reasonLine = `${L.forMonth} ${month || "—"} ${L.withScore}: ${score ?? "—"}`;
    drawMixedScriptText(doc, reasonLine, pageWidth / 2, margin + 98, {
      align: "center",
    });

    // ─── Team ──────────────────────────────────────────────
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

    // ─── Date + Signature lines ────────────────────────────
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

    // ─── Save ──────────────────────────────────────────────
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

    // ─── Title ─────────────────────────────────────────────
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

    // ─── Table ─────────────────────────────────────────────
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

    // ─── Footer ────────────────────────────────────────────
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

// ─── EXPORT FORUM REPORT (language-aware, mixed-script safe) ───
export const exportForumReportToPDF = (
  formData,
  t,
  lang = "am",
  teamName = "",
  options = {},
) => {
  try {
    console.log("📄 Generating Forum Report PDF...");

    const hasData =
      formData?.present?.some((m) => m && m.trim() !== "") ||
      formData?.absent?.some((i) => i?.name && i.name.trim() !== "") ||
      formData?.topics?.some((tp) => tp && tp.trim() !== "");

    if (!hasData) {
      showErrorToast(
        "No data to export. Please fill in some information first.",
      );
      return false;
    }

    // ─── Language resolution ────────────────────────────────
    // Priority: explicit lang (am|en|om) → detect from content → Amharic
    let reportLang = lang;
    if (!["am", "en", "om"].includes(reportLang)) {
      const sample =
        (formData?.present || []).join(" ") +
        " " +
        (formData?.topics || []).join(" ");
      const detected = detectLanguage(sample);
      reportLang = detected === "english" ? "en" : "am";
    }

    const L = getForumLabels(reportLang, t);

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

    // ✅ CRITICAL: embed the fonts on THIS document instance
    loadFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // ─── Header ────────────────────────────────────────────
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
      drawMixedScriptText(doc, `— ${teamName}`, pageWidth / 2, yPos, {
        align: "center",
        bold: true,
      });
      yPos += 7;
    }

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // ─── Meta line (date + time) ────────────────────────────
    const dateText = formData?.date || new Date().toISOString().split("T")[0];
    const timeText =
      formData?.timeStart || formData?.timeEnd
        ? `${formData.timeStart || "—"} - ${formData.timeEnd || "—"}`
        : "—";
    const metaLine = `${L.date}: ${dateText}    |    ${L.time}: ${timeText}`;

    doc.setFontSize(10);
    drawMixedScriptText(doc, metaLine, margin, yPos);
    yPos += 10;

    // ─── Section renderer ────────────────────────────────────
    // Every section gets the same treatment:
    //   • colored header bar (mixed-script safe title)
    //   • wrapped body via drawMixedScriptText
    //   • pagination
    const renderSection = (title, bodyLines, opts = {}) => {
      const { fillColor = [26, 107, 74], minSpace = 30 } = opts;

      if (yPos > pageHeight - minSpace) {
        doc.addPage();
        yPos = margin;
      }

      // Header bar
      doc.setFillColor(...fillColor);
      doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      drawMixedScriptText(doc, title, margin + 2, yPos, { bold: true });
      doc.setTextColor(0, 0, 0);
      yPos += 8;

      if (!bodyLines || bodyLines.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        drawMixedScriptText(doc, "—", margin + 2, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
        return;
      }

      doc.setFontSize(9);
      bodyLines.forEach((line) => {
        const encoded = encodeText(line);
        const wrapped = doc.splitTextToSize(
          encoded,
          pageWidth - margin * 2 - 4,
        );
        wrapped.forEach((w) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = margin;
          }
          drawMixedScriptText(doc, w, margin + 2, yPos);
          yPos += 5;
        });
      });
      yPos += 4;
    };

    // ─── Present Members ────────────────────────────────────
    const present = (formData?.present || []).filter((m) => m && m.trim());
    renderSection(
      L.presentMembers,
      present.map((name, i) => `${i + 1}. ${name}`),
      { fillColor: [26, 107, 74] },
    );

    // ─── Absent Members ─────────────────────────────────────
    const absent = (formData?.absent || []).filter(
      (i) => i?.name && i.name.trim(),
    );
    renderSection(
      L.absentMembers,
      absent.map((i, idx) => `${idx + 1}. ${i.name} — ${i.reason || "—"}`),
      { fillColor: [139, 26, 26] },
    );

    // ─── Previous Results ───────────────────────────────────
    const prev = (formData?.prevResults || []).filter((r) => r && r.trim());
    renderSection(
      L.prevResults,
      prev.map((r, i) => `${i + 1}. ${r}`),
      { fillColor: [60, 60, 60] },
    );

    // ─── Topics ─────────────────────────────────────────────
    const topics = (formData?.topics || []).filter((tp) => tp && tp.trim());
    renderSection(
      L.topics,
      topics.map((tp, i) => `${i + 1}. ${tp}`),
      { fillColor: [46, 125, 50] },
    );

    // ─── Explanation ────────────────────────────────────────
    // Note: the form.explanation field is a single textarea that may
    // contain multiple newline-separated paragraphs (including the
    // AI-generated summary block, which itself uses `\n`). We split
    // on newlines and render each as its own wrapped line.
    const explanation = formData?.explanation || "";
    renderSection(
      L.explanation,
      explanation.split("\n").filter((l) => l.trim() !== ""),
      { fillColor: [60, 60, 60], minSpace: 40 },
    );

    // ─── Gaps ───────────────────────────────────────────────
    const gaps = (formData?.gaps || []).filter((g) => g && g.trim());
    renderSection(
      L.gaps,
      gaps.map((g, i) => `${i + 1}. ${g}`),
      { fillColor: [194, 90, 0] },
    );

    // ─── Agreements ─────────────────────────────────────────
    const agreements = (formData?.agreements || []).filter(
      (a) => a && a.trim(),
    );
    renderSection(
      L.agreements,
      agreements.map((a, i) => `${i + 1}. ${a}`),
      { fillColor: [26, 107, 74] },
    );

    // ─── Signatures ─────────────────────────────────────────
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFontSize(11);
    drawMixedScriptText(doc, L.signatures, margin, yPos, { bold: true });
    yPos += 12;

    const sigsPerRow = 3;
    const sigWidth = (pageWidth - margin * 2) / sigsPerRow;

    for (let i = 0; i < 7; i++) {
      const col = i % sigsPerRow;

      // New row → advance y, reset x
      if (col === 0 && i > 0) {
        yPos += 20;
      }
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }

      const sigX = margin + col * sigWidth;

      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(sigX, yPos, sigX + sigWidth - 12, yPos);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      drawMixedScriptText(doc, `${i + 1}${L.signatureN}`, sigX, yPos - 3);
      doc.setTextColor(0, 0, 0);
    }

    // ─── Footer with page numbers ───────────────────────────
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

    // ─── TITLE SECTION ─────────────────────────────────────────
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

    // ─── REPORT DATE, PREPARED BY & BRANCH ──────────────────
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

    // ─── TABLE ────────────────────────────────────────────────
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

    // ─── BEST PERFORMER & STATS ──────────────────────────────
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

    // ─── ANALYSIS & SUMMARY ───────────────────────────────────
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

    // ─── FOOTER ───────────────────────────────────────────────
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
