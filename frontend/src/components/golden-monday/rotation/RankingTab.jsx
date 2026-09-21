// src/components/golden-monday/rotation/RankingTab.jsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiStar,
  FiClock,
  FiLoader,
  FiArrowRight,
  FiMaximize2,
  FiMinimize2,
  FiUserPlus,
  FiSearch,
  FiCalendar,
} from "react-icons/fi";
import { C, F } from "../../../styles/theme";
import { RankingSkeleton } from "./Skeleton";

export default function RankingTab({
  ranking,
  loading,
  isPrivileged,
  onAssign,
  assigning,
  expandedRanking,
  setExpandedRanking,
  onOpenManualPicker,
  targetWeekOf,
  t,
}) {
  const [search, setSearch] = useState("");

  const rankingStats = useMemo(() => {
    const total = ranking.length;
    const neverPresented = ranking.filter(
      (r) =>
        r.daysSinceLastPresented === "never presented" ||
        r.daysSinceLastPresented === null,
    ).length;
    const avgDays = ranking
      .filter(
        (r) =>
          r.daysSinceLastPresented !== "never presented" &&
          r.daysSinceLastPresented !== null,
      )
      .reduce((sum, r) => sum + r.daysSinceLastPresented, 0);
    const avg = ranking.length > 0 ? Math.round(avgDays / ranking.length) : 0;
    return { total, neverPresented, avgDays: avg };
  }, [ranking]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranking;
    return ranking.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q),
    );
  }, [ranking, search]);

  if (loading) {
    return <RankingSkeleton />;
  }

  if (!ranking || ranking.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "30px 20px",
          color: C.muted,
          background: C.bg,
          borderRadius: 12,
        }}
      >
        <FiUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p>{t.noRanking || "No eligible presenters on the roster yet"}</p>
        {isPrivileged && (
          <button
            onClick={onAssign}
            disabled={assigning}
            style={{
              marginTop: 12,
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: C.primary,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: assigning ? "not-allowed" : "pointer",
              opacity: assigning ? 0.6 : 1,
            }}
          >
            {assigning
              ? t.assigning || "Assigning..."
              : t.assignNext || "Assign Next"}
          </button>
        )}
      </div>
    );
  }

  const displayRanking = expandedRanking ? filtered : filtered.slice(0, 8);

  return (
    <div>
      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
          padding: "10px 14px",
          background: C.bg,
          borderRadius: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiUsers size={14} /> {t.totalPresenters || "Total"}:{" "}
          <strong>{rankingStats.total}</strong>
        </span>
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiStar size={14} color={C.gold} /> {t.neverPresented || "New"}:{" "}
          <strong>{rankingStats.neverPresented}</strong>
        </span>
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiClock size={14} /> {t.avgWait || "Avg wait"}:{" "}
          <strong>{rankingStats.avgDays}d</strong>
        </span>
      </div>

      {/* Search bar */}
      <div
        style={{
          position: "relative",
          marginBottom: 12,
        }}
      >
        <FiSearch
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#999",
          }}
        />
        <input
          type="text"
          placeholder={
            t.searchPresenters || "Search presenters by name or department…"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 38px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 13,
            fontFamily: F.sans,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Header row with actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 12, color: C.muted }}>
            {t.rotationOrder || "Rotation order (longest-waiting first)"}
          </span>
          {targetWeekOf && (
            <span
              style={{
                fontSize: 11,
                color: C.primary,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiCalendar size={11} />
              {t.targetWeekLabel || "Target week:"}{" "}
              {new Date(targetWeekOf).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {isPrivileged && (
            <>
              <button
                onClick={onOpenManualPicker}
                title={t.manualPickerTitle || "Pick a presenter manually"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${C.primary}33`,
                  background: `${C.primary}0d`,
                  color: C.primary,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: F.sans,
                }}
              >
                <FiUserPlus size={14} />
                {t.pickManually || "Pick manually"}
              </button>
              <button
                onClick={onAssign}
                disabled={assigning}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: assigning
                    ? C.border
                    : "linear-gradient(135deg, #f5c518, #d4a017)",
                  color: assigning ? C.muted : C.dark,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: assigning ? "not-allowed" : "pointer",
                  opacity: assigning ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: F.sans,
                }}
              >
                {assigning ? (
                  <FiLoader
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <FiArrowRight size={14} />
                )}
                {assigning
                  ? t.assigning || "Assigning..."
                  : t.assignNext || "Assign Next"}
              </button>
            </>
          )}
          {filtered.length > 8 && (
            <button
              onClick={() => setExpandedRanking(!expandedRanking)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: F.sans,
              }}
            >
              {expandedRanking ? (
                <FiMinimize2 size={14} />
              ) : (
                <FiMaximize2 size={14} />
              )}
              {expandedRanking
                ? t.showLess || "Show Less"
                : t.showAll || "Show All"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {displayRanking.map((r, index) => (
          <RankingItem key={r.userId || index} r={r} index={index} t={t} />
        ))}
      </div>

      {filtered.length > 8 && !expandedRanking && (
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: C.muted,
            marginTop: 10,
          }}
        >
          +{filtered.length - 8} {t.more || "more"}
        </p>
      )}
    </div>
  );
}

function RankingItem({ r, index, t }) {
  const isTop3 = index < 3;
  const colors = ["#f5c518", "#d4a017", "#b8860b"];
  const bgColors = [
    "rgba(245,197,24,0.12)",
    "rgba(212,160,23,0.10)",
    "rgba(184,134,11,0.08)",
  ];
  const isNew =
    r.daysSinceLastPresented === "never presented" ||
    r.daysSinceLastPresented === null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderRadius: 12,
        background: isTop3 ? bgColors[index] : "transparent",
        border: isTop3
          ? `1.5px solid ${colors[index]}44`
          : `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 13,
          background: isTop3 ? colors[index] : C.bg,
          color: isTop3 ? "#fff" : C.muted,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: C.dark,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {r.name}
          {isTop3 && (
            <span
              style={{ fontSize: 11, fontWeight: 700, color: colors[index] }}
            >
              {index === 0 ? "🔥" : index === 1 ? "⭐" : "💪"}
            </span>
          )}
          {isNew && (
            <span
              style={{
                fontSize: 9,
                background: `${C.primary}15`,
                color: C.primary,
                padding: "1px 10px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {t.new || "NEW"}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{r.department || t.noDepartment || "No department"}</span>
          <span style={{ fontSize: 10, color: C.border }}>·</span>
          <span>
            {r.timesPresented || 0}x {t.presented || "presented"}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: isTop3 ? colors[index] : C.dark,
          }}
        >
          {isNew
            ? t.neverPresented || "✨ New"
            : `${r.daysSinceLastPresented}d`}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>
          {isNew ? t.never || "Never" : t.daysSince || "days since"}
        </div>
      </div>
    </motion.div>
  );
}
