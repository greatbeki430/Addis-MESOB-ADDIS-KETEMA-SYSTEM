// ════════════════════════════════════════════════════════════
// components/layout/Sidebar
// ════════════════════════════════════════════════════════════
import { C, F } from "../../styles/theme";
import { LANGUAGES } from "../../constants/translations";

const NAV = [
  { id: "dashboard", icon: "⬢" },
  { id: "forum", icon: "◈" },
  { id: "evaluation", icon: "◉" },
  { id: "report", icon: "◫" },
  { id: "services", icon: "◧" },
];

export default function Sidebar({
  tab,
  setTab,
  lang,
  setLang,
  t,
  collapsed,
  setCollapsed,
}) {
  return (
    <aside
      style={{
        width: collapsed ? 56 : 160,
        minHeight: "100vh",
        background: C.dark,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        borderRight: `2px solid ${C.primary}`,
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Collapse Toggle - NOW AT TOP */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: "#162c1e",
          border: "none",
          color: "#4a7a5a",
          padding: "12px 0",
          cursor: "pointer",
          fontSize: 14,
          borderBottom: "1px solid #1a3a26",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a26")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#162c1e")}
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "16px 0" : "14px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
          borderBottom: "1px solid #1a3a26",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            minWidth: 32,
            background: `linear-gradient(135deg,${C.primary},${C.light})`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 900,
            color: "#fff",
            fontFamily: F.serif,
          }}
        >
          አ
        </div>
        {!collapsed && (
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: C.light,
                fontFamily: F.serif,
              }}
            >
              {t.appName}
            </div>
            <div style={{ fontSize: 8, color: "#6aaa88", letterSpacing: 0.3 }}>
              One-Stop
            </div>
          </div>
        )}
      </div>

      {/* Nav label */}
      {!collapsed && (
        <div
          style={{
            padding: "10px 12px 4px",
            fontSize: 9,
            color: "#4a7a5a",
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {t.sidebar.main}
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "4px 0" }}>
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              title={t.nav[n.id]}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px 0" : "8px 12px",
                background: active ? "#1a6b4a22" : "none",
                border: "none",
                borderLeft: active
                  ? `3px solid ${C.light}`
                  : "3px solid transparent",
                color: active ? C.light : "#7a9a88",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                fontFamily: F.sans,
                transition: "all .18s",
                marginBottom: 1,
              }}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {!collapsed && <span>{t.nav[n.id]}</span>}
            </button>
          );
        })}
      </nav>

      {/* Language switcher - Now at bottom */}
      <div
        style={{
          borderTop: "1px solid #1a3a26",
          padding: collapsed ? "10px 0" : "12px 12px",
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: 9,
              color: "#4a7a5a",
              fontWeight: 700,
              letterSpacing: 0.5,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {t.sidebar.language}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            gap: 4,
            alignItems: collapsed ? "center" : "center",
            justifyContent: collapsed ? "center" : "flex-start",
            flexWrap: "wrap",
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              title={l.label}
              style={{
                background: lang === l.code ? C.primary : "transparent",
                color: lang === l.code ? "#fff" : "#5a8a6a",
                border: `1px solid ${lang === l.code ? C.primary : "#2a5a3a"}`,
                borderRadius: 4,
                padding: collapsed ? "4px 6px" : "3px 8px",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: F.sans,
                width: collapsed ? "auto" : "auto",
              }}
            >
              {l.flag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
