// frontend/src/components/leaderboard/PeriodSelector.jsx
import { useState, useMemo } from "react";
import { FiCalendar } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { C, F, radius, FONT_SIZES } from "../../styles/theme";

// ─── Date helpers ──────────────────────────────────────────
// We deliberately do NOT use `.toISOString().slice(0,10)`. That path
// converts the local Date into UTC first, which for a user in Addis
// Ababa (UTC+3) turns "Sept 1 local" into "Aug 31 UTC" and produces
// an off-by-one-day range. The period selector should send exactly the
// calendar dates the user's browser displays — no timezone math.

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

const startOfNextMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 1);

const thisMonthRange = () => ({
  from: toYMD(startOfMonth()),
  // Use start of *next* month so the backend can treat it as a
  // half-open interval [from, to). This is the same convention
  // leaderboardService already uses.
  to: toYMD(startOfNextMonth()),
});

const lastMonthRange = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return {
    from: toYMD(startOfMonth(d)),
    to: toYMD(startOfNextMonth(d)),
  };
};

const thisQuarterRange = () => {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  return {
    from: toYMD(new Date(now.getFullYear(), q * 3, 1)),
    to: toYMD(new Date(now.getFullYear(), q * 3 + 3, 1)),
  };
};

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
    // Custom mode: treat the "to" date as inclusive. Bump it by one day
    // before sending so [from, to) on the backend covers the whole day.
    let toInclusive = localTo;
    if (localTo) {
      const d = new Date(localTo + "T00:00:00");
      d.setDate(d.getDate() + 1);
      toInclusive = toYMD(d);
    }
    onChange({ from: localFrom, to: toInclusive });
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
