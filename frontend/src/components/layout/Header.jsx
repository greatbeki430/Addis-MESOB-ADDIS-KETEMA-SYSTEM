// frontend/src/components/layout/Header.jsx
import { C, F } from "../../styles/theme";
import { LANGUAGES } from "../../constants/translations";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import {
  FiHome,
  FiMessageSquare,
  FiStar,
  FiFileText,
  FiGrid,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiCalendar,
  FiChevronRight,
  FiUser,
  FiGlobe,
} from "react-icons/fi";

export default function Header({ tab, t, lang, setLang }) {
  const icons = {
    dashboard: <FiHome size={18} />,
    forum: <FiMessageSquare size={18} />,
    evaluation: <FiStar size={18} />,
    report: <FiFileText size={18} />,
    services: <FiGrid size={18} />,
    users: <FiUsers size={18} />,
    teams: <FiUsers size={18} />,
    analytics: <FiBarChart2 size={18} />,
    "golden-monday": <FiCalendar size={18} />,
  };
  const { logout, user } = useAuth();
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const safeT = t || {};
  const safeNav = safeT.nav || {};
  const safeAuth = safeT.auth || {};
  const safeAppName = safeT.appName || "A-MESOB";

  const tabLabel = safeNav[tab] || tab;

  return (
    <header
      style={{
        height: "auto",
        minHeight: "clamp(48px, 8vh, 56px)",
        background: C.white,
        borderBottom: `2px solid rgba(26, 58, 173, 0.13)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px clamp(12px, 4vw, 24px)",
        boxShadow: "0 2px 12px rgba(26,58,173,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        gap: "clamp(8px, 3vw, 16px)",
        flexWrap: "wrap",
      }}
    >
      {/* LEFT SECTION */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(6px, 2vw, 12px)",
          flexWrap: "wrap",
          flex: "1 1 auto",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "clamp(16px, 4vw, 20px)",
            color: C.primary,
            flexShrink: 0,
            animation: "pulseGlow 3s ease-in-out infinite",
            display: "flex",
            alignItems: "center",
          }}
        >
          {icons[tab] || <FiGrid size={18} />}
        </span>

        <span
          className="header-appname"
          style={{
            color: C.muted,
            fontSize: "clamp(10px, 3vw, 12px)",
            fontFamily: F.sans,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {safeAppName}
        </span>

        <span
          style={{
            color: C.gold,
            fontSize: "clamp(10px, 3vw, 14px)",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
          }}
        >
          <FiChevronRight size={14} />
        </span>

        <span
          style={{
            fontWeight: 700,
            fontSize: "clamp(11px, 3.5vw, 13px)",
            color: C.dark,
            fontFamily: F.sans,
            whiteSpace: "normal",
            wordBreak: "break-word",
            maxWidth: "min(200px, 40vw)",
            background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {tabLabel}
        </span>
      </div>

      {/* RIGHT SECTION - FIXED LAYOUT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(6px, 2vw, 14px)",
          flexShrink: 0,
          flexWrap: "nowrap",
        }}
      >
        {/* Date - hidden on mobile */}
        <span
          className="header-date"
          style={{
            fontSize: "clamp(9px, 2.5vw, 11px)",
            color: C.muted,
            fontFamily: F.sans,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiCalendar size={12} />
          {dateStr}
        </span>

        {/* Language Buttons - fixed width */}
        <div
          style={{
            display: "flex",
            gap: "clamp(2px, 1.5vw, 6px)",
            flexShrink: 0,
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className="header-lang-btn"
              onClick={() => setLang(l.code)}
              title={l.label}
              style={{
                background: lang === l.code ? C.primary : "#f0f3ff",
                color: lang === l.code ? C.gold : C.primary,
                border: `1px solid ${lang === l.code ? C.primary : C.border}`,
                borderRadius: 5,
                padding: "clamp(2px, 1.5vw, 4px) clamp(4px, 2vw, 8px)",
                fontSize: "clamp(9px, 2.5vw, 11px)",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: F.sans,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                minWidth: "clamp(24px, 6vw, 32px)",
                transform: lang === l.code ? "scale(1.05)" : "scale(1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
              onMouseEnter={(e) => {
                if (lang !== l.code) {
                  e.currentTarget.style.background = C.primary + "22";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (lang !== l.code) {
                  e.currentTarget.style.background = "#f0f3ff";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <FiGlobe size={10} />
              {l.flag}
            </button>
          ))}
        </div>

        {/* Logout Button - FIXED WIDTH */}
        <button
          onClick={logout}
          className="header-logout-btn"
          style={{
            background: isLogoutHovered ? "#dc2626" : "transparent",
            border: `1px solid ${isLogoutHovered ? "#dc2626" : C.border}`,
            borderRadius: 5,
            padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 2vw, 14px)",
            minWidth: "clamp(70px, 10vw, 90px)",
            fontSize: "clamp(10px, 2.5vw, 12px)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: isLogoutHovered ? "#fff" : C.muted,
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            height: "clamp(30px, 4vh, 36px)",
          }}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
        >
          <FiLogOut size={14} style={{ flexShrink: 0 }} />
          <span
            style={{
              display: "inline-block",
              // ✅ Fixed width for the text to prevent layout shift
              minWidth: "clamp(38px, 5vw, 50px)",
              textAlign: "center",
            }}
          >
            {safeAuth.logout || "Logout"}
          </span>
        </button>

        {/* Profile Avatar */}
        <div
          className="header-avatar"
          style={{
            width: "clamp(28px, 6vw, 36px)",
            height: "clamp(28px, 6vw, 36px)",
            background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "clamp(12px, 3vw, 16px)",
            color: "#fff",
            fontWeight: 900,
            fontFamily: F.serif,
            cursor: "pointer",
            boxShadow: `0 2px 8px rgba(26,58,173,0.35)`,
            flexShrink: 0,
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          title={user?.name || "User"}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,197,24,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,58,173,0.35)";
          }}
        >
          <FiUser size={16} />
        </div>
      </div>

      {/* ✅ Responsive CSS */}
      <style>{`
        @media (max-width: 500px) {
          .header-lang-btn {
            display: none !important;
          }
          .header-logout-btn span {
            display: none !important;
          }
          .header-logout-btn {
            min-width: unset !important;
            padding: 6px 10px !important;
          }
          .header-date {
            display: none !important;
          }
          .header-appname {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
