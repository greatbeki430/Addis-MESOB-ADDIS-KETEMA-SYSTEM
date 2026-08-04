// frontend/src/utils/pdfExport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { showErrorToast, showSuccessToast } from "./toastHelper";
import { loadFonts, FONT_NAMES } from "./pdf/fontLoader";
import { isAmharic } from "./pdf/language";

// Helper: Get Ethiopian date
const getEthiopianDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const ethiopianYear = year - 8;
  return `${day}/${month}/${ethiopianYear} ዓ.ም`;
};

// Helper: Format time
const formatTime = (timeStr) => {
  if (!timeStr) return "___";
  return timeStr;
};

// ✅ Helper: Ensure text is properly encoded for PDF (Unicode/UTF-8 support)
const encodeText = (text) => {
  if (!text) return "";
  return String(text);
};

// ✅ Export Forum Report to PDF
export const exportForumReportToPDF = (formData, t, meetingNumber = 1) => {
  try {
    console.log("📄 Generating Forum Report PDF...");

    // Check if there's data to export
    const hasData =
      formData?.present?.some((m) => m && m.trim() !== "") ||
      formData?.absent?.some((item) => item?.name && item.name.trim() !== "") ||
      // formData?.topics?.some((t) => t && t.trim() !== "");
      formData?.topics?.some((topic) => topic && topic.trim() !== "");

    if (!hasData) {
      showErrorToast(
        "No data to export. Please fill in some information first.",
      );
      return false;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      encodeText(t.forum?.title || "Peer Forum Report"),
      pageWidth / 2,
      yPos,
      {
        align: "center",
      },
    );
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(encodeText(t.forum?.subtitle || ""), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Meeting info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Meeting #${meetingNumber || 1}`, margin, yPos);
    const displayDate = formData?.date || getEthiopianDate();
    doc.text(`Date: ${displayDate}`, pageWidth - margin - 50, yPos, {
      align: "right",
    });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `⏰ Time: ${formatTime(formData?.timeStart)} - ${formatTime(formData?.timeEnd)}`,
      margin,
      yPos,
    );
    yPos += 12;

    // Present Members
    doc.setFillColor(26, 107, 74);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    doc.text(
      encodeText(t.forum?.presentMembers || "Present Members"),
      margin + 2,
      yPos,
    );
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const presentMembers =
      formData?.present?.filter((m) => m && m.trim() !== "") || [];
    if (presentMembers.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [
          [
            encodeText(t.forum?.memberN || "No."),
            encodeText(t.forum?.name || "Name"),
          ],
        ],
        body: presentMembers.map((name, idx) => [
          `${idx + 1}`,
          encodeText(name),
        ]),
        margin: { left: margin, right: margin },
        theme: "striped",
        headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 9 },
      });
      yPos = doc.lastAutoTable?.finalY + 8 || yPos + 20;
    } else {
      doc.setFontSize(10);
      doc.text("—", margin, yPos);
      yPos += 8;
    }

    // Absent Members
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(139, 26, 26);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    doc.text(
      encodeText(t.forum?.absentMembers || "Absent Members"),
      margin + 2,
      yPos,
    );
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const absentMembers =
      formData?.absent?.filter(
        (item) => item?.name && item.name.trim() !== "",
      ) || [];
    if (absentMembers.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [
          [
            encodeText(t.forum?.memberN || "No."),
            encodeText(t.forum?.name || "Name"),
            encodeText(t.forum?.reason || "Reason"),
          ],
        ],
        body: absentMembers.map((item, idx) => [
          `${idx + 1}`,
          encodeText(item.name),
          encodeText(item.reason || "—"),
        ]),
        margin: { left: margin, right: margin },
        theme: "striped",
        headStyles: { fillColor: [139, 26, 26], textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 9 },
      });
      yPos = doc.lastAutoTable?.finalY + 8 || yPos + 20;
    } else {
      doc.setFontSize(10);
      doc.text("All members present", margin, yPos);
      yPos += 8;
    }

    // Previous Results
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    doc.text(
      encodeText(t.forum?.prevResults || "Previous Results"),
      margin + 2,
      yPos,
    );
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const prevResults =
      formData?.prevResults?.filter((r) => r && r.trim() !== "") || [];
    if (prevResults.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", encodeText("Result")]],
        body: prevResults.map((result, idx) => [
          `${idx + 1}`,
          encodeText(result),
        ]),
        margin: { left: margin, right: margin },
        theme: "plain",
        bodyStyles: { fontSize: 9 },
      });
      yPos = doc.lastAutoTable?.finalY + 8 || yPos + 20;
    } else {
      doc.setFontSize(10);
      doc.text("—", margin, yPos);
      yPos += 8;
    }

    // Discussion Topics
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(46, 125, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    doc.text(
      encodeText(t.forum?.todayTopics || "Discussion Topics"),
      margin + 2,
      yPos,
    );
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const topics =
      formData?.topics?.filter((topic) => topic && topic.trim() !== "") || [];
    if (topics.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", encodeText(t.forum?.topic || "Topic")]],
        body: topics.map((topic, idx) => [`${idx + 1}`, encodeText(topic)]),
        margin: { left: margin, right: margin },
        theme: "striped",
        bodyStyles: { fontSize: 9 },
      });
      yPos = doc.lastAutoTable?.finalY + 6 || yPos + 20;
    }

    // Standing Agendas
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      encodeText(t.forum?.standingAgendas || "Standing Agendas:"),
      margin,
      yPos,
    );
    yPos += 5;

    const standingAgendas = t?.agendas || [];
    const agendasPerRow = 2;
    const agendaWidth = (pageWidth - margin * 2) / agendasPerRow;
    let agendaX = margin;

    standingAgendas.slice(0, 4).forEach((agenda, idx) => {
      if (idx % agendasPerRow === 0 && idx > 0) {
        agendaX = margin;
        yPos += 6;
      }
      doc.text(`☐ ${encodeText(agenda)}`, agendaX, yPos);
      agendaX += agendaWidth;
    });
    yPos += 12;

    // Explanation
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    doc.text(
      encodeText(t.forum?.explanation || "Explanation"),
      margin + 2,
      yPos,
    );
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const explanationText = formData?.explanation || "—";
    const splitExplanation = doc.splitTextToSize(
      encodeText(explanationText),
      pageWidth - margin * 2,
    );
    doc.text(splitExplanation, margin, yPos);
    yPos += splitExplanation.length * 5 + 8;

    // Gaps
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(194, 90, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    doc.text(encodeText(t.forum?.gaps || "Identified Gaps"), margin + 2, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const gaps = formData?.gaps?.filter((g) => g && g.trim() !== "") || [];
    if (gaps.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", encodeText("Gap Identified")]],
        body: gaps.map((gap, idx) => [`${idx + 1}`, encodeText(gap)]),
        margin: { left: margin, right: margin },
        theme: "striped",
        headStyles: { fillColor: [194, 90, 0], textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 9 },
      });
      yPos = doc.lastAutoTable?.finalY + 8 || yPos + 20;
    } else {
      doc.setFontSize(10);
      doc.text("—", margin, yPos);
      yPos += 8;
    }

    // Agreements
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(26, 107, 74);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    doc.text(
      encodeText(t.forum?.agreements || "Agreed Points"),
      margin + 2,
      yPos,
    );
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const agreements =
      formData?.agreements?.filter((a) => a && a.trim() !== "") || [];
    if (agreements.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", encodeText("Agreed Point")]],
        body: agreements.map((agreement, idx) => [
          `${idx + 1}`,
          encodeText(agreement),
        ]),
        margin: { left: margin, right: margin },
        theme: "striped",
        headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 9 },
      });
      yPos = doc.lastAutoTable?.finalY + 8 || yPos + 20;
    } else {
      doc.setFontSize(10);
      doc.text("—", margin, yPos);
      yPos += 8;
    }

    // Signatures
    if (yPos > 230) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(encodeText(t.forum?.signatures || "Signatures"), margin, yPos);
    yPos += 10;

    const signatureCount = 7;
    const sigsPerRow = 3;
    const sigWidth = (pageWidth - margin * 2) / sigsPerRow;
    let sigX = margin;

    for (let i = 0; i < signatureCount; i++) {
      if (i % sigsPerRow === 0 && i > 0) {
        sigX = margin;
        yPos += 20;
      }
      doc.setDrawColor(100, 100, 100);
      doc.line(sigX, yPos, sigX + sigWidth - 10, yPos);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        encodeText(`${i + 1}${t.forum?.signatureN || "th Signature"}`),
        sigX,
        yPos - 3,
      );
      sigX += sigWidth;
    }

    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by Addis MESOB One-Stop Service Center · ${getEthiopianDate()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" },
      );
    }

    doc.save(`forum_report_${displayDate.replace(/\//g, "-")}.pdf`);
    console.log("✅ Forum Report PDF generated successfully!");

    showSuccessToast("📄 Forum Report PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Forum Report PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};

// Export Daily Report to PDF
export const exportDailyReportToPDF = (rows, date, t) => {
  try {
    console.log("📄 Generating Daily Report PDF...");

    if (!rows || rows.length === 0) {
      showErrorToast("No data to export. Please add some data first.");
      return false;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(
      encodeText(t.dailyReport?.title || "Daily Report"),
      pageWidth / 2,
      yPos,
      {
        align: "center",
      },
    );
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const reportDate = date || getEthiopianDate();
    doc.text(`Report Date: ${reportDate}`, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 12;

    const grandTotal = rows.reduce((sum, row) => sum + (row.total || 0), 0);
    const grandMale = rows.reduce((sum, row) => sum + (row.male || 0), 0);
    const grandFemale = rows.reduce((sum, row) => sum + (row.female || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          encodeText(t.dailyReport?.colNo || "#"),
          encodeText(t.dailyReport?.colDept || "Department"),
          encodeText(t.dailyReport?.colService || "Service"),
          encodeText(t.dailyReport?.colMale || "Male"),
          encodeText(t.dailyReport?.colFemale || "Female"),
          encodeText(t.dailyReport?.colTotal || "Total"),
        ],
      ],
      body: rows.map((row, idx) => [
        idx + 1,
        encodeText(row.dept || "—"),
        encodeText(row.service || "—"),
        row.male || 0,
        row.female || 0,
        row.total || 0,
      ]),
      foot: [
        [
          "",
          "",
          encodeText(t.dailyReport?.grandTotal || "Grand Total"),
          grandMale,
          grandFemale,
          grandTotal,
        ],
      ],
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
      footStyles: {
        fillColor: [240, 247, 244],
        textColor: [26, 107, 74],
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9 },
    });

    doc.save(`daily_report_${reportDate.replace(/\//g, "-")}.pdf`);
    console.log("✅ Daily Report PDF generated successfully!");

    showSuccessToast("📄 Daily Report PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Daily Report PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};

// Export Evaluation Report to PDF (with Comments Support)
// Helper: pick the right embedded font for whatever script the text uses
// FIXED: previously switched to a mismatched "-Bold" family name while
// hardcoding the style to "normal" (the same bug as dailyReport.js's
// setSmartFont). FONT_NAMES.ethiopic/latin now resolve to the one
// registered family for both weights — only pass the real style through.

// Export Evaluation Report to PDF (Amharic-safe + signatures - ONE TABLE)
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

    // ─── Helper Functions ──────────────────────────────────────
    const setSmartFont = (doc, text, bold = false) => {
      const style = bold ? "bold" : "normal";
      if (isAmharic(text)) {
        doc.setFont(FONT_NAMES.ethiopic, style);
      } else {
        doc.setFont(FONT_NAMES.latin, style);
      }
    };

    // ─── TITLE SECTION ─────────────────────────────────────────
    // Main Title - Amharic
    const amharicTitle = "የሥራ አፈጻጸም ሪፖርት";
    doc.setFontSize(22);
    setSmartFont(doc, amharicTitle, true);
    doc.text(amharicTitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    // Subtitle - Amharic
    const amharicSubtitle = "የአዲስ አበባ ከተማ አስተዳደር · የህዝብ አገልግሎት ቢሮ";
    doc.setFontSize(11);
    setSmartFont(doc, amharicSubtitle, false);
    doc.text(amharicSubtitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 7;

    // Subtitle - English
    const englishSubtitle =
      "Addis Ababa City Administration · Public Service Bureau";
    doc.setFontSize(9);
    setSmartFont(doc, englishSubtitle, false);
    doc.setTextColor(100, 100, 100);
    doc.text(englishSubtitle, pageWidth / 2, yPos, { align: "center" });
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // ─── DIVIDER LINE ──────────────────────────────────────────
    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ─── REPORT DATE SECTION ──────────────────────────────────
    // Ethiopian Date (Amharic)
    const ethiopianDate = getEthiopianDate();
    doc.setFontSize(11);
    setSmartFont(doc, "የሪፖርት ቀን (በኢትዮጵያ አቆጣጠር)", true);
    doc.text(`የሪፖርት ቀን (በኢትዮጵያ አቆጣጠር): ${ethiopianDate}`, margin, yPos);
    yPos += 8;

    // Gregorian Date (English)
    const gregorianDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFontSize(10);
    setSmartFont(doc, "Report Date (Gregorian Calendar)", false);
    doc.text(
      `Report Date (Gregorian Calendar): ${gregorianDate}`,
      margin,
      yPos,
    );
    yPos += 10;

    // ─── BRANCH NAME ──────────────────────────────────────────
    const branchName = t?.evaluation?.branchName || "አዲስ ከተማ ቅርንጫፍ";
    doc.setFontSize(10);
    setSmartFont(doc, "ቅርንጫፍ", false);
    doc.text(`ቅርንጫፍ: ${branchName}`, margin, yPos);
    yPos += 12;

    // ─── TABLE HEADER ──────────────────────────────────────────
    doc.setFillColor(26, 107, 74);
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    setSmartFont(doc, "የቡድን አፈጻጸም ማጠቃለያ", true);
    doc.text("የቡድን አፈጻጸም ማጠቃለያ", margin + 2, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    // ─── BUILD TABLE DATA ─────────────────────────────────────
    const memberTotals = members.map((m) => ({
      name: m,
      total: totalScores(m),
    }));

    const sortedMembers = [...memberTotals].sort((a, b) => b.total - a.total);

    const tableHeaders = ["#", "የአባል ስም", "ውጤት", "ደረጃ", "ፊርማ", "ሁኔታ"];

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

      const memberIndex = members.indexOf(m.name);
      const comment = comments?.[memberIndex] || "";

      let statusText;
      if (hasSignature) {
        statusText = "✅ ተፈርሟል";
      } else if (comment) {
        statusText = "📝 አስተያየት";
      } else {
        statusText = "⏳ በመጠበቅ ላይ";
      }

      return [
        idx + 1,
        encodeText(m.name),
        m.total,
        rank,
        hasSignature
          ? { content: "signature", signature: signatureData }
          : "✗ አልተፈረመም",
        statusText,
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
      bodyStyles: {
        fontSize: 8,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 92, halign: "left" },
        2: { cellWidth: 28, halign: "center" },
        3: { cellWidth: 35, halign: "center" },
        4: { cellWidth: 60, halign: "center", minCellHeight: 14 },
        5: { cellWidth: 50, halign: "center" },
      },
      rowHeight: 16,
      styles: {
        font: FONT_NAMES.ethiopic,
        overflow: "linebreak",
      },
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
              cellData.cell.styles.cellWidth = 60;
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
                const imgWidth = Math.min(cellWidth - 12, 45);
                const imgHeight = Math.min(cellHeight - 8, 14);
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
    if (bestPerformer) {
      const avgScore =
        sortedMembers.length > 0
          ? Math.round(
              sortedMembers.reduce((sum, m) => sum + m.total, 0) /
                sortedMembers.length,
            )
          : 0;

      // Best Performer - Amharic
      const bpTextAm = `🏆 ምርጥ አፈጻጸም: ${encodeText(bestPerformer)}`;
      doc.setFontSize(12);
      setSmartFont(doc, bpTextAm, true);
      doc.setTextColor(26, 107, 74);
      doc.text(bpTextAm, margin, yPos);
      yPos += 8;

      // Best Performer - English
      const bpTextEn = `🏆 Best Performer: ${encodeText(bestPerformer)}`;
      doc.setFontSize(10);
      setSmartFont(doc, bpTextEn, false);
      doc.setTextColor(60, 60, 60);
      doc.text(bpTextEn, margin, yPos);
      yPos += 8;

      // Average Score - Amharic
      const avgTextAm = `📊 አማካይ ውጤት: ${avgScore} / 100`;
      doc.setFontSize(11);
      setSmartFont(doc, avgTextAm, false);
      doc.setTextColor(0, 0, 0);
      doc.text(avgTextAm, margin, yPos);
      yPos += 7;

      // Average Score - English
      const avgTextEn = `📊 Average Score: ${avgScore} / 100`;
      doc.setFontSize(9);
      setSmartFont(doc, avgTextEn, false);
      doc.setTextColor(100, 100, 100);
      doc.text(avgTextEn, margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    }

    // ─── COMMENTS SECTION ─────────────────────────────────────
    if (comments && Object.keys(comments).length > 0) {
      const hasComments = Object.values(comments).some(
        (c) => c && c.trim() !== "",
      );

      if (hasComments) {
        if (yPos > 170) {
          doc.addPage();
          yPos = margin;
        }

        // Amharic header
        doc.setFontSize(14);
        setSmartFont(doc, "የግለሰብ አስተያየቶች", true);
        doc.text("የግለሰብ አስተያየቶች", margin, yPos);
        yPos += 7;

        // English sub-header
        doc.setFontSize(10);
        setSmartFont(doc, "Individual Feedback & Comments", false);
        doc.setTextColor(100, 100, 100);
        doc.text("Individual Feedback & Comments", margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        const memberList = members.filter((m) => m.trim() !== "");
        memberList.forEach((member, idx) => {
          const comment = comments[idx] || "ምንም አስተያየት የለም";

          if (yPos > 190) {
            doc.addPage();
            yPos = margin;
          }

          // Member name - Amharic & English
          const memberLabelAm = `${encodeText(member)}:`;
          doc.setFontSize(10);
          setSmartFont(doc, memberLabelAm, true);
          doc.setTextColor(26, 107, 74);
          doc.text(memberLabelAm, margin, yPos);
          yPos += 5;

          // Comment content
          doc.setFontSize(9);
          setSmartFont(doc, comment, false);
          doc.setTextColor(50, 50, 50);
          const splitComment = doc.splitTextToSize(
            encodeText(comment),
            pageWidth - margin * 2 - 5,
          );
          doc.text(splitComment, margin + 4, yPos);
          yPos += splitComment.length * 4.5 + 6;

          if (idx < memberList.length - 1) {
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.line(margin + 4, yPos - 3, pageWidth - margin - 4, yPos - 3);
            yPos += 2;
          }
        });
      }
    }

    // ─── AI NARRATIVE SECTION ─────────────────────────────────
    if (includeAINarrative && aiNarrative) {
      if (yPos > 180) {
        doc.addPage();
        yPos = margin;
      }

      // Amharic header
      doc.setFontSize(14);
      setSmartFont(doc, "AI የአፈጻጸም ትንተና", true);
      doc.setTextColor(0, 0, 0);
      doc.text("AI የአፈጻጸም ትንተና", margin, yPos);
      yPos += 7;

      // English sub-header
      doc.setFontSize(10);
      setSmartFont(doc, "AI Performance Analysis", false);
      doc.setTextColor(100, 100, 100);
      doc.text("AI Performance Analysis", margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(FONT_NAMES.ethiopic, "normal");
      doc.setTextColor(50, 50, 50);

      let cleanNarrative = aiNarrative
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/O- U/g, "")
        .replace(/O-U/g, "")
        .replace(/\/\d+\/points\//g, "")
        .replace(/ma contributed/g, "and contributed")
        .replace(/ma/g, "and")
        .replace(/\s{2,}/g, " ")
        .trim();

      cleanNarrative = encodeText(cleanNarrative);

      const splitNarrative = doc.splitTextToSize(
        cleanNarrative,
        pageWidth - margin * 2 - 5,
      );

      const estimatedHeight = splitNarrative.length * 5 + 20;
      if (yPos + estimatedHeight > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(splitNarrative, margin, yPos);
      yPos += splitNarrative.length * 5 + 12;

      doc.setFontSize(8);
      setSmartFont(doc, "footer", false);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "ይህ ትንተና በAI የተፈጠረ ነው / This analysis was generated by AI",
        margin,
        yPos,
      );
      yPos += 8;
    }

    // ─── FOOTER ─────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = pageHeight - 12;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      // Left Footer - Amharic
      const amharicFooter = `ሪፖርት የተዘጋጀው በ: አዲስ መሶብ አንድ ማቆሚያ አገልግሎት ማዕከል - ${branchName}`;
      setSmartFont(doc, amharicFooter, false);
      doc.text(amharicFooter, margin, footerY);

      // Center Footer - English
      const englishFooter = `Reported by: Addis MESOB One-Stop Service Center - ${branchName}`;
      setSmartFont(doc, englishFooter, false);
      doc.text(englishFooter, pageWidth / 2, footerY, { align: "center" });

      // Right Footer - Date & Page
      const dateStr = getEthiopianDate();
      const footerRight = `${dateStr} | ገጽ ${i}/${pageCount}`;
      setSmartFont(doc, footerRight, false);
      doc.text(footerRight, pageWidth - margin, footerY, { align: "right" });
    }

    // ─── SAVE ──────────────────────────────────────────────────
    doc.save(`evaluation_report_${getEthiopianDate().replace(/\//g, "-")}.pdf`);
    console.log("✅ Evaluation Report PDF generated successfully!");

    showSuccessToast("📄 Evaluation Report PDF generated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Evaluation Report PDF Error:", error);
    showErrorToast(`❌ Failed to generate PDF: ${error.message}`);
    return false;
  }
};
