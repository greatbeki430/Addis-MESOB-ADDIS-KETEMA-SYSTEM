// frontend/src/utils/pdf/fontPreloader.js
import { preloadFonts } from "./fontLoader";

let preloaded = false;
let preloadPromise = null;

/**
 * Initialize PDF fonts
 * Call this in App.jsx or main entry point
 */
export const initPDFFonts = async () => {
  if (preloaded) return true;

  try {
    console.log("🔄 Initializing PDF fonts...");

    // Try to preload fonts, but don't fail if they don't load
    try {
      preloadPromise = preloadFonts();
      await preloadPromise;
      preloaded = true;
      console.log("✅ PDF fonts ready");
    } catch (fontError) {
      console.warn("⚠️ PDF font preload warning:", fontError.message);
      console.warn("   Using fallback fonts for PDF generation");
      // ✅ Still mark as ready so PDF generation continues with fallback
      preloaded = true;
    }
    return true;
  } catch (error) {
    console.error("❌ PDF font initialization failed:", error);
    // ✅ Return true anyway so PDF generation can continue with fallback
    return true;
  }
};

/**
 * Check if fonts are ready
 */
export const arePDFFontsReady = () => {
  return preloaded;
};

/**
 * Get preload status
 */
export const getPDFFontsStatus = () => {
  return {
    ready: preloaded,
    loading: !!preloadPromise,
  };
};

/**
 * ✅ Force reload fonts (useful after font files update)
 */
export const reloadPDFFonts = async () => {
  preloaded = false;
  preloadPromise = null;
  return initPDFFonts();
};
