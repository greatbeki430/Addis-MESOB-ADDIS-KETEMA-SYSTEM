// frontend/src/components/leaderboard/TeamLeaderboard.jsx
import { useEffect, useState, useCallback } from "react";
import { FiAward, FiActivity, FiAlertCircle, FiLoader } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { leaderboardAPI } from "../../services/api";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";
import LeaderboardRow from "./LeaderboardRow";
import MemberDrilldown from "./MemberDrilldown";

const TeamLeaderboard = ({ source, period, refreshKey, canDrillDown }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdminTier = user?.role === "admin" || user?.role === "superadmin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [drillTeam, setDrillTeam] = useState(null);

  const periodFromParam = period?.from;
  const periodToParam = period?.to;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { source };
      if (periodFromParam) params.from = periodFromParam;
      if (periodToParam) params.to = periodToParam;
      const res = await leaderboardAPI.getTeamLeaderboard(params);
      setTeams(res.data.teams || []);
      setPeriodFrom(res.data.period?.from || "");
      setPeriodTo(res.data.period?.to || "");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          t("leaderboard.loadError") ||
          "Failed to load leaderboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [source, periodFromParam, periodToParam, t]);

  useEffect(() => {
    const task = setTimeout(load, 0);
    return () => clearTimeout(task);
  }, [load, refreshKey]);

  // ─── Pluralization helpers ────────────────────────────────
  // The translation file has both `eval`/`evals` and `team`/`teams` keys.
  // Previously the count label always rendered the plural form, so a
  // team with a single evaluation displayed "1 evals".
  const evalCountLabel = (count) => {
    const key = count === 1 ? "eval" : "evals";
    return `${count} ${t(`leaderboard.${key}`) || key}`;
  };

  const memberCountLabel = (count) => {
    // `members` is used for both singular and plural today; kept as-is
    // to avoid adding a new translation key just for this.
    return `${count} ${t("leaderboard.members") || "members"}`;
  };

  const scoreLabelFor = (row) => {
    if (source === "forum") {
      const count = row.meetingsHeld || 0;
      const key = count === 1 ? "meeting" : "meetings";
      return `${count} ${t(`leaderboard.${key}`) || key}`;
    }
    return evalCountLabel(row.evaluationCount || 0);
  };

  const metaLineFor = (row) => {
    if (source === "forum") {
      return (
        <>
          <span>
            {t("leaderboard.attendance") || "Attendance"}: {row.attendanceRate}%
          </span>
          <span>·</span>
          <span>
            {t("leaderboard.avgAttendees") || "Avg attendees"}:{" "}
            {row.averageAttendees}
          </span>
        </>
      );
    }
    return (
      <>
        <span>{memberCountLabel(row.memberCount || 0)}</span>
        {row.bestPerformerScore > 0 && (
          <>
            <span>·</span>
            <span>
              {t("leaderboard.topScore") || "Top score"}:{" "}
              {row.bestPerformerScore}
            </span>
          </>
        )}
      </>
    );
  };

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
        {t("leaderboard.loading") || "Loading rankings…"}
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
        <div>
          {error}
          <button
            onClick={load}
            style={{
              marginLeft: 10,
              background: "none",
              border: "none",
              color: C.red,
              textDecoration: "underline",
              cursor: "pointer",
              fontFamily: F.sans,
              fontSize: FONT_SIZES.small,
            }}
          >
            {t("leaderboard.retry") || "Retry"}
          </button>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div
        style={{
          padding: "56px 20px",
          textAlign: "center",
          color: C.muted,
          fontFamily: F.sans,
          background: "#fff",
          border: `1px dashed ${C.border}`,
          borderRadius: radius.lg,
        }}
      >
        <FiAward
          size={40}
          style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }}
        />
        <p style={{ fontSize: FONT_SIZES.body, fontWeight: 600, margin: 0 }}>
          {source === "forum"
            ? t("leaderboard.emptyForum") ||
              "No forum reports submitted in this period."
            : t("leaderboard.emptyEvaluation") ||
              "No evaluations submitted in this period."}
        </p>
        <p
          style={{
            fontSize: FONT_SIZES.small,
            color: C.muted,
            marginTop: 6,
          }}
        >
          {t("leaderboard.emptyHint") ||
            "Try switching the period or come back next month."}
        </p>
      </div>
    );
  }

  return (
    <>
      {periodFrom && periodTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: FONT_SIZES.tiny,
            color: C.muted,
            fontFamily: F.sans,
            marginBottom: SPACING.sm,
          }}
        >
          <FiActivity size={11} />
          {t("leaderboard.periodLabel") || "Period"}:{" "}
          {new Date(periodFrom).toLocaleDateString()} –{" "}
          {new Date(periodTo).toLocaleDateString()}
          <span style={{ marginLeft: 6 }}>
            · {teams.length}{" "}
            {teams.length === 1
              ? t("leaderboard.team") || "team"
              : t("leaderboard.teams") || "teams"}
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {teams.map((row) => {
          const isDrillable =
            canDrillDown && isAdminTier && row.teamId && !row.outsideTop;
          return (
            <LeaderboardRow
              key={row.teamId || `${row.rank}-${row.teamName}`}
              rank={row.rank}
              kind="team"
              name={row.teamName}
              score={source === "forum" ? row.compositeScore : row.averageScore}
              scoreLabel={scoreLabelFor(row)}
              metaLine={metaLineFor(row)}
              bestPerformerName={
                source === "evaluation" ? row.bestPerformerName : null
              }
              bestPerformerScore={
                source === "evaluation" ? row.bestPerformerScore : null
              }
              isMyTeam={row.isMyTeam || row.outsideTop}
              showMemberCount={source === "evaluation"}
              memberCount={row.memberCount || 0}
              onClick={
                isDrillable
                  ? () => setDrillTeam({ id: row.teamId, name: row.teamName })
                  : null
              }
            />
          );
        })}
      </div>

      {teams.some((r) => r.outsideTop) && (
        <p
          style={{
            fontSize: FONT_SIZES.tiny,
            color: C.muted,
            marginTop: 8,
            fontFamily: F.sans,
            fontStyle: "italic",
          }}
        >
          {t("leaderboard.outsideTopNote") ||
            "Your team is shown at the bottom because it ranked outside the top list."}
        </p>
      )}

      {drillTeam && (
        <MemberDrilldown
          teamId={drillTeam.id}
          teamName={drillTeam.name}
          period={period}
          onClose={() => setDrillTeam(null)}
        />
      )}
    </>
  );
};

export default TeamLeaderboard;
