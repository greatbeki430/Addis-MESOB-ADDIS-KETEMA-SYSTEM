// frontend/src/components/leaderboard/LeaderboardTabs.jsx
import { useState } from "react";
import { C, F, radius, FONT_SIZES } from "../../styles/theme";

// ─── Per-tab accent palette ─────────────────────────────────
// Each tab gets its own accent color so the active state is
// identifiable at a glance even before reading the label. Falls back
// to the app's primary blue for any tab without an explicit color.
const TAB_ACCENTS = {
  teams: { base: C.primary, soft: `${C.primary}14` },
  people: { base: C.gold, soft: `${C.gold}22` },
  me: { base: C.light, soft: `${C.light}14` },
};

const accentFor = (key) =>
  TAB_ACCENTS[key] || { base: C.primary, soft: `${C.primary}14` };

// ─── Single tab ─────────────────────────────────────────────
const Tab = ({
  tab,
  active,
  hovering,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const { base, soft } = accentFor(tab.key);

  // Three visual states, each with a distinct "temperature":
  //   active    — filled pill with the accent color, white text
  //   hovering  — subtle tinted background, accent-colored text
  //   resting   — transparent, muted text
  const background = active ? base : hovering ? soft : "transparent";
  const color = active ? "#fff" : hovering ? base : C.muted;
  const shadow = active
    ? `0 6px 18px ${base}55, inset 0 1px 0 rgba(255,255,255,0.2)`
    : "none";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "11px 20px",
        borderRadius: radius.md,
        border: "none",
        background,
        color,
        boxShadow: shadow,
        fontWeight: active ? 700 : 600,
        fontSize: FONT_SIZES.small,
        fontFamily: F.sans,
        cursor: "pointer",
        transition:
          "background 0.22s cubic-bezier(0.4, 0, 0.2, 1), color 0.22s ease, box-shadow 0.22s ease, transform 0.18s ease",
        flex: "1 1 auto",
        minWidth: 130,
        transform: hovering && !active ? "translateY(-1px)" : "translateY(0)",
        outline: "none",
        overflow: "hidden",
      }}
    >
      {/* Icon bubble — small circular badge behind the icon */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: active
            ? "rgba(255,255,255,0.22)"
            : hovering
              ? `${base}22`
              : `${C.border}55`,
          color: active ? "#fff" : base,
          flexShrink: 0,
          transition: "background 0.22s ease, color 0.22s ease",
        }}
      >
        {tab.icon}
      </span>

      {/* Label */}
      <span
        className="leaderboard-tab-label"
        style={{ whiteSpace: "nowrap", letterSpacing: 0.1 }}
      >
        {tab.label}
      </span>

      {/* Optional count badge — shown when tab.count is a number */}
      {typeof tab.count === "number" && tab.count > 0 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 22,
            height: 20,
            padding: "0 7px",
            borderRadius: 999,
            background: active ? "rgba(255,255,255,0.26)" : `${base}1a`,
            color: active ? "#fff" : base,
            fontSize: 11,
            fontWeight: 800,
            fontFamily: F.mono,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {tab.count}
        </span>
      )}

      {/* Active tab underline accent — sits on the bottom edge */}
      {active && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: "40%",
            height: 3,
            borderRadius: "3px 3px 0 0",
            background: "#fff",
            opacity: 0.7,
          }}
        />
      )}
    </button>
  );
};

// ─── Main component ─────────────────────────────────────────
const LeaderboardTabs = ({ tabs, activeKey, onChange }) => {
  const [hoverKey, setHoverKey] = useState(null);

  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 6,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: radius.lg,
        padding: 6,
        flexWrap: "wrap",
        boxShadow: `inset 0 1px 3px rgba(13, 26, 94, 0.04)`,
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.key}
          tab={tab}
          active={tab.key === activeKey}
          hovering={tab.key === hoverKey && tab.key !== activeKey}
          onMouseEnter={() => setHoverKey(tab.key)}
          onMouseLeave={() => setHoverKey((k) => (k === tab.key ? null : k))}
          onClick={() => onChange(tab.key)}
        />
      ))}

      {/* Global CSS for small screens — hide labels, keep icons + tooltips */}
      <style>{`
        @media (max-width: 480px) {
          .leaderboard-tab-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardTabs;
