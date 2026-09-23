// frontend/src/components/leaderboard/LeaderboardTabs.jsx
import { C, F, radius, FONT_SIZES } from "../../styles/theme";

const LeaderboardTabs = ({ tabs, activeKey, onChange }) => (
  <div
    style={{
      display: "flex",
      gap: 4,
      background: C.cardBg,
      border: `1px solid ${C.border}`,
      borderRadius: radius.lg,
      padding: 4,
      flexWrap: "wrap",
    }}
  >
    {tabs.map((tab) => {
      const active = tab.key === activeKey;
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: radius.md,
            border: "none",
            background: active ? "#fff" : "transparent",
            color: active ? C.dark : C.muted,
            fontWeight: active ? 700 : 500,
            fontSize: FONT_SIZES.small,
            fontFamily: F.sans,
            cursor: "pointer",
            boxShadow: active ? "0 1px 4px rgba(13,26,94,0.08)" : "none",
            transition: "all 0.15s ease",
            flex: "1 1 auto",
            justifyContent: "center",
            minWidth: 110,
          }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.color = C.dark;
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.color = C.muted;
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default LeaderboardTabs;
