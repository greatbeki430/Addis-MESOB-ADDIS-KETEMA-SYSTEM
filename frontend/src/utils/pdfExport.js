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

// ✅ Export Daily Report to PDF
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

// ✅ Export Evaluation Report to PDF (with Comments Support)
// ✅ Helper: pick the right embedded font for whatever script the text uses
const setSmartFont = (doc, text, bold = false) => {
  if (isAmharic(text)) {
    doc.setFont(bold ? FONT_NAMES.ethiopicBold : FONT_NAMES.ethiopic, "normal");
  } else {
    doc.setFont(bold ? FONT_NAMES.latinBold : FONT_NAMES.latin, "normal");
  }
};

// ✅ Export Evaluation Report to PDF (Amharic-safe + signatures)
export const exportEvaluationReportToPDF = (
  scores,
  members,
  totalScores,
  bestPerformer,
  t,
  comments = {},
  signatures = {},
  includeAINarrative = false, // ✅ ADD THIS
  aiNarrative = "", // ✅ ADD THIS
) => {
  try {
    console.log("📄 Generating Evaluation Report PDF...");

    if (!members || members.length === 0) {
      showErrorToast("No members to evaluate. Please add some members first.");
      return false;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ✅ Embed the real Unicode/Ethiopic fonts into this document
    loadFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    const title = encodeText(t.evaluation?.title || "Evaluation Report");
    doc.setFontSize(18);
    setSmartFont(doc, title, true);
    doc.text(title, pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    const subtitle = encodeText(t.evaluation?.subtitle || "");
    doc.setFontSize(10);
    setSmartFont(doc, subtitle, false);
    doc.text(subtitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    doc.setDrawColor(26, 107, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Evaluation Date
    doc.setFontSize(11);
    setSmartFont(doc, "Evaluation Date", true);
    doc.text(`Evaluation Date: ${getEthiopianDate()}`, margin, yPos);
    yPos += 12;

    // Team Members Summary Table
    doc.setFillColor(26, 107, 74);
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, "F");
    setSmartFont(doc, "Team Members Summary", true);
    doc.text("Team Members Summary", margin + 2, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const memberTotals = members.map((m) => ({
      name: m,
      total: totalScores(m),
    }));

    const sortedMembers = [...memberTotals].sort((a, b) => b.total - a.total);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Member Name", "Total Score (0-100)", "Rank"]],
      body: sortedMembers.map((m, idx) => [
        idx + 1,
        encodeText(m.name),
        m.total,
        idx === 0
          ? "1st"
          : idx === 1
            ? "2nd"
            : idx === 2
              ? "3rd"
              : `#${idx + 1}`,
      ]),
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: { fillColor: [26, 107, 74], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 10 },
      styles: { font: FONT_NAMES.ethiopic },
      didParseCell: (data) => {
        const cellText = String(data.cell.raw ?? "");
        if (!isAmharic(cellText)) {
          data.cell.styles.font = FONT_NAMES.latin;
        }
      },
    });

    yPos = doc.lastAutoTable?.finalY + 12 || yPos + 20;

    // Best Performer
    if (bestPerformer) {
      const bpText = `Best Performer: ${encodeText(bestPerformer)}`;
      doc.setFontSize(12);
      setSmartFont(doc, bpText, true);
      doc.setTextColor(26, 107, 74);
      doc.text(bpText, margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }

    // Comments Section
    if (comments && Object.keys(comments).length > 0) {
      const hasComments = Object.values(comments).some(
        (c) => c && c.trim() !== "",
      );

      if (hasComments) {
        doc.setFontSize(14);
        setSmartFont(doc, "Individual Feedback & Comments", true);
        doc.text("Individual Feedback & Comments", margin, yPos);
        yPos += 10;

        const memberList = members.filter((m) => m.trim() !== "");
        memberList.forEach((member, idx) => {
          const comment = comments[idx] || "No comment provided";

          if (yPos > 240) {
            doc.addPage();
            yPos = margin;
          }

          const memberLabel = `${encodeText(member)}:`;
          doc.setFontSize(11);
          setSmartFont(doc, memberLabel, true);
          doc.setTextColor(26, 107, 74);
          doc.text(memberLabel, margin, yPos);
          yPos += 6;

          doc.setFontSize(10);
          setSmartFont(doc, comment, false);
          doc.setTextColor(50, 50, 50);
          const splitComment = doc.splitTextToSize(
            encodeText(comment),
            pageWidth - margin * 2 - 5,
          );
          doc.text(splitComment, margin + 3, yPos);
          yPos += splitComment.length * 5 + 8;

          if (idx < memberList.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, yPos - 4, pageWidth - margin, yPos - 4);
            yPos += 4;
          }
        });
      }
    }

    // ✅ AI NARRATIVE SECTION - FIXED with proper encoding
    if (includeAINarrative && aiNarrative) {
      if (yPos > 220) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      setSmartFont(doc, "AI Evaluation Narrative", true);
      doc.setTextColor(0, 0, 0);
      doc.text("AI Evaluation Narrative", margin, yPos);
      yPos += 10;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      // ✅ Force Ethiopic font for Amharic text
      doc.setFont(FONT_NAMES.ethiopic, "normal");
      doc.setTextColor(50, 50, 50);

      // ✅ Clean up the narrative
      let cleanNarrative = aiNarrative
        // Remove any markdown artifacts
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/O- U/g, "")
        .replace(/O-U/g, "")
        .replace(/\/\d+\/points\//g, "")
        .replace(/ma contributed/g, "and contributed")
        .replace(/ma/g, "and")
        .replace(/\s{2,}/g, " ")
        .trim();

      // ✅ Properly encode the text
      cleanNarrative = encodeText(cleanNarrative);

      // Split the narrative into lines and wrap
      const splitNarrative = doc.splitTextToSize(
        cleanNarrative,
        pageWidth - margin * 2 - 5,
      );

      // Check if we need a new page
      const estimatedHeight = splitNarrative.length * 5 + 20;
      if (yPos + estimatedHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(splitNarrative, margin, yPos);
      yPos += splitNarrative.length * 5 + 12;

      // Add a footer note
      doc.setFontSize(8);
      setSmartFont(doc, "footer", false);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "This narrative was generated by AI based on evaluation data.",
        margin,
        yPos,
      );
      yPos += 8;
    }

    // ✅ Digital Signatures Section
    const signatureEntries = Object.entries(signatures || {}).filter(
      ([, data]) =>
        data && typeof data === "string" && data.startsWith("data:image"),
    );

    if (signatureEntries.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFontSize(14);
      setSmartFont(doc, "Digital Signatures", true);
      doc.setTextColor(0, 0, 0);
      doc.text("Digital Signatures", margin, yPos);
      yPos += 10;

      const sigWidth = 55;
      const sigHeight = 22;
      let col = 0;
      const startX = margin;
      const colGap = sigWidth + 10;

      signatureEntries.forEach(([name, dataUrl]) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
          col = 0;
        }
        const x = startX + col * colGap;
        try {
          doc.addImage(dataUrl, "PNG", x, yPos, sigWidth, sigHeight);
        } catch (imgErr) {
          console.warn("Could not embed signature for", name, imgErr);
        }
        doc.setFontSize(8);
        setSmartFont(doc, name, false);
        doc.setTextColor(80, 80, 80);
        doc.text(encodeText(name), x, yPos + sigHeight + 4);

        col += 1;
        if (col >= 3) {
          col = 0;
          yPos += sigHeight + 12;
        }
      });
      yPos += sigHeight + 12;
    }

    // Footer
    doc.setFontSize(8);
    setSmartFont(doc, "footer", false);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by Addis MESOB One-Stop Service Center - ${getEthiopianDate()}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );

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
