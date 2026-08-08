// frontend/src/utils/reportExport.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadFonts, FONT_NAMES } from "./pdf/fontLoader";
import { getEthiopianDate, drawMixedScriptText } from "./pdf/pdfHelpers";
import { isAmharic } from "./pdf/language";
import { showErrorToast, showSuccessToast } from "./toastHelper";

// ─── GREGORIAN MONTH NAMES IN AMHARIC ──────────────────────
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

// ─── Helper: Format Gregorian date in Amharic ──────────────
const formatGregorianDateAmharic = (date = new Date()) => {
  const monthIdx = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${GREGORIAN_MONTHS_AM[monthIdx]} ${day}, ${year}`;
};

// ─── Helper: Format Ethiopian date in Amharic ───────────────
const formatEthiopianDateAmharic = (date = new Date()) => {
  return getEthiopianDate(date);
};

// ─── EXPORT TO EXCEL ──────────────────────────────────────────
export const exportReportToExcel = (
  reportData,
  reportType,
  period,
  teamName,
  t,
) => {
  if (!reportData || !reportData.data || reportData.data.length === 0) {
    const msg = t?.report?.noDataToExport || "No data to export.";
    showErrorToast?.(msg) || alert(msg);
    return false;
  }

  const tr = (key, fallback) => t?.report?.[key] || fallback;

  const wsData = [
    [
      "#",
      tr("date", "Date"),
      tr("team", "Team"),
      tr("typeCol", "Type"),
      tr("descriptionCol", "Description"),
      tr("value", "Value"),
      tr("status", "Status"),
    ],
    ...reportData.data.map((item, idx) => [
      idx + 1,
      item.date || "",
      item.team || "",
      item.type || "",
      item.description || "",
      item.value || 0,
      item.status || "",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tr("report", "Report"));

  ws["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
  ];

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(
    blob,
    `${reportType}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
  showSuccessToast?.(tr("exportSuccess", "Excel exported successfully!"));
  return true;
};

