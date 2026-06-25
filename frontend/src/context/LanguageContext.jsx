// src/context/LanguageContext.jsx
import { useState, useEffect } from "react";
import { translations } from "../constants/translations";
import { LanguageContext } from "./LanguageContext";

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("app_lang") || "am",
  );

  useEffect(() => {
    localStorage.setItem("app_lang", language);
  }, [language]);

  // Translation function - supports nested keys like "nav.dashboard"
  const t = (path) => {
    const keys = path.split(".");
    let result = translations[language];

    for (const key of keys) {
      if (result && result[key] !== undefined && result[key] !== null) {
        result = result[key];
      } else {
        // Fallback to English if key missing in current language
        let fallback = translations["en"];
        for (const fKey of keys) {
          if (
            fallback &&
            fallback[fKey] !== undefined &&
            fallback[fKey] !== null
          ) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }

    return result;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

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
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
