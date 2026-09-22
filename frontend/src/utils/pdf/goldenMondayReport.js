// frontend/src/utils/pdf/goldenMondayReport.js
//
// Canonical PDF generator for every Golden Monday report type
// (attendance, sessions, gallery, experiences, results,
// employee-performance, dashboard-insights).
//
// This replaces two previously-diverging implementations:
//   - the inline exportAsPDF() that used to live in
//     components/golden-monday/ReportExport.jsx (blue branding,
//     theme "report", no mixed-script rendering, no Ethiopian
//     calendar labels, no watermark/prepared-by support)
//   - this file's own earlier version, which had the right
//     foundations (green branding, theme "daily", language
//     auto-detection) but never used the root-cause mixed-script
//     fix that Daily Report / Forum Report rely on.
//
// ReportExport.jsx now delegates to generateGoldenMondayReportPDF()
// below for every PDF export instead of building its own document.
//
// ─────────────────────────────────────────────────────────────────
// ROOT-CAUSE FIX (ported, not re-implemented): jsPDF can only apply
// ONE font per doc.text() call. Any line that mixes Amharic with
// Latin/digits/punctuation (dates, "Prepared By: <name>", footers
// with page numbers, an English category name inside an Amharic
// sentence) needs per-script-run font switching, or the script the
// active font doesn't cover silently renders as nothing. That fix,
// drawMixedScriptText(), already lives in ./pdfHelpers.js (used by
// dailyReport.js's whole family and by pdfExport.js) — we import it
// from there rather than keeping a third copy in this file.
// ─────────────────────────────────────────────────────────────────

import { createPDF } from "./pdfEngine";
import { encodeText, isAmharic, detectLanguage } from "./language";
import { loadFonts, FONT_NAMES } from "./fontLoader";
import { drawMixedScriptText } from "./pdfHelpers";

// ─────────────────────────────────────────────────────────────────
// Ethiopian calendar conversion (Gregorian → Ethiopian), plus Oromo
// and Amharic month names for both calendars. Kept local (mirrors
// dailyReport.js, which also keeps its own local copy rather than
// importing from pdfHelpers.js, since pdfHelpers.js only exposes the
// already-Amharic-formatted string, not the raw {year,month,day}
// Oromo formatting needs).
// ─────────────────────────────────────────────────────────────────
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
  return `${ETHIOPIAN_MONTHS_AM[month - 1]} ${day} ቀን ${year} ዓ.ም`;
}

function formatEthiopianDateOromo(date = new Date()) {
  const { year, day, month } = toEthiopianDate(date);
  return `${ETHIOPIAN_MONTHS_OM[month - 1]} ${day}, ${year} A.M`;
}

