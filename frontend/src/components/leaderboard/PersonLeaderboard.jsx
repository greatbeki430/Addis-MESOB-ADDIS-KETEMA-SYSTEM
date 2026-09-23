// frontend/src/components/leaderboard/PersonLeaderboard.jsx
import { useEffect, useState, useCallback } from "react";
import { FiUser, FiAlertCircle, FiLoader } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { leaderboardAPI } from "../../services/api";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";
import LeaderboardRow from "./LeaderboardRow";

const PersonLeaderboard = ({ period, refreshKey }) => {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [people, setPeople] = useState([]);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { source: "evaluation" };
      if (period?.from) params.from = period.from;
      if (period?.to) params.to = period.to;
      const res = await leaderboardAPI.getPersonLeaderboard(params);
      setPeople(res.data.people || []);
      setPeriodFrom(res.data.period?.from || "");
      setPeriodTo(res.data.period?.to || "");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          t("leaderboard.loadError") ||
          "Failed to load rankings.",
      );
    } finally {
      setLoading(false);
    }
  }, [period, t]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      load();
    }, 0);

    return () => clearTimeout(timeoutId);
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
        <div>{error}</div>
      </div>
    );
  }

  if (people.length === 0) {
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
        <FiUser
          size={40}
          style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }}
        />
        <p style={{ fontSize: FONT_SIZES.body, fontWeight: 600, margin: 0 }}>
          {t("leaderboard.emptyPeople") ||
            "No individual scores recorded in this period."}
        </p>
      </div>
    );
  }

  return (
    <>
      {periodFrom && periodTo && (
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: C.muted,
            fontFamily: F.sans,
            marginBottom: SPACING.sm,
          }}
        >
          {t("leaderboard.periodLabel") || "Period"}:{" "}
          {new Date(periodFrom).toLocaleDateString()} –{" "}
          {new Date(periodTo).toLocaleDateString()}
          <span style={{ marginLeft: 6 }}>· {people.length} ranked</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {people.map((p) => (
          <LeaderboardRow
            key={`${p.rank}-${p.name}`}
            rank={p.rank}
            kind="person"
            name={p.name}
            teamName={p.teamName}
            score={p.averageScore}
            scoreLabel={
              p.evaluationCount === 1
                ? t("leaderboard.oneEval") || "1 eval"
                : `${p.evaluationCount} ${t("leaderboard.evals") || "evals"}`
            }
            metaLine={
              typeof p.bestScore === "number" ? (
                <>
                  <span>
                    {t("leaderboard.best") || "Best"}: {p.bestScore}
                  </span>
                </>
              ) : null
            }
            isMyTeam={Boolean(p.isMyTeam)}
          />
        ))}
      </div>
    </>
  );
};

export default PersonLeaderboard;
