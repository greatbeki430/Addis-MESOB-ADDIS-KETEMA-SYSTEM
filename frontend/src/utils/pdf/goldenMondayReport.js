// frontend/src/utils/pdf/goldenMondayReport.js
// Golden Monday Report PDF Generator - Enhanced with full Amharic support
// Based on dailyReport.js pattern with mixed-script rendering

import { createPDF } from "../pdfEngine";
import { encodeText, isAmharic, detectLanguage } from "../language";
import { loadFonts, FONT_NAMES } from "../fontLoader";
import autoTable from "jspdf-autotable";

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
  return `${ETHIOPIAN_MONTHS_AM[month - 1]} ${day} ቀን ${year} ዓ.ም`;
}

function formatEthiopianDateOromo(date = new Date()) {
  const { year, day, month } = toEthiopianDate(date);
  return `${ETHIOPIAN_MONTHS_OM[month - 1]} ${day}, ${year} A.M`;
}

function formatDateForLanguage(dateStr, lang) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(dateStr);
  if (lang === "am") return formatEthiopianDateAmharic(dateObj);
  if (lang === "om") return formatEthiopianDateOromo(dateObj);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ LABELS with language support
// ─────────────────────────────────────────────────────────────────────────────
function getLabels(lang) {
  const isAm = lang === "am";
  const isOm = lang === "om";

  return {
    title: isAm
      ? "ወርቃማ ሰኞ ሪፖርት"
      : isOm
        ? "Gabaasa Wiixata Warqee"
        : "Golden Monday Report",
    subtitle: isAm
      ? "የአዲስ መሶብ የአንድ ማዕከል አገልግሎት"
      : isOm
        ? "A-MESOB One-Stop Tajaajila"
        : "A-MESOB One-Stop Service Center",
    reportDate: isAm ? "የሪፖርቱ ቀን" : isOm ? "Guyyaa Gabaasaa" : "Report Date",
    generatedOn: isAm
      ? "የተዘጋጀበት ቀን"
      : isOm
        ? "Guyyaa Itti Qophaa'e"
        : "Generated On",
    footer: isAm
      ? "በአዲስ መሶብ ወርቃማ ሰኞ ሪፖርት"
      : isOm
        ? "A-MESOB Wiixata Warqee Gabaasa"
        : "A-MESOB Golden Monday Report",
    page: isAm ? "ገጽ" : isOm ? "Fuula" : "Page",
    of: isAm ? "ከ" : isOm ? "keessaa" : "of",
    // Attendance
    total: isAm ? "ጠቅላላ" : isOm ? "Waliigala" : "Total",
    present: isAm ? "ተገኝተዋል" : isOm ? "Argaman" : "Present",
    absent: isAm ? "አልተገኙም" : isOm ? "Hin argamne" : "Absent",
    attendanceRate: isAm
      ? "የመገኘት መጠን"
      : isOm
        ? "Hirmaanna Argamaa"
        : "Attendance Rate",
    name: isAm ? "ስም" : isOm ? "Maqaa" : "Name",
    department: isAm ? "ዘርፍ" : isOm ? "Kutaa" : "Department",
    email: isAm ? "ኢሜል" : isOm ? "Imeelii" : "Email",
    status: isAm ? "ሁኔታ" : isOm ? "Haala" : "Status",
    signature: isAm ? "ፊርማ" : isOm ? "Mallattoo" : "Signature",
    signed: isAm ? "ተፈርሟል" : isOm ? "Mallatteeffame" : "Signed",
    notSigned: isAm ? "አልተፈረሙም" : isOm ? "Hin mallatteeffamne" : "Not Signed",
    checkedInAt: isAm ? "የገቡበት ሰዓት" : isOm ? "Yeroo Galan" : "Checked In At",
    feedback: isAm ? "አስተያየት" : isOm ? "Yaada" : "Feedback",
    // Sessions
    titleLabel: isAm ? "ርዕስ" : isOm ? "Mataduree" : "Title",
    date: isAm ? "ቀን" : isOm ? "Guyyaa" : "Date",
    presenter: isAm ? "አቅራቢ" : isOm ? "Dhiheessituu" : "Presenter",
    rating: isAm ? "ደረጃ" : isOm ? "Sadarkaa" : "Rating",
    attendees: isAm ? "ተሳታፊዎች" : isOm ? "Hirmaattota" : "Attendees",
    // Gallery
    category: isAm ? "ምድብ" : isOm ? "Ramaddii" : "Category",
    uploadedBy: isAm ? "ያስገባው" : isOm ? "Kan fe'e" : "Uploaded By",
    untitled: isAm ? "ርዕስ የሌለው" : isOm ? "Mataduree hin qabne" : "Untitled",
    unknown: isAm ? "ያልታወቀ" : isOm ? "Hin beekamne" : "Unknown",
    na: isAm ? "የለም" : isOm ? "Hin jiru" : "N/A",
    other: isAm ? "ሌላ" : isOm ? "Kaan" : "Other",
    descriptionCol: isAm ? "መግለጫ" : isOm ? "Ibsa" : "Description",
    confidence: isAm ? "እምነት" : isOm ? "Amantaa" : "Confidence",
    // Experiences
    whatILearned: isAm ? "የተማርኩት" : isOm ? "Waan baradhe" : "What I Learned",
    relevanceRating: isAm ? "ተግባራዊነት" : isOm ? "Mirkanaa'ina" : "Relevance",
    wouldRecommend: isAm ? "ምክር ይሰጣሉ?" : isOm ? "Gorsa ni kennu?" : "Recommend",
    // Results
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
    // Performance
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
    // Insights
    metric: isAm ? "መለኪያ" : isOm ? "Safartuu" : "Metric",
    value: isAm ? "እሴት" : isOm ? "Gatii" : "Value",
    aiSuggestions: isAm ? "የAI ምክሮች" : isOm ? "Gorsa AI" : "AI Suggestions",
    // Report types
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
    detailedAttendance: isAm
      ? "ዝርዝር መገኘት"
      : isOm
        ? "Argama Gadifageessa"
        : "Detailed Attendance",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate Golden Monday Report PDF
 * @param {Object} data - Report data (attendance, sessions, gallery, etc.)
 * @param {string} reportType - 'attendance', 'sessions', 'gallery', 'experiences', 'results', 'performance', 'insights'
 * @param {string} date - Report date
 * @param {Object} options - Options
 */
export const generateGoldenMondayReportPDF = async (
  data,
  reportType,
  date,
  options = {},
) => {
  try {
    console.log(`📄 Generating Golden Monday ${reportType} Report PDF...`);

    // ─── AUTO-DETECT LANGUAGE ───
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
        case "performance":
          sampleText = (data?.performance || [])
            .slice(0, 3)
            .map((p) => (p.name || "") + " " + (p.department || ""))
            .join(" ");
          break;
        case "insights":
          sampleText = JSON.stringify(data?.metrics || {}).substring(0, 200);
          break;
        default:
          sampleText = JSON.stringify(data || {}).substring(0, 500);
      }

      const detected = detectLanguage(sampleText);
      if (detected === "amharic" || detected === "mixed") {
        lang = "am";
        console.log(`🔍 Auto-detected ${detected} content, using Amharic font`);
      } else if (detected === "english") {
        lang = "en";
        console.log(`🔍 Auto-detected English content, using English font`);
      } else {
        lang = "am";
        console.log(`🔍 Language not detected, defaulting to Amharic`);
      }
    }

    const labels = getLabels(lang);

    // ─── Create PDF engine ─────────────────────────────────────
    const engine = createPDF({
      orientation: "landscape",
      theme: "daily",
    });

    const doc = engine.getDoc();
    loadFonts(doc, { silent: false });

    // ─── Helper: Set font based on text content ────────────────
    const setSmartFont = (text, bold = false) => {
      try {
        const hasAmharic = isAmharic(text);
        const style = bold ? "bold" : "normal";
        if (hasAmharic) {
          doc.setFont(
            doc.__hasEthiopicFont ? FONT_NAMES.ethiopic : "helvetica",
            style,
          );
        } else {
          doc.setFont(
            doc.__hasLatinFont ? FONT_NAMES.latin : "helvetica",
            style,
          );
        }
      } catch (_error) {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        console.debug("PDF metadata could not be set:", _error.message);
      }
    };

    // ─── Document properties ──────────────────────────────────
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    try {
      doc.setProperties({
        title: labels.title,
        author: "A-MESOB Golden Monday",
        subject: labels.title,
        creator: "A-MESOB PDF Generator",
      });
    } catch (_error) {
      console.debug("PDF metadata could not be set:", _error.message);
    }

    // ─── Title ──────────────────────────────────────────────────
    setSmartFont(labels.title, true);
    doc.setFontSize(20);
    doc.text(encodeText(labels.title), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 12;

    // ─── Subtitle ──────────────────────────────────────────────
    setSmartFont(labels.subtitle, false);
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(encodeText(labels.subtitle), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // ─── Report Date ───────────────────────────────────────────
    const reportDate = date || new Date().toISOString().split("T")[0];
    const formattedReportDate = formatDateForLanguage(reportDate, lang);
    const dateText = `${labels.reportDate}: ${reportDate} (${formattedReportDate})`;

    setSmartFont(dateText, false);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(encodeText(dateText), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 8;

    // ─── Generated On ──────────────────────────────────────────
    const currentDate = new Date();
    const generatedOnDate = currentDate.toLocaleDateString(
      lang === "am" ? "am-ET" : lang === "om" ? "om-ET" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );
    const generatedText = `${labels.generatedOn}: ${generatedOnDate}`;

    setSmartFont(generatedText, false);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(encodeText(generatedText), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // ─── Separator ─────────────────────────────────────────────
    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    // ─── Content based on report type ─────────────────────────
    switch (reportType) {
      case "attendance":
        yPos = renderAttendanceReport(
          doc,
          data,
          labels,
          yPos,
          lang,
          setSmartFont,
        );
        break;
      case "sessions":
        yPos = renderSessionsReport(
          doc,
          data,
          labels,
          yPos,
          lang,
          setSmartFont,
        );
        break;
      case "gallery":
        yPos = renderGalleryReport(doc, data, labels, yPos, lang, setSmartFont);
        break;
      case "experiences":
        yPos = renderExperiencesReport(
          doc,
          data,
          labels,
          yPos,
          lang,
          setSmartFont,
        );
        break;
      case "results":
        yPos = renderResultsReport(doc, data, labels, yPos, lang, setSmartFont);
        break;
      case "performance":
        yPos = renderPerformanceReport(
          doc,
          data,
          labels,
          yPos,
          lang,
          setSmartFont,
        );
        break;
      case "insights":
        yPos = renderInsightsReport(
          doc,
          data,
          labels,
          yPos,
          lang,
          setSmartFont,
        );
        break;
      default:
        yPos = renderGeneralReport(doc, labels, yPos, setSmartFont);
    }

    // ─── Footer ────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = doc.internal.pageSize.getHeight() - 12;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

      setSmartFont(labels.footer, false);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(encodeText(labels.footer), pageWidth / 2, footerY, {
        align: "center",
      });

      const pageText = `${labels.page} ${i} ${labels.of} ${pageCount}`;
      setSmartFont(pageText, false);
      doc.text(encodeText(pageText), pageWidth - 15, footerY, {
        align: "right",
      });
    }

    // ─── Save ──────────────────────────────────────────────────
    const safeDate = reportDate.replace(/\//g, "-");
    const langSuffix = lang === "am" ? "_am" : lang === "om" ? "_om" : "_en";
    const filename =
      options?.filename ||
      `GoldenMonday_${reportType}${langSuffix}_${safeDate}.pdf`;
    engine.save(filename);

    console.log(
      `✅ Golden Monday ${reportType} Report generated successfully in ${lang.toUpperCase()}!`,
    );
    return true;
  } catch (_error) {
    console.error("❌ Golden Monday PDF Error:", _error.message);
    throw _error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ HELPER: Create table with font support (ported from dailyReport.js)
// ─────────────────────────────────────────────────────────────────────────────
function createTable(doc, config, labels, lang, setSmartFont) {
  const {
    headers,
    rows,
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
    setSmartFont(title, true);
    doc.setFontSize(titleSize);
    doc.setTextColor(0, 0, 0);
    doc.text(encodeText(title), 14, currentY);
    currentY += 6;
  }

  // Check if we need a new page
  const requiredSpace = rows.length * rowHeight + 30;
  if (currentY + requiredSpace > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 20;
  }

  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: theme,
    headStyles: {
      fillColor: [26, 107, 74],
      textColor: [255, 255, 255],
      fontSize: 8,
      font: doc.__hasEthiopicFont ? FONT_NAMES.ethiopic : "helvetica",
      halign: "center",
      valign: "middle",
    },
    styles: {
      fontSize: fontSize,
      font: doc.__hasLatinFont ? FONT_NAMES.latin : "helvetica",
    },
    columnStyles: columnStyles,
    rowHeight: rowHeight,
    tableWidth: pageWidth - 28,
    margin: { left: 14, right: 14 },
    didParseCell: (cellData) => {
      const raw = String(cellData.cell.raw || "");
      const hasAmharic = /[\u1200-\u137F]/.test(raw);
      cellData.cell.styles.font = hasAmharic
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

// ─────────────────────────────────────────────────────────────────────────────
// ✅ RENDER FUNCTIONS with proper setSmartFont usage
// ─────────────────────────────────────────────────────────────────────────────

function renderAttendanceReport(doc, data, labels, yPos, lang, setSmartFont) {
  const attendance = data?.attendance || [];
  const total = attendance.length;
  const present = attendance.filter((a) => a.attended).length;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  // Summary table
  const summaryRows = [
    [labels.total, String(total)],
    [labels.present, String(present)],
    [labels.absent, String(absent)],
    [labels.attendanceRate, `${rate}%`],
  ];

  yPos = createTable(
    doc,
    {
      headers: [labels.metric, labels.value],
      rows: summaryRows,
      startY: yPos,
      title: labels.attendanceReport,
      fontSize: 9,
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
      },
    },
    labels,
    lang,
    setSmartFont,
  );

  // Detailed attendance
  const presentWithSignatures = attendance.filter(
    (a) => a.attended && a.signature && a.signature.length > 100,
  );
  const presentWithoutSignature = attendance.filter(
    (a) => a.attended && (!a.signature || a.signature.length <= 100),
  );
  const absentEmployees = attendance.filter((a) => !a.attended);
  const sortedAttendance = [
    ...presentWithSignatures,
    ...presentWithoutSignature,
    ...absentEmployees,
  ];

  const headers = [
    labels.name,
    labels.department,
    labels.email,
    labels.status,
    labels.signature,
    labels.checkedInAt,
    labels.feedback,
  ];

  const rows = sortedAttendance.map((a) => {
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

  yPos = createTable(
    doc,
    {
      headers: headers,
      rows: rows,
      startY: yPos,
      title: labels.detailedAttendance,
      fontSize: 7,
      rowHeight: 7,
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: "auto" },
      },
    },
    labels,
    lang,
    setSmartFont,
  );

  return yPos;
}

function renderSessionsReport(doc, data, labels, yPos, lang, setSmartFont) {
  const sessions = data?.sessions || [];

  const headers = [
    labels.titleLabel,
    labels.date,
    labels.presenter,
    labels.rating,
    labels.status,
    labels.attendees,
  ];

  const rows = sessions.map((s) => [
    s.presentationTitle || s.title || labels.untitled,
    new Date(s.date).toLocaleDateString(
      lang === "am" ? "am-ET" : lang === "om" ? "om-ET" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    ),
    s.presenterName || labels.na,
    s.averageRating ? `${s.averageRating.toFixed(1)} ★` : labels.na,
    s.status || labels.unknown,
    String(s.attendees?.length || 0),
  ]);

  yPos = createTable(
    doc,
    {
      headers: headers,
      rows: rows,
      startY: yPos,
      title: labels.sessionsReport,
      fontSize: 7,
      rowHeight: 7,
    },
    labels,
    lang,
    setSmartFont,
  );

  return yPos;
}

function renderGalleryReport(doc, data, labels, yPos, lang, setSmartFont) {
  const photos = data?.photos || [];

  const headers = [
    labels.titleLabel,
    labels.category,
    labels.date,
    labels.uploadedBy,
  ];

  const rows = photos.map((p) => [
    p.title || labels.untitled,
    p.category || labels.other,
    new Date(p.createdAt).toLocaleDateString(
      lang === "am" ? "am-ET" : lang === "om" ? "om-ET" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    ),
    p.uploadedByName || labels.unknown,
  ]);

  yPos = createTable(
    doc,
    {
      headers: headers,
      rows: rows,
      startY: yPos,
      title: labels.galleryReport,
      fontSize: 7,
      rowHeight: 7,
    },
    labels,
    lang,
    setSmartFont,
  );

  return yPos;
}

function renderExperiencesReport(doc, data, labels, yPos, lang, setSmartFont) {
  const experiences = data?.experiences || [];

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
    (e.whatILearned || "").substring(0, 60) +
      ((e.whatILearned || "").length > 60 ? "..." : ""),
    `${e.relevanceRating || 0}/5`,
    e.wouldRecommend ? "✅" : "❌",
    new Date(e.createdAt).toLocaleDateString(
      lang === "am" ? "am-ET" : lang === "om" ? "om-ET" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    ),
  ]);

  yPos = createTable(
    doc,
    {
      headers: headers,
      rows: rows,
      startY: yPos,
      title: labels.experiencesReport,
      fontSize: 7,
      rowHeight: 7,
    },
    labels,
    lang,
    setSmartFont,
  );

  return yPos;
}

function renderResultsReport(doc, data, labels, yPos, lang, setSmartFont) {
  const results = data?.results || [];

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
    (r.whatIApplied || "").substring(0, 50) +
      ((r.whatIApplied || "").length > 50 ? "..." : ""),
    (r.measurableOutcome || "").substring(0, 50) +
      ((r.measurableOutcome || "").length > 50 ? "..." : ""),
    r.outcomeCategory || labels.other,
    new Date(r.createdAt).toLocaleDateString(
      lang === "am" ? "am-ET" : lang === "om" ? "om-ET" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    ),
  ]);

  yPos = createTable(
    doc,
    {
      headers: headers,
      rows: rows,
      startY: yPos,
      title: labels.resultsReport,
      fontSize: 7,
      rowHeight: 7,
    },
    labels,
    lang,
    setSmartFont,
  );

  return yPos;
}

function renderPerformanceReport(doc, data, labels, yPos, lang, setSmartFont) {
  const performance = data?.performance || [];

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

  yPos = createTable(
    doc,
    {
      headers: headers,
      rows: rows,
      startY: yPos,
      title: labels.performanceReport,
      fontSize: 7,
      rowHeight: 7,
    },
    labels,
    lang,
    setSmartFont,
  );

  return yPos;
}

function renderInsightsReport(doc, data, labels, yPos, lang, setSmartFont) {
  // Metrics
  if (data?.metrics && Object.keys(data.metrics).length > 0) {
    const metricsRows = Object.entries(data.metrics).map(([key, val]) => [
      key,
      String(val),
    ]);

    yPos = createTable(
      doc,
      {
        headers: [labels.metric, labels.value],
        rows: metricsRows,
        startY: yPos,
        title: labels.insightsReport,
        fontSize: 9,
        rowHeight: 7,
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
        },
      },
      labels,
      lang,
      setSmartFont,
    );
  }

  // AI Insights
  if (data?.insights && data.insights.length > 0) {
    const insightRows = data.insights.map((insight) => [
      insight.title || "",
      (insight.description || "").substring(0, 60) +
        ((insight.description || "").length > 60 ? "..." : ""),
      insight.confidence
        ? `${(insight.confidence * 100).toFixed(0)}%`
        : labels.na,
    ]);

    yPos = createTable(
      doc,
      {
        headers: [labels.titleLabel, labels.descriptionCol, labels.confidence],
        rows: insightRows,
        startY: yPos,
        title: labels.aiSuggestions,
        fontSize: 7,
        rowHeight: 7,
      },
      labels,
      lang,
      setSmartFont,
    );
  }

  return yPos;
}

function renderGeneralReport(doc, labels, yPos, setSmartFont) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const text = "No data available for this report type.";
  setSmartFont(text, false);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(encodeText(text), pageWidth / 2, yPos, {
    align: "center",
  });
  return yPos + 10;
}

// ─── Default export ──────────────────────────────────────────────────────────
export default generateGoldenMondayReportPDF;
