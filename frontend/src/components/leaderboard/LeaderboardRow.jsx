// frontend/src/components/leaderboard/LeaderboardRow.jsx
import { useState } from "react";
import { FiAward, FiStar, FiUsers } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { C, F, SPACING, FONT_SIZES, radius } from "../../styles/theme";

// ─── Medal palettes for the top 3 ──────────────────────────
const MEDALS = {
  1: { color: "#C89B3C", label: "1", ring: "#E4C878" },
  2: { color: "#9AA6A0", label: "2", ring: "#C0C8C4" },
  3: { color: "#B5542E", label: "3", ring: "#E4A182" },
};

const RankBadge = ({ rank, size = 32 }) => {
  const medal = MEDALS[rank];
  const bg = medal ? medal.color : C.bg;
  const color = medal ? "#fff" : C.muted;
  const ring = medal ? medal.ring : C.border;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F.mono,
        fontWeight: 800,
        fontSize: size <= 28 ? 11 : 13,
        flexShrink: 0,
        border: `2px solid ${ring}`,
        boxShadow: medal ? `0 2px 8px ${medal.color}44` : "none",
      }}
    >
      {medal ? <FiAward size={size <= 28 ? 12 : 14} /> : rank}
    </div>
  );
};

const LeaderboardRow = ({
  rank,
  kind = "team",
  name,
  teamName,
  score,
  scoreLabel,
  metaLine,
  bestPerformerName,
  bestPerformerScore,
  isMyTeam = false,
  onClick = null,
  showMemberCount = false,
  memberCount = 0,
}) => {
  const { t } = useLanguage();
  const [hover, setHover] = useState(false);

  const interactive = Boolean(onClick);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick || undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACING.md,
        padding: "12px 16px",
        borderRadius: radius.lg,
        background: isMyTeam ? `${C.primary}08` : "#fff",
        border: `1px solid ${isMyTeam ? C.primary : C.border}`,
        boxShadow:
          hover && interactive
            ? "0 6px 24px rgba(13,26,94,0.08)"
            : "0 1px 3px rgba(13,26,94,0.04)",
        transform: hover && interactive ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.15s ease",
        cursor: interactive ? "pointer" : "default",
      }}
    >
      {/* Rank badge */}
      <RankBadge rank={rank} />

      {/* Identity block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: FONT_SIZES.body,
              fontWeight: 700,
              color: C.dark,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
            title={name}
          >
            {name}
          </span>

          {isMyTeam && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: radius.pill,
                background: C.primary,
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {t("leaderboard.yourTeam") || "Your Team"}
            </span>
          )}

          {kind === "person" && teamName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: radius.pill,
                background: C.bg,
                color: C.muted,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              <FiUsers size={10} />
              {teamName}
            </span>
          )}
        </div>

        {metaLine && (
          <div
            style={{
              fontSize: FONT_SIZES.tiny,
              color: C.muted,
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {metaLine}
          </div>
        )}

        {/* Best performer chip — only shown when the row carries the data */}
        {bestPerformerName && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: radius.pill,
              background: `${C.gold}1a`,
              color: C.dark,
              fontSize: 10,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            <FiStar size={10} style={{ color: C.gold }} />
            {t("leaderboard.bestPerformer") || "Best"} ·{" "}
            <strong>{bestPerformerName}</strong>
            {typeof bestPerformerScore === "number" && (
              <span style={{ marginLeft: 2, color: C.muted }}>
                ({bestPerformerScore})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Score block */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 20,
            fontWeight: 800,
            color: rank <= 3 ? C.primary : C.dark,
            lineHeight: 1.1,
          }}
        >
          {typeof score === "number" ? score : score}
        </div>
        {scoreLabel && (
          <div
            style={{
              fontSize: FONT_SIZES.tiny,
              color: C.muted,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {scoreLabel}
          </div>
        )}
        {showMemberCount && memberCount > 0 && (
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              marginTop: 1,
            }}
          >
            {memberCount} {t("leaderboard.members") || "members"}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardRow;
