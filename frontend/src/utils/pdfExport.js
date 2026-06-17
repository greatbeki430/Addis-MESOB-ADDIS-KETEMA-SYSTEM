// frontend/src/utils/pdfExport.js
import jsPDF from "jspdf";
import "jspdf-autotable";

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

// Export Forum Report to PDF
export const exportForumReportToPDF = (formData, t, meetingNumber = 1) => {
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
  doc.text(t.forum.title, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(t.forum.subtitle, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setDrawColor(26, 107, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Meeting info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Meeting #${meetingNumber}`, margin, yPos);
  const displayDate = formData.date || getEthiopianDate();
  doc.text(`Date: ${displayDate}`, pageWidth - margin - 50, yPos, {
    align: "right",
  });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `⏰ Time: ${formatTime(formData.timeStart)} - ${formatTime(formData.timeEnd)}`,
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
  doc.text(t.forum.presentMembers, margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const presentMembers = formData.present.filter((m) => m && m.trim() !== "");
  if (presentMembers.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [[t.forum.memberN, t.forum.name]],
      body: presentMembers.map((name, idx) => [`${idx + 1}`, name]),
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
    });
    yPos = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(10);
    doc.text("—", margin, yPos);
    yPos += 8;
  }

  // ✅ FIXED: Absent Members
  if (yPos > 250) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(139, 26, 26);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
  doc.text(t.forum.absentMembers, margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  // ✅ FIXED: Filter absent members correctly (they are objects with name and reason)
  const absentMembers = formData.absent.filter(
    (item) => item.name && item.name.trim() !== "",
  );
  if (absentMembers.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [[t.forum.memberN, t.forum.name, t.forum.reason]],
      body: absentMembers.map((item, idx) => [
        `${idx + 1}`,
        item.name,
        item.reason || "—",
      ]),
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: { fillColor: [139, 26, 26], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
    });
    yPos = doc.lastAutoTable.finalY + 8;
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
  doc.text(t.forum.prevResults, margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const prevResults = formData.prevResults.filter((r) => r && r.trim() !== "");
  if (prevResults.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [["#", "Result"]],
      body: prevResults.map((result, idx) => [`${idx + 1}`, result]),
      margin: { left: margin, right: margin },
      theme: "plain",
      bodyStyles: { fontSize: 9 },
    });
    yPos = doc.lastAutoTable.finalY + 8;
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
  doc.text(t.forum.todayTopics, margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const topics = formData.topics.filter(
    (topic) => topic && topic.trim() !== "",
  );
  if (topics.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [["#", t.forum.topic]],
      body: topics.map((topic, idx) => [`${idx + 1}`, topic]),
      margin: { left: margin, right: margin },
      theme: "striped",
      bodyStyles: { fontSize: 9 },
    });
    yPos = doc.lastAutoTable.finalY + 6;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${t.forum.standingAgendas}`, margin, yPos);
  yPos += 5;

  const standingAgendas = t.agendas || [];
  const agendasPerRow = 2;
  const agendaWidth = (pageWidth - margin * 2) / agendasPerRow;
  let agendaX = margin;

  standingAgendas.slice(0, 4).forEach((agenda, idx) => {
    if (idx % agendasPerRow === 0 && idx > 0) {
      agendaX = margin;
      yPos += 6;
    }
    doc.text(`☐ ${agenda}`, agendaX, yPos);
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
  doc.text(t.forum.explanation, margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const explanationText = formData.explanation || "—";
  const splitExplanation = doc.splitTextToSize(
    explanationText,
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
  doc.text(t.forum.gaps, margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const gaps = formData.gaps.filter((g) => g && g.trim() !== "");
  if (gaps.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [["#", "Gap Identified"]],
      body: gaps.map((gap, idx) => [`${idx + 1}`, gap]),
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: { fillColor: [194, 90, 0], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
    });
    yPos = doc.lastAutoTable.finalY + 8;
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
  doc.text(t.forum.agreements, margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const agreements = formData.agreements.filter((a) => a && a.trim() !== "");
  if (agreements.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [["#", "Agreed Point"]],
      body: agreements.map((agreement, idx) => [`${idx + 1}`, agreement]),
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
    });
    yPos = doc.lastAutoTable.finalY + 8;
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
  doc.text(t.forum.signatures, margin, yPos);
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
    doc.text(`${i + 1}${t.forum.signatureN || "th Signature"}`, sigX, yPos - 3);
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
      `Generated by Addis Messob One-Stop Service Center · ${getEthiopianDate()}`,
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

  doc.save(`acha_forum_report_${displayDate.replace(/\//g, "-")}.pdf`);
};

// Export Daily Report to PDF
export const exportDailyReportToPDF = (rows, date, t) => {
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
  doc.text(t.dailyReport.title, pageWidth / 2, yPos, { align: "center" });
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

  doc.autoTable({
    startY: yPos,
    head: [
      [
        t.dailyReport.colNo,
        t.dailyReport.colDept,
        t.dailyReport.colService,
        t.dailyReport.colMale,
        t.dailyReport.colFemale,
        t.dailyReport.colTotal,
      ],
    ],
    body: rows.map((row, idx) => [
      idx + 1,
      row.dept || "—",
      row.service || "—",
      row.male || 0,
      row.female || 0,
      row.total || 0,
    ]),
    foot: [
      ["", "", t.dailyReport.grandTotal, grandMale, grandFemale, grandTotal],
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

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated by Addis Messob One-Stop Service Center · ${getEthiopianDate()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  );

  doc.save(`daily_report_${reportDate.replace(/\//g, "-")}.pdf`);
};

// Export Evaluation Report to PDF
export const exportEvaluationReportToPDF = (
  scores,
  members,
  totalScores,
  bestPerformer,
  t,
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(t.evaluation.title, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(t.evaluation.subtitle, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setDrawColor(26, 107, 74);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Evaluation Date: ${getEthiopianDate()}`, margin, yPos);
  yPos += 12;

  // Team members summary
  doc.setFillColor(26, 107, 74);
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
  doc.text("Team Members Summary", margin + 2, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const memberTotals = members.map((m) => ({
    name: m,
    total: totalScores(m),
  }));

  doc.autoTable({
    startY: yPos,
    head: [["#", "Member Name", "Total Score (0-100)"]],
    body: memberTotals.map((m, idx) => [idx + 1, m.name, m.total]),
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 10 },
  });

  yPos = doc.lastAutoTable.finalY + 12;

  // Best performer
  if (bestPerformer) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 107, 74);
    doc.text(`🏆 Best Performer: ${bestPerformer}`, margin, yPos);
    doc.setTextColor(0, 0, 0);
  }

  // Footer
  doc.setPage(1);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated by Addis Messob One-Stop Service Center · ${getEthiopianDate()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  );

  doc.save(`evaluation_report_${getEthiopianDate().replace(/\//g, "-")}.pdf`);
};
