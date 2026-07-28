// frontend/src/utils/pdf/fontLoader.js
import jsPDF from "jspdf";
import { FONT_BASE64 } from "./fonts/fontBase64";

// Font names for jsPDF
//
// ✅ FIXED: Bold is a STYLE, not a separate font family. jsPDF looks up
// registered fonts by the (family name, style) PAIR — e.g. setFont("Roboto",
// "bold") only finds a font if something was registered as exactly
// ("Roboto", "bold"). Previously ethiopicBold/latinBold pointed at entirely
// different family names ("NotoSansEthiopic-Bold", "Roboto-Bold"), which
// were registered under THOSE names with style "bold" — but every caller
// in the codebase (dailyReport.js, pdfExport.js, pdfEngine.js) requests
// fonts as (ethiopic-or-latin family name, bold ? "bold" : "normal"), never
// by the "-Bold" name. That combination was never registered, so every
// bold Amharic/Latin string silently fell back to Helvetica (no error —
// jsPDF's setFont() never throws on an unregistered font/style pair, it
// just keeps whatever font was already active).
//
// The fix: register Bold under the SAME family name as Regular, varying
// only the style. ethiopicBold/latinBold are kept as aliases (equal to
// ethiopic/latin) purely so any existing call site that still imports
// them doesn't break — they no longer name a distinct PDF font family.
export const FONT_NAMES = {
  ethiopic: "NotoSansEthiopic",
  ethiopicBold: "NotoSansEthiopic", // ✅ alias — same family as `ethiopic`
  latin: "Roboto",
  latinBold: "Roboto", // ✅ alias — same family as `latin`
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
  // jsPDF's setFont() never throws when a font name isn't registered — it
  // just falls back silently. The reliable signal is the flag loadFonts()
  // itself sets, not whether setFont() happened to not throw.
  return !!(doc && doc.__fontsLoaded);
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

    // ── Ethiopic Regular ──────────────────────────────────────────────
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

    // ── Ethiopic Bold ─────────────────────────────────────────────────
    // ✅ Registered under FONT_NAMES.ethiopic (same family as Regular),
    // style "bold" — NOT under a separate "-Bold" family name.
    if (FONT_BASE64.notoSansEthiopicBold) {
      try {
        doc.addFileToVFS(
          "NotoSansEthiopic-Bold.ttf",
          FONT_BASE64.notoSansEthiopicBold,
        );
        doc.addFont(
          "NotoSansEthiopic-Bold.ttf",
          FONT_NAMES.ethiopic, // ✅ same family name as Regular
          "bold",
        );
        hasEthiopicFont = true;
        if (!silent) console.log("✅ Ethiopic Bold font loaded");
      } catch (error) {
        console.warn("⚠️ Failed to load Ethiopic Bold font:", error.message);
      }
    }

    // ── Latin Regular (Roboto) ────────────────────────────────────────
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

    // ── Latin Bold (Roboto-Bold) ──────────────────────────────────────
    // ✅ Registered under FONT_NAMES.latin (same family as Regular),
    // style "bold" — NOT under a separate "-Bold" family name.
    if (FONT_BASE64.robotoBold) {
      try {
        doc.addFileToVFS("Roboto-Bold.ttf", FONT_BASE64.robotoBold);
        doc.addFont(
          "Roboto-Bold.ttf",
          FONT_NAMES.latin, // ✅ same family name as Regular
          "bold",
        );
        hasLatinFont = true;
        if (!silent) console.log("✅ Roboto Bold font loaded");
      } catch (error) {
        console.warn("⚠️ Failed to load Roboto Bold font:", error.message);
      }
    }

    // Set default font - try Latin first, then fallback
    try {
      if (hasLatinFont) {
        doc.setFont(FONT_NAMES.latin, "normal");
      } else if (hasEthiopicFont) {
        doc.setFont(FONT_NAMES.ethiopic, "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }
    } catch (error) {
      console.warn("⚠️ Failed to set default font:", error.message);
      doc.setFont("helvetica", "normal");
    }

    // Store loaded state and font availability
    doc.__fontsLoaded = true;
    doc.__hasEthiopicFont = hasEthiopicFont;
    doc.__hasLatinFont = hasLatinFont;

    if (!silent) {
      console.log(
        `✅ Fonts loaded (Ethiopic: ${hasEthiopicFont}, Latin: ${hasLatinFont})`,
      );
      // Self-check: confirms both styles actually resolved for each family.
      // If either "bold" entry is missing here after this change, something
      // is wrong with the base64 data itself (already verified fine) or the
      // installed jsPDF version's addFont/getFontList behavior.
      try {
        console.log("📋 jsPDF font list:", doc.getFontList());
      } catch (fontListError) {
        // getFontList not available on this jsPDF version — non-fatal.
        console.debug("getFontList() unavailable:", fontListError?.message);
      }
    }

    return doc;
  } catch (error) {
    console.error("❌ Font loading failed:", error.message);

    // Use fallback fonts
    try {
      doc.setFont("helvetica", "normal");
      console.log("🔁 Using fallback fonts");
    } catch (fallbackError) {
      console.error("❌ Fallback font also failed:", fallbackError.message);
    }

    return doc;
  }
};

/**
 * Get appropriate font for text with fallback.
 * ✅ Bold no longer changes the returned family name — only the caller's
 * subsequent setFont(name, style) call should vary by style. This function
 * still accepts `bold` for the has-font availability check and for API
 * compatibility with existing call sites, but ethiopicBold/latinBold are
 * now aliases equal to ethiopic/latin, so the returned name is the same
 * either way.
 */
// compatibility (existing code calls getFontForText(text, bold, doc));
// it no longer affects which family name is returned since Bold now
// shares the same family as Regular — only the style passed to
// doc.setFont() should vary.
// eslint-disable-next-line no-unused-vars
export const getFontForText = (text, bold = false, doc = null) => {
  if (!text) return FONT_NAMES.latin;

  // Check if text contains Amharic characters
  const hasAmharic = /[\u1200-\u137F]/.test(String(text));

  if (hasAmharic) {
    // Check if Ethiopic font is available
    if (doc && doc.__hasEthiopicFont) {
      return FONT_NAMES.ethiopic;
    }
    // Fallback to helvetica if Ethiopic font not available
    return "helvetica";
  }

  // Check if Latin font is available
  if (doc && doc.__hasLatinFont) {
    return FONT_NAMES.latin;
  }

  return "helvetica";
};

/**
 * Apply correct font to doc with error handling.
 * ✅ Now always passes the actual style through to setFont(), instead of
 * relying on the font NAME to encode boldness. This is what makes bold
 * Amharic/Latin text actually pick up the embedded Bold weight.
 */
export const applyFontForText = (doc, text, bold = false) => {
  const fontName = getFontForText(text, bold, doc);
  const style = bold ? "bold" : "normal";

  try {
    doc.setFont(fontName, style);
  } catch (error) {
    // Fallback to helvetica
    console.warn("Font application failed, using fallback:", error.message);
    try {
      doc.setFont("helvetica", style);
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
