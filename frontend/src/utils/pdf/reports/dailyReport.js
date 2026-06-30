// frontend/src/utils/pdf/reports/dailyReport.js
import { createPDF } from "../pdfEngine";
import { encodeText } from "../language";

/**
 * Generate Daily Report PDF with full Amharic support
 * @param {Array} rows - Array of report rows with dept, service, male, female, total
 * @param {string} date - Report date string
 * @param {Object} t - Translation function object
 * @param {Object} options - Additional options for PDF generation
 * @param {string} options.filename - Custom filename (optional)
 * @param {string} options.footerText - Custom footer text (optional)
 * @param {boolean} options.showWatermark - Show watermark (optional)
 */
export const generateDailyReportPDF = (rows, date, t, options = {}) => {
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

    // Get the document instance for additional manipulation if needed
    const doc = engine.getDoc();

    // Use the doc for any additional customization
    // For example, set document metadata
    try {
      doc.setProperties({
        title: options?.title || t?.dailyReport?.title || "Daily Report",
        author: options?.author || "A-MESOB One-Stop Service Center",
        subject: options?.subject || "Daily Report",
        keywords: options?.keywords || "daily, report, service",
        creator: "A-MESOB PDF Generator",
      });
    } catch (metadataError) {
      console.debug("Could not set document metadata:", metadataError.message);
    }

    // ─── Title ────────────────────────────────────────────────────────────────
    engine.addHeader({
      title: t?.dailyReport?.title || "Daily Report",
      subtitle: t?.dailyReport?.subtitle || "",
      titleSize: options?.titleSize || 18,
      subtitleSize: options?.subtitleSize || 10,
    });

    // ─── Date ──────────────────────────────────────────────────────────────────
    const reportDate = date || new Date().toISOString().split("T")[0];
    engine.addTextBlock({
      text: `Report Date: ${reportDate}`,
      fontSize: 10,
      bold: false,
      align: "center",
      marginBottom: 12,
    });

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
        t?.dailyReport?.colNo || "#",
        t?.dailyReport?.colDept || "Department",
        t?.dailyReport?.colService || "Service",
        t?.dailyReport?.colMale || "Male",
        t?.dailyReport?.colFemale || "Female",
        t?.dailyReport?.colTotal || "Total",
      ],
    ];

    const body = validRows.map((row, idx) => [
      idx + 1,
      encodeText(row.dept || "—"),
      encodeText(row.service || "—"),
      row.male || 0,
      row.female || 0,
      row.total || 0,
    ]);

    const foot = [
      [
        "",
        "",
        t?.dailyReport?.grandTotal || "Grand Total",
        grandMale,
        grandFemale,
        grandTotal,
      ],
    ];

    engine.addTable({
      head,
      body,
      foot,
      theme: options?.tableTheme || "grid",
      headStyles: {
        fillColor: options?.headerColor || [194, 90, 0],
        textColor: [255, 255, 255],
        fontSize: options?.headerFontSize || 11,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: options?.bodyFontSize || 10,
        cellPadding: options?.cellPadding || 4,
      },
      footStyles: {
        fillColor: options?.footerColor || [240, 247, 244],
        textColor: options?.footerTextColor || [194, 90, 0],
        fontStyle: "bold",
        fontSize: options?.footerFontSize || 11,
      },
      columnsStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 25, halign: "center" },
        5: { cellWidth: 30, halign: "center" },
      },
    });

    // ─── Add Watermark if requested ──────────────────────────────────────────
    if (options?.showWatermark) {
      try {
        const watermarkText = options?.watermarkText || "CONFIDENTIAL";
        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(options?.watermarkSize || 60);
          doc.setTextColor(200, 200, 200);
          doc.setFont("helvetica", "bold");
          doc.text(
            watermarkText,
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
    const footerText =
      options?.footerText || "Generated by A-MESOB One-Stop Service Center";
    engine.addFooter({
      text: footerText,
      showPageNumbers: options?.showPageNumbers !== false,
      showDate: options?.showDate !== false,
    });

    // ─── Save ──────────────────────────────────────────────────────────────────
    const safeDate = reportDate.replace(/\//g, "-");
    const filename = options?.filename || `daily_report_${safeDate}.pdf`;
    engine.save(filename);

    console.log("✅ Daily Report PDF generated successfully!");
    console.log(`📄 Saved as: ${filename}`);
    console.log(
      `📊 Total rows: ${validRows.length}, Grand total: ${grandTotal}`,
    );

    // Log options used (for debugging)
    if (options) {
      console.debug("PDF Options used:", JSON.stringify(options, null, 2));
    }

    return true;
  } catch (error) {
    console.error("❌ Daily Report PDF Error:", error.message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
};

export default generateDailyReportPDF;
