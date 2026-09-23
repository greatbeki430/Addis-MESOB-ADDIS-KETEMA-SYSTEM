// frontend/src/pages/Leaderboard.jsx
import { useState, useMemo } from "react";
import {
  FiAward,
  FiUsers,
  FiUser,
  FiTarget,
  FiRefreshCw,
} from "react-icons/fi";
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../hooks/useAuth";
import { C, F, SPACING, FONT_SIZES, radius } from "../styles/theme";
import LeaderboardTabs from "../components/leaderboard/LeaderboardTabs";
import PeriodSelector from "../components/leaderboard/PeriodSelector";
import TeamLeaderboard from "../components/leaderboard/TeamLeaderboard";
import PersonLeaderboard from "../components/leaderboard/PersonLeaderboard";
import MyPerformanceCard from "../components/leaderboard/MyPerformanceCard";

const Leaderboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const isAdminTier = user?.role === "admin" || user?.role === "superadmin";
  const isLeader = user?.role === "leader";
  const canSeePeopleTab = isAdminTier || isLeader;

  const [tab, setTab] = useState("teams"); // "teams" | "people" | "me"
  const [teamSource, setTeamSource] = useState("evaluation"); // "evaluation" | "forum"
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = useMemo(() => {
    const list = [
      {
        key: "teams",
        label: t("leaderboard.tabTeams") || "Teams",
        icon: <FiUsers size={16} />,
      },
    ];
    if (canSeePeopleTab) {
      list.push({
        key: "people",
        label: t("leaderboard.tabPeople") || "People",
        icon: <FiUser size={16} />,
      });
    }
    list.push({
      key: "me",
      label: t("leaderboard.tabMe") || "My Performance",
      icon: <FiTarget size={16} />,
    });
    return list;
  }, [canSeePeopleTab, t]);

  if (!canSeePeopleTab && tab === "people") {
    setTab("teams");
  }

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div
      style={{
        padding: SPACING.lg,
        maxWidth: 1200,
        margin: "0 auto",
        fontFamily: F.sans,
        color: C.dark,
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.lg,
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
              boxShadow: `0 4px 14px ${C.primary}44`,
            }}
          >
            <FiAward size={22} />
          </div>
          <div>
            <h1
              style={{
                fontSize: FONT_SIZES.h2,
                fontWeight: 800,
                fontFamily: F.serif,
                margin: 0,
                color: C.dark,
              }}
            >
              {t("leaderboard.title") || "Performance Rankings"}
            </h1>
            <p
              style={{
                fontSize: FONT_SIZES.small,
                color: C.muted,
                margin: "4px 0 0",
              }}
            >
              {t("leaderboard.subtitle") ||
                "Monthly team and individual rankings across evaluations and forum reports"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAdminTier && (
            <PeriodSelector value={period} onChange={setPeriod} />
          )}
          <button
            type="button"
            onClick={refresh}
            title={t("leaderboard.refresh") || "Refresh"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              background: C.bg,
              color: C.primary,
              border: `1px solid ${C.border}`,
              borderRadius: radius.md,
              fontSize: FONT_SIZES.small,
              fontWeight: 600,
              fontFamily: F.sans,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <FiRefreshCw size={14} />
            {t("leaderboard.refresh") || "Refresh"}
          </button>
        </div>
      </header>

      <LeaderboardTabs tabs={tabs} activeKey={tab} onChange={setTab} />

      <div style={{ marginTop: SPACING.lg }}>
        {tab === "teams" && (
          <TeamLeaderboard
            source={teamSource}
            onSourceChange={setTeamSource}
            period={period}
            refreshKey={refreshKey}
            canDrillDown={isAdminTier || isLeader}
          />
        )}

        {tab === "people" && canSeePeopleTab && (
          <PersonLeaderboard period={period} refreshKey={refreshKey} />
        )}

        {tab === "me" && (
          <MyPerformanceCard period={period} refreshKey={refreshKey} />
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
