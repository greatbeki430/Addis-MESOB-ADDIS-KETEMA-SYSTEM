// src/components/LanguageSelector.jsx
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { C, F } from "../styles/theme";
import { FiGlobe, FiChevronDown, FiCheck } from "react-icons/fi";

const LanguageSelector = ({ variant = "default" }) => {
  const { language, changeLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang =
    availableLanguages.find((l) => l.code === language) ||
    availableLanguages[1]; // Default to Amharic

  const handleSelect = (code) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  const variantStyles = {
    default: {
      button: {
        padding: "6px 12px",
        fontSize: "13px",
        background: "transparent",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
      },
      dropdown: {
        minWidth: "160px",
        right: 0,
      },
    },
    compact: {
      button: {
        padding: "4px 8px",
        fontSize: "12px",
        background: "transparent",
        border: "none",
        borderRadius: "6px",
      },
      dropdown: {
        minWidth: "140px",
        right: 0,
      },
    },
    header: {
      button: {
        padding: "8px 14px",
        fontSize: "14px",
        background: "#f8fafc",
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      },
      dropdown: {
        minWidth: "180px",
        right: 0,
        top: "calc(100% + 8px)",
      },
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          color: C.dark,
          fontFamily: F.sans,
          transition: "all 0.2s ease",
          ...styles.button,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.primary;
          if (variant !== "compact") {
            e.currentTarget.style.background = "#f8fafc";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = styles.button.border || C.border;
          if (variant !== "compact") {
            e.currentTarget.style.background =
              styles.button.background || "transparent";
          }
        }}
        aria-label="Select language"
      >
        <FiGlobe size={variant === "compact" ? 14 : 16} color={C.primary} />
        <span>
          {currentLang.flag} {currentLang.name}
        </span>
        <FiChevronDown
          size={variant === "compact" ? 12 : 14}
          style={{
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: C.muted,
          }}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            style={{
              position: "absolute",
              top: styles.dropdown.top || "calc(100% + 4px)",
              right: styles.dropdown.right,
              background: "#fff",
              borderRadius: "10px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              border: `1px solid ${C.border}`,
              zIndex: 50,
              minWidth: styles.dropdown.minWidth,
              overflow: "hidden",
              animation: "slideDown 0.15s ease",
            }}
          >
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  width: "100%",
                  border: "none",
                  background:
                    language === lang.code ? "#F0FDF4" : "transparent",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: F.sans,
                  color: language === lang.code ? C.primary : C.dark,
                  transition: "background 0.15s ease",
                  borderLeft:
                    language === lang.code
                      ? `3px solid ${C.primary}`
                      : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    language === lang.code ? "#F0FDF4" : "transparent";
                }}
              >
                <span style={{ fontSize: "16px" }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.name}</span>
                {language === lang.code && (
                  <FiCheck size={14} color={C.primary} />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
