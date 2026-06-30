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

    // Preload fonts in background
    preloadPromise = preloadFonts();
    await preloadPromise;

    preloaded = true;
    console.log("✅ PDF fonts ready");
    return true;
  } catch (error) {
    console.error("❌ PDF font initialization failed:", error);
    return false;
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
