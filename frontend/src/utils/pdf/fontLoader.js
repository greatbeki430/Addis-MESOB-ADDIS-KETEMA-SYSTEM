// frontend/src/utils/pdf/fontLoader.js
import jsPDF from "jspdf";
import { FONT_BASE64 } from "./fonts/fontBase64";

// Font names for jsPDF
export const FONT_NAMES = {
  ethiopic: "NotoSansEthiopic",
  ethiopicBold: "NotoSansEthiopic-Bold",
  latin: "Roboto",
  latinBold: "Roboto-Bold",
};

// Fallback fonts
export const FALLBACK_FONTS = {
  ethiopic: "helvetica",
  ethiopicBold: "helvetica",
  latin: "helvetica",
  latinBold: "helvetica",
};

// Cache for loaded fonts
let fontsLoaded = false;
let loadingPromise = null;

/**
 * Check if fonts are loaded in jsPDF
 */
export const areFontsLoaded = (doc) => {
  if (!doc) return false;
  try {
    doc.setFont(FONT_NAMES.ethiopic);
    return true;
  } catch (error) {
    // Font not loaded, return false
    console.debug("Font not loaded:", error.message);
    return false;
  }
};

/**
 * Load fonts into jsPDF with error handling
 */
export const loadFonts = (doc, options = {}) => {
  const { silent = false } = options;

  try {
    // Check if fonts are already loaded
    if (areFontsLoaded(doc)) {
      if (!silent) console.log("✅ Fonts already loaded");
      return doc;
    }

    if (!silent) console.log("📥 Loading fonts into PDF...");

    // Register fonts in jsPDF Virtual File System
    let hasEthiopicFont = false;
    let hasLatinFont = false;

    // Load Ethiopic fonts
    if (FONT_BASE64.notoSansEthiopic) {
      try {
        doc.addFileToVFS(
          "NotoSansEthiopic-Regular.ttf",
          FONT_BASE64.notoSansEthiopic,
        );
        doc.addFont(
          "NotoSansEthiopic-Regular.ttf",
          FONT_NAMES.ethiopic,
          "normal",
        );
        hasEthiopicFont = true;
        if (!silent) console.log("✅ Ethiopic font loaded");
      } catch (error) {
        console.warn("⚠️ Failed to load Ethiopic font:", error.message);
      }
    }

    if (FONT_BASE64.notoSansEthiopicBold) {
      try {
        doc.addFileToVFS(
          "NotoSansEthiopic-Bold.ttf",
          FONT_BASE64.notoSansEthiopicBold,
        );
        doc.addFont(
          "NotoSansEthiopic-Bold.ttf",
          FONT_NAMES.ethiopicBold,
          "bold",
        );
        hasEthiopicFont = true;
      } catch (error) {
        console.warn("⚠️ Failed to load Ethiopic Bold font:", error.message);
      }
    }

    // Load Latin fonts (Roboto)
    if (FONT_BASE64.roboto) {
      try {
        doc.addFileToVFS("Roboto-Regular.ttf", FONT_BASE64.roboto);
        doc.addFont("Roboto-Regular.ttf", FONT_NAMES.latin, "normal");
        hasLatinFont = true;
        if (!silent) console.log("✅ Roboto font loaded");
      } catch (error) {
        console.warn("⚠️ Failed to load Roboto font:", error.message);
      }
    }

    if (FONT_BASE64.robotoBold) {
      try {
        doc.addFileToVFS("Roboto-Bold.ttf", FONT_BASE64.robotoBold);
        doc.addFont("Roboto-Bold.ttf", FONT_NAMES.latinBold, "bold");
        hasLatinFont = true;
      } catch (error) {
        console.warn("⚠️ Failed to load Roboto Bold font:", error.message);
      }
    }

    // Set default font - try Latin first, then fallback
    try {
      if (hasLatinFont) {
        doc.setFont(FONT_NAMES.latin);
      } else if (hasEthiopicFont) {
        doc.setFont(FONT_NAMES.ethiopic);
      } else {
        doc.setFont("helvetica");
      }
    } catch (error) {
      console.warn("⚠️ Failed to set default font:", error.message);
      doc.setFont("helvetica");
    }

    // Store loaded state and font availability
    doc.__fontsLoaded = true;
    doc.__hasEthiopicFont = hasEthiopicFont;
    doc.__hasLatinFont = hasLatinFont;

    if (!silent) {
      console.log(
        `✅ Fonts loaded (Ethiopic: ${hasEthiopicFont}, Latin: ${hasLatinFont})`,
      );
    }

    return doc;
  } catch (error) {
    console.error("❌ Font loading failed:", error.message);

    // Use fallback fonts
    try {
      doc.setFont("helvetica");
      console.log("🔁 Using fallback fonts");
    } catch (fallbackError) {
      console.error("❌ Fallback font also failed:", fallbackError.message);
    }

    return doc;
  }
};