function formatDateForLanguage(dateStr, lang) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(dateStr);
  if (Number.isNaN(dateObj.getTime())) return String(dateStr);
  if (lang === "am") return formatEthiopianDateAmharic(dateObj);
  if (lang === "om") return formatEthiopianDateOromo(dateObj);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatGregorianDateForLanguage(date, lang) {
  const day = date.getDate();
  const year = date.getFullYear();
  const monthIdx = date.getMonth();
  if (lang === "am") return `${GREGORIAN_MONTHS_AM[monthIdx]} ${day}, ${year}`;
  if (lang === "om") return `${GREGORIAN_MONTHS_OM[monthIdx]} ${day}, ${year}`;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────
// Watermark — ported from dailyReport.js, unchanged behavior
// (positioned below page center so it doesn't collide with the
// table header).
// ─────────────────────────────────────────────────────────────────
function drawWatermark(doc, text, opts = {}) {
  const { angle = 0, fontSize = 50, opacity = 0.25, yOffset = 20 } = opts;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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

// ─────────────────────────────────────────────────────────────────
// Labels — Amharic-first (the ternary always checks isAm before
// isOm before the English fallback), one dict per language.
// ─────────────────────────────────────────────────────────────────
function getLabels(lang = "am") {
  const isAm = lang === "am";
  const isOm = lang === "om";

  return {
    // ── Generic ──
    generated: isAm ? "የተዘጋጀው" : isOm ? "Kan qophaa'e" : "Generated",
    generatedOn: isAm
      ? "የተዘጋጀበት ቀን"
      : isOm
        ? "Guyyaa Itti Qophaa'e"
        : "Generated On",
    reportDate: isAm ? "የሪፖርቱ ቀን" : isOm ? "Guyyaa Gabaasaa" : "Report Date",
    preparedBy: isAm ? "የተዘጋጀው በ" : isOm ? "Kan Qophaa'e" : "Prepared By",
    page: isAm ? "ገጽ" : isOm ? "Fuula" : "Page",
    of: isAm ? "ከ" : isOm ? "keessaa" : "of",
    name: isAm ? "ስም" : isOm ? "Maqaa" : "Name",
    department: isAm ? "ዘርፍ" : isOm ? "Kutaa" : "Department",
    email: isAm ? "ኢሜል" : isOm ? "Imeelii" : "Email",
    status: isAm ? "ሁኔታ" : isOm ? "Haala" : "Status",
    date: isAm ? "ቀን" : isOm ? "Guyyaa" : "Date",
    total: isAm ? "ጠቅላላ" : isOm ? "Waliigala" : "Total",
    rating: isAm ? "ደረጃ" : isOm ? "Sadarkaa" : "Rating",
    title: isAm ? "ርዕስ" : isOm ? "Mataduree" : "Title",
    category: isAm ? "ምድብ" : isOm ? "Ramaddii" : "Category",
    unknown: isAm ? "ያልታወቀ" : isOm ? "Hin beekamne" : "Unknown",
    na: isAm ? "የለም" : isOm ? "Hin jiru" : "N/A",
    untitled: isAm ? "ርዕስ የሌለው" : isOm ? "Mataduree hin qabne" : "Untitled",
    other: isAm ? "ሌላ" : isOm ? "Kaan" : "Other",
    metric: isAm ? "መለኪያ" : isOm ? "Safartuu" : "Metric",
    value: isAm ? "እሴት" : isOm ? "Gatii" : "Value",
    subtitle: isAm
      ? "የአዲስ መሶብ የአንድ ማዕከል አገልግሎት"
      : isOm
        ? "Wiirtuu Tajaajila Iddoo Tokkoo (A-MESOB)"
        : "A-MESOB One-Stop Service Center",
    footerText: isAm
      ? "በአዲስ መሶብ ወርቃማ ሰኞ ስርዓት የተዘጋጀ"
      : isOm
        ? "Sistimii Wiixata Warqee A-MESOB tiin qophaa'e"
        : "Generated by Addis MESOB Golden Monday System",

    // ── Report type titles ──
    attendanceReport: isAm
      ? "የመገኘት ሪፖርት"
      : isOm
        ? "Gabaasa Argamaa"
        : "Attendance Report",
    sessionsReport: isAm
      ? "የክፍለ-ጊዜ ሪፖርት"
      : isOm
        ? "Gabaasa Yeroo"
        : "Sessions Report",
    galleryReport: isAm
      ? "የስዕል ማሳያ ሪፖርት"
      : isOm
        ? "Gabaasa Fakkii"
        : "Gallery Report",
    experiencesReport: isAm
      ? "የተጋሩ ተሞክሮዎች ሪፖርት"
      : isOm
        ? "Gabaasa Muuxannoo Qoodatame"
        : "Experiences Shared Report",
    resultsReport: isAm
      ? "የተገኙ ውጤቶች ሪፖርት"
      : isOm
        ? "Gabaasa Bu'aa Argame"
        : "Results Gained Report",
    performanceReport: isAm
      ? "የሰራተኞች አፈጻጸም ሪፖርት"
      : isOm
        ? "Gabaasa Hojjataa"
        : "Employee Performance Report",
    insightsReport: isAm
      ? "የዳሽቦርድ እና የAI ግንዛቤዎች ሪፖርት"
      : isOm
        ? "Gabaasa Dashboard fi Hubannoo AI"
        : "Dashboard & AI Insights Report",

    // ── Attendance ──
    present: isAm ? "ተገኝተዋል" : isOm ? "Argaman" : "Present",
    absent: isAm ? "አልተገኙም" : isOm ? "Hin argamne" : "Absent",
    attendanceRate: isAm
      ? "የመገኘት መጠን"
      : isOm
        ? "Hirmaanna Argamaa"
        : "Attendance Rate",
    detailedAttendance: isAm
      ? "ዝርዝር መገኘት"
      : isOm
        ? "Argama Gadifageessa"
        : "Detailed Attendance",
    signature: isAm ? "ፊርማ" : isOm ? "Mallattoo" : "Signature",
    signed: isAm ? "ተፈርሟል" : isOm ? "Mallatteeffame" : "Signed",
    notSigned: isAm ? "አልተፈረሙም" : isOm ? "Hin mallatteeffamne" : "Not Signed",
    checkedInAt: isAm ? "የገቡበት ሰዓት" : isOm ? "Yeroo Galan" : "Checked In At",
    feedback: isAm ? "አስተያየት" : isOm ? "Yaada" : "Feedback",

    // ── Sessions ──
    presenter: isAm ? "አቅራቢ" : isOm ? "Dhiheessituu" : "Presenter",
    attendees: isAm ? "ተሳታፊዎች" : isOm ? "Hirmaattota" : "Attendees",

    // ── Gallery ──
    uploadedBy: isAm ? "ያስገባው" : isOm ? "Kan fe'e" : "Uploaded By",

    // ── Experiences ──
    whatILearned: isAm ? "የተማርኩት" : isOm ? "Waan baradhe" : "What I Learned",
    relevanceRating: isAm ? "ተግባራዊነት" : isOm ? "Mirkanaa'ina" : "Relevance",
    wouldRecommend: isAm ? "ምክር ይሰጣሉ?" : isOm ? "Gorsa ni kennu?" : "Recommend",

    // ── Results ──
    whatIApplied: isAm
      ? "የተገበርኩት"
      : isOm
        ? "Waan hojii irra oolche"
        : "What I Applied",
    measurableOutcome: isAm
      ? "ሊለካ የሚችል ውጤት"
      : isOm
        ? "Bu'aa Safaruu Danda'amu"
        : "Measurable Outcome",
    outcomeCategory: isAm
      ? "የውጤት ምድብ"
      : isOm
        ? "Ramaddii Bu'aa"
        : "Outcome Category",

    // ── Performance ──
    employee: isAm ? "ሰራተኛ" : isOm ? "Hojjetaa" : "Employee",
    position: isAm ? "ሹመት" : isOm ? "Aangoo" : "Position",
    timesPresented: isAm
      ? "ያቀረቡት ጊዜ"
      : isOm
        ? "Yeroo Dhiheessan"
        : "Times Presented",
    avgRating: isAm
      ? "አማካይ ደረጃ"
      : isOm
        ? "Sadarkaa Giddugaleessa"
        : "Avg Rating",
    isEligible: isAm ? "ብቁ ነው" : isOm ? "Maluqaadha" : "Eligible",
    eligible: isAm ? "ብቁ" : isOm ? "Maluqaadha" : "Eligible",

    // ── Insights ──
    aiSuggestions: isAm ? "የAI ምክሮች" : isOm ? "Gorsa AI" : "AI Suggestions",
    descriptionCol: isAm ? "መግለጫ" : isOm ? "Ibsa" : "Description",
    confidence: isAm ? "እምነት" : isOm ? "Amantaa" : "Confidence",
  };
}

// ─────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a Golden Monday report PDF.
 * @param {Object} data - Report data, shaped per reportType (see ReportExport.jsx getReportData)
 * @param {string} reportType - 'attendance' | 'sessions' | 'gallery' | 'experiences' | 'results' | 'employee-performance' | 'dashboard-insights'
 * @param {string} date - ISO date string for the report (defaults to now)
 * @param {Object} options - {
 *   language, filename,
 *   preparedBy, preparedByDisplay, preparedByDepartment, preparedByPosition, preparedByBranch,
 *   showWatermark, watermarkText, watermarkAngle, watermarkOpacity, watermarkSize,
 * }
 */
export const generateGoldenMondayReportPDF = async (
  data,
  reportType,
  date,
  options = {},
) => {
  try {
    console.log(`📄 Generating Golden Monday ${reportType} Report PDF...`);

    // ─── Language: explicit choice wins, else auto-detect from content, else Amharic ──
    let lang = options?.language || "am";

    if (!options?.language) {
      let sampleText = "";
      switch (reportType) {
        case "attendance":
          sampleText = (data?.attendance || [])
            .slice(0, 3)
            .map((a) => (a.name || "") + " " + (a.department || ""))
            .join(" ");
          break;
        case "sessions":
          sampleText = (data?.sessions || [])
            .slice(0, 3)
            .map(
              (s) =>
                (s.presentationTitle || "") + " " + (s.presenterName || ""),
            )
            .join(" ");
          break;
        case "gallery":
          sampleText = (data?.photos || [])
            .slice(0, 3)
            .map((p) => (p.title || "") + " " + (p.category || ""))
            .join(" ");
          break;
        case "experiences":
          sampleText = (data?.experiences || [])
            .slice(0, 3)
            .map((e) => (e.whatILearned || "") + " " + (e.userName || ""))
            .join(" ");
          break;
        case "results":
          sampleText = (data?.results || [])
            .slice(0, 3)
            .map((r) => (r.whatIApplied || "") + " " + (r.userName || ""))
            .join(" ");
          break;
        case "employee-performance":
          sampleText = (data?.performance || [])
            .slice(0, 3)
            .map((p) => (p.name || "") + " " + (p.department || ""))
            .join(" ");
          break;
        case "dashboard-insights":
          sampleText = JSON.stringify(data?.metrics || {}).substring(0, 200);
          break;
        default:
          sampleText = JSON.stringify(data || {}).substring(0, 500);
      }

      const detected = detectLanguage(sampleText);
      lang = detected === "english" ? "en" : "am";
      console.log(`🔍 Auto-detected "${detected}" content → using ${lang}`);
    }

    const labels = getLabels(lang);

    // ─── Create PDF (green "daily" theme — same as every other A-MESOB report) ──
    const engine = createPDF({ orientation: "landscape", theme: "daily" });
    const doc = engine.getDoc();
    loadFonts(doc, { silent: false });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    try {
      doc.setProperties({
        title: labels[`${camelReportType(reportType)}Report`] || labels.title,
        author: options?.preparedBy || "A-MESOB Golden Monday",
        subject: labels[`${camelReportType(reportType)}Report`] || "",
        creator: "A-MESOB PDF Generator",
      });
    } catch (metadataError) {
      console.debug("Could not set document metadata:", metadataError.message);
    }

    // ─── Title ──
    const titleText =
      labels[`${camelReportType(reportType)}Report`] || labels.title;
    doc.setFontSize(20);
    doc.setTextColor(26, 107, 74);
    drawMixedScriptText(doc, titleText, pageWidth / 2, yPos, {
      align: "center",
      bold: true,
    });
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // ─── Subtitle ──
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    drawMixedScriptText(doc, labels.subtitle, pageWidth / 2, yPos, {
      align: "center",
    });
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    // ─── Report date (Ethiopian/Gregorian/Oromo per language, with a
    //     calendar indicator so the reader knows which calendar it is —
    //     same pattern as dailyReport.js) ──
    const reportDate = date || new Date().toISOString();
    const formattedReportDate = formatDateForLanguage(reportDate, lang);
    const calendarSuffix =
      lang === "am"
        ? "(ኢንደ ኢትዮጵያን አቆጣጠር)"
        : lang === "om"
          ? "(A.L.I)"
          : "(E.C)";
    const reportDateText = `${labels.reportDate} ${calendarSuffix}: ${formattedReportDate}`;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    drawMixedScriptText(doc, reportDateText, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 7;

    // ─── Generated on ──
    const now = new Date();
    const generatedOnDate = formatGregorianDateForLanguage(now, lang);
    const generatedSuffix =
      lang === "am" ? "(ግሪጎሪያን ቀን)" : lang === "om" ? "(A.L.A)" : "(G.C)";
    const generatedText = `${labels.generatedOn} ${generatedSuffix}: ${generatedOnDate}`;

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    drawMixedScriptText(doc, generatedText, pageWidth / 2, yPos, {
      align: "center",
    });
    doc.setTextColor(0, 0, 0);
    yPos += 7;

    // ─── Prepared by (optional) ──
    if (options?.preparedBy) {
      let preparedByText = `${labels.preparedBy}: ${options.preparedBy}`;
      if (options.preparedByDisplay) {
        preparedByText += ` ${options.preparedByDisplay}`;
      } else {
        const parts = [
          options.preparedByDepartment,
          options.preparedByPosition,
          options.preparedByBranch,
        ].filter((p) => p && p !== "N/A");
        if (parts.length) preparedByText += ` (${parts.join(" - ")})`;
      }
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      drawMixedScriptText(doc, preparedByText, pageWidth / 2, yPos, {
        align: "center",
      });
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    } else {
      yPos += 2;
    }

    // ─── Divider ──
    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    // ─── Content, dispatched by report type ──
    switch (reportType) {
      case "attendance":
        yPos = renderAttendanceReport(doc, data, labels, yPos);
        break;
      case "sessions":
        yPos = renderSessionsReport(doc, data, labels, yPos, lang);
        break;
      case "gallery":
        yPos = renderGalleryReport(doc, data, labels, yPos, lang);
        break;
      case "experiences":
        yPos = renderExperiencesReport(doc, data, labels, yPos, lang);
        break;
      case "results":
        yPos = renderResultsReport(doc, data, labels, yPos, lang);
        break;
      case "employee-performance":
        yPos = renderPerformanceReport(doc, data, labels, yPos);
        break;
      case "dashboard-insights":
        yPos = renderInsightsReport(doc, data, labels, yPos);
        break;
      default:
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        drawMixedScriptText(
          doc,
          "No data available for this report type.",
          pageWidth / 2,
          yPos,
          { align: "center" },
        );
    }

    // ─── Watermark (drawn after content on every page, matches dailyReport.js) ──
    if (options?.showWatermark) {
      try {
        const watermarkText = options?.watermarkText || titleText;
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
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

    // ─── Footer ──
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = pageHeight - 12;

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
        });
      }

      drawMixedScriptText(doc, labels.footerText, pageWidth / 2, footerY, {
        align: "center",
      });

      const pageText = `${labels.page} ${i} ${labels.of} ${pageCount}`;
      drawMixedScriptText(doc, pageText, pageWidth - 15, footerY, {
        align: "right",
      });
    }

    // ─── Save ──
    const safeDate = new Date(reportDate).toISOString().split("T")[0];
    const langSuffix = lang === "am" ? "_am" : lang === "om" ? "_om" : "_en";
    const filename =
      options?.filename ||
      `AMESOB_GoldenMonday_${reportType}${langSuffix}_${safeDate}.pdf`;
    engine.save(filename);

    console.log(
      `✅ Golden Monday ${reportType} Report generated successfully in ${lang.toUpperCase()}! Saved as: ${filename}`,
    );
    return true;
  } catch (error) {
    console.error("❌ Golden Monday PDF Error:", error.message);
    throw error;
  }
};

// Maps a hyphenated reportType ("employee-performance") to the camelCase
// key used in the labels dict ("employeePerformance" → "employeePerformanceReport").
// "employee-performance" is a special case (maps to "performanceReport") and
// "dashboard-insights" maps to "insightsReport" — both handled explicitly.
function camelReportType(reportType) {
  if (reportType === "employee-performance") return "performance";
  if (reportType === "dashboard-insights") return "insights";
  return reportType;
}

// ─────────────────────────────────────────────────────────────────
// Shared table helper — per-cell font switching (Amharic vs Latin)
// via didParseCell, matching the pattern pdfEngine.js's addTable()
// uses. Title line (if any) uses drawMixedScriptText so a title that
// mixes an Amharic report name with a Latin category/id doesn't lose
// either half.
// ─────────────────────────────────────────────────────────────────
async function createTable(doc, config) {
  const {
    headers,
    rows,
    foot = null,
    startY,
    title = null,
    titleSize = 12,
    fontSize = 8,
    theme = "striped",
    columnStyles = {},
    rowHeight = 8,
  } = config;

  let currentY = startY;
  const pageWidth = doc.internal.pageSize.getWidth();

  if (title) {
    doc.setFontSize(titleSize);
    doc.setTextColor(0, 0, 0);
    drawMixedScriptText(doc, title, 14, currentY, { bold: true });
    currentY += 7;
  }

  const requiredSpace = rows.length * rowHeight + 30;
  if (currentY + requiredSpace > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 20;
  }

  const autoTable = (await import("jspdf-autotable")).default;

  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    foot: foot || undefined,
    theme,
    headStyles: {
      fillColor: [26, 107, 74],
      textColor: [255, 255, 255],
      fontSize: 8,
      font: doc.__hasEthiopicFont ? FONT_NAMES.ethiopic : "helvetica",
      halign: "center",
      valign: "middle",
    },
    footStyles: {
      fillColor: [240, 247, 244],
      textColor: [26, 107, 74],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    styles: {
      fontSize,
      font: doc.__hasLatinFont ? FONT_NAMES.latin : "helvetica",
      cellPadding: 3,
    },
    columnStyles,
    rowHeight,
    tableWidth: pageWidth - 28,
    margin: { left: 14, right: 14 },
    didParseCell: (cellData) => {
      const raw = String(cellData.cell.raw || "");
      const hasAm = isAmharic(raw);
      cellData.cell.styles.font = hasAm
        ? doc.__hasEthiopicFont
          ? FONT_NAMES.ethiopic
          : "helvetica"
        : doc.__hasLatinFont
          ? FONT_NAMES.latin
          : "helvetica";
    },
  });

  return doc.lastAutoTable.finalY + 6;
}