// ─── EXPORT TO WORD ───────────────────────────────────────────
export const exportReportToWord = (
  reportData,
  reportType,
  period,
  teamName,
  t,
  preparedBy = "",
  preparedByDisplay = "",
) => {
  if (!reportData || !reportData.data || reportData.data.length === 0) {
    const msg = t?.report?.noDataToExport || "No data to export.";
    showErrorToast?.(msg) || alert(msg);
    return false;
  }

  const tr = (key, fallback) => t?.report?.[key] || fallback;
  const reportTypeDisplay =
    reportType.charAt(0).toUpperCase() + reportType.slice(1);

  const ethiopianDate = formatEthiopianDateAmharic(new Date());
  const gregorianDate = formatGregorianDateAmharic(new Date());

  let preparedByText = preparedBy || "Administrator";
  if (preparedByDisplay) {
    preparedByText += ` (${preparedByDisplay})`;
  }

  // Combine all info into one line
  const infoLine =
    `${tr("generated", "Generated")}: ${gregorianDate} (GC) | ${ethiopianDate}, ` +
    `${tr("team", "Team")}: ${teamName || tr("allTeams", "All Teams")}, ` +
    `${tr("period", "Period")}: ${period}, ` +
    `${tr("preparedBy", "Prepared By")}: ${preparedByText}`;

  const tableRows = reportData.data
    .map(
      (item, idx) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.date || ""}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.team || ""}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.type || ""}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.description || ""}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.value || 0}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.status || ""}</td>
      </tr>
    `,
    )
    .join("");

  const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTypeDisplay} ${tr("report", "Report")}</title>
        <style>
          body { font-family: 'Noto Sans Ethiopic', Arial, sans-serif; padding: 20px; }
          h1 { color: #1a6b4a; font-size: 24px; text-align: center; }
          .subtitle { text-align: center; color: #666; font-size: 14px; margin-top: -5px; }
          .info-line { margin: 8px 0; font-size: 11px; color: #555; text-align: center; }
          .info-line strong { color: #333; }
          .divider { border-top: 2px solid #1a6b4a; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
          th { background-color: #1a6b4a; color: white; padding: 8px; text-align: left; border: 1px solid #ddd; }
          td { padding: 6px 8px; border: 1px solid #ddd; }
          .footer { margin-top: 20px; color: #999; font-size: 11px; text-align: center; border-top: 1px solid #ddd; padding-top: 12px; }
        </style>
      </head>
      <body>
        <h1>📊 ${reportTypeDisplay} ${tr("report", "Report")}</h1>
        <div class="subtitle">የአዲስ አበባ ከተማ አስተዳደር · የህዝብ አገልግሎት ቢሮ</div>
        <div class="subtitle" style="font-size: 11px; color: #999;">Addis Ababa City Administration · Public Service Bureau</div>

        <div class="divider"></div>

        <div class="info-line">${infoLine}</div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${tr("date", "Date")}</th>
              <th>${tr("team", "Team")}</th>
              <th>${tr("typeCol", "Type")}</th>
              <th>${tr("descriptionCol", "Description")}</th>
              <th>${tr("value", "Value")}</th>
              <th>${tr("status", "Status")}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>

        <div class="footer">
          ${tr("footerText", "Generated by A-MESOB Report Generator")} © ${new Date().getFullYear()}
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], {
    type: "application/msword;charset=utf-8",
  });
  saveAs(
    blob,
    `${reportType}_report_${new Date().toISOString().split("T")[0]}.doc`,
  );
  showSuccessToast?.(tr("exportSuccess", "Word exported successfully!"));
  return true;
};

// ─── EXPORT TO PDF ────────────────────────────────────────────
export const exportReportToPDF = (
  reportData,
  reportType,
  period,
  teamName,
  t,
  preparedBy = "",
  preparedByDisplay = "",
) => {
  if (!reportData || !reportData.data || reportData.data.length === 0) {
    const msg = t?.report?.noDataToExport || "No data to export.";
    showErrorToast?.(msg) || alert(msg);
    return false;
  }

  const tr = (key, fallback) => t?.report?.[key] || fallback;
  const reportTypeDisplay =
    reportType.charAt(0).toUpperCase() + reportType.slice(1);

  let preparedByText = preparedBy || "Administrator";
  if (preparedByDisplay) {
    preparedByText += ` (${preparedByDisplay})`;
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

  // ─── TITLE ──────────────────────────────────────────────────
  const titleText = `${reportTypeDisplay} ${tr("report", "Report")}`;
  doc.setFontSize(22);
  doc.setTextColor(26, 107, 74);
  drawMixedScriptText(doc, titleText, pageWidth / 2, yPos, {
    align: "center",
    bold: true,
  });
  yPos += 10;

  // ─── SUBTITLE ──────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const amharicSubtitle = "የአዲስ አበባ ከተማ አስተዳደር · የህዝብ አገልግሎት ቢሮ";
  drawMixedScriptText(doc, amharicSubtitle, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 6;

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  const englishSubtitle =
    "Addis Ababa City Administration · Public Service Bureau";
  drawMixedScriptText(doc, englishSubtitle, pageWidth / 2, yPos, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // ─── DIVIDER ─────────────────────────────────────────────────
  doc.setDrawColor(26, 107, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ─── INFO LINE (single line with all info) ──────────────────
  const ethiopianDate = formatEthiopianDateAmharic(new Date());
  const gregorianDate = formatGregorianDateAmharic(new Date());

  // Build single info line
  const infoLine =
    `${tr("generated", "Generated")}: ${gregorianDate} (GC) | ${ethiopianDate}, ` +
    `${tr("team", "Team")}: ${teamName || tr("allTeams", "All Teams")}, ` +
    `${tr("period", "Period")}: ${period}, ` +
    `${tr("preparedBy", "Prepared By")}: ${preparedByText}`;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Draw the info line - centered, will wrap if needed
  const maxWidth = pageWidth - margin * 2;
  const lines = doc.splitTextToSize(infoLine, maxWidth);
  lines.forEach((line) => {
    drawMixedScriptText(doc, line, pageWidth / 2, yPos, {
      align: "center",
      bold: false,
    });
    yPos += 6;
  });
  yPos += 4;

  // ─── DIVIDER ─────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ─── TABLE ──────────────────────────────────────────────────
  const tableHeaders = [
    "#",
    tr("date", "Date"),
    tr("team", "Team"),
    tr("typeCol", "Type"),
    tr("descriptionCol", "Description"),
    tr("value", "Value"),
    tr("status", "Status"),
  ];

  const tableBody = reportData.data.map((item, idx) => {
    let dateStr = item.date || "";
    if (dateStr && dateStr.includes("T")) {
      try {
        const d = new Date(dateStr);
        dateStr = d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch (e) {
        console.warn("Failed to format date:", dateStr, e);
        dateStr = dateStr.split("T")[0] || dateStr;
      }
    }
    return [
      String(idx + 1),
      dateStr,
      item.team || "",
      item.type || "",
      item.description || "",
      String(item.value || 0),
      item.status || "",
    ];
  });

  // ─── TABLE WITH FULL WIDTH ──────────────────────────────────
  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: {
      fillColor: [26, 107, 74],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: "auto", halign: "left" },
      3: { cellWidth: "auto", halign: "center" },
      4: { cellWidth: "auto", halign: "left" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
    },
    tableWidth: "auto", // ✅ Auto width to fill page
    rowHeight: 12,
    styles: {
      overflow: "linebreak",
      cellPadding: 3,
    },
    didParseCell: (data) => {
      const cellText = String(data.cell.raw || "");
      if (isAmharic(cellText)) {
        data.cell.styles.font = doc.__hasEthiopicFont
          ? FONT_NAMES.ethiopic
          : "helvetica";
      } else {
        data.cell.styles.font = doc.__hasLatinFont
          ? FONT_NAMES.latin
          : "helvetica";
      }
    },
  });

  yPos = doc.lastAutoTable?.finalY + 10 || yPos + 40;

  // ─── PAGE NUMBERS ───────────────────────────────────────────
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

  // ─── SAVE ────────────────────────────────────────────────────
  const filename = `${reportType}_report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);

  showSuccessToast?.(tr("exportSuccess", "PDF exported successfully!"));
  return true;
};
