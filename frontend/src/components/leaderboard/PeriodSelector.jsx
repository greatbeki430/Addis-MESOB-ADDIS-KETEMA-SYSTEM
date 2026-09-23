// frontend/src/components/leaderboard/PeriodSelector.jsx
import { useState, useMemo } from "react";
import { FiCalendar } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { C, F, radius, FONT_SIZES } from "../../styles/theme";

// ─── Date helpers ──────────────────────────────────────────
const startOfMonthISO = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);

const startOfNextMonthISO = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);

const lastMonthRange = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return {
    from: startOfMonthISO(d),
    to: startOfNextMonthISO(d),
  };
};

const thisMonthRange = () => ({
  from: startOfMonthISO(),
  to: startOfNextMonthISO(),
});

const thisQuarterRange = () => {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 1);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

// ─── Preset chips ──────────────────────────────────────────
const PRESETS = [
  { key: "thisMonth", labelKey: "periodThisMonth", compute: thisMonthRange },
  { key: "lastMonth", labelKey: "periodLastMonth", compute: lastMonthRange },
  {
    key: "thisQuarter",
    labelKey: "periodThisQuarter",
    compute: thisQuarterRange,
  },
];

const PeriodSelector = ({ value, onChange }) => {
  const { t } = useLanguage();
  const [customMode, setCustomMode] = useState(false);
  const [localFrom, setLocalFrom] = useState(value?.from || "");
  const [localTo, setLocalTo] = useState(value?.to || "");

  const activePreset = useMemo(() => {
    if (customMode) return "custom";
    for (const p of PRESETS) {
      const r = p.compute();
      if (r.from === value?.from && r.to === value?.to) return p.key;
    }
    // Empty value means "backend defaults to current month", which is
    // the same as the This Month preset.
    if (!value?.from && !value?.to) return "thisMonth";
    return "custom";
  }, [value, customMode]);

  const applyPreset = (preset) => {
    setCustomMode(false);
    onChange(preset.compute());
  };

  const applyCustom = () => {
    if (!localFrom && !localTo) {
      onChange({ from: "", to: "" });
      return;
    }
    onChange({ from: localFrom, to: localTo });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      <FiCalendar size={14} style={{ color: C.muted }} />
      {PRESETS.map((p) => {
        const active = activePreset === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p)}
            style={{
              padding: "6px 12px",
              borderRadius: radius.pill,
              background: active ? C.primary : C.bg,
              color: active ? "#fff" : C.muted,
              border: `1px solid ${active ? C.primary : C.border}`,
              fontSize: FONT_SIZES.tiny,
              fontWeight: active ? 700 : 500,
              fontFamily: F.sans,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {t(`leaderboard.${p.labelKey}`) ||
              p.key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (c) => c.toUpperCase())}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setCustomMode((v) => !v)}
        style={{
          padding: "6px 12px",
          borderRadius: radius.pill,
          background: customMode ? C.primary : C.bg,
          color: customMode ? "#fff" : C.muted,
          border: `1px solid ${customMode ? C.primary : C.border}`,
          fontSize: FONT_SIZES.tiny,
          fontWeight: customMode ? 700 : 500,
          fontFamily: F.sans,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {t("leaderboard.periodCustom") || "Custom"}
      </button>

      {customMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: radius.md,
          }}
        >
          <input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: FONT_SIZES.tiny,
              fontFamily: F.sans,
              color: C.dark,
              background: "transparent",
            }}
          />
          <span style={{ color: C.muted, fontSize: FONT_SIZES.tiny }}>→</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: FONT_SIZES.tiny,
              fontFamily: F.sans,
              color: C.dark,
              background: "transparent",
            }}
          />
          <button
            type="button"
            onClick={applyCustom}
            style={{
              padding: "4px 10px",
              borderRadius: radius.sm,
              background: C.primary,
              color: "#fff",
              border: "none",
              fontSize: FONT_SIZES.tiny,
              fontWeight: 700,
              fontFamily: F.sans,
              cursor: "pointer",
            }}
          >
            {t("leaderboard.periodApply") || "Apply"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;