// ─────────────────────────────────────────────────────────────────
// Per-report-type render functions
// ─────────────────────────────────────────────────────────────────

async function renderAttendanceReport(doc, data, labels, yPos) {
  const attendance = data?.attendance || [];
  const { total, present, absent, withSignature } = data?.stats || {
    total: attendance.length,
    present: attendance.filter((a) => a.attended).length,
    absent: attendance.filter((a) => !a.attended).length,
    withSignature: attendance.filter(
      (a) => a.attended && a.signature && a.signature.length > 100,
    ).length,
  };
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  yPos = await createTable(doc, {
    headers: [labels.metric, labels.value],
    rows: [
      [labels.total, String(total)],
      [labels.present, String(present)],
      [labels.absent, String(absent)],
      [labels.attendanceRate, `${rate}%`],
      ["With Signature", String(withSignature)],
    ],
    startY: yPos,
    title: labels.attendanceReport,
    fontSize: 9,
  });

  const headers = [
    labels.name,
    labels.department,
    labels.email,
    labels.status,
    labels.signature,
    labels.checkedInAt,
    labels.feedback,
  ];

  const rows = attendance.map((a) => {
    const status = a.attended ? `✅ ${labels.present}` : `❌ ${labels.absent}`;
    const signatureVal =
      a.attended && a.signature && a.signature.length > 100
        ? `✓ ${labels.signed}`
        : a.attended
          ? `✗ ${labels.notSigned}`
          : "—";
    return [
      a.name || labels.unknown,
      a.department || labels.na,
      a.email || labels.na,
      status,
      signatureVal,
      a.checkedInAt ? new Date(a.checkedInAt).toLocaleTimeString() : labels.na,
      a.feedback || "",
    ];
  });

  yPos = await createTable(doc, {
    headers,
    rows,
    startY: yPos,
    title: labels.detailedAttendance,
    fontSize: 7,
    rowHeight: 7,
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 22 },
      2: { cellWidth: 32 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: "auto" },
    },
  });

  return yPos;
}

