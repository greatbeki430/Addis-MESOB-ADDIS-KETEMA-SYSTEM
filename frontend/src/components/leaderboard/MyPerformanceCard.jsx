// frontend/src/components/leaderboard/MyPerformanceCard.jsx
import { useEffect, useState, useCallback } from "react";
import {
  FiAward,
  FiStar,
  FiUsers,
  FiMessageSquare,
  FiTarget,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { leaderboardAPI } from "../../services/api";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

const Stat = ({ icon, label, value, accent = C.primary, suffix = "" }) => (
  <div
    style={{
      padding: "14px 16px",
      background: C.cardBg,
      border: `1px solid ${C.border}`,
      borderRadius: radius.lg,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: radius.md,
        background: `${accent}18`,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: FONT_SIZES.tiny,
          color: C.muted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 22,
          fontWeight: 800,
          color: C.dark,
          lineHeight: 1.1,
          marginTop: 2,
        }}
      >
        {value}
        {suffix && (
          <span
            style={{
              fontSize: FONT_SIZES.small,
              color: C.muted,
              marginLeft: 4,
              fontWeight: 500,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  </div>
);

const MyPerformanceCard = ({ period, refreshKey }) => {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (period?.from) params.from = period.from;
      if (period?.to) params.to = period.to;
      const res = await leaderboardAPI.getMyPerformance(params);
      setData(res.data);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          t("leaderboard.loadError") ||
          "Failed to load your performance.",
      );
    } finally {
      setLoading(false);
    }
  }, [period, t]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "64px 20px",
          color: C.muted,
          fontFamily: F.sans,
        }}
      >
        <FiLoader size={20} style={{ animation: "spin 1s linear infinite" }} />
        {t("leaderboard.loading") || "Loading…"}
        <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "16px 20px",
          background: "#fef2f2",
          border: `1px solid ${C.red}44`,
          borderRadius: radius.lg,
          color: C.red,
          fontSize: FONT_SIZES.small,
          fontFamily: F.sans,
        }}
      >
        <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const evalAvg = data.evaluation?.averageScore;
  const forumAttended = data.forum?.meetingsAttended ?? 0;
  const forumLed = data.forum?.meetingsLed ?? 0;
  const teamRank = data.team?.rank;
  const teamSize = data.team?.boardSize;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: SPACING.md,
      }}
    >
      {/* Greeting card */}
      <div
        style={{
          padding: SPACING.lg,
          borderRadius: radius.xl,
          background: `linear-gradient(135deg, ${C.primary}0a, ${C.gold}0a)`,
          border: `1px solid ${C.primary}22`,
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.h3,
            fontWeight: 800,
            fontFamily: F.serif,
            color: C.dark,
            marginBottom: 4,
          }}
        >
          {t("leaderboard.myGreeting") || "Your Performance"}
        </div>
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: C.muted,
            fontFamily: F.sans,
          }}
        >
          {data.user?.teamName
            ? `${t("leaderboard.memberOf") || "Member of"} ${data.user.teamName}`
            : t("leaderboard.notOnTeam") || "Not currently on a team"}
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: SPACING.md,
        }}
      >
        <Stat
          icon={<FiStar size={18} />}
          label={t("leaderboard.myAvgScore") || "My Avg Evaluation"}
          value={evalAvg !== null && evalAvg !== undefined ? evalAvg : "—"}
          suffix={evalAvg !== null && evalAvg !== undefined ? "/ 100" : ""}
          accent={C.primary}
        />
        <Stat
          icon={<FiAward size={18} />}
          label={t("leaderboard.myBest") || "My Best Score"}
          value={data.evaluation?.bestScore ?? "—"}
          suffix={data.evaluation?.bestScore ? "/ 100" : ""}
          accent={C.gold}
        />
        <Stat
          icon={<FiMessageSquare size={18} />}
          label={t("leaderboard.forumAttended") || "Forum Meetings Attended"}
          value={forumAttended}
          accent={C.light}
        />
        <Stat
          icon={<FiTarget size={18} />}
          label={t("leaderboard.forumLed") || "Forum Meetings Led"}
          value={forumLed}
          accent={C.purple}
        />
        {teamRank && teamSize ? (
          <Stat
            icon={<FiUsers size={18} />}
            label={t("leaderboard.teamRank") || "Team Rank"}
            value={`#${teamRank}`}
            suffix={`/ ${teamSize}`}
            accent={C.primary}
          />
        ) : null}
      </div>

      {/* Footnote */}
      <p
        style={{
          fontSize: FONT_SIZES.tiny,
          color: C.muted,
          fontFamily: F.sans,
          fontStyle: "italic",
          margin: 0,
        }}
      >
        {t("leaderboard.selfPrivacyNote") ||
          "Only you can see these numbers. Team rankings are visible to everyone; individual scores are not."}
      </p>
    </div>
  );
};

export default MyPerformanceCard;
