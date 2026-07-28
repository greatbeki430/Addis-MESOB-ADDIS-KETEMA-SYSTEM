// frontend/src/utils/pdf/reports/dailyReport.js
import { createPDF } from "../pdfEngine";
import { encodeText, isAmharic } from "../language";
import { loadFonts, FONT_NAMES } from "../fontLoader";

// ✅ Amharic labels - forced for all exports
const AMHARIC_LABELS = {
  title: "ዕለታዊ ሪፖርት",
  subtitle: "የአዲስ መሶብ የአንድ ማዕከል አገልግሎት",
  reportDate: "የሪፖርቱ ቀን",
  colNo: "#",
  colDept: "ዘርፍ",
  colService: "አገልግሎት",
  colMale: "ወንድ",
  colFemale: "ሴት",
  colTotal: "ድምር",
  grandTotal: "ጠቅላላ ድምር",
  footer: "በአዲስ መሶብ የአንድ ማዕከል አገልግሎት ማእከል የተዘጋጀ",
  generatedBy: "ገጽ",
  of: "ከ",
};

/**
 * Generate Daily Report PDF with full Amharic support
 * @param {Array} rows - Array of report rows with dept, service, male, female, total
 * @param {string} date - Report date string
 * @param {Object} t - Translation function object (kept for compatibility)
 * @param {Object} options - Additional options for PDF generation
 * @param {string} options.filename - Custom filename (optional)
 * @param {string} options.footerText - Custom footer text (optional)
 * @param {boolean} options.showWatermark - Show watermark (optional)
 */
