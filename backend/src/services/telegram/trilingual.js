// backend/src/services/telegram/trilingual.js
//
// Fixed labels for the Golden Monday announcement, translated into
// the three languages this organization posts in. Dynamic content
// (presentation title, AI-suggested topics) is translated separately
// by the AI service when needed.

const LABELS = {
  am: {
    header: "ወርቃማ ሰኞ",
    presenter: "አቅራቢ",
    department: "ዘርፍ",
    topic: "ርዕስ",
    description: "መግለጫ",
    time: "ሰዓት",
    timeValue: "2:00 – 2:50 ከሰዓት",
    location: "ቦታ",
    locationValue: "አዲስ መሶብ ስብሰባ አዳራሽ",
    aiTopics: "በAI የተጠቆሙ ርዕሶች",
    hashtags: ["#ወርቃማሰኞ", "#አዲስመሶብ"],
  },
  en: {
    header: "Golden Monday",
    presenter: "Presenter",
    department: "Department",
    topic: "Topic",
    description: "Description",
    time: "Time",
    timeValue: "2:00 – 2:50 PM",
    location: "Location",
    locationValue: "Addis MESOB Conference Hall",
    aiTopics: "AI Suggested Topics",
    hashtags: ["#GoldenMonday", "#AddisMESOB"],
  },
  om: {
    header: "Wiixata Warqee",
    presenter: "Dhiheessituu",
    department: "Kutaa",
    topic: "Mataduree",
    description: "Ibsa",
    time: "Yeroo",
    timeValue: "2:00 – 2:50 PM",
    location: "Bakka",
    locationValue: "Addis MESOB Galma Walga'ii",
    aiTopics: "Matadureewwan AI yaade",
    hashtags: ["#WiixataWarqee", "#AddisMESOB"],
  },
};

// Format a Date as a human string in a given language. Uses the
// built-in Intl API so we don't need date-fns or moment.
const formatDateForLang = (date, lang) => {
  const d = date instanceof Date ? date : new Date(date);
  const localeMap = {
    am: "am-ET",
    en: "en-US",
    om: "om-ET", // falls back to a Latin script if om-ET isn't available
  };
  const locale = localeMap[lang] || "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    // Some Node builds ship without the om locale — fall back to English.
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }
};

// Build the small "#PresenterName" hashtag the message ends with.
// Keeps the name alphanumeric-only so Telegram renders it cleanly.
// Uses Unicode property escapes so Amharic / Latin / digits all work.
const buildPresenterHashtag = (name) =>
  `#${String(name || "GM").replace(/[^\p{L}\p{N}]/gu, "")}`;

// ─── DYNAMIC STRING TRANSLATION ─────────────────────────────────
//
// Translate an array of short strings into a target language via the
// existing AI service. Falls back to returning the originals if the
// service is unavailable or throws — the goal is to never block an
// announcement post on a translation failure.
//
// The AI service exposes a `translate(text, targetLanguage)` helper
// (matches the /api/ai/translate endpoint). We `require` it lazily so
// a missing export doesn't crash this module at load time.

async function translateDynamicStrings(strings, targetLanguage) {
  const cleanStrings = (strings || [])
    .filter((s) => typeof s === "string" && s.trim())
    .map((s) => s.trim());

  if (cleanStrings.length === 0) return [];
  if (targetLanguage === "en") return cleanStrings;

  // Try to locate the AI translate function. Different codebases name
  // it differently — accept any of the common aliases.
  let translateFn = null;
  try {
    const ai = require("../aiService");
    translateFn =
      ai.translateText ||
      ai.translate ||
      ai.translateAiText ||
      (ai.default && (ai.default.translateText || ai.default.translate)) ||
      null;
  } catch (err) {
    console.warn(
      "[trilingual] aiService not found, skipping dynamic translation:",
      err.message,
    );
  }

  if (typeof translateFn !== "function") {
    console.warn(
      `[trilingual] no translate function in aiService — returning originals for ${targetLanguage}`,
    );
    return cleanStrings;
  }

  // Translate each string in parallel; any individual failure falls
  // back to the original for that one string only.
  const results = await Promise.all(
    cleanStrings.map((s) =>
      Promise.resolve(translateFn(s, targetLanguage)).catch((err) => {
        console.warn(
          `[trilingual] translate(${targetLanguage}) failed for "${s.slice(0, 40)}...": ${err.message}`,
        );
        return s;
      }),
    ),
  );

  return results;
}

module.exports = {
  LABELS,
  formatDateForLang,
  buildPresenterHashtag,
  translateDynamicStrings,
};
