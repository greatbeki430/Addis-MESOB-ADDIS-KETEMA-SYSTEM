// src/context/LanguageProvider.jsx
import { useState, useEffect } from "react";
import { LanguageContext } from "./LanguageContext";

// Import existing translations (legacy system)
import { translations as legacyTranslations } from "../constants/translations";

// Import modular translations (new system)
import { modularTranslations } from "../constants/translations/index";

/**
 * Merge translations with priority: modular overrides legacy
 * This allows gradual migration without breaking existing code
 */
const mergeTranslations = () => {
  const merged = {
    en: { ...legacyTranslations.en, ...modularTranslations.en },
    am: { ...legacyTranslations.am, ...modularTranslations.am },
    om: { ...legacyTranslations.om, ...modularTranslations.om },
  };
  return merged;
};

// Create the merged translations object
const translations = mergeTranslations();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("app_lang") || "am",
  );

  useEffect(() => {
    localStorage.setItem("app_lang", language);
  }, [language]);

  /**
   * Enhanced translation function with support for:
   * - Nested keys (e.g., "dashboard.title")
   * - Fallback to English if translation not found
   * - Variable interpolation (e.g., "Hello {name}")
   * - Default return of the path if nothing found
   */
  const t = (path, variables = {}) => {
    // Handle array path or string path
    const keys = typeof path === "string" ? path.split(".") : path;

    // Try to find the translation
    let result = translations[language];

    for (const key of keys) {
      if (result && result[key] !== undefined && result[key] !== null) {
        result = result[key];
      } else {
        // Fallback to English
        let fallback = translations["en"];
        let found = true;

        for (const fKey of keys) {
          if (
            fallback &&
            fallback[fKey] !== undefined &&
            fallback[fKey] !== null
          ) {
            fallback = fallback[fKey];
          } else {
            found = false;
            break;
          }
        }

        if (found) {
          result = fallback;
        } else {
          // If nothing found, return the path
          return path;
        }
        break;
      }
    }

    // Handle variable interpolation
    if (typeof result === "string" && Object.keys(variables).length > 0) {
      let interpolated = result;
      for (const [key, value] of Object.entries(variables)) {
        interpolated = interpolated.replace(new RegExp(`{${key}}`, "g"), value);
      }
      return interpolated;
    }

    return result;
  };

  const changeLanguage = (lang) => setLanguage(lang);

  const availableLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "am", name: "አማርኛ", flag: "🇪🇹" },
    { code: "om", name: "Afaan Oromo", flag: "🇪🇹" },
  ];

  const value = {
    language,
    changeLanguage,
    t,
    availableLanguages,
    // Expose merged translations for debugging or advanced use
    translations: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