export const generateDailyReportPDF = async (rows, date, t, options = {}) => {
  try {
    console.log("📄 Generating Daily Report PDF...");

    if (!rows || rows.length === 0) {
      throw new Error("No data to export");
    }

    // Filter valid rows
    const validRows = rows.filter((r) => r.dept || r.service);

    if (validRows.length === 0) {
      throw new Error("No valid data to export");
    }

    // Create PDF engine with daily theme
    const engine = createPDF({
      orientation: "landscape",
      theme: "daily",
    });

    // Get the document instance
    const doc = engine.getDoc();

    // ✅ IMPORTANT: Load fonts into this document
    loadFonts(doc);

    // Use Amharic labels (forced)
    const labels = AMHARIC_LABELS;

    // ─── Helper: Set font based on text content ───
    const setSmartFont = (text, bold = false) => {
      try {
        if (isAmharic(text)) {
          doc.setFont(
            bold ? FONT_NAMES.ethiopicBold : FONT_NAMES.ethiopic,
            "normal",
          );
        } else {
          doc.setFont(bold ? FONT_NAMES.latinBold : FONT_NAMES.latin, "normal");
        }
      } catch (error) {
        console.warn("Font fallback:", error.message);
        doc.setFont("helvetica", bold ? "bold" : "normal");
      }
    };

    // ─── Set document metadata ────────────────────────────────────────────────
    try {
      doc.setProperties({
        title: labels.title,
        author: options?.author || "A-MESOB One-Stop Service Center",
        subject: options?.subject || labels.title,
        keywords: options?.keywords || "daily, report, service, Amharic",
        creator: "A-MESOB PDF Generator",
      });
    } catch (metadataError) {
      console.debug("Could not set document metadata:", metadataError.message);
    }

    // ─── Title ────────────────────────────────────────────────────────────────
    setSmartFont(labels.title, true);
    doc.setFontSize(18);
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    doc.text(encodeText(labels.title), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;

    // ─── Subtitle ──────────────────────────────────────────────────────────────
    setSmartFont(labels.subtitle, false);
    doc.setFontSize(10);
    doc.text(encodeText(labels.subtitle), pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;

    // ─── Date ──────────────────────────────────────────────────────────────────
    const reportDate = date || new Date().toISOString().split("T")[0];
    setSmartFont(`${labels.reportDate}: ${reportDate}`, false);
    doc.setFontSize(10);
    doc.text(
      encodeText(`${labels.reportDate}: ${reportDate}`),
      pageWidth / 2,
      yPos,
      {
        align: "center",
      },
    );
    yPos += 12;

    // ─── Calculate Totals ─────────────────────────────────────────────────────
    const grandTotal = validRows.reduce(
      (sum, row) => sum + (row.total || 0),
      0,
    );
    const grandMale = validRows.reduce((sum, row) => sum + (row.male || 0), 0);
    const grandFemale = validRows.reduce(
      (sum, row) => sum + (row.female || 0),
      0,
    );

    // ─── Table ─────────────────────────────────────────────────────────────────
    const head = [
      [
        labels.colNo,
        labels.colDept,
        labels.colService,
        labels.colMale,
        labels.colFemale,
        labels.colTotal,
      ],
    ];

    const body = validRows.map((row, idx) => [
      `${idx + 1}`,
      encodeText(row.dept || "—"),
      encodeText(row.service || "—"),
      row.male || 0,
      row.female || 0,
      row.total || 0,
    ]);

    const foot = [
      ["", "", labels.grandTotal, grandMale, grandFemale, grandTotal],
    ];

    // ─── Import autoTable dynamically ────────────────────────────────────────
    const autoTable = (await import("jspdf-autotable")).default;

    autoTable(doc, {
      startY: yPos,
      head: head,
      body: body,
      foot: foot,
      margin: { left: 15, right: 15 },
      theme: options?.tableTheme || "striped",
      headStyles: {
        fillColor: options?.headerColor || [26, 107, 74],
        textColor: [255, 255, 255],
        fontSize: options?.headerFontSize || 10,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      bodyStyles: {
        fontSize: options?.bodyFontSize || 9,
        cellPadding: options?.cellPadding || 4,
        halign: "center",
        valign: "middle",
      },
      footStyles: {
        fillColor: options?.footerColor || [240, 247, 244],
        textColor: options?.footerTextColor || [26, 107, 74],
        fontStyle: "bold",
        fontSize: options?.footerFontSize || 10,
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 25, halign: "center" },
        5: { cellWidth: 30, halign: "center" },
      },
      // ✅ IMPORTANT: Handle mixed language content
      didParseCell: (data) => {
        const cellText = String(data.cell.raw || "");
        if (isAmharic(cellText)) {
          data.cell.styles.font = FONT_NAMES.ethiopic;
        } else {
          data.cell.styles.font = FONT_NAMES.latin;
        }
      },
      styles: {
        font: FONT_NAMES.latin,
      },
    });

    // ─── Add Watermark if requested ──────────────────────────────────────────
    if (options?.showWatermark) {
      try {
        const watermarkText = options?.watermarkText || "ሚስጥራዊ";
        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          setSmartFont(watermarkText, true);
          doc.setFontSize(options?.watermarkSize || 60);
          doc.setTextColor(200, 200, 200);
          doc.text(
            encodeText(watermarkText),
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() / 2,
            {
              align: "center",
              angle: options?.watermarkAngle || -45,
            },
          );
        }
      } catch (watermarkError) {
        console.warn("Watermark addition failed:", watermarkError.message);
      }
    }

    // ─── Footer ────────────────────────────────────────────────────────────────
    const footerText = options?.footerText || labels.footer;
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = doc.internal.pageSize.getHeight() - 10;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      setSmartFont(footerText, false);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(encodeText(footerText), pageWidth / 2, footerY, {
        align: "center",
      });
      doc.text(
        `${labels.generatedBy} ${i} ${labels.of} ${pageCount}`,
        pageWidth - 15,
        footerY,
        { align: "right" },
      );
    }

    // ─── Save ──────────────────────────────────────────────────────────────────
    const safeDate = reportDate.replace(/\//g, "-");
    const filename = options?.filename || `daily_report_${safeDate}.pdf`;
    engine.save(filename);

    console.log("✅ Daily Report PDF generated successfully in Amharic!");
    console.log(`📄 Saved as: ${filename}`);
    console.log(
      `📊 Total rows: ${validRows.length}, Grand total: ${grandTotal}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Daily Report PDF Error:", error.message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
};

export default generateDailyReportPDF;