/**
 * Get appropriate font for text with fallback
 */
export const getFontForText = (text, bold = false, doc = null) => {
  if (!text) return FONT_NAMES.latin;

  // Check if text contains Amharic characters
  const hasAmharic = /[\u1200-\u137F]/.test(String(text));

  if (hasAmharic) {
    // Check if Ethiopic font is available
    if (doc && doc.__hasEthiopicFont) {
      return bold ? FONT_NAMES.ethiopicBold : FONT_NAMES.ethiopic;
    }
    // Fallback to helvetica if Ethiopic font not available
    return "helvetica";
  }

  // Check if Latin font is available
  if (doc && doc.__hasLatinFont) {
    return bold ? FONT_NAMES.latinBold : FONT_NAMES.latin;
  }

  return bold ? "helvetica" : "helvetica";
};

/**
 * Apply correct font to doc with error handling
 */
export const applyFontForText = (doc, text, bold = false) => {
  const fontName = getFontForText(text, bold, doc);

  try {
    doc.setFont(fontName);
    if (bold && fontName !== "helvetica") {
      // Some fonts handle bold differently
    }
  } catch (error) {
    // Fallback to helvetica
    console.warn("Font application failed, using fallback:", error.message);
    try {
      doc.setFont("helvetica", bold ? "bold" : "normal");
    } catch (fallbackError) {
      console.error("Fallback font also failed:", fallbackError.message);
    }
  }

  return doc;
};

/**
 * Preload fonts asynchronously
 * Fixed: Removed async from Promise executor
 */
export const preloadFonts = () => {
  if (fontsLoaded) return Promise.resolve(true);
  if (loadingPromise) return loadingPromise;

  // Create promise without async executor
  loadingPromise = new Promise((resolve) => {
    // Use an immediately invoked async function inside
    (async () => {
      try {
        console.log("🔄 Preloading PDF fonts...");

        // Create temporary document to load fonts
        const tempDoc = new jsPDF();
        loadFonts(tempDoc, { silent: true });

        // Store loaded fonts globally for reuse
        if (typeof window !== "undefined") {
          window.__pdfFontsLoaded = true;
          window.__pdfFontsDoc = tempDoc;
        }

        fontsLoaded = true;
        console.log("✅ PDF fonts preloaded");
        resolve(true);
      } catch (error) {
        console.error("❌ Font preload failed:", error.message);
        resolve(false);
      } finally {
        loadingPromise = null;
      }
    })();
  });

  return loadingPromise;
};

/**
 * Get font loading status
 */
export const getFontLoadingStatus = () => {
  if (typeof window === "undefined") return false;
  return !!window.__pdfFontsLoaded;
};

/**
 * Get preloaded fonts document
 */
export const getPreloadedFontsDoc = () => {
  if (typeof window === "undefined") return null;
  return window.__pdfFontsDoc || null;
};