async function renderSessionsReport(doc, data, labels, yPos) {
  const sessions = data?.sessions || [];
  const stats = data?.stats || {};

  yPos = await createTable(doc, {
    headers: [labels.metric, labels.value],
    rows: [
      [labels.total, String(stats.total ?? sessions.length)],
      ["Upcoming", String(stats.upcoming ?? 0)],
      ["Past", String(stats.past ?? 0)],
      [
        labels.avgRating,
        `${(stats.avgRating ?? 0).toFixed ? stats.avgRating.toFixed(1) : stats.avgRating || 0} ★`,
      ],
    ],
    startY: yPos,
    title: labels.sessionsReport,
    fontSize: 9,
  });

  const headers = [
    labels.title,
    labels.date,
    labels.presenter,
    labels.rating,
    labels.status,
    labels.attendees,
  ];

  const rows = sessions.map((s) => [
    s.presentationTitle || s.title || labels.untitled,
    new Date(s.date).toLocaleDateString(),
    s.presenterName || labels.na,
    s.averageRating ? `${s.averageRating.toFixed(1)} ★` : labels.na,
    s.status || labels.unknown,
    String(s.attendees?.length || 0),
  ]);

  yPos = await createTable(doc, {
    headers,
    rows,
    startY: yPos,
    title: labels.sessionsReport,
    fontSize: 7,
    rowHeight: 7,
  });

  return yPos;
}

