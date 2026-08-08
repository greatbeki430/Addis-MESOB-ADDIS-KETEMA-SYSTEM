// frontend/src/utils/reportExport.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { loadFonts, FONT_NAMES } from "./pdf/fontLoader";
import { getEthiopianDate, drawMixedScriptText } from "./pdf/pdfHelpers";
import { isAmharic } from "./pdf/language";
import { showErrorToast, showSuccessToast } from "./toastHelper";

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
) => {
  if (!reportData || !reportData.data || reportData.data.length === 0) {
    const msg = t?.report?.noDataToExport || "No data to export.";
    showErrorToast?.(msg) || alert(msg);
    return false;
  }

  const tr = (key, fallback) => t?.report?.[key] || fallback;
  const reportTypeDisplay =
    reportType.charAt(0).toUpperCase() + reportType.slice(1);

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
        <title>${tr("report", "Report")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1a6b4a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1a6b4a; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .summary { margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
          .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 120px; }
          .summary-card h3 { margin: 0; color: #666; font-size: 12px; }
          .summary-card p { margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1a6b4a; }
          .footer { margin-top: 30px; color: #999; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>📊 ${reportTypeDisplay} ${tr("report", "Report")}</h1>
        <p><strong>${tr("generated", "Generated")}:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>${tr("team", "Team")}:</strong> ${teamName || tr("allTeams", "All Teams")}</p>
        <p><strong>${tr("period", "Period")}:</strong> ${period}</p>
        
        <div class="summary">
          <div class="summary-card"><h3>${tr("totalRecords", "Total Records")}</h3><p>${reportData.summary?.total || 0}</p></div>
          <div class="summary-card"><h3>${tr("completed", "Completed")}</h3><p>${reportData.summary?.completed || 0}</p></div>
          <div class="summary-card"><h3>${tr("pending", "Pending")}</h3><p>${reportData.summary?.pending || 0}</p></div>
          <div class="summary-card"><h3>${tr("average", "Average Value")}</h3><p>${reportData.summary?.average || 0}</p></div>
        </div>

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
        <div class="footer">${tr("footerText", "Generated by A-MESOB Report Generator")} © ${new Date().getFullYear()}</div>
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
) => {
  if (!reportData || !reportData.data || reportData.data.length === 0) {
    const msg = t?.report?.noDataToExport || "No data to export.";
    showErrorToast?.(msg) || alert(msg);
    return false;
  }

  const tr = (key, fallback) => t?.report?.[key] || fallback;
  const reportTypeDisplay =
    reportType.charAt(0).toUpperCase() + reportType.slice(1);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // ✅ Load fonts for Amharic support (reuses fontLoader)
  loadFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ─── TITLE SECTION ──────────────────────────────────────────
  // ✅ Amharic title with proper font
  const amharicTitle = `📊 ${reportTypeDisplay} ${tr("report", "Report")}`;
  doc.setFontSize(20);
  drawMixedScriptText(doc, amharicTitle, pageWidth / 2, yPos, {
    align: "center",
    bold: true,
  });
  yPos += 10;

  // ─── SUBTITLE ──────────────────────────────────────────────
  const amharicSubtitle = "የአዲስ አበባ ከተማ አስተዳደር · የህዝብ አገልግሎት ቢሮ";
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  drawMixedScriptText(doc, amharicSubtitle, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 6;

  const englishSubtitle =
    "Addis Ababa City Administration · Public Service Bureau";
  doc.setFontSize(9);
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

  // ─── REPORT INFO ────────────────────────────────────────────
  const ethiopianDate = getEthiopianDate();
  const gregorianDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const infoLines = [
    `${tr("generated", "Generated")}: ${gregorianDate} (GC) | ${ethiopianDate}`,
    `${tr("team", "Team")}: ${teamName || tr("allTeams", "All Teams")}`,
    `${tr("period", "Period")}: ${period}`,
  ];

  infoLines.forEach((line) => {
    drawMixedScriptText(doc, line, margin, yPos);
    yPos += 6;
  });
  yPos += 4;

  // ─── DIVIDER ─────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ─── SUMMARY CARDS ──────────────────────────────────────────
  const summaryData = [
    {
      label: tr("totalRecords", "Total Records"),
      value: reportData.summary?.total || 0,
      color: "#1a3aad",
    },
    {
      label: tr("completed", "Completed"),
      value: reportData.summary?.completed || 0,
      color: "#10b981",
    },
    {
      label: tr("pending", "Pending"),
      value: reportData.summary?.pending || 0,
      color: "#f59e0b",
    },
    {
      label: tr("average", "Average Value"),
      value: reportData.summary?.average || 0,
      color: "#1a3aad",
    },
  ];

  const cardWidth = (pageWidth - margin * 2) / summaryData.length - 4;
  summaryData.forEach((item, idx) => {
    const x = margin + idx * (cardWidth + 4);
    doc.setFillColor(240, 247, 244);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, yPos, cardWidth, 20, 2, 2, "FD");

    doc.setFontSize(12);
    doc.setTextColor(item.color);
    const valueStr = String(item.value);
    drawMixedScriptText(doc, valueStr, x + cardWidth / 2, yPos + 6, {
      align: "center",
      bold: true,
    });

    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    drawMixedScriptText(doc, item.label, x + cardWidth / 2, yPos + 14, {
      align: "center",
    });
  });
  yPos += 28;

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

  const tableBody = reportData.data.map((item, idx) => [
    String(idx + 1),
    item.date || "",
    item.team || "",
    item.type || "",
    item.description || "",
    String(item.value || 0),
    item.status || "",
  ]);

  // ✅ Use autoTable with Amharic font support
  doc.autoTable({
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
      font: FONT_NAMES.ethiopic,
    },
    bodyStyles: {
      fontSize: 7,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 30, halign: "left" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 40, halign: "left" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
    },
    tableWidth: pageWidth - margin * 2,
    rowHeight: 12,
    styles: {
      overflow: "linebreak",
      cellPadding: 3,
      font: FONT_NAMES.ethiopic,
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

  // ─── FOOTER ──────────────────────────────────────────────────
  if (yPos > pageHeight - 20) {
    doc.addPage();
    yPos = margin;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);

  const footerText = `${tr("footerText", "Generated by A-MESOB Report Generator")} © ${new Date().getFullYear()} | ${ethiopianDate}`;
  drawMixedScriptText(doc, footerText, pageWidth / 2, yPos, {
    align: "center",
  });

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
