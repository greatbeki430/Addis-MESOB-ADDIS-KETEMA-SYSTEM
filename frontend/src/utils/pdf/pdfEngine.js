// frontend/src/utils/pdf/pdfEngine.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadFonts, FONT_NAMES, getPreloadedFontsDoc } from "./fontLoader";
import { getTheme } from "./themes";
import { encodeText, isAmharic } from "./language";

// Default configuration
const DEFAULT_CONFIG = {
  orientation: "portrait",
  unit: "mm",
  format: "a4",
  theme: "report",
  margin: 15,
  autoPageBreak: true,
  compress: true,
};

/**
 * Main PDF Engine Class
 */
export class PDFEngine {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.doc = null;
    this.theme = getTheme(this.config.theme);
    this.pageWidth = 0;
    this.pageHeight = 0;
    this.margin = this.config.margin;
    this.yPos = this.margin;
    this.fontsLoaded = false;
  }

  /**
   * Initialize PDF document with fonts
   */
  init() {
    // Try to use preloaded fonts document
    const preloadedDoc = getPreloadedFontsDoc();

    if (preloadedDoc) {
      // Clone the preloaded document
      this.doc = new jsPDF({
        orientation: this.config.orientation,
        unit: this.config.unit,
        format: this.config.format,
        compress: this.config.compress,
      });

      // Copy font data from preloaded document
      this.doc.__fontsLoaded = preloadedDoc.__fontsLoaded;
      this.doc.__hasEthiopicFont = preloadedDoc.__hasEthiopicFont;
      this.doc.__hasLatinFont = preloadedDoc.__hasLatinFont;

      // Try to use preloaded fonts
      try {
        this.doc.setFont(FONT_NAMES.latin);
      } catch (error) {
        // Log the error and load fonts if preloaded ones don't work
        console.warn("Preloaded fonts failed, loading fresh:", error.message);
        loadFonts(this.doc);
      }
    } else {
      // Create new document and load fonts
      this.doc = new jsPDF({
        orientation: this.config.orientation,
        unit: this.config.unit,
        format: this.config.format,
        compress: this.config.compress,
      });
      loadFonts(this.doc);
    }

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.yPos = this.margin;
    this.fontsLoaded = true;

    // Set default font
    try {
      this.doc.setFont(FONT_NAMES.latin);
    } catch (error) {
      console.warn("Failed to set Latin font, using helvetica:", error.message);
      this.doc.setFont("helvetica");
    }
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);

    return this;
  }

  /**
   * Apply text style with proper font for content
   */
  applyTextStyle(text, options = {}) {
    const { bold = false, size = 10, color = null } = options;

    try {
      const fontName = this.getFontForText(text, bold);
      this.doc.setFont(fontName);
    } catch (error) {
      // Log the error and try fallback
      console.warn("Font application failed, using helvetica:", error.message);
      try {
        this.doc.setFont("helvetica", bold ? "bold" : "normal");
      } catch (fallbackError) {
        // Log the fallback error too
        console.error("Fallback font also failed:", fallbackError.message);
        // Last resort - do nothing, use default font
      }
    }

    if (size) this.doc.setFontSize(size);
    if (color) this.doc.setTextColor(...color);

    return this;
  }

  /**
   * Get appropriate font for text
   */
  getFontForText(text, bold = false) {
    if (!text) return FONT_NAMES.latin;

    const hasAmharic = /[\u1200-\u137F]/.test(String(text));

    if (hasAmharic) {
      // Check if Ethiopic font is available
      if (this.doc.__hasEthiopicFont) {
        return bold ? FONT_NAMES.ethiopicBold : FONT_NAMES.ethiopic;
      }
      // Log warning if Ethiopic font not available
      console.warn(
        "Ethiopic font not available, using helvetica for:",
        text.substring(0, 20),
      );
      return "helvetica";
    }

    if (this.doc.__hasLatinFont) {
      return bold ? FONT_NAMES.latinBold : FONT_NAMES.latin;
    }

    return "helvetica";
  }

  /**
   * Check and add page break if needed
   */
  checkPageBreak(requiredSpace = 20) {
    const bottomMargin = this.margin;
    const availableSpace = this.pageHeight - this.yPos - bottomMargin;

    if (availableSpace < requiredSpace) {
      this.doc.addPage();
      this.yPos = this.margin;

      // Re-apply font settings on new page
      try {
        this.doc.setFont(FONT_NAMES.latin);
      } catch (error) {
        console.warn("Font reset on new page failed:", error.message);
        this.doc.setFont("helvetica");
      }
      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 0, 0);
    }

    return this;
  }

  /**
   * Add header block
   */
  addHeader(config) {
    const {
      title,
      subtitle,
      align = "center",
      titleSize = 18,
      subtitleSize = 10,
      showLine = true,
      lineColor = null,
      titleColor = null,
    } = config;

    if (title) {
      this.checkPageBreak(30);

      const color =
        titleColor || this.theme.colors?.header || this.theme.primaryColor;
      this.applyTextStyle(title, { bold: true, size: titleSize, color });
      this.doc.text(encodeText(title), this.pageWidth / 2, this.yPos, {
        align,
      });
      this.yPos += 8;
    }

    if (subtitle) {
      this.applyTextStyle(subtitle, { bold: false, size: subtitleSize });
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(encodeText(subtitle), this.pageWidth / 2, this.yPos, {
        align,
      });
      this.yPos += 10;
    }

    if (showLine) {
      const color = lineColor || this.theme.primaryColor;
      this.doc.setDrawColor(...color);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.margin,
        this.yPos,
        this.pageWidth - this.margin,
        this.yPos,
      );
      this.yPos += 8;
    }

    return this;
  }

  /**
   * Add section header with background
   */
  addSection(config) {
    const {
      title,
      fontSize = 11,
      fillColor = null,
      textColor = [255, 255, 255],
      padding = 4,
    } = config;

    this.checkPageBreak(15);

    const color = fillColor || this.theme.primaryColor;
    const rectHeight = 8;

    // Draw background
    this.doc.setFillColor(...color);
    this.doc.setDrawColor(...color);
    this.doc.rect(
      this.margin,
      this.yPos - padding,
      this.pageWidth - this.margin * 2,
      rectHeight,
      "F",
    );

    // Draw text
    this.applyTextStyle(title, {
      bold: true,
      size: fontSize,
      color: textColor,
    });
    this.doc.text(encodeText(title), this.margin + 2, this.yPos);
    this.doc.setTextColor(0, 0, 0);

    this.yPos += rectHeight + 4;

    return this;
  }

  /**
   * Add text block with proper encoding
   */
  addTextBlock(config) {
    const {
      text,
      fontSize = 10,
      bold = false,
      color = null,
      align = "left",
      maxWidth = null,
      marginBottom = 4,
      maxLines = null,
    } = config;

    if (!text || text === "") return this;

    this.checkPageBreak(10);

    const maxW = maxWidth || this.pageWidth - this.margin * 2;
    this.applyTextStyle(text, { bold, size: fontSize });

    if (color) this.doc.setTextColor(...color);

    const encodedText = encodeText(text);
    let splitText = this.doc.splitTextToSize(encodedText, maxW);

    if (maxLines && splitText.length > maxLines) {
      splitText = splitText.slice(0, maxLines);
      splitText[splitText.length - 1] += "...";
    }

    this.doc.text(splitText, this.margin, this.yPos, { align });

    const lineHeight = fontSize * 0.5;
    this.yPos += splitText.length * lineHeight + marginBottom;

    return this;
  }

  /**
   * Add table with full Amharic support
   */
  addTable(config) {
    const {
      head,
      body,
      foot = null,
      theme = null,
      headStyles = {},
      bodyStyles = {},
      footStyles = {},
      margin = null,
      startY = null,
      tableWidth = null,
      pageBreak = true,
      columnsStyles = {},
      showHead = true,
      showFoot = true,
    } = config;

    // Validate data
    if (!body || body.length === 0) {
      console.warn("No table data to render");
      return this;
    }

    const tableTheme = theme || this.theme.tableStyle || "striped";
    const marginLeft = margin?.left || this.margin;
    const marginRight = margin?.right || this.margin;

    // Encode all text data for PDF
    const encodedHead = head
      ? head.map((row) => row.map((cell) => encodeText(String(cell || ""))))
      : [];

    const encodedBody = body.map((row) =>
      row.map((cell) => encodeText(String(cell || ""))),
    );

    let encodedFoot = null;
    if (foot) {
      encodedFoot = foot.map((row) =>
        row.map((cell) => encodeText(String(cell || ""))),
      );
    }

    // Build styles with theme
    const defaultHeadStyles = {
      fillColor: this.theme.primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: 4,
    };

    const defaultBodyStyles = {
      fontSize: 9,
      cellPadding: 3,
      valign: "middle",
    };

    const defaultFootStyles = {
      fillColor: this.theme.colors?.light || [240, 247, 244],
      textColor: this.theme.primaryColor,
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3,
    };

    // Set startY
    const startYPos = startY || this.yPos;

    // Page break check
    if (pageBreak && startYPos > this.pageHeight - 80) {
      this.doc.addPage();
      this.yPos = this.margin;
    }

    // Configure and render table with proper font support
    const tableConfig = {
      startY: startYPos,
      head: encodedHead,
      body: encodedBody,
      foot: encodedFoot,
      theme: tableTheme,
      margin: { left: marginLeft, right: marginRight },
      headStyles: { ...defaultHeadStyles, ...headStyles },
      bodyStyles: { ...defaultBodyStyles, ...bodyStyles },
      footStyles: { ...defaultFootStyles, ...footStyles },
      tableWidth: tableWidth || "auto",
      pageBreak: pageBreak ? "auto" : "avoid",
      showHead,
      showFoot,
      columnsStyles,
      styles: {
        font: this.doc.__hasLatinFont ? FONT_NAMES.latin : "helvetica",
      },
    };

    // Add custom cell rendering for mixed content
    tableConfig.didDrawCell = (data) => {
      if (data.cell && data.cell.raw) {
        const cellText = String(data.cell.raw);
        if (isAmharic(cellText) && this.doc.__hasEthiopicFont) {
          // Log for debugging if needed
          // The actual font switching will happen via the styles
        }
      }
    };

    try {
      autoTable(this.doc, tableConfig);
    } catch (error) {
      console.error("Table rendering failed:", error.message);
      // Try rendering without table styles as fallback
      try {
        autoTable(this.doc, {
          ...tableConfig,
          theme: "plain",
        });
      } catch (fallbackError) {
        console.error(
          "Fallback table rendering also failed:",
          fallbackError.message,
        );
        // Return without table if both attempts fail
        return this;
      }
    }

    this.yPos = this.doc.lastAutoTable?.finalY + 6 || startYPos + 20;

    return this;
  }

  /**
   * Add footer with page numbers
   */
  addFooter(config = {}) {
    const {
      text = "Generated by A-MESOB One-Stop Service Center",
      fontSize = 8,
      color = [150, 150, 150],
      align = "center",
      showPageNumbers = true,
      showDate = true,
    } = config;

    const pageCount = this.doc.internal.getNumberOfPages();
    const footerY = this.pageHeight - 10;
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    for (let i = 1; i <= pageCount; i++) {
      try {
        this.doc.setPage(i);

        this.applyTextStyle(text, { bold: false, size: fontSize });
        this.doc.setTextColor(...color);

        let footerText = encodeText(text);

        if (showDate) {
          footerText = `${footerText} · ${dateStr}`;
        }

        // Center text
        this.doc.text(footerText, this.pageWidth / 2, footerY, { align });

        // Page numbers
        if (showPageNumbers) {
          this.doc.text(
            `Page ${i} of ${pageCount}`,
            this.pageWidth - this.margin,
            footerY,
            { align: "right" },
          );
        }
      } catch (error) {
        console.error(`Failed to add footer on page ${i}:`, error.message);
        // Continue with next page
      }
    }

    return this;
  }

  /**
   * Add a divider line
   */
  addDivider(color = null, width = 0.5) {
    const lineColor = color || this.theme.primaryColor;

    this.checkPageBreak(5);

    try {
      this.doc.setDrawColor(...lineColor);
      this.doc.setLineWidth(width);
      this.doc.line(
        this.margin,
        this.yPos,
        this.pageWidth - this.margin,
        this.yPos,
      );
      this.yPos += 5;
    } catch (error) {
      console.error("Failed to add divider:", error.message);
    }

    return this;
  }

  /**
   * Get current y-position
   */
  getY() {
    return this.yPos;
  }

  /**
   * Set y-position
   */
  setY(y) {
    this.yPos = y;
    return this;
  }

  /**
   * Add space
   */
  addSpace(space = 5) {
    this.yPos += space;
    return this;
  }

  /**
   * Get the underlying jsPDF document
   */
  getDoc() {
    return this.doc;
  }

  /**
   * Save the PDF
   */
  save(filename) {
    if (!filename) {
      const date = new Date().toISOString().split("T")[0];
      filename = `report_${date}.pdf`;
    }
    try {
      this.doc.save(filename);
    } catch (error) {
      console.error("Failed to save PDF:", error.message);
      throw error;
    }
    return this;
  }

  /**
   * Get PDF as blob
   */
  getBlob() {
    try {
      return this.doc.output("blob");
    } catch (error) {
      console.error("Failed to get PDF blob:", error.message);
      throw error;
    }
  }

  /**
   * Get PDF as data URI
   */
  getDataURI() {
    try {
      return this.doc.output("datauristring");
    } catch (error) {
      console.error("Failed to get PDF data URI:", error.message);
      throw error;
    }
  }

  /**
   * Get PDF as array buffer
   */
  getArrayBuffer() {
    try {
      return this.doc.output("arraybuffer");
    } catch (error) {
      console.error("Failed to get PDF array buffer:", error.message);
      throw error;
    }
  }
}

/**
 * Factory function to create PDF engine
 */
export const createPDF = (config = {}) => {
  const engine = new PDFEngine(config);
  engine.init();
  return engine;
};

export default createPDF;