async function renderGalleryReport(doc, data, labels, yPos) {
  const photos = data?.photos || [];
  const categories = data?.stats?.categories || {};

  yPos = await createTable(doc, {
    headers: [labels.category, "Count"],
    rows: Object.entries(categories).map(([cat, count]) => [
      cat,
      String(count),
    ]),
    startY: yPos,
    title: labels.galleryReport,
    fontSize: 9,
  });

  const headers = [
    labels.title,
    labels.category,
    labels.date,
    labels.uploadedBy,
  ];

  const rows = photos.map((p) => [
    p.title || labels.untitled,
    p.category || labels.other,
    new Date(p.createdAt).toLocaleDateString(),
    p.uploadedByName || labels.unknown,
  ]);

  yPos = await createTable(doc, {
    headers,
    rows,
    startY: yPos,
    title: labels.galleryReport,
    fontSize: 7,
    rowHeight: 7,
  });

  return yPos;
}

async function renderExperiencesReport(doc, data, labels, yPos) {
  const experiences = data?.experiences || [];
  const stats = data?.stats || {};

  yPos = await createTable(doc, {
    headers: [labels.metric, labels.value],
    rows: [
      [labels.total, String(stats.total ?? experiences.length)],
      [
        labels.avgRating,
        `${(stats.avgRating ?? 0).toFixed ? stats.avgRating.toFixed(1) : stats.avgRating || 0} ★`,
      ],
      ["Would Recommend", String(stats.recommendCount ?? 0)],
    ],
    startY: yPos,
    title: labels.experiencesReport,
    fontSize: 9,
  });

  const headers = [
    labels.name,
    labels.department,
    labels.whatILearned,
    labels.relevanceRating,
    labels.wouldRecommend,
    labels.date,
  ];

  const rows = experiences.map((e) => [
    e.userName || labels.unknown,
    e.department || labels.na,
    (e.whatILearned || "").substring(0, 50) +
      ((e.whatILearned || "").length > 50 ? "..." : ""),
    `${e.relevanceRating || 0}/5`,
    e.wouldRecommend ? "✅" : "❌",
    new Date(e.createdAt).toLocaleDateString(),
  ]);

  yPos = await createTable(doc, {
    headers,
    rows,
    startY: yPos,
    title: labels.experiencesReport,
    fontSize: 7,
    rowHeight: 7,
  });

  return yPos;
}

