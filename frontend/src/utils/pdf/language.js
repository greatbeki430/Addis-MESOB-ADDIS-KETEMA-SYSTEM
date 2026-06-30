// frontend/src/utils/pdf/language.js

/**
 * Check if text contains Amharic characters
 * Ethiopic Unicode range: U+1200 - U+137F
 */
export const isAmharic = (text) => {
  if (!text || typeof text !== "string") return false;
  return /[\u1200-\u137F]/.test(text);
};

/**
 * Check if text contains English characters
 */
export const isEnglish = (text) => {
  if (!text || typeof text !== "string") return false;
  return /[a-zA-Z]/.test(text);
};

/**
 * Detect primary language of text
 */
export const detectLanguage = (text) => {
  if (!text || typeof text !== "string") return "english";

  const hasAmharic = isAmharic(text);
  const hasLatin = isEnglish(text);

  if (hasAmharic && hasLatin) return "mixed";
  if (hasAmharic) return "amharic";
  return "english";
};

/**
 * Encode text safely for PDF
 */
export const encodeText = (text) => {
  if (!text) return "";
  if (typeof text === "number") return String(text);
  return String(text);
};

/**
 * Split text by language for mixed content rendering
 */
export const splitByLanguage = (text) => {
  if (!text || typeof text !== "string") return [{ text, language: "english" }];

  const parts = [];
  let currentPart = "";
  let currentLang = "english";

  for (const char of text) {
    const isAmh = isAmharic(char);
    const lang = isAmh ? "amharic" : "english";

    if (!currentPart) {
      currentPart = char;
      currentLang = lang;
    } else if (currentLang === lang) {
      currentPart += char;
    } else {
      parts.push({ text: currentPart, language: currentLang });
      currentPart = char;
      currentLang = lang;
    }
  }

  if (currentPart) {
    parts.push({ text: currentPart, language: currentLang });
  }

  return parts.length > 0 ? parts : [{ text, language: "english" }];
};

/**
 * Get text style based on content
 */
export const getTextStyle = (text, options = {}) => {
  const hasAmharic = isAmharic(text);
  const { bold = false, size = 10 } = options;

  return {
    fontName: hasAmharic
      ? bold
        ? "NotoSansEthiopic-Bold"
        : "NotoSansEthiopic"
      : bold
        ? "Roboto-Bold"
        : "Roboto",
    isAmharic: hasAmharic,
    size,
    bold,
  };
};

/**
 * Check if text needs Amharic font
 */
export const needsAmharicFont = (text) => {
  return isAmharic(text);
};
