// frontend/src/components/dashboard/LeaderboardCelebrationBanner.jsx
import { useEffect, useState, useCallback } from "react";
import { FiAward, FiStar, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { leaderboardAPI } from "../../services/api";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const DISMISS_KEY = "leaderboard_banner_dismissed";

const LeaderboardCelebrationBanner = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return sessionStorage.getItem(DISMISS_KEY) === monthKey;
  });

  const load = useCallback(async () => {
    try {
      const res = await leaderboardAPI.getCelebration();
      return res.data;
    } catch {
      // Silent failure — banner is decorative, don't pollute the console
      // or block the Dashboard if the endpoint is briefly unavailable.
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    load().then((result) => {
      if (active && result) setData(result);
    });

    return () => {
      active = false;
    };
  }, [load]);

  const handleDismiss = () => {
    const monthKey = new Date().toISOString().slice(0, 7);
    sessionStorage.setItem(DISMISS_KEY, monthKey);
    setDismissed(true);
  };

  if (dismissed) return null;
  if (!data?.topTeam) return null;

  const { topTeam, runnerUp } = data;

  return (
    <div
      style={{
        position: "relative",
        padding: SPACING.lg,
        borderRadius: radius.xl,
        background: `linear-gradient(135deg, ${C.gold}0f, ${C.primary}0f)`,
        border: `1px solid ${C.gold}55`,
        boxShadow: `0 4px 20px ${C.gold}22`,
        display: "flex",
        alignItems: "center",
        gap: SPACING.md,
        flexWrap: "wrap",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.lg,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight || "#E4C878"})`,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 6px 18px ${C.gold}66`,
        }}
      >
        <FiAward size={28} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: C.muted,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 2,
          }}
        >
          {t("leaderboard.celebrationLabel") || "Best Team of the Month"}
        </div>
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
          title={topTeam.teamName}
        >
          {topTeam.teamName}
        </div>
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: C.muted,
            marginTop: 2,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: F.mono,
              fontWeight: 700,
              color: C.primary,
            }}
          >
            <FiStar size={12} style={{ color: C.gold }} />
            {topTeam.averageScore} / 100
          </span>
          {topTeam.memberCount > 0 && (
            <span>
              · {topTeam.memberCount} {t("leaderboard.members") || "members"}
            </span>
          )}
          {runnerUp && (
            <span style={{ color: C.muted }}>
              · {t("leaderboard.runnerUp") || "Runner-up"}: {runnerUp.teamName}
            </span>
          )}
        </div>
      </div>

      {/* View full board */}
      <button
        type="button"
        onClick={() => navigate("/leaderboard")}
        style={{
          padding: "10px 18px",
          background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
          color: "#fff",
          border: "none",
          borderRadius: radius.md,
          fontSize: FONT_SIZES.small,
          fontWeight: 700,
          fontFamily: F.sans,
          cursor: "pointer",
          boxShadow: `0 3px 12px ${C.primary}44`,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = `0 6px 18px ${C.primary}66`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `0 3px 12px ${C.primary}44`;
        }}
      >
        {t("leaderboard.viewBoard") || "View Board"}
      </button>

      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        title={t("leaderboard.dismiss") || "Dismiss"}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "transparent",
          border: "none",
          color: C.muted,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.color = C.dark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = C.muted;
        }}
      >
        <FiX size={14} />
      </button>
    </div>
  );
};

export default LeaderboardCelebrationBanner;