async function renderResultsReport(doc, data, labels, yPos) {
  const results = data?.results || [];
  const categories = data?.stats?.categories || {};

  yPos = await createTable(doc, {
    headers: [labels.category, "Count"],
    rows: Object.entries(categories).map(([cat, count]) => [
      cat,
      String(count),
    ]),
    startY: yPos,
    title: labels.resultsReport,
    fontSize: 9,
  });

  const headers = [
    labels.name,
    labels.department,
    labels.whatIApplied,
    labels.measurableOutcome,
    labels.outcomeCategory,
    labels.date,
  ];

  const rows = results.map((r) => [
    r.userName || labels.unknown,
    r.department || labels.na,
    (r.whatIApplied || "").substring(0, 40) +
      ((r.whatIApplied || "").length > 40 ? "..." : ""),
    (r.measurableOutcome || "").substring(0, 40) +
      ((r.measurableOutcome || "").length > 40 ? "..." : ""),
    r.outcomeCategory || labels.other,
    new Date(r.createdAt).toLocaleDateString(),
  ]);

  yPos = await createTable(doc, {
    headers,
    rows,
    startY: yPos,
    title: labels.resultsReport,
    fontSize: 7,
    rowHeight: 7,
  });

  return yPos;
}

async function renderPerformanceReport(doc, data, labels, yPos) {
  const performance = data?.performance || [];
  const stats = data?.stats || {};

  yPos = await createTable(doc, {
    headers: [labels.metric, labels.value],
    rows: [
      [labels.total, String(stats.total ?? performance.length)],
      [labels.eligible, String(stats.eligible ?? 0)],
      ["Total Presentations", String(stats.totalPresentations ?? 0)],
    ],
    startY: yPos,
    title: labels.performanceReport,
    fontSize: 9,
  });

  const headers = [
    labels.employee,
    labels.department,
    labels.position,
    labels.timesPresented,
    labels.avgRating,
    labels.isEligible,
  ];

  const rows = performance.map((p) => [
    p.name || labels.unknown,
    p.department || labels.na,
    p.position || labels.na,
    String(p.timesPresented || 0),
    p.averageRating ? p.averageRating.toFixed(1) : labels.na,
    p.isEligible ? "✅" : "❌",
  ]);

  yPos = await createTable(doc, {
    headers,
    rows,
    startY: yPos,
    title: labels.performanceReport,
    fontSize: 7,
    rowHeight: 7,
  });

  return yPos;
}

async function renderInsightsReport(doc, data, labels, yPos) {
  if (data?.metrics && Object.keys(data.metrics).length > 0) {
    yPos = await createTable(doc, {
      headers: [labels.metric, labels.value],
      rows: Object.entries(data.metrics).map(([key, val]) => [
        key,
        String(val),
      ]),
      startY: yPos,
      title: labels.insightsReport,
      fontSize: 9,
      rowHeight: 7,
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40 } },
    });
  }

  if (data?.insights && data.insights.length > 0) {
    const rows = data.insights.map((insight) => [
      insight.title || "",
      (insight.description || "").substring(0, 60) +
        ((insight.description || "").length > 60 ? "..." : ""),
      insight.confidence
        ? `${(insight.confidence * 100).toFixed(0)}%`
        : labels.na,
    ]);

    yPos = await createTable(doc, {
      headers: [labels.title, labels.descriptionCol, labels.confidence],
      rows,
      startY: yPos,
      title: labels.aiSuggestions,
      fontSize: 7,
      rowHeight: 7,
    });
  }

  return yPos;
}

export default generateGoldenMondayReportPDF;
