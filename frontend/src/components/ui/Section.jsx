// frontend/src/components/ui/Section.jsx
// Enhanced Section component with professional styling

import { useState } from "react";
import { C, F, radius } from "../../styles/theme";
import { FiChevronDown } from "react-icons/fi";

const Section = ({
  title,
  children,
  icon,
  collapsible = false,
  defaultOpen = true,
  badge = null,
  variant = "default",
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    default: {
      background: "transparent",
      borderColor: "#f0f0f0",
      titleColor: C.primary,
    },
    highlight: {
      background: `linear-gradient(135deg, ${C.primary}06, ${C.light}04)`,
      borderColor: C.primary,
      titleColor: C.dark,
    },
    muted: {
      background: C.bg,
      borderColor: C.border,
      titleColor: C.muted,
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  const toggleOpen = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      style={{
        marginBottom: "clamp(20px, 5vw, 28px)",
        padding: "clamp(12px, 3vw, 16px)",
        background: styles.background,
        borderRadius: radius.lg,
        border: `1.5px solid ${styles.borderColor}`,
        transition: "all 0.3s ease",
        ...(className && { className }),
        ...props,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: collapsible ? "pointer" : "default",
          padding: "clamp(4px, 1vw, 8px) 0",
          userSelect: collapsible ? "none" : "auto",
        }}
        onClick={toggleOpen}
        onMouseEnter={(e) => {
          if (collapsible) {
            e.currentTarget.style.opacity = "0.8";
          }
        }}
        onMouseLeave={(e) => {
          if (collapsible) {
            e.currentTarget.style.opacity = "1";
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(8px, 2vw, 12px)",
            flex: 1,
          }}
        >
          {icon && (
            <span
              style={{
                fontSize: "clamp(18px, 4.5vw, 22px)",
                display: "flex",
                alignItems: "center",
                color: C.primary,
              }}
            >
              {icon}
            </span>
          )}
          <h3
            style={{
              fontSize: "clamp(14px, 4vw, 17px)",
              fontWeight: 700,
              color: styles.titleColor,
              fontFamily: F.sans,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {title}
            {badge && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: radius.pill,
                  background: C.primary,
                  color: "#fff",
                }}
              >
                {badge}
              </span>
            )}
          </h3>
        </div>

        {collapsible && (
          <span
            style={{
              color: C.muted,
              transition: "transform 0.3s ease",
              transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FiChevronDown size={18} />
          </span>
        )}
      </div>

      {(!collapsible || isOpen) && (
        <div
          style={{
            marginTop: "clamp(12px, 3vw, 16px)",
            animation: "fadeInUp 0.3s ease",
          }}
        >
          {children}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
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

export default Section;
