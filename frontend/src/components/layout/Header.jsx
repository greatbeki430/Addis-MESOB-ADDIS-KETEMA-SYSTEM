// ════════════════════════════════════════════════════════════
// components/layout/Header - Fully Responsive with Logout
// ════════════════════════════════════════════════════════════
import { C, F } from "../../styles/theme";
import { LANGUAGES } from "../../constants/translations";
import { useAuth } from "../../context/AuthContext";

export default function Header({ tab, t, lang, setLang }) {
  const icons = {
    dashboard: "⬢",
    forum: "◈",
    evaluation: "◉",
    report: "◫",
    services: "◧",
  };
  const { logout, user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Get user initial for avatar
  const getUserInitial = () => {
    if (!user?.name) return "U";
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <header
      style={{
        height: "auto",
        minHeight: "clamp(48px, 8vh, 56px)",
        background: C.white,
        borderBottom: "1px solid #e0ece4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px clamp(12px, 4vw, 24px)",
        boxShadow: "0 1px 4px #0001",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        gap: "clamp(8px, 3vw, 16px)",
        flexWrap: "wrap",
      }}
    >
      {/* LEFT SECTION - Navigation info */}
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
          }}
        >
          {icons[tab] || "◈"}
        </span>

        {/* App name - hide on very small screens */}
        <span
          className="header-appname"
          style={{
            color: C.muted,
            fontSize: "clamp(10px, 3vw, 12px)",
            fontFamily: F.sans,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            "@media (max-width: 480px)": {
              display: "none",
            },
          }}
        >
          {t.appName}
        </span>

        <span style={{ color: "#ccc", fontSize: "clamp(10px, 3vw, 12px)" }}>
          ›
        </span>

        {/* Current page name */}
        <span
          style={{
            fontWeight: 700,
            fontSize: "clamp(11px, 3.5vw, 13px)",
            color: C.dark,
            fontFamily: F.sans,
            whiteSpace: "normal",
            wordBreak: "break-word",
            maxWidth: "min(200px, 40vw)",
          }}
        >
          {t.nav[tab]}
        </span>
      </div>

      {/* RIGHT SECTION - Date, Language, Logout, Profile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(6px, 2vw, 14px)",
          flexShrink: 0,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {/* Date - Hide on small screens */}
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
            "@media (max-width: 550px)": {
              display: "none",
            },
          }}
        >
          📅 {dateStr}
        </span>

        {/* Language buttons - Desktop: Show all buttons, Mobile: Dropdown */}
        <div
          style={{
            display: "flex",
            gap: "clamp(2px, 1.5vw, 6px)",
            flexShrink: 0,
          }}
        >
          {/* Desktop: Show all buttons */}
          <div
            style={{
              display: "flex",
              gap: "clamp(2px, 1.5vw, 6px)",
              "@media (max-width: 500px)": {
                display: "none",
              },
            }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className="header-lang-btn"
                onClick={() => setLang(l.code)}
                title={l.label}
                style={{
                  background: lang === l.code ? C.primary : "#f0f7f4",
                  color: lang === l.code ? "#fff" : C.primary,
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
                }}
              >
                {l.flag}
              </button>
            ))}
          </div>

          {/* Mobile: Show dropdown selector */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              background: C.primary,
              color: "#fff",
              border: `1px solid ${C.primary}`,
              borderRadius: 5,
              padding: "clamp(2px, 1.5vw, 4px) clamp(4px, 2vw, 8px)",
              fontSize: "clamp(9px, 2.5vw, 11px)",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
              display: "none",
              "@media (max-width: 500px)": {
                display: "block",
              },
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ LOGOUT BUTTON - Added here */}
        <button
          onClick={logout}
          className="header-logout-btn"
          style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: 5,
            padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 2vw, 12px)",
            fontSize: "clamp(10px, 2.5vw, 12px)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: C.muted,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#dc2626";
            e.currentTarget.style.borderColor = "#dc2626";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.muted;
          }}
        >
          <span style={{ fontSize: "clamp(12px, 3vw, 14px)" }}>🚪</span>
          <span style={{ display: "inline-block" }}>Logout</span>
        </button>

        {/* Profile avatar - now shows user initial */}
        <div
          className="header-avatar"
          style={{
            width: "clamp(28px, 6vw, 36px)",
            height: "clamp(28px, 6vw, 36px)",
            background: `linear-gradient(135deg,${C.primary},${C.light})`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "clamp(12px, 3vw, 16px)",
            color: "#fff",
            fontWeight: 900,
            fontFamily: F.serif,
            cursor: "pointer",
            boxShadow: `0 2px 6px ${C.primary}44`,
            flexShrink: 0,
          }}
          title={user?.name || "User"}
        >
          {getUserInitial()}
        </div>
      </div>
    </header>
  );
}
