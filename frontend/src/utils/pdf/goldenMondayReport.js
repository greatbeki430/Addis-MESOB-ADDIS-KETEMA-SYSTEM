// frontend/src/utils/pdf/goldenMondayReport.js
// Golden Monday Report PDF Generator - Based on dailyReport.js pattern

import { createPDF } from "../pdfEngine";
import { encodeText, isAmharic } from "../language";
import { loadFonts } from "../fontLoader";
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

// ─────────────────────────────────────────────────────────────────────────────
// ✅ MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate Golden Monday Report PDF
 * @param {Object} data - Report data (attendance, sessions, gallery)
 * @param {string} reportType - 'attendance', 'sessions', 'gallery'
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

    const lang = options?.language || "am";
    const labels = getLabels(lang);

    // Create PDF engine
    const engine = createPDF({
      orientation: "landscape",
      theme: "daily",
    });

    const doc = engine.getDoc();
    loadFonts(doc, { silent: false });

    const setSmartFont = (text, bold = false) => {
      try {
        const hasAmharic = isAmharic(text);
        const style = bold ? "bold" : "normal";
        if (hasAmharic) {
          doc.setFont(
            doc.__hasEthiopicFont ? "NotoSansEthiopic" : "helvetica",
            style,
          );
        } else {
          doc.setFont(doc.__hasLatinFont ? "Roboto" : "helvetica", style);
        }
      } catch (_error) {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        console.debug("PDF metadata could not be set:", _error.message);
      }
    };

    // ─── Document properties ──────────────────────────────────────────────
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
      // Silently handle metadata error - non-critical for PDF generation
      console.debug("PDF metadata could not be set:", _error.message);
    }

    // ─── Title ────────────────────────────────────────────────────────────
    setSmartFont(labels.title, true);
    doc.setFontSize(20);
    doc.text(encodeText(labels.title), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 12;

    // ─── Subtitle ──────────────────────────────────────────────────────────
    setSmartFont(labels.subtitle, false);
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(encodeText(labels.subtitle), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // ─── Date ──────────────────────────────────────────────────────────────
    const reportDate = date || new Date().toISOString().split("T")[0];
    const ethiopianDate = formatEthiopianDateAmharic(new Date());
    const dateText = `${labels.reportDate}: ${reportDate} (${ethiopianDate})`;

    setSmartFont(dateText, false);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(encodeText(dateText), pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    doc.setTextColor(0, 0, 0);

    // ─── Separator ─────────────────────────────────────────────────────────
    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    // ─── Content based on report type ────────────────────────────────────
    switch (reportType) {
      case "attendance":
        yPos = renderAttendanceReport(doc, data, labels, yPos);
        break;
      case "sessions":
        yPos = renderSessionsReport(doc, data, labels, yPos);
        break;
      case "gallery":
        yPos = renderGalleryReport(doc, data, labels, yPos);
        break;
      default:
        yPos = renderGeneralReport(doc, labels, yPos);
    }

    // ─── Footer ────────────────────────────────────────────────────────────
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

      setSmartFont(`${labels.page} ${i} ${labels.of} ${pageCount}`, false);
      doc.text(
        `${labels.page} ${i} ${labels.of} ${pageCount}`,
        pageWidth - 15,
        footerY,
        { align: "right" },
      );
    }

    // ─── Save ──────────────────────────────────────────────────────────────
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

// ─── Helper: Get labels ────────────────────────────────────────────────────
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
    footer: isAm
      ? "በአዲስ መሶብ የወርቃማ ሰኞ ሪፖርት"
      : isOm
        ? "A-MESOB Wiixata Warqee Gabaasa"
        : "A-MESOB Golden Monday Report",
    page: isAm ? "ገጽ" : isOm ? "Fuula" : "Page",
    of: isAm ? "ከ" : isOm ? "keessaa" : "of",
    // Attendance labels
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
    // Sessions labels
    titleLabel: isAm ? "ርዕስ" : isOm ? "Mataduree" : "Title",
    date: isAm ? "ቀን" : isOm ? "Guyyaa" : "Date",
    presenter: isAm ? "አቅራቢ" : isOm ? "Dhiheessituu" : "Presenter",
    rating: isAm ? "ደረጃ" : isOm ? "Sadarkaa" : "Rating",
    // Gallery labels
    category: isAm ? "ምድብ" : isOm ? "Ramaddii" : "Category",
    uploadedBy: isAm ? "ያስገባው" : isOm ? "Kan fe'e" : "Uploaded By",
    untitled: isAm ? "ርዕስ የሌለው" : isOm ? "Mataduree hin qabne" : "Untitled",
  };
}

// ─── RENDER ATTENDANCE REPORT ─────────────────────────────────────────────
function renderAttendanceReport(doc, data, labels, yPos) {
  const attendance = data?.attendance || [];
  const total = attendance.length;
  const present = attendance.filter((a) => a.attended).length;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  // Summary box
  const summaryText = `${labels.total}: ${total}  |  ${labels.present}: ${present}  |  ${labels.absent}: ${absent}  |  ${labels.attendanceRate}: ${rate}%`;

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(encodeText(summaryText), pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Table
  const head = [
    [
      labels.name,
      labels.department,
      labels.email,
      labels.status,
      labels.signature,
    ],
  ];
  const body = attendance.map((a) => [
    a.name || "Unknown",
    a.department || "N/A",
    a.email || "N/A",
    a.attended ? `✅ ${labels.present}` : `❌ ${labels.absent}`,
    a.signature ? `✓ ${labels.signed}` : `✗ ${labels.notSigned}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head,
    body,
    theme: "striped",
    headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
    },
  });

  return doc.lastAutoTable.finalY + 10;
}

// ─── RENDER SESSIONS REPORT ──────────────────────────────────────────────
function renderSessionsReport(doc, data, labels, yPos) {
  const sessions = data?.sessions || [];

  const head = [
    [
      labels.titleLabel,
      labels.date,
      labels.presenter,
      labels.rating,
      labels.status,
    ],
  ];
  const body = sessions.map((s) => [
    s.presentationTitle || s.title || labels.untitled,
    new Date(s.date).toLocaleDateString(),
    s.presenterName || "N/A",
    s.averageRating ? `${s.averageRating.toFixed(1)} ★` : "N/A",
    s.status || "Unknown",
  ]);

  autoTable(doc, {
    startY: yPos,
    head,
    body,
    theme: "striped",
    headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
  });

  return doc.lastAutoTable.finalY + 10;
}

// ─── RENDER GALLERY REPORT ────────────────────────────────────────────────
function renderGalleryReport(doc, data, labels, yPos) {
  const photos = data?.photos || [];

  const head = [
    [labels.titleLabel, labels.category, labels.date, labels.uploadedBy],
  ];
  const body = photos.map((p) => [
    p.title || labels.untitled,
    p.category || "Other",
    new Date(p.createdAt).toLocaleDateString(),
    p.uploadedByName || "Unknown",
  ]);

  autoTable(doc, {
    startY: yPos,
    head,
    body,
    theme: "striped",
    headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
  });

  return doc.lastAutoTable.finalY + 10;
}

// ─── RENDER GENERAL REPORT ────────────────────────────────────────────────
function renderGeneralReport(doc, labels, yPos) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(
    encodeText("No data available for this report type."),
    pageWidth / 2,
    yPos,
    { align: "center" },
  );
  return yPos + 10;
}
