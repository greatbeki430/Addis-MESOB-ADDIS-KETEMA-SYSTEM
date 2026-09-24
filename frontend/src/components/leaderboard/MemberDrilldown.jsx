// frontend/src/components/leaderboard/MemberDrilldown.jsx
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiX, FiStar, FiUsers, FiLoader, FiAlertCircle } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { leaderboardAPI } from "../../services/api";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const BAR_PADDING = `${SPACING.md} ${SPACING.lg}`;

// Normalize a team name for comparison — trim, lowercase, collapse
// internal whitespace. Two strings that differ only in these ways
// should match. Anything more exotic than that and we'd have to change
// the schema; this covers the realistic cases (extra spaces, casing).
const normalizeTeamName = (s) =>
  (s || "").trim().toLowerCase().replace(/\s+/g, " ");

const MemberDrilldown = ({ teamId, teamName, period, onClose }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);

  const periodFrom = period?.from;
  const periodTo = period?.to;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // The person board is the source of truth for "who belongs to which
      // team in this period". Each row already carries a teamName; some
      // rows also carry a teamId when the underlying evaluation was saved
      // with a proper `team` ref. We filter by teamId when both sides have
      // it, and fall back to a normalized name comparison otherwise.
      const params = { source: "evaluation" };
      if (periodFrom) params.from = periodFrom;
      if (periodTo) params.to = periodTo;
      const res = await leaderboardAPI.getPersonLeaderboard(params);
      const all = res.data.people || [];

      const targetName = normalizeTeamName(teamName);
      const filtered = all.filter((p) => {
        // Preferred: match on teamId when available on both sides.
        if (teamId && p.teamId) {
          return String(p.teamId) === String(teamId);
        }
        // Fallback: normalized name comparison.
        return normalizeTeamName(p.teamName) === targetName;
      });

      setMembers(filtered);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          t("leaderboard.loadError") ||
          "Failed to load team members.",
      );
    } finally {
      setLoading(false);
    }
  }, [teamId, teamName, periodFrom, periodTo, t]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Re-sort the filtered members by average score so the numbers shown
  // inside the drill-down are the team's own ranking, not the
  // organization-wide ranking. A person who is #12 globally might be #2
  // on their team; the drill-down should show #2.
  const ranked = [...members].sort((a, b) => {
    if (b.averageScore !== a.averageScore)
      return b.averageScore - a.averageScore;
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    return a.name.localeCompare(b.name);
  });

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(13,26,94,0.55)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        padding: SPACING.md,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: radius.xl,
          boxShadow: "0 20px 60px rgba(13,26,94,0.35)",
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: F.sans,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: BAR_PADDING,
            borderBottom: `2px solid ${C.primary}22`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                background: `${C.primary}18`,
                color: C.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FiUsers size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: FONT_SIZES.h3,
                  fontWeight: 800,
                  fontFamily: F.serif,
                  color: C.dark,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={teamName}
              >
                {teamName}
              </div>
              <div
                style={{
                  fontSize: FONT_SIZES.tiny,
                  color: C.muted,
                  marginTop: 2,
                }}
              >
                {t("leaderboard.memberBreakdown") || "Member breakdown"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              background: "transparent",
              border: "none",
              borderRadius: radius.sm,
              color: C.muted,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.color = C.dark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.muted;
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: SPACING.lg,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "40px 20px",
                color: C.muted,
              }}
            >
              <FiLoader
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
              />
              {t("leaderboard.loading") || "Loading…"}
              <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                background: "#fef2f2",
                border: `1px solid ${C.red}44`,
                borderRadius: radius.md,
                color: C.red,
                fontSize: FONT_SIZES.small,
              }}
            >
              <FiAlertCircle
                size={16}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <div>{error}</div>
            </div>
          )}

          {!loading && !error && ranked.length === 0 && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: C.muted,
                fontSize: FONT_SIZES.small,
                background: C.cardBg,
                borderRadius: radius.lg,
                border: `1px dashed ${C.border}`,
              }}
            >
              {t("leaderboard.noMembersInPeriod") ||
                "No member scores in this period for this team."}
            </div>
          )}

          {!loading &&
            !error &&
            ranked.map((m, idx) => {
              const localRank = idx + 1;
              const medal =
                localRank === 1
                  ? C.gold
                  : localRank === 2
                    ? "#9AA6A0"
                    : localRank === 3
                      ? C.clay || "#B5542E"
                      : C.border;
              return (
                <div
                  key={`${localRank}-${m.name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "#fff",
                    border: `1px solid ${C.border}`,
                    borderRadius: radius.md,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: localRank <= 3 ? medal : C.cardBg,
                      color: localRank <= 3 ? "#fff" : C.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: F.mono,
                      fontWeight: 800,
                      fontSize: 11,
                      flexShrink: 0,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {localRank <= 3 ? <FiStar size={12} /> : localRank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: FONT_SIZES.body,
                        fontWeight: 700,
                        color: C.dark,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={m.name}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontSize: FONT_SIZES.tiny,
                        color: C.muted,
                        marginTop: 2,
                      }}
                    >
                      {m.evaluationCount}{" "}
                      {m.evaluationCount === 1
                        ? t("leaderboard.eval") || "eval"
                        : t("leaderboard.evals") || "evals"}
                      {typeof m.bestScore === "number" && (
                        <>
                          {" · "}
                          {t("leaderboard.best") || "Best"}: {m.bestScore}
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 18,
                      fontWeight: 800,
                      color: localRank <= 3 ? C.primary : C.dark,
                      flexShrink: 0,
                    }}
                  >
                    {m.averageScore}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: BAR_PADDING,
            borderTop: `1px solid ${C.border}`,
            background: C.cardBg,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 22px",
              background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              color: "#fff",
              border: "none",
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 700,
              fontFamily: F.sans,
              cursor: "pointer",
              boxShadow: `0 3px 12px ${C.primary}44`,
            }}
          >
            {t("leaderboard.close") || "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MemberDrilldown;
