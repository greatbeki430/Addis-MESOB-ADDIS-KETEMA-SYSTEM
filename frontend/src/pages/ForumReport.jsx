/* eslint-disable react-hooks/set-state-in-effect */
// frontend/src/pages/ForumReport.jsx
// Enhanced Professional Forum Report Page with AI Integration - FULLY ENHANCED
// Unified: original timer/history/extension/edit features + synced roster/
// auto-translate/signature cards, plus bug fixes for autosave, extension poll,
// timer-key collision, and signature map loading.
//
// Latest changes:
//  • Present/Absent buttons: removed `require()` inside render (broken under
//    Vite/ESM) and made the roster loader immune to identity changes of
//    `tf` / `showToast` / `selectedTeam`, so the roster is no longer wiped
//    back to "all present" by unrelated re-renders.
//  • Empty reports are rejected (save button + timer-expiry finalize).
//  • Saving now sends status "completed" so the report counts as SUBMITTED.
//  • The first Peer Forum page (team list) now also shows Submitted Reports.
//  • Team leaders are no longer auto-redirected into their team form, so
//    they land on the team list + Submitted Reports first.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  btn,
  C,
  F,
  card,
  inp,
  shadows,
  radius,
  text,
  SPACING,
} from "../styles/theme";
import Field from "../components/ui/Field";
import Section from "../components/ui/Section";
import { exportForumReportToPDF } from "../utils/pdfExport";
import { meetingAPI } from "../services/api";
import { aiAPI } from "../services/api";
import { teamAPI } from "../services/api";
import { AISummary } from "../components/ai";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../hooks/useAuth";
import ForumReportFeed from "../components/ForumReportFeed";
import ForumReportHistory from "../components/forum-report/ForumReportHistory";
import SubmittedReports from "../components/forum-report/SubmittedReports";
import { forumReportTranslations } from "../constants/translations/forumReport";
import { commonTranslations } from "../constants/translations/common";
import { isAdminOrAbove, isLeaderOrAbove } from "../utils/roles";

// ─── Timer Features ──────────────────────────────────────────
import { useMeetingTimer } from "../hooks/useMeetingTimer";
import MeetingTimer from "../components/forum-report/MeetingTimer";
import TimeExpiredModal from "../components/forum-report/TimeExpiredModal";
import AutoSaveIndicator from "../components/forum-report/AutoSaveIndicator";
import { forumReportService } from "../services/forumReportService";
import SignatureModal from "../components/forum-report/SignatureModal";
import { useTimerBeep } from "../hooks/useTimerBeep";

// ─── Synced Roster + Auto-translate helpers (new) ───────────
import {
  buildRoster,
  newManualMember,
  setRosterStatus,
  setAllRosterStatus,
  deriveAttendance,
  getSigners,
  alignSignatures,
  needsAmharicTranslation,
  cleanTranslation,
} from "../utils/forumReportHelpers";

// ✅ React Icons
import {
  FiPlus,
  FiX,
  FiUsers,
  FiUserX,
  FiCalendar,
  FiFileText,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
  FiEdit3,
  FiPenTool,
  FiDownload,
  FiSave,
  FiLoader,
  FiChevronDown,
  FiCheck,
  FiInfo,
  FiUserCheck as FiUserCheckIcon,
  FiZap,
  FiTrendingUp,
  FiChevronLeft,
  FiBriefcase,
  FiClock,
  FiRefreshCw,
  FiList,
  FiGlobe,
  FiRotateCcw,
  FiStar,
  FiUser,
} from "react-icons/fi";

// ─── FONT SIZES ──────────────────────────────────────────────
const FONT_SIZES = {
  h1: "clamp(20px, 4.5vw, 32px)",
  h2: "clamp(16px, 3.5vw, 26px)",
  h3: "clamp(14px, 3vw, 20px)",
  body: "clamp(12px, 2.8vw, 15px)",
  small: "clamp(10px, 2.2vw, 13px)",
};

// ─── Empty-report guard ──────────────────────────────────────
// A report is "empty" when it has no topic, previous result, explanation,
// gap or agreement. Attendance alone does not count (the synced roster
// defaults everyone to Present). The backend enforces the same rule.
const hasReportContent = (f) =>
  [f.topics, f.prevResults, f.gaps, f.agreements].some(
    (a) => Array.isArray(a) && a.some((x) => x && x.trim()),
  ) || !!(f.explanation && f.explanation.trim());

// ─── Helper: Get translations based on language ─────────────
const getTranslations = (lang) => {
  const forum =
    forumReportTranslations[lang]?.forum || forumReportTranslations.en.forum;
  const common =
    commonTranslations[lang]?.common || commonTranslations.en.common;
  return { forum, common };
};

// ─── Team Selector Component ─────────────────────────────────
const TeamSelector = ({
  teams,
  selectedTeam,
  setSelectedTeam,
  lang,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { forum: t, common: tc } = getTranslations(lang);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px)",
        animation: "fadeInUp 0.6s ease",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "clamp(28px, 5vw, 40px)",
        }}
      >
        <div
          style={{
            width: "clamp(60px, 10vw, 90px)",
            height: "clamp(60px, 10vw, 90px)",
            background: `linear-gradient(145deg, ${C.primary}20, ${C.primary}08)`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            fontSize: "clamp(32px, 8vw, 48px)",
            boxShadow: `0 8px 32px ${C.primary}22`,
          }}
        >
          <FiMessageSquare size={36} color={C.primary} />
        </div>
        <h2
          style={{
            fontSize: FONT_SIZES.h1,
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.serif,
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          {t.selectTeamPrompt || "Select a Team"}
        </h2>
        <p
          style={{
            fontSize: FONT_SIZES.body,
            color: C.muted,
            fontFamily: F.sans,
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          {t.selectTeamHelper ||
            "Choose a team from the list below to start or view their forum report"}
        </p>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t.searchTeams || "Search teams..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 18px 14px 44px",
            border: `2px solid ${C.border}`,
            borderRadius: 12,
            fontSize: 14,
            outline: "none",
            transition: "all 0.3s ease",
            background: C.white,
            boxShadow: shadows.sm,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.primary;
            e.currentTarget.style.boxShadow = `0 0 0 4px ${C.primary}22, ${shadows.md}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = shadows.sm;
          }}
        />
        <FiUsers
          size={18}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: C.muted,
          }}
        />
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: C.muted,
            background: C.bg,
            borderRadius: 16,
          }}
        >
          <FiLoader
            size={32}
            style={{ animation: "spin 1s linear infinite", marginBottom: 12 }}
            color={C.primary}
          />
          <p style={{ fontSize: FONT_SIZES.body }}>
            {t.loadingTeams || "Loading teams..."}
          </p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 50,
            color: C.muted,
            background: C.bg,
            borderRadius: 16,
            border: `2px dashed ${C.border}`,
          }}
        >
          <FiUsers size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: FONT_SIZES.body, fontWeight: 500 }}>
            {t.noTeamsFound || "No teams found"}
          </p>
          <p style={{ fontSize: FONT_SIZES.small, color: C.muted }}>
            {t.noTeamsYet || "No teams created yet."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {filteredTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              style={{
                padding: "clamp(14px, 2vw, 20px)",
                background: C.white,
                borderRadius: 14,
                border: `2px solid ${selectedTeam?.id === team.id ? C.primary : C.border}44`,
                cursor: "pointer",
                transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                textAlign: "left",
                boxShadow:
                  selectedTeam?.id === team.id
                    ? `0 8px 30px ${C.primary}28`
                    : shadows.sm,
                transform:
                  selectedTeam?.id === team.id ? "scale(1.03)" : "scale(1)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (selectedTeam?.id !== team.id) {
                  e.currentTarget.style.borderColor = C.primary + "66";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = shadows.md;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTeam?.id !== team.id) {
                  e.currentTarget.style.borderColor = C.border + "44";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = shadows.sm;
                }
              }}
            >
              {selectedTeam?.id === team.id && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: C.primary,
                    color: "#fff",
                    padding: "2px 12px",
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: "0 12px 0 12px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {tc.selected || "SELECTED"}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "12px",
                    background: `linear-gradient(145deg, ${C.primary}18, ${C.primary}08)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 18,
                  }}
                >
                  <FiUsers size={20} color={C.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: C.dark,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {team.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiBriefcase size={11} />
                    {team.department || t.noDepartment || "No department"}
                  </div>
                </div>
                {selectedTeam?.id === team.id && (
                  <div
                    style={{
                      background: C.primary,
                      color: "#fff",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FiCheck size={14} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Enhanced Dynamic Field Group (unchanged, + optional renderStatus) ─
const DynamicFieldGroup = ({
  title,
  values,
  onAdd,
  onRemove,
  onUpdate,
  renderField,
  labelPrefix = "",
  placeholderPrefix = "",
  icon,
  maxItems = 20,
  helperText = "",
  variant = "default",
  addFirstLabel = "Add First",
  addAnotherLabel = "Add Another",
  onFieldBlur,
  renderStatus,
}) => {
  const handleAdd = () => {
    if (values.length < maxItems) onAdd();
  };

  const variants = {
    default: { bg: C.cardBg, border: C.border, hoverBg: "#f0f3ff" },
    primary: { bg: "#EFF6FF", border: "#BFDBFE", hoverBg: "#DBEAFE" },
    success: { bg: "#F0FDF4", border: "#86EFAC", hoverBg: "#DCFCE7" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", hoverBg: "#FEF3C7" },
    danger: { bg: "#FEF2F2", border: "#FCA5A5", hoverBg: "#FEE2E2" },
  };
  const style = variants[variant] || variants.default;

  return (
    <Section title={title} icon={icon}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {values.map((value, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              background: style.bg,
              borderRadius: radius.lg,
              border: `1.5px solid ${style.border}`,
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              animation: `fadeInUp ${0.15 + idx * 0.05}s ease`,
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.background = style.hoverBg;
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = style.border;
              e.currentTarget.style.background = style.bg;
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div
              style={{
                minWidth: 24,
                height: 24,
                borderRadius: "50%",
                background: C.primary,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderField ? (
                renderField(value, idx)
              ) : (
                <Field
                  label={`${labelPrefix} ${idx + 1}`}
                  value={value}
                  onChange={(v) => onUpdate(idx, v)}
                  onBlur={() => onFieldBlur?.(idx)}
                  placeholder={`${placeholderPrefix} ${idx + 1}`}
                />
              )}
              {renderStatus?.(idx)}
            </div>
            {values.length > 1 && (
              <button
                onClick={() => onRemove(idx)}
                aria-label="Remove item"
                style={{
                  ...btn.icon,
                  color: "#dc2626",
                  background: "#fee2e2",
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fecaca";
                  e.currentTarget.style.transform = "scale(1.15) rotate(90deg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.transform = "scale(1) rotate(0)";
                }}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {values.length < maxItems && (
        <button
          onClick={handleAdd}
          style={{
            ...btn.secondary,
            padding: "8px 16px",
            fontSize: "12px",
            marginTop: "10px",
            width: "100%",
            justifyContent: "center",
            gap: "6px",
            borderRadius: radius.lg,
            borderStyle: "dashed",
            borderWidth: "2px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.primary;
            e.currentTarget.style.background = `${C.primary}08`;
            e.currentTarget.style.transform = "scale(1.01)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FiPlus size={14} />
          {values.length === 0 ? addFirstLabel : addAnotherLabel}
        </button>
      )}

      {helperText && (
        <p style={{ ...text.muted, fontSize: "11px", marginTop: "6px" }}>
          <FiInfo size={12} style={{ marginRight: "4px" }} />
          {helperText}
        </p>
      )}
    </Section>
  );
};

// ─── Standing Agendas Panel ──────────────────────────────────
const STANDING_AGENDAS_AM = [
  "በተቋሙ መልካም አስተዳደር ማስፈን በተመለከተ",
  "በተቋሙ ብልሹ አሰራር ከመታገል አንጻር",
  "መደበኛ አገልግሎት አሰጣጥን ከማሳለጥ አንጻር",
  "QMS ስታንዳርድ በመስራት",
  "ሳምንታዊ አብነታዊ ስራዎች",
  "ያጋጠሙ ችግሮች",
  "የተፈታበት አግባብ",
];

const StandingAgendasPanel = ({ t }) => {
  const safeT = useMemo(() => t || {}, [t]);
  const agendas = safeT.agendas || STANDING_AGENDAS_AM;
  const tf = useCallback((key, fallback) => safeT?.[key] ?? fallback, [safeT]);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        background: `linear-gradient(145deg, ${C.primary}10, ${C.primary}05)`,
        border: `1.5px solid ${C.primary}30`,
        borderLeft: `5px solid ${C.primary}`,
        borderRadius: radius.xl,
        marginBottom: SPACING.lg,
        overflow: "hidden",
        boxShadow: shadows.md,
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadows.lg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.md;
      }}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${C.primary}08`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: C.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <FiBookOpen size={16} />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: FONT_SIZES.h3,
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {tf("standingAgendas", "ቋሚ የአቻ ፎረም አጀንዳዎች")}
          </span>
          <span
            style={{
              background: C.primary,
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 12px",
              borderRadius: radius.pill,
            }}
          >
            {agendas.length}
          </span>
        </div>
        <div
          style={{
            color: C.primary,
            fontSize: "14px",
            transition: "transform 0.3s ease",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          <FiChevronDown size={18} />
        </div>
      </div>
      {!collapsed && (
        <div style={{ padding: "4px 20px 18px" }}>
          {agendas.map((agenda, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "8px 0",
                borderBottom:
                  i < agendas.length - 1 ? `1px solid ${C.border}50` : "none",
              }}
            >
              <span
                style={{
                  minWidth: "26px",
                  height: "26px",
                  background: `linear-gradient(145deg, ${C.primary}, ${C.light})`,
                  color: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: FONT_SIZES.body,
                  color: C.dark,
                  fontFamily: F.sans,
                  lineHeight: 1.6,
                  flex: 1,
                }}
              >
                {agenda}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── AI Insight Badge ─────────────────────────────────────────
const AIInsightBadge = ({ type = "info", children, onClose }) => {
  const styles = {
    info: {
      background: "#EFF6FF",
      border: "1.5px solid #BFDBFE",
      color: "#1D4ED8",
      icon: <FiInfo size={16} />,
    },
    success: {
      background: "#F0FDF4",
      border: "1.5px solid #86EFAC",
      color: "#15803D",
      icon: <FiCheckCircle size={16} />,
    },
    warning: {
      background: "#FFFBEB",
      border: "1.5px solid #FDE68A",
      color: "#92400E",
      icon: <FiAlertCircle size={16} />,
    },
  };
  const style = styles[type] || styles.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: radius.md,
        background: style.background,
        border: style.border,
        color: style.color,
        fontSize: "clamp(11px, 2.5vw, 14px)",
        marginBottom: SPACING.md,
        position: "relative",
        animation: "fadeInUp 0.4s ease",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "2px" }}>{style.icon}</span>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: style.color,
            cursor: "pointer",
            padding: "2px",
            opacity: 0.6,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
};

// ─── Format AI Response (clean, human-readable) ──────────────
const formatAIResponse = (text) => {
  if (!text) return "";

  let formatted = text;

  formatted = formatted.replace(/```[\s\S]*?```/g, (m) =>
    m.replace(/```/g, ""),
  );

  formatted = formatted.replace(
    /(?:^\|.+\|\s*$\n^\|[\s\-:|]+\|\s*$\n(?:^\|.+\|\s*$\n?)*)/gm,
    (tableBlock) => {
      const lines = tableBlock.trim().split("\n");
      if (lines.length < 3) return tableBlock;
      const parseRow = (line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
      const headers = parseRow(lines[0]);
      const rows = lines.slice(2).map(parseRow);
      let out = "\n";
      rows.forEach((row, i) => {
        out += `  ${i + 1}. `;
        headers.forEach((h, j) => {
          if (row[j])
            out += `${h}: ${row[j]}${j < headers.length - 1 ? " • " : ""}`;
        });
        out += "\n";
      });
      return out;
    },
  );

  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "$1");
  formatted = formatted.replace(/\*(.+?)\*/g, "$1");
  formatted = formatted.replace(/__(.+?)__/g, "$1");
  formatted = formatted.replace(/_(.+?)_/g, "$1");
  formatted = formatted.replace(/`(.+?)`/g, "$1");

  formatted = formatted.replace(
    /^#{1,6}\s*(.+)$/gm,
    (_, title) =>
      `\n${title.trim().toUpperCase()}\n${"─".repeat(Math.min(title.trim().length, 40))}\n`,
  );
  formatted = formatted.replace(/^\s*-{3,}\s*$/gm, "─".repeat(40));
  formatted = formatted.replace(/^\s*[-*+]\s+/gm, "• ");
  formatted = formatted.replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " ");

  formatted = formatted
    .replace(/\*\*/g, "")
    .replace(/###/g, "")
    .replace(/---/g, "");
  formatted = formatted.replace(/^\s*\|.*\|\s*$/gm, "");
  formatted = formatted.replace(/[ \t]+$/gm, "");
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted.trim();
};

// ─── Attendance Mode Toggle (synced <-> manual) ─────────────
const AttendanceModeToggle = ({ mode, onChange, tf }) => {
  const opts = [
    [
      "sync",
      tf("attModeSynced", "Synced team roster"),
      <FiUsers size={13} key="s" />,
    ],
    [
      "manual",
      tf("attModeManual", "Manual entry"),
      <FiEdit3 size={13} key="m" />,
    ],
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "#F1F5F9",
        borderRadius: 10,
        padding: 4,
        marginBottom: SPACING.md,
      }}
    >
      {opts.map(([key, label, icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          style={{
            flex: 1,
            padding: "7px 12px",
            borderRadius: 8,
            border: "none",
            background: mode === key ? "#fff" : "transparent",
            color: mode === key ? "#0F172A" : "#64748B",
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: mode === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
};

// Two tiny icon wrappers (plain ES imports — `require()` does not exist in
// Vite's ESM build and made the roster rows crash/dead on render).
const FiStarIcon = () => <FiStar size={14} />;
const FiUserIcon = () => <FiUser size={14} />;

const segStyle = (active, color) => ({
  border: "none",
  padding: "6px 12px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: active ? color : "transparent",
  color: active ? "#fff" : "#64748B",
  transition: "all 0.15s",
});

// ─── Attendance: synced roster with Present / Absent toggles ─
const AttendanceRoster = ({
  roster,
  loading,
  error,
  onRetry,
  onResync,
  onStatus,
  onAll,
  onName,
  onReason,
  onReasonBlur,
  onRemove,
  onAddManual,
  renderReasonStatus,
  tf,
}) => {
  const presentCount = roster.filter((r) => r.status === "present").length;
  const absentCount = roster.filter((r) => r.status === "absent").length;

  const chip = (bg, color, label, value) => (
    <span
      style={{
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: radius.pill,
      }}
    >
      {label}: {value}
    </span>
  );

  const small = {
    ...btn.secondary,
    padding: "4px 10px",
    fontSize: 11,
    justifyContent: "center",
  };

  return (
    <div>
      <p style={{ ...text.muted, fontSize: 11, margin: "0 0 10px" }}>
        <FiInfo size={12} style={{ marginRight: 4 }} />
        {tf(
          "attSyncedHelper",
          "Team members are loaded automatically. Mark each one Present or Absent.",
        )}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {chip("#DCFCE7", "#15803D", tf("attPresent", "Present"), presentCount)}
        {chip("#FEE2E2", "#B91C1C", tf("attAbsent", "Absent"), absentCount)}
        {chip("#E0E7FF", C.primary, tf("attTotal", "Total"), roster.length)}
        <span style={{ flex: 1 }} />
        <button type="button" style={small} onClick={() => onAll("present")}>
          <FiUserCheckIcon size={12} />
          {tf("attAllPresent", "Mark all present")}
        </button>
        <button type="button" style={small} onClick={() => onAll("absent")}>
          <FiUserX size={12} />
          {tf("attAllAbsent", "Mark all absent")}
        </button>
        <button
          type="button"
          style={small}
          onClick={onResync}
          disabled={loading}
          title={tf("attResync", "Re-sync team")}
        >
          <FiRefreshCw
            size={12}
            style={
              loading ? { animation: "spin 1s linear infinite" } : undefined
            }
          />
          {tf("attResync", "Re-sync team")}
        </button>
      </div>

      {loading && roster.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 24,
            color: C.muted,
            fontSize: 12,
          }}
        >
          <FiLoader
            size={18}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <div>{tf("attLoading", "Loading team members...")}</div>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            color: "#92400E",
            padding: "8px 12px",
            borderRadius: radius.md,
            fontSize: 12,
            marginBottom: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <FiAlertCircle size={14} />
          <span style={{ flex: 1 }}>
            {tf(
              "attLoadError",
              "Could not load team members. You can retry or switch to manual entry.",
            )}
          </span>
          <button type="button" style={small} onClick={onRetry}>
            {tf("attRetry", "Retry")}
          </button>
        </div>
      )}

      {!loading && !error && roster.length === 0 && (
        <p
          style={{
            ...text.muted,
            fontSize: 12,
            textAlign: "center",
            padding: 12,
          }}
        >
          {tf(
            "attNoMembers",
            "This team has no members yet. Add someone manually below.",
          )}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {roster.map((r) => {
          const isAbsent = r.status === "absent";
          const isManual = r.source === "manual";
          const badge = isManual
            ? [tf("attManualBadge", "Manual"), "#F3E8FF", "#6D28D9"]
            : r.role === "leader"
              ? [tf("attLeaderBadge", "Team Leader"), "#FEF3C7", "#92400E"]
              : [tf("attMemberBadge", "Member"), "#E0E7FF", C.primary];
          const initial = (r.name || "?").trim().charAt(0).toUpperCase();
          return (
            <div
              key={r.id}
              style={{
                padding: "10px 12px",
                background: isAbsent ? "#FEF2F2" : "#F0FDF4",
                border: `1px solid ${isAbsent ? "#FECACA" : "#BBF7D0"}`,
                borderRadius: radius.lg,
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: C.primary,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {r.role === "leader" && !isManual ? (
                    <FiStarIcon />
                  ) : initial ? (
                    initial
                  ) : (
                    <FiUserIcon />
                  )}
                </div>

                <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                  {isManual ? (
                    <input
                      value={r.name}
                      onChange={(e) => onName(r.id, e.target.value)}
                      placeholder={tf("attManualName", "Full name")}
                      style={{
                        ...inp,
                        width: "100%",
                        padding: "6px 10px",
                        fontSize: 13,
                        borderRadius: radius.md,
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: C.dark,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.name}
                    </div>
                  )}
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 3,
                      background: badge[1],
                      color: badge[2],
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 8px",
                      borderRadius: radius.pill,
                    }}
                  >
                    {badge[0]}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    background: "#fff",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onStatus(r.id, "present")}
                    aria-pressed={!isAbsent}
                    style={segStyle(!isAbsent, "#16A34A")}
                  >
                    <FiCheck size={12} />
                    {tf("attPresent", "Present")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatus(r.id, "absent")}
                    aria-pressed={isAbsent}
                    style={segStyle(isAbsent, "#DC2626")}
                  >
                    <FiX size={12} />
                    {tf("attAbsent", "Absent")}
                  </button>
                </div>

                {isManual && (
                  <button
                    type="button"
                    onClick={() => onRemove(r.id)}
                    aria-label="Remove"
                    style={{
                      ...btn.icon,
                      color: "#dc2626",
                      background: "#fee2e2",
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                    }}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {isAbsent && (
                <div style={{ marginTop: 8 }}>
                  <Field
                    value={r.reason}
                    onChange={(v) => onReason(r.id, v)}
                    onBlur={() => onReasonBlur(r.id)}
                    placeholder={tf(
                      "attReasonPlaceholder",
                      "Reason for absence (English is auto-translated)",
                    )}
                  />
                  {renderReasonStatus(r.id)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddManual}
        style={{
          ...btn.secondary,
          padding: "6px 14px",
          fontSize: 12,
          marginTop: 10,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <FiPlus size={14} />
        {tf("attAddManual", "Add someone not in the roster")}
      </button>
    </div>
  );
};

// ─── Signature cards: one per present member (synced mode) ───
const SignatureCards = ({ signers, signatureMap, absentNames, onSign, tf }) => {
  if (signers.length === 0) {
    return (
      <p
        style={{
          ...text.muted,
          fontSize: 12,
          textAlign: "center",
          padding: 12,
        }}
      >
        {tf(
          "sigNoSigners",
          "Mark at least one member as present to collect signatures.",
        )}
      </p>
    );
  }
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 190px), 1fr))",
          gap: 12,
        }}
      >
        {signers.map((s) => {
          const img = signatureMap[s.key];
          const isLeader = s.role === "leader";
          return (
            <button
              type="button"
              key={s.key}
              onClick={() => onSign(s)}
              style={{
                textAlign: "center",
                cursor: "pointer",
                padding: "12px 14px",
                borderRadius: 10,
                background: isLeader
                  ? `linear-gradient(135deg, ${C.primary}10, ${C.gold}10)`
                  : C.cardBg,
                border: `2px solid ${img || isLeader ? C.primary : C.border}`,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isLeader ? C.primary : C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {isLeader
                  ? tf("attLeaderBadge", "Team Leader")
                  : tf("attMemberBadge", "Member")}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                  margin: "4px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <FiUserIcon />
                {s.name}
              </div>
              {img ? (
                <img
                  src={img}
                  alt={s.name}
                  style={{
                    width: "100%",
                    height: 44,
                    objectFit: "contain",
                    background: "#fff",
                    borderRadius: 6,
                    border: `1px dashed ${C.border}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 44,
                    borderRadius: 6,
                    border: `1px dashed ${C.border}`,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.muted,
                  }}
                >
                  <FiPenTool size={16} />
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  marginTop: 4,
                  color: img ? "#10b981" : "#f59e0b",
                }}
              >
                {img
                  ? `✅ ${tf("sigSigned", "Signed")}`
                  : `⏳ ${tf("sigNotSigned", "Not signed")}`}
              </div>
            </button>
          );
        })}
      </div>
      {absentNames.length > 0 && (
        <p style={{ ...text.muted, fontSize: 10, marginTop: 10 }}>
          <FiInfo size={12} style={{ marginRight: 4 }} />
          {absentNames.join("، ")} —{" "}
          {tf("sigAbsentNote", "absent - not required to sign")}
        </p>
      )}
    </div>
  );
};

// ─── Auto-translate status line (under a field) ──────────────
const trStatusStyle = (color) => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 4,
  fontSize: "10px",
  fontWeight: 600,
  color,
});

const TranslateStatus = ({ id, translating, originals, onRevert, tf }) => {
  if (translating[id]) {
    return (
      <div style={trStatusStyle("#1D4ED8")}>
        <FiLoader size={11} style={{ animation: "spin 1s linear infinite" }} />
        {tf("trWorking", "Translating to Amharic...")}
      </div>
    );
  }
  if (originals[id] !== undefined) {
    return (
      <div style={trStatusStyle("#15803D")}>
        <FiGlobe size={11} />
        {tf("trDone", "Translated to Amharic")}
        <button
          type="button"
          onClick={() => onRevert(id)}
          style={{
            border: "none",
            background: "transparent",
            color: C.primary,
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: 700,
            textDecoration: "underline",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <FiRotateCcw size={10} />
          {tf("trShowEnglish", "Show English")}
        </button>
      </div>
    );
  }
  return null;
};

// ─── Main Component ──────────────────────────────────────────
export default function ForumReport({
  t: tProp,
  lang,
  selectedTeam,
  setSelectedTeam,
  onReportSaved,
}) {
  const { t: tHook } = useLanguage();
  const { user } = useAuth();
  const t = tProp || tHook;

  const currentLang = useMemo(() => {
    if (lang && ["am", "en", "om"].includes(lang)) return lang;
    if (t?.lang && ["am", "en", "om"].includes(t.lang)) return t.lang;
    return "am";
  }, [lang, t]);

  const forumDict = useMemo(
    () =>
      forumReportTranslations[currentLang]?.forum ||
      forumReportTranslations.en.forum,
    [currentLang],
  );
  const commonDict = useMemo(
    () =>
      commonTranslations[currentLang]?.common || commonTranslations.en.common,
    [currentLang],
  );
  const safeYear = forumDict?.year || "2018 E.C.";

  const tf = useCallback(
    (key, fallback) =>
      forumDict?.[key] ?? t?.forum?.[key] ?? t?.[key] ?? fallback,
    [forumDict, t],
  );
  const tc = useCallback(
    (key, fallback) =>
      commonDict?.[key] ?? t?.common?.[key] ?? t?.[key] ?? fallback,
    [commonDict, t],
  );

  const { showToast } = useToast();
  const formRef = useRef(null);
  const autoSelectedRef = useRef(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    timeStart: "",
    timeEnd: "",
    present: [""],
    absent: [{ name: "", reason: "" }],
    prevResults: [""],
    topics: [""],
    explanation: "",
    gaps: [""],
    agreements: [""],
    signatures: [""],
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formProgress, setFormProgress] = useState(0);
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);
  const [showAIBadge, setShowAIBadge] = useState(true);
  const [includeAIForPdf, setIncludeAIForPdf] = useState(true);

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [activeForumTab, setActiveForumTab] = useState("form");

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  // ─── Timer State ──────────────────────────────────────────────
  const [timerActive, setTimerActive] = useState(false);
  const [isReportLocked, setIsReportLocked] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState(null);
  const [savedProgressId, setSavedProgressId] = useState(null);
  const [extensionRequested, setExtensionRequested] = useState(false);

  // ─── Signature Modal State (manual mode, index-based) ──────
  const [signatureModal, setSignatureModal] = useState({
    isOpen: false,
    index: null,
    value: null,
  });

  // ─── Synced Roster state (sync mode) ───────────────────────
  const [attendanceMode, setAttendanceMode] = useState("sync");
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState(false);
  const [signatureMap, setSignatureMap] = useState({});

  // ─── Auto-translate state ───────────────────────────────────
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [translating, setTranslating] = useState({});
  const [originals, setOriginals] = useState({});
  const [translatingAll, setTranslatingAll] = useState(false);
  const formLive = useRef(null);
  const rosterLive = useRef([]);
  const autoRef = useRef(true);
  const timers = useRef({});
  const dismissed = useRef({});
  const trCache = useRef(new Map());
  const failToastShown = useRef(false);

  // Refs for callback freshness inside useMeetingTimer.onTimeExpired
  const editingIdRef = useRef(editingId);
  const savedProgressIdRef = useRef(savedProgressId);

  const isAdmin = isAdminOrAbove(user);

  // ─── LocalStorage Key (FIX: includes userId to avoid cross-leader collisions) ─
  const STORAGE_KEY = useMemo(() => {
    const teamId = selectedTeam?.id || selectedTeam?._id || "default";
    const userId = user?._id || user?.id || "anon";
    return `forum_report_timer_${teamId}:${userId}`;
  }, [selectedTeam, user]);

  // Legacy key (team-only) for one-shot migration so in-flight timers
  // survive this deploy.
  const LEGACY_STORAGE_KEY = useMemo(
    () => `forum_report_timer_${selectedTeam?.id || "default"}`,
    [selectedTeam],
  );

  const getInitialTimeRemaining = useCallback(() => {
    if (!selectedTeam) return null;
    try {
      // Migrate legacy team-only key into the new per-user key so we
      // don't lose an in-progress timer that started on the previous build.
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy && !localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      /* storage disabled */
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
        const remaining = Math.max(0, data.timeRemaining - elapsed);
        if (remaining > 0) return remaining;
      } catch (e) {
        console.error("Failed to load timer state:", e);
      }
    }
    return null;
  }, [selectedTeam, STORAGE_KEY, LEGACY_STORAGE_KEY]);

  useEffect(() => {
    if (selectedTeam) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
          const remaining = Math.max(0, data.timeRemaining - elapsed);
          if (remaining > 0) setTimerActive(true);
        } catch (e) {
          console.error("Failed to load timer state:", e);
        }
      }
    }
  }, [selectedTeam, STORAGE_KEY]);

  // Keep refs in sync so the timer callback always sees fresh ids.
  useEffect(() => {
    editingIdRef.current = editingId;
    savedProgressIdRef.current = savedProgressId;
  }, [editingId, savedProgressId]);

  // ─── Timer Hook ──────────────────────────────────────────────
  const {
    timeRemaining,
    formattedTime,
    progressPercent,
    status,
    isExpired,
    showExpiredModal,
    setShowExpiredModal,
    resetTimer,
    progressSaved,
  } = useMeetingTimer({
    isActive: timerActive,
    initialTimeRemaining: getInitialTimeRemaining(),
    onTimeExpired: () => {
      setIsReportLocked(true);
      handleFinalizeOnExpiry();
      setShowExpiredModal(true);
      localStorage.removeItem(STORAGE_KEY);
    },
    onWarning: (message) => {
      setWarningMessage(message);
      showToast(message, "warning");
      setTimeout(() => setWarningMessage(null), 5000);
    },
    onTick: (remaining) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          timeRemaining: remaining,
          timestamp: Date.now(),
        }),
      );
    },
  });

  const { isMuted, toggleMute } = useTimerBeep({
    isActive: timerActive,
    timeRemaining,
  });

  // ─── Auto-save handler ───────────────────────────────────────
  const handleAutoSave = useCallback(async () => {
    if (isReportLocked) return null;
    try {
      const reportData = {
        date: form.date,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        present: form.present.filter((p) => p.trim() !== ""),
        absent: form.absent.filter((a) => a.name.trim() !== ""),
        prevResults: form.prevResults.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((t) => t.trim() !== ""),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim() !== ""),
        agreements: form.agreements.filter((a) => a.trim() !== ""),
        signatures: form.signatures.filter((s) => s.trim() !== ""),
        team: selectedTeam?.id || selectedTeam?._id,
        teamName: selectedTeam?.name || "Unknown Team",
        isAutoSave: true,
        status: "in_progress",
      };

      const response = await forumReportService.autoSave(reportData);
      setLastAutoSaveTime(new Date());
      const id = response?.meeting?._id || response?._id || null;
      if (id) setSavedProgressId(id);
      return response;
    } catch (error) {
      console.error("Auto-save failed:", error);
      showToast(tf("autoSaveError") || "Auto-save failed", "error");
      throw error;
    }
  }, [form, selectedTeam, tf, showToast, isReportLocked]);

  // ─── Finalize on timer expiry ────────────────────────────────
  const handleFinalizeOnExpiry = useCallback(async () => {
    try {
      // Never turn a blank form into a completed (submitted) report.
      if (!hasReportContent(form)) return;

      const reportData = {
        date: form.date,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        present: form.present.filter((p) => p.trim() !== ""),
        absent: form.absent.filter((a) => a.name.trim() !== ""),
        prevResults: form.prevResults.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((t) => t.trim() !== ""),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim() !== ""),
        agreements: form.agreements.filter((a) => a.trim() !== ""),
        signatures: form.signatures.filter((s) => s.trim() !== ""),
        team: selectedTeam?.id || selectedTeam?._id,
        teamName: selectedTeam?.name || "Unknown Team",
        aiGeneratedContent,
        isAutoSave: false,
        status: "completed",
        finalizedAt: new Date().toISOString(),
      };

      const targetId = editingIdRef.current || savedProgressIdRef.current;
      if (targetId) {
        await meetingAPI.update(targetId, reportData);
      } else {
        await meetingAPI.create(reportData);
      }
      setHistoryRefreshKey((k) => k + 1);
      console.log("✅ Report finalized on timer expiry");
    } catch (error) {
      console.error(
        "Finalize on expiry failed, falling back to draft save:",
        error,
      );
      try {
        await handleAutoSave();
      } catch (fallbackError) {
        console.error("Fallback auto-save also failed:", fallbackError);
      }
    }
  }, [form, selectedTeam, aiGeneratedContent, handleAutoSave]);

  // ─── Extension request handler ──────────────────────────────
  const handleRequestExtension = async (reason) => {
    if (!reason?.trim()) {
      showToast(tf("reasonRequired") || "Please provide a reason", "warning");
      return;
    }

    let targetId = savedProgressId || editingId;
    if (!targetId) {
      // The user has typed but never autosaved. Force a save so the
      // extension has something to attach to.
      try {
        const response = await handleAutoSave();
        targetId = response?.meeting?._id || response?._id;
      } catch {
        /* fall through — will fail below */
      }
    }

    if (!targetId) {
      showToast(
        tf("saveFirst") ||
          "Please save the report before requesting an extension",
        "warning",
      );
      return;
    }

    try {
      await forumReportService.requestExtension(targetId, reason);
      setExtensionRequested(true);
      setShowExpiredModal(false);
      showToast(
        tf("extensionRequested") || "✅ Extension request submitted to admin",
        "success",
      );
    } catch (error) {
      console.error("Extension request failed:", error);
      showToast(
        tf("extensionRequestError") || "Failed to request extension",
        "error",
      );
    }
  };

  // ─── Extension poll (NEW): check approval every 12s ─────────
  useEffect(() => {
    if (!extensionRequested) return;
    const targetId = savedProgressIdRef.current || editingIdRef.current;
    if (!targetId) return;

    const poll = setInterval(async () => {
      try {
        const res = await forumReportService.getReportById(targetId);
        const meeting = res?.meeting || res;
        if (meeting?.extensionApproved) {
          clearInterval(poll);
          setIsReportLocked(false);
          setShowExpiredModal(false);
          setExtensionRequested(false);
          resetTimer();
          setTimerActive(true);
          showToast(
            tf("extensionApproved") || "✅ Extension approved by admin",
            "success",
          );
        }
      } catch (e) {
        // Silent — transient network errors shouldn't spam the toast.
        console.warn("Extension poll failed:", e?.message);
      }
    }, 12_000);

    return () => clearInterval(poll);
  }, [extensionRequested, resetTimer, tf, showToast, setShowExpiredModal]);

  // ─── 60s-inactivity auto-save + flush on pagehide ──────────
  const autoSaveTimerRef = useRef(null);
  useEffect(() => {
    if (isReportLocked || submitted) return;
    // Only schedule if there's something worth saving.
    const hasContent =
      form.explanation.trim() ||
      form.topics.some((x) => x && x.trim()) ||
      form.gaps.some((x) => x && x.trim()) ||
      form.agreements.some((x) => x && x.trim());
    if (!hasContent) return;

    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave().catch(() => {});
    }, 60_000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [form, roster, attendanceMode, isReportLocked, submitted, handleAutoSave]);

  useEffect(() => {
    const flush = () => {
      if (isReportLocked || submitted) return;
      try {
        handleAutoSave().catch(() => {});
      } catch {
        /* no-op */
      }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isReportLocked, submitted, handleAutoSave]);

  // ─── Resume report handler (admin only) ─────────────────────
  const handleResumeReport = async () => {
    if (!isAdmin) return;
    const targetId = savedProgressId || editingId;
    if (!targetId) return;
    try {
      await forumReportService.resumeReport(targetId);
      setIsReportLocked(false);
      resetTimer();
      setTimerActive(true);
      setShowExpiredModal(false);
      showToast(
        tf("reportResumed") || "✅ Report resumed successfully",
        "success",
      );
    } catch (error) {
      console.error("Resume failed:", error);
      showToast(tf("resumeError") || "Failed to resume report", "error");
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Load teams when no team is selected ──────────────────
  // NOTE: Team Leaders are intentionally NOT auto-redirected into their
  // team's form any more. They land on this team list + "Submitted Reports"
  // first, then click their team to start a report.
  useEffect(() => {
    if (!isLeaderOrAbove(user)) {
      setLoadingTeams(false);
      return;
    }
    if (!selectedTeam) {
      const loadTeams = async () => {
        try {
          setLoadingTeams(true);
          const response = isAdmin
            ? await teamAPI.getAll()
            : await teamAPI.getMine();
          if (response.data && Array.isArray(response.data)) {
            const formattedTeams = response.data.map((team) => ({
              id: team._id,
              name: team.name,
              description: team.department || "",
              leader: team.leader?.name || tf("notAssigned", "Not assigned"),
              leaderId: team.leader?._id,
              members: team.members || [],
              department: team.department,
            }));
            setTeams(formattedTeams);
          }
        } catch (error) {
          console.error("Failed to load teams:", error);
        } finally {
          setLoadingTeams(false);
        }
      };
      loadTeams();
    }
  }, [selectedTeam, tf, isAdmin, user]);

  // ─── Form progress ──────────────────────────────────────────
  useEffect(() => {
    const totalFields = 9;
    let filled = 0;
    if (form.date) filled++;
    if (form.present.some((p) => p.trim())) filled++;
    if (form.topics.some((t) => t.trim())) filled++;
    if (form.explanation.trim()) filled++;
    if (form.gaps.some((g) => g.trim())) filled++;
    if (form.agreements.some((a) => a.trim())) filled++;
    if (form.prevResults.some((p) => p.trim())) filled++;
    if (form.signatures.some((s) => s.trim())) filled++;
    if (form.timeStart || form.timeEnd) filled++;
    setFormProgress(Math.round((filled / totalFields) * 100));
  }, [form]);

  const upd = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const addItem = (field, defaultValue = "") =>
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], defaultValue],
    }));

  const removeItem = (field, index) => {
    clearTranslateMeta(`${field}:`);
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addAbsent = () =>
    setForm((prev) => ({
      ...prev,
      absent: [...prev.absent, { name: "", reason: "" }],
    }));

  const removeAbsent = (index) => {
    clearTranslateMeta("absentManual:");
    setForm((prev) => ({
      ...prev,
      absent: prev.absent.filter((_, i) => i !== index),
    }));
  };

  const updateAbsent = (index, field, value) =>
    setForm((prev) => {
      const updated = [...prev.absent];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, absent: updated };
    });

  // ─── Live form/roster refs for translation ────────────────
  useEffect(() => {
    formLive.current = form;
    rosterLive.current = roster;
    autoRef.current = autoTranslate;
  }, [form, roster, autoTranslate]);

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  // ─── Sync roster from team ──────────────────────────────────
  // The latest `tf` / `showToast` / `selectedTeam` are kept in refs so
  // `loadRoster` has a STABLE identity. Previously it depended on them
  // directly; whenever any of them changed identity on a re-render the
  // effect below ran `setRoster([])` + reload, resetting every row to
  // "present" — which made the Present/Absent buttons look dead.
  const tfRef = useRef(tf);
  const toastRef = useRef(showToast);
  const teamRef = useRef(selectedTeam);
  useEffect(() => {
    tfRef.current = tf;
    toastRef.current = showToast;
    teamRef.current = selectedTeam;
  });

  const teamId = selectedTeam?.id || selectedTeam?._id;

  const loadRoster = useCallback(
    async (announce = false) => {
      if (!teamId) return;
      setLoadingRoster(true);
      setRosterError(false);
      try {
        const res = await teamAPI.getById(teamId);
        setRoster((prev) => buildRoster(res.data, prev));
        if (announce) {
          toastRef.current(
            tfRef.current("attResynced", "✅ Team roster synced"),
            "success",
          );
        }
      } catch (error) {
        console.error("Failed to sync team members:", error);
        const fallback = teamRef.current?.members;
        if (Array.isArray(fallback) && fallback.length > 0) {
          setRoster((prev) => buildRoster({ members: fallback }, prev));
        } else {
          setRosterError(true);
        }
      } finally {
        setLoadingRoster(false);
      }
    },
    [teamId],
  );

  // Reset + reload ONLY when the team actually changes.
  useEffect(() => {
    if (!teamId) return;
    setRoster([]);
    setSignatureMap({});
    loadRoster();
  }, [teamId, loadRoster]);

  // ─── Derived: attendance, signers, signatures ──────────────
  const attendance = useMemo(
    () =>
      deriveAttendance({
        mode: attendanceMode,
        roster,
        manualPresent: form.present,
        manualAbsent: form.absent,
      }),
    [attendanceMode, roster, form.present, form.absent],
  );

  const signers = useMemo(
    () =>
      getSigners({
        mode: attendanceMode,
        roster,
        manualPresent: form.present,
      }),
    [attendanceMode, roster, form.present],
  );

  const aligned = useMemo(
    () => alignSignatures(signatureMap, signers),
    [signatureMap, signers],
  );

  // ─── Auto-translate engine ─────────────────────────────────
  const getTargetValue = useCallback((id) => {
    const f = formLive.current || {};
    if (id === "explanation") return f.explanation || "";
    if (id.startsWith("roster:")) {
      return (
        (rosterLive.current || []).find((r) => r.id === id.slice(7))?.reason ||
        ""
      );
    }
    const [field, idxStr] = id.split(":");
    const idx = Number(idxStr);
    if (field === "absentManual") return f.absent?.[idx]?.reason || "";
    return f[field]?.[idx] || "";
  }, []);

  const setTargetValue = useCallback((id, value) => {
    if (id === "explanation") {
      setForm((p) => ({ ...p, explanation: value }));
    } else if (id.startsWith("roster:")) {
      const rid = id.slice(7);
      setRoster((p) =>
        p.map((r) => (r.id === rid ? { ...r, reason: value } : r)),
      );
    } else {
      const [field, idxStr] = id.split(":");
      const idx = Number(idxStr);
      if (field === "absentManual") {
        setForm((p) => ({
          ...p,
          absent: p.absent.map((a, k) =>
            k === idx ? { ...a, reason: value } : a,
          ),
        }));
      } else {
        setForm((p) => ({
          ...p,
          [field]: p[field].map((v, k) => (k === idx ? value : v)),
        }));
      }
    }
  }, []);

  const translateNow = useCallback(
    async (id, force = false) => {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
      if (!force && !autoRef.current) return false;

      const original = getTargetValue(id);
      if (!needsAmharicTranslation(original)) return false;
      if (!force && dismissed.current[id] === original) return false;

      setTranslating((p) => ({ ...p, [id]: true }));
      try {
        let am = trCache.current.get(original);
        if (!am) {
          const res = await aiAPI.translate(original.trim(), "am");
          am = cleanTranslation(res.data?.translation);
          if (am) trCache.current.set(original, am);
        }
        if (am && getTargetValue(id) === original) {
          setOriginals((p) => ({ ...p, [id]: original }));
          setTargetValue(id, am);
          delete dismissed.current[id];
          return true;
        }
      } catch (error) {
        console.error("Auto-translate failed:", error);
        if (!failToastShown.current) {
          failToastShown.current = true;
          showToast(
            tf(
              "trFailed",
              "⚠️ Translation failed. Your text was left unchanged.",
            ),
            "warning",
          );
        }
      } finally {
        setTranslating((p) => {
          const n = { ...p };
          delete n[id];
          return n;
        });
      }
      return false;
    },
    [getTargetValue, setTargetValue, showToast, tf],
  );

  const onTranslatableChange = useCallback(
    (id, value) => {
      setTargetValue(id, value);
      setOriginals((p) => {
        if (!(id in p)) return p;
        const n = { ...p };
        delete n[id];
        return n;
      });
      delete dismissed.current[id];
      clearTimeout(timers.current[id]);
      if (autoRef.current) {
        timers.current[id] = setTimeout(() => translateNow(id), 1800);
      }
    },
    [setTargetValue, translateNow],
  );

  const revertTranslation = useCallback(
    (id) => {
      const orig = originals[id];
      if (orig === undefined) return;
      dismissed.current[id] = orig;
      setTargetValue(id, orig);
      setOriginals((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
    },
    [originals, setTargetValue],
  );

  const clearTranslateMeta = (prefix) => {
    Object.keys(timers.current).forEach((k) => {
      if (k.startsWith(prefix)) {
        clearTimeout(timers.current[k]);
        delete timers.current[k];
      }
    });
    Object.keys(dismissed.current).forEach((k) => {
      if (k.startsWith(prefix)) delete dismissed.current[k];
    });
    setOriginals((p) =>
      Object.fromEntries(
        Object.entries(p).filter(([k]) => !k.startsWith(prefix)),
      ),
    );
  };

  const handleTranslateAll = async () => {
    const ids = [];
    ["prevResults", "topics", "gaps", "agreements"].forEach((field) =>
      form[field].forEach((_, i) => ids.push(`${field}:${i}`)),
    );
    ids.push("explanation");
    if (attendanceMode === "sync") {
      roster
        .filter((r) => r.status === "absent")
        .forEach((r) => ids.push(`roster:${r.id}`));
    } else {
      form.absent.forEach((_, i) => ids.push(`absentManual:${i}`));
    }
    const todo = ids.filter((id) =>
      needsAmharicTranslation(getTargetValue(id)),
    );
    if (todo.length === 0) {
      showToast(tf("trNothing", "Nothing to translate"), "info");
      return;
    }
    setTranslatingAll(true);
    let done = 0;
    for (const id of todo) {
      if (await translateNow(id, true)) done++;
    }
    setTranslatingAll(false);
    if (done > 0)
      showToast(tf("trAllDone", "✅ Translated to Amharic"), "success");
  };

  const renderTrStatus = (id) => (
    <TranslateStatus
      id={id}
      translating={translating}
      originals={originals}
      onRevert={revertTranslation}
      tf={tf}
    />
  );

  // ─── Roster handlers ───────────────────────────────────────
  const handleRosterStatus = (id, status) =>
    setRoster((p) => setRosterStatus(p, id, status));
  const handleRosterAll = (status) =>
    setRoster((p) => setAllRosterStatus(p, status));
  const handleRosterName = (id, name) =>
    setRoster((p) => p.map((r) => (r.id === id ? { ...r, name } : r)));
  const handleRosterRemove = (id) => {
    clearTranslateMeta(`roster:${id}`);
    setRoster((p) => p.filter((r) => r.id !== id));
  };
  const handleRosterAddManual = () =>
    setRoster((p) => [...p, newManualMember("")]);

  // ─── Signature handlers ───────────────────────────────────
  const handleSignatureMapConfirm = (signer, dataUrl) => {
    setSignatureMap((p) => {
      const n = { ...p };
      if (dataUrl) n[signer.key] = dataUrl;
      else delete n[signer.key];
      return n;
    });
  };

  // ─── Load report from History ───────────────────────────────
  const handleLoadReport = useCallback(
    (report) => {
      if (!report || !report._id) return;

      setForm({
        date: report.date
          ? new Date(report.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        timeStart: report.timeStart || "",
        timeEnd: report.timeEnd || "",
        present:
          Array.isArray(report.present) && report.present.length > 0
            ? report.present
            : [""],
        absent:
          Array.isArray(report.absent) && report.absent.length > 0
            ? report.absent
            : [{ name: "", reason: "" }],
        prevResults:
          Array.isArray(report.prevResults) && report.prevResults.length > 0
            ? report.prevResults
            : [""],
        topics:
          Array.isArray(report.topics) && report.topics.length > 0
            ? report.topics
            : [""],
        explanation: report.explanation || "",
        gaps:
          Array.isArray(report.gaps) && report.gaps.length > 0
            ? report.gaps
            : [""],
        agreements:
          Array.isArray(report.agreements) && report.agreements.length > 0
            ? report.agreements
            : [""],
        signatures:
          Array.isArray(report.signatures) && report.signatures.length > 0
            ? report.signatures
            : [""],
      });

      // Rebuild signatureMap from signatureData (round-trips the
      // key-based model) or from report.signatures zipped with the
      // present members (legacy reports).
      const rebuilt = {};
      if (Array.isArray(report.signatureData)) {
        report.signatureData.forEach((entry) => {
          if (entry?.key && entry?.image) rebuilt[entry.key] = entry.image;
        });
      } else if (
        Array.isArray(report.signatures) &&
        Array.isArray(report.present)
      ) {
        report.present.forEach((name, i) => {
          const img = report.signatures[i];
          if (name && img) {
            rebuilt[
              report.attendance?.[i]?.member
                ? String(report.attendance[i].member)
                : `name:${name.trim()}`
            ] = img;
          }
        });
      }
      setSignatureMap(rebuilt);

      // Restore attendance mode. New reports carry `attendanceMode`;
      // legacy reports only had manual present/absent arrays.
      setAttendanceMode(report.attendanceMode === "sync" ? "sync" : "manual");

      setEditingId(report._id);
      setSavedProgressId(report._id);
      setIsReportLocked(
        report.isLocked === true ||
          report.status === "locked" ||
          report.status === "completed",
      );
      setActiveForumTab("form");
      setSubmitted(false);

      if (
        report.timeStart &&
        report.status !== "completed" &&
        report.status !== "locked" &&
        !report.isLocked
      ) {
        setTimerActive(true);
      } else {
        setTimerActive(false);
      }

      showToast(
        `Editing "${report.teamName || "Untitled"}" — save to update, or Reset to start fresh.`,
        "info",
      );
    },
    [showToast],
  );

  // ─── Reset form ─────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      timeStart: "",
      timeEnd: "",
      present: [""],
      absent: [{ name: "", reason: "" }],
      prevResults: [""],
      topics: [""],
      explanation: "",
      gaps: [""],
      agreements: [""],
      signatures: [""],
    });

    setEditingId(null);
    setSavedProgressId(null);
    setAiGeneratedContent(null);
    setShowAIBadge(true);
    setTimerActive(false);
    setIsReportLocked(false);
    setExtensionRequested(false);
    setLastAutoSaveTime(null);
    setWarningMessage(null);
    setRoster([]);
    setSignatureMap({});
    setAttendanceMode("sync");
    autoSelectedRef.current = false;
    failToastShown.current = false;
    trCache.current.clear();
    dismissed.current = {};
    timers.current = {};

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode */
    }
    resetTimer();
  }, [STORAGE_KEY, resetTimer]);

  // ─── AI apply / generate ───────────────────────────────────
  const handleApplySuggestion = (text) => {
    if (!text || text.trim() === "") {
      showToast(tf("noContent", "⚠️ No content to apply"), "warning");
      return;
    }
    const formattedText = formatAIResponse(text);
    setForm((prev) => ({
      ...prev,
      explanation: prev.explanation
        ? `${prev.explanation}\n\n📝 AI Generated Summary:\n${formattedText}`
        : `📝 AI Generated Summary:\n${formattedText}`,
    }));
    setAiGeneratedContent(formattedText);
    setShowAIBadge(true);
    showToast(
      tf("aiApplied", "✅ AI suggestion applied to explanation!"),
      "success",
    );
  };

  const handleGenerateSummary = async () => {
    try {
      const context = {
        title: `${tf("title", "Peer Forum Report")} - ${selectedTeam?.name || ""}`,
        date: form.date,
        attendees: attendance.presentNames,
        topics: form.topics.filter((x) => x.trim()),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim()),
        agreements: form.agreements.filter((a) => a.trim()),
      };
      const response = await aiAPI.getMeetingMinutes({
        title: context.title,
        date: context.date,
        attendees: context.attendees,
        agenda: context.topics.join("; "),
        notes: [
          `Topics: ${context.topics.join("; ")}`,
          `Explanation: ${context.explanation}`,
          `Gaps: ${context.gaps.join("; ")}`,
          `Agreements: ${context.agreements.join("; ")}`,
        ].join("\n"),
      });
      const content = response.data?.minutes || response.data?.insight || "";
      if (content) {
        handleApplySuggestion(content);
        showToast(
          tf("summaryGenerated", "✅ AI summary generated and applied!"),
          "success",
        );
      } else {
        showToast(
          tf(
            "noContentGenerated",
            "⚠️ No content generated. Please try again.",
          ),
          "warning",
        );
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      showToast(
        tf("summaryError", "❌ Failed to generate AI summary"),
        "error",
      );
    }
  };

  const handleGenerateFullReport = async () => {
    try {
      const context = {
        title: `${tf("title", "Peer Forum Report")} - ${selectedTeam?.name || ""}`,
        date: form.date,
        attendees: attendance.presentNames,
        topics: form.topics.filter((x) => x.trim()),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim()),
        agreements: form.agreements.filter((a) => a.trim()),
      };
      const response = await aiAPI.getMeetingMinutes({
        title: context.title,
        date: context.date,
        attendees: context.attendees,
        agenda: context.topics.join("; "),
        notes: [
          `Topics: ${context.topics.join("; ")}`,
          `Explanation: ${context.explanation}`,
          `Gaps: ${context.gaps.join("; ")}`,
          `Agreements: ${context.agreements.join("; ")}`,
        ].join("\n"),
      });
      const content = response.data?.minutes || response.data?.insight || "";
      const formattedContent = formatAIResponse(content);
      const fullReport = `
📋 PEER FORUM MEETING REPORT
${"=".repeat(50)}

📅 Date: ${form.date}
👥 Attendees: ${context.attendees.join(", ") || "Not specified"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 TOPICS DISCUSSED:
${context.topics.map((x, i) => `${i + 1}. ${x}`).join("\n") || "No topics listed"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 DISCUSSION SUMMARY:
${formattedContent || "No summary available"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ GAPS IDENTIFIED:
${context.gaps.map((g, i) => `${i + 1}. ${g}`).join("\n") || "No gaps identified"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AGREEMENTS REACHED:
${context.agreements.map((a, i) => `${i + 1}. ${a}`).join("\n") || "No agreements"}

${"=".repeat(50)}
🤖 Generated by AI Assistant • ${new Date().toLocaleString()}
      `;
      handleApplySuggestion(fullReport);
      showToast(
        tf("fullReportGenerated", "✅ Full report generated and applied!"),
        "success",
      );
    } catch (error) {
      console.error("Failed to generate full report:", error);
      showToast(
        tf("fullReportError", "❌ Failed to generate full report"),
        "error",
      );
    }
  };

  // ─── Export / Save ──────────────────────────────────────────
  const handleExport = () => {
    try {
      exportForumReportToPDF(
        {
          ...form,
          present: attendance.presentNames,
          absent: attendance.absent,
          signatures:
            aligned.signedCount > 0
              ? aligned.signatureData.map((s) => s.image)
              : form.signatures.filter(Boolean),
        },
        t,
        currentLang,
        selectedTeam?.name,
        { includeAI: includeAIForPdf },
      );
      showToast(
        tf("exportSuccess", "✅ Report exported successfully!"),
        "success",
      );
    } catch (error) {
      console.error("Failed to export report:", error);
      showToast(tf("exportError", "❌ Failed to export report"), "error");
    }
  };

  const handleSaveReport = async () => {
    try {
      setSaving(true);

      if (!form.date) {
        showToast(tf("selectDate", "Please select a date"), "warning");
        setSaving(false);
        return;
      }

      // Reject empty reports (backend enforces the same rule).
      if (!hasReportContent(form)) {
        showToast(
          tf(
            "emptyReport",
            "Cannot submit an empty report. Fill in at least one topic, explanation, gap, or agreement.",
          ),
          "warning",
        );
        setSaving(false);
        return;
      }

      const signatureData =
        aligned.signedCount > 0
          ? aligned.signatureData
          : form.signatures
              .filter((s) => s && s.trim())
              .map((img, i) => ({
                key: `name:${attendance.presentNames[i] || `slot-${i}`}`,
                member: null,
                name: attendance.presentNames[i] || `Slot ${i + 1}`,
                role: "member",
                image: img,
              }));

      const reportData = {
        date: form.date,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        present: attendance.presentNames,
        absent: attendance.absent,
        attendanceMode,
        attendance: attendance.attendance,
        prevResults: form.prevResults.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((x) => x.trim() !== ""),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim() !== ""),
        agreements: form.agreements.filter((a) => a.trim() !== ""),
        signatures: signatureData.map((s) => s.image),
        signatureData,
        team: selectedTeam?.id || selectedTeam?._id,
        teamName: selectedTeam?.name || "Unknown Team",
        aiGeneratedContent: aiGeneratedContent,
        // Saving = submitting. Without this the report stays a draft and
        // never appears under "Submitted Reports".
        status: "completed",
      };

      if (editingId) {
        await meetingAPI.update(editingId, reportData);
        showToast(
          tf("updateSuccess", "Report updated successfully!"),
          "success",
        );
      } else if (savedProgressId) {
        await meetingAPI.update(savedProgressId, reportData);
        showToast(tf("updateSuccess", "Report saved successfully!"), "success");
      } else {
        await meetingAPI.create(reportData);
        showToast(tf("saveSuccess", "Report saved successfully!"), "success");
      }

      if (onReportSaved) onReportSaved(selectedTeam?.id, form);
      setHistoryRefreshKey((k) => k + 1);
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to save report:", error);
      showToast(
        error.response?.data?.message ||
          error.response?.data?.error ||
          tf("saveError", "Failed to save report. Please try again."),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const g3Responsive = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "clamp(12px, 2vw, 18px)",
  };

  // ─── Submitted screen (unchanged from original) ────────────
  if (submitted) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "60px auto",
          padding: "0 20px",
          animation: "fadeInUp 0.6s ease",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "clamp(40px, 6vw, 70px) clamp(20px, 4vw, 50px)",
            background: C.white,
            borderRadius: radius.xl,
            boxShadow: shadows.xl,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              width: "clamp(60px, 12vw, 90px)",
              height: "clamp(60px, 12vw, 90px)",
              background: `linear-gradient(145deg, ${C.primary}, ${C.light})`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(32px, 7vw, 48px)",
              color: "#fff",
              margin: "0 auto 20px",
              boxShadow: `0 8px 40px ${C.primary}44`,
            }}
          >
            <FiCheck size={36} />
          </div>
          <h2
            style={{
              fontSize: FONT_SIZES.h1,
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.serif,
              marginBottom: 8,
            }}
          >
            {tf("saved", "Report Saved!")}
          </h2>
          <p
            style={{
              color: C.muted,
              marginBottom: 28,
              fontFamily: F.sans,
              fontSize: FONT_SIZES.body,
            }}
          >
            {tf("savedSub", "Peer Forum report completed successfully.")}
          </p>

          {aiGeneratedContent && showAIBadge && (
            <div
              style={{
                background: "#EFF6FF",
                borderRadius: radius.md,
                padding: "12px 16px",
                marginBottom: "20px",
                textAlign: "left",
                border: "1px solid #BFDBFE",
                animation: "fadeInUp 0.4s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <FiZap size={16} color="#1D4ED8" />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1D4ED8",
                  }}
                >
                  {tf("aiContentApplied", "AI Generated Content Applied")}
                </span>
                <button
                  onClick={() => setShowAIBadge(false)}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: "#1D4ED8",
                    cursor: "pointer",
                    opacity: 0.5,
                  }}
                >
                  <FiX size={14} />
                </button>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#1E293B",
                  margin: 0,
                  maxHeight: "80px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "pre-wrap",
                }}
              >
                {aiGeneratedContent.substring(0, 200)}
                {aiGeneratedContent.length > 200 && "..."}
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              style={{ ...btn.primary, padding: "12px 28px", gap: "8px" }}
              onClick={() => {
                resetForm();
                setSubmitted(false);
              }}
            >
              <FiPlus size={18} />
              {tf("newReport", "New Report")}
            </button>
            <button
              style={{ ...btn.secondary, padding: "12px 24px", gap: "8px" }}
              onClick={handleExport}
            >
              <FiDownload size={18} />
              {tc("export", "Export PDF")}
            </button>
          </div>

          <div style={{ marginTop: "28px", textAlign: "left" }}>
            <AISummary
              fetchFn={() =>
                aiAPI.getMeetingMinutes({
                  title: `${tf("title", "Peer Forum Report")} - ${selectedTeam?.name || ""}`,
                  date: form.date,
                  attendees: attendance.presentNames,
                  agenda: STANDING_AGENDAS_AM.join("; "),
                  notes: [
                    `Topics: ${form.topics.filter((x) => x.trim()).join("; ")}`,
                    `Explanation: ${form.explanation}`,
                    `Gaps: ${form.gaps.filter((x) => x.trim()).join("; ")}`,
                    `Agreements: ${form.agreements.filter((x) => x.trim()).join("; ")}`,
                  ].join("\n"),
                })
              }
              args={[]}
              label={tf("aiSummaryLabel", "AI Meeting Minutes")}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Access guard ──────────────────────────────────────────
  if (!isLeaderOrAbove(user)) {
    const msg = {
      am: "የአቻ ፎረም ለቡድን መሪዎች እና ከዚያ በላይ ላሉ ብቻ ነው።",
      om: "Fooramiin Hiriyaa Qajeelchitoota Garee fi isaan olii qofaaf.",
      en: "Peer Forum is only available to Team Leaders and above.",
    };
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "80px auto",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ margin: 0 }}>{msg[currentLang] || msg.en}</h2>
      </div>
    );
  }

  // ─── No team selected: team list + Submitted Reports ───────
  if (!selectedTeam) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <TeamSelector
          teams={teams}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          lang={currentLang}
          loading={loadingTeams}
        />
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "0 clamp(24px, 5vw, 48px) 48px",
          }}
        >
          <SubmittedReports tf={tf} t={t} lang={currentLang} />
        </div>
      </div>
    );
  }

  // ─── Main Form ─────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "clamp(14px, 3vw, 32px) clamp(12px, 3vw, 24px)",
        animation: "fadeInUp 0.5s ease",
      }}
      ref={formRef}
    >
      {/* Header (unchanged) */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 2vw, 16px)",
          marginBottom: "clamp(18px, 3.5vw, 30px)",
          paddingBottom: "clamp(12px, 2.5vw, 18px)",
          borderBottom: `2px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(10px, 2vw, 16px)",
          }}
        >
          <div
            style={{
              width: "clamp(40px, 7vw, 52px)",
              height: "clamp(40px, 7vw, 52px)",
              background: `linear-gradient(145deg, ${C.primary}, ${C.light})`,
              borderRadius: radius.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "clamp(18px, 3vw, 24px)",
              boxShadow: `0 4px 20px ${C.primary}33`,
              flexShrink: 0,
            }}
          >
            <FiMessageSquare size={22} />
          </div>
          <div>
            <h1
              style={{
                fontSize: FONT_SIZES.h1,
                fontWeight: 800,
                color: C.dark,
                fontFamily: F.serif,
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              {tf("title", "Peer Forum Report")}
            </h1>
            <h2
              style={{
                fontSize: FONT_SIZES.h2,
                fontWeight: 600,
                color: C.primary,
                fontFamily: F.sans,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              — {selectedTeam.name}
            </h2>
            <p
              style={{
                fontSize: FONT_SIZES.small,
                color: C.muted,
                margin: "2px 0 0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiCalendar size={13} />
              {tf(
                "subtitle",
                "Addis Ababa City Admin · Addis MESOB · Addis Ketema Center",
              )}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(8px, 1.5vw, 14px)",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setSelectedTeam(null)}
            style={{
              ...btn.secondary,
              padding: "6px 12px",
              fontSize: "12px",
              borderRadius: radius.md,
              gap: "4px",
            }}
          >
            <FiChevronLeft size={14} />
            {tf("changeTeam", "Change Team")}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: C.bg,
              padding: "4px 14px 4px 10px",
              borderRadius: radius.pill,
              border: `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontSize: "10px", color: C.muted, fontWeight: 600 }}>
              {formProgress}%
            </span>
            <div
              style={{
                width: "80px",
                height: "4px",
                background: C.border,
                borderRadius: radius.pill,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${formProgress}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
                  borderRadius: radius.pill,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
          <div
            style={{
              background: `linear-gradient(145deg, ${C.primary}, ${C.light})`,
              color: "#fff",
              padding: "4px 14px",
              borderRadius: radius.pill,
              fontSize: FONT_SIZES.small,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: `0 2px 12px ${C.primary}33`,
            }}
          >
            <FiCalendar size={13} />
            {safeYear}
          </div>
        </div>
      </div>

      {/* Timer + AutoSaveIndicator (unchanged) */}
      <div style={{ marginBottom: "16px" }}>
        <MeetingTimer
          timeRemaining={timeRemaining}
          formattedTime={formattedTime}
          progressPercent={progressPercent}
          status={status}
          isExpired={isExpired}
          progressSaved={progressSaved}
          warningMessage={warningMessage}
          onExtend={() => setShowExpiredModal(true)}
          isAdmin={isAdmin}
          onResume={handleResumeReport}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      </div>

      {(isReportLocked || extensionRequested) && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: radius.md,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: isReportLocked ? "#FEF2F2" : "#FFFBEB",
            border: `1px solid ${isReportLocked ? "#FCA5A5" : "#FDE68A"}`,
          }}
        >
          {isReportLocked ? (
            <>
              <FiAlertCircle size={18} color="#DC2626" />
              <span style={{ fontSize: "13px", color: "#991B1B" }}>
                {tf("reportLocked") ||
                  "🔒 This report is locked. Please contact an admin."}
              </span>
            </>
          ) : (
            <>
              <FiClock size={18} color="#D97706" />
              <span style={{ fontSize: "13px", color: "#92400E" }}>
                {tf("extensionPending") ||
                  "⏳ Extension request pending admin approval."}
              </span>
            </>
          )}
        </div>
      )}

      {aiGeneratedContent && showAIBadge && (
        <AIInsightBadge type="success" onClose={() => setShowAIBadge(false)}>
          <strong>🤖 AI Generated Content Applied!</strong>
          <span
            style={{ display: "block", fontSize: "12px", marginTop: "2px" }}
          >
            {aiGeneratedContent.substring(0, 120)}
            {aiGeneratedContent.length > 120 && "..."}
          </span>
        </AIInsightBadge>
      )}

      <AIInsightBadge type="info">
        <strong>
          📊 Progress: {formProgress}% {tf("complete", "complete")}
        </strong>
        <span style={{ marginLeft: "8px", fontSize: "12px" }}>
          {formProgress < 30 &&
            tf("progressStart", "🚀 Start filling in the report details below")}
          {formProgress >= 30 &&
            formProgress < 70 &&
            tf("progressMiddle", "💪 You're making good progress! Keep going.")}
          {formProgress >= 70 &&
            tf("progressEnd", "🎯 Almost there! Review and save your report.")}
        </span>
      </AIInsightBadge>

      <StandingAgendasPanel t={forumDict} />

      {/* Tabs (form | history | feed) */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#F1F5F9",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "clamp(18px, 3vw, 24px)",
          border: `1px solid ${C.border}50`,
        }}
      >
        <button
          onClick={() => setActiveForumTab("form")}
          style={tabStyle(activeForumTab === "form", isMobile)}
        >
          <FiEdit3 size={isMobile ? 14 : 16} />
          {tf("newReport", "New Report")}
        </button>
        <button
          onClick={() => setActiveForumTab("history")}
          style={tabStyle(activeForumTab === "history", isMobile)}
        >
          <FiList size={isMobile ? 14 : 16} />
          {tf("historyTab", "History")}
          {historyCount > 0 && (
            <span
              style={{
                background: C.primary,
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: 999,
                lineHeight: 1.6,
              }}
            >
              {historyCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveForumTab("feed")}
          style={tabStyle(activeForumTab === "feed", isMobile)}
        >
          <FiMessageSquare size={isMobile ? 14 : 16} />
          {tf("feed", "Feed")}
        </button>
      </div>

      {activeForumTab === "form" ? (
        <div
          style={{
            ...card,
            padding: "clamp(18px, 3vw, 36px)",
            background: C.white,
            borderRadius: radius.xl,
            boxShadow: shadows.lg,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "8px",
            }}
          >
            <AutoSaveIndicator
              isSaving={saving}
              isSaved={progressSaved}
              lastSavedAt={lastAutoSaveTime}
              t={tf}
            />
          </div>

          {/* Auto-translate toggle */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              marginBottom: SPACING.lg,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: radius.md,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
                color: "#15803D",
                flex: "1 1 220px",
              }}
            >
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
              />
              <FiGlobe size={14} />
              {tf("trAuto", "Auto-translate English → Amharic")}
            </label>
            <span style={{ ...text.muted, fontSize: 10, flex: "2 1 220px" }}>
              {tf(
                "trAutoHelper",
                "Type in English in the fields below; they are converted to Amharic automatically.",
              )}
            </span>
            <button
              type="button"
              onClick={handleTranslateAll}
              disabled={translatingAll}
              style={{
                ...btn.secondary,
                padding: "4px 10px",
                fontSize: 11,
                justifyContent: "center",
                opacity: translatingAll ? 0.7 : 1,
              }}
            >
              {translatingAll ? (
                <FiLoader
                  size={12}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <FiGlobe size={12} />
              )}
              {tf("trAll", "Translate all now")}
            </button>
          </div>

          {/* Meeting Time (unchanged) */}
          <Section
            title={tf("meetingTime", "Meeting Time")}
            icon={<FiCalendar size={18} />}
          >
            <div style={g3Responsive}>
              <Field
                label={tf("date", "Date")}
                value={form.date}
                onChange={(v) => upd("date", v)}
                type="date"
              />
              <Field
                label={tf("startTime", "Start Time")}
                value={form.timeStart}
                onChange={(v) => {
                  upd("timeStart", v);
                  if (v) {
                    const [hours, minutes] = v.split(":").map(Number);
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    date.setMinutes(date.getMinutes() + 30);
                    const endHours = String(date.getHours()).padStart(2, "0");
                    const endMinutes = String(date.getMinutes()).padStart(
                      2,
                      "0",
                    );
                    upd("timeEnd", `${endHours}:${endMinutes}`);
                    setTimerActive(true);
                  }
                }}
                type="time"
              />
              <Field
                label={tf("endTime", "End Time")}
                value={form.timeEnd || ""}
                onChange={() => {}}
                type="time"
                readOnly
                style={{
                  background: "#f3f4f6",
                  cursor: "not-allowed",
                  opacity: 0.8,
                  color: "#6b7280",
                }}
              />
            </div>
          </Section>

          {/* Attendance mode toggle + sections */}
          <AttendanceModeToggle
            mode={attendanceMode}
            onChange={setAttendanceMode}
            tf={tf}
          />

          {attendanceMode === "sync" ? (
            <Section
              title={tf("attTitle", "👥 Attendance")}
              icon={<FiUserCheckIcon size={18} />}
            >
              <AttendanceRoster
                roster={roster}
                loading={loadingRoster}
                error={rosterError}
                onRetry={() => loadRoster()}
                onResync={() => loadRoster(true)}
                onStatus={handleRosterStatus}
                onAll={handleRosterAll}
                onName={handleRosterName}
                onReason={(id, v) => onTranslatableChange(`roster:${id}`, v)}
                onReasonBlur={(id) => translateNow(`roster:${id}`)}
                onRemove={handleRosterRemove}
                onAddManual={handleRosterAddManual}
                renderReasonStatus={(id) => renderTrStatus(`roster:${id}`)}
                tf={tf}
              />
            </Section>
          ) : (
            <>
              <DynamicFieldGroup
                title={tf("presentMembers", "Present Members")}
                icon={<FiUserCheckIcon size={18} />}
                values={form.present}
                onAdd={() => addItem("present", "")}
                onRemove={(idx) => removeItem("present", idx)}
                onUpdate={(idx, val) => {
                  const updated = [...form.present];
                  updated[idx] = val;
                  setForm((prev) => ({ ...prev, present: updated }));
                }}
                renderField={(value, idx) => (
                  <Field
                    label={`${idx + 1}${tf("memberN", " Member")}`}
                    value={value}
                    onChange={(v) => {
                      const updated = [...form.present];
                      updated[idx] = v;
                      setForm((prev) => ({ ...prev, present: updated }));
                    }}
                    placeholder={`${tf("memberPlaceholder", "Member")} ${idx + 1}`}
                  />
                )}
                helperText={tf(
                  "presentHelper",
                  "Add all team members who attended the forum meeting",
                )}
                variant="primary"
                addFirstLabel={tf("addFirst", "Add First")}
                addAnotherLabel={tf("addAnother", "Add Another")}
              />

              <Section
                title={tf("absentMembers", "Absent Members & Reasons")}
                icon={<FiUserX size={18} />}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {form.absent.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "14px 16px",
                        background: C.cardBg,
                        border: `1.5px solid ${C.border}`,
                        borderRadius: radius.lg,
                        transition:
                          "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: FONT_SIZES.small,
                          fontWeight: 600,
                          color: C.muted,
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FiUserX size={14} />
                        {tf("absentMemberLabel", "Absent Member")} #{idx + 1}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        <Field
                          label={tf("name", "Name")}
                          value={item.name}
                          onChange={(v) => updateAbsent(idx, "name", v)}
                          placeholder={tf("namePlaceholder", "Member name")}
                        />
                        <div>
                          <Field
                            label={tf("reason", "Reason")}
                            value={item.reason}
                            onChange={(v) =>
                              onTranslatableChange(`absentManual:${idx}`, v)
                            }
                            onBlur={() => translateNow(`absentManual:${idx}`)}
                            placeholder={tf(
                              "reasonPlaceholder",
                              "Reason for absence",
                            )}
                          />
                          {renderTrStatus(`absentManual:${idx}`)}
                        </div>
                      </div>
                      {form.absent.length > 1 && (
                        <button
                          onClick={() => removeAbsent(idx)}
                          style={{
                            ...btn.icon,
                            marginTop: "6px",
                            color: "#dc2626",
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: radius.md,
                            background: "transparent",
                          }}
                        >
                          <FiX size={14} />
                          {tc("remove", "Remove")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addAbsent}
                  style={{
                    ...btn.secondary,
                    padding: "8px 16px",
                    fontSize: "12px",
                    marginTop: "10px",
                    width: "100%",
                    justifyContent: "center",
                    borderRadius: radius.lg,
                    borderStyle: "dashed",
                    borderWidth: "2px",
                    gap: "6px",
                  }}
                >
                  <FiPlus size={14} />
                  {tf("addAbsent", "Add Absent Member")}
                </button>
              </Section>
            </>
          )}

          {/* Prev Results */}
          <DynamicFieldGroup
            title={tf("prevResults", "Results from Previous Meeting")}
            icon={<FiFileText size={18} />}
            values={form.prevResults}
            onAdd={() => addItem("prevResults", "")}
            onRemove={(idx) => removeItem("prevResults", idx)}
            onUpdate={(idx, val) =>
              onTranslatableChange(`prevResults:${idx}`, val)
            }
            onFieldBlur={(idx) => translateNow(`prevResults:${idx}`)}
            renderStatus={(idx) => renderTrStatus(`prevResults:${idx}`)}
            labelPrefix={tf("resultLabel", "Result")}
            placeholderPrefix={tf("prevResultPlaceholder", "Previous result")}
            helperText={tf(
              "prevResultHelper",
              "List outcomes and action items from the previous meeting",
            )}
            variant="warning"
            addFirstLabel={tf("addFirst", "Add First")}
            addAnotherLabel={tf("addAnother", "Add Another")}
          />

          {/* Topics */}
          <DynamicFieldGroup
            title={tf("todayTopics", "Today's Discussion Topics")}
            icon={<FiMessageSquare size={18} />}
            values={form.topics}
            onAdd={() => addItem("topics", "")}
            onRemove={(idx) => removeItem("topics", idx)}
            onUpdate={(idx, val) => onTranslatableChange(`topics:${idx}`, val)}
            onFieldBlur={(idx) => translateNow(`topics:${idx}`)}
            renderStatus={(idx) => renderTrStatus(`topics:${idx}`)}
            labelPrefix={tf("topic", "Topic")}
            placeholderPrefix={tf("topicPlaceholder", "Discussion topic")}
            helperText={tf(
              "topicHelper",
              "Enter each discussion topic separately",
            )}
            variant="primary"
            addFirstLabel={tf("addFirst", "Add First")}
            addAnotherLabel={tf("addAnother", "Add Another")}
          />

          {/* Explanation */}
          <Section
            title={tf("explanation", "Explanation Given (Brief)")}
            icon={<FiEdit3 size={18} />}
          >
            <textarea
              style={{
                ...inp,
                resize: "vertical",
                minHeight: "clamp(90px, 15vw, 140px)",
                fontSize: FONT_SIZES.body,
                padding: "12px 14px",
                borderRadius: radius.md,
                border: `2px solid ${focusedField === "explanation" ? C.primary : C.border}`,
                boxShadow:
                  focusedField === "explanation"
                    ? `0 0 0 4px ${C.primary}22`
                    : "none",
                transition: "all 0.3s ease",
                width: "100%",
                fontFamily: F.sans,
                lineHeight: 1.6,
              }}
              rows={4}
              value={form.explanation}
              onChange={(e) =>
                onTranslatableChange("explanation", e.target.value)
              }
              onFocus={() => setFocusedField("explanation")}
              onBlur={() => {
                setFocusedField(null);
                translateNow("explanation");
              }}
              placeholder={tf("explanationPlaceholder", "Write explanation...")}
            />
            {renderTrStatus("explanation")}

            <div
              style={{
                marginTop: "14px",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
                padding: "12px 16px",
                background: "#F8FAFC",
                borderRadius: radius.md,
                border: `1.5px solid ${C.border}`,
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              >
                <FiZap size={14} color={C.primary} />
                {tf("aiActions", "AI Actions:")}
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={handleGenerateSummary}
                  style={{
                    ...btn.secondary,
                    padding: "6px 12px",
                    fontSize: "11px",
                    background: "#EFF6FF",
                    borderColor: "#BFDBFE",
                    color: "#1D4ED8",
                    flex: "1 1 auto",
                    minWidth: "80px",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    borderRadius: radius.md,
                    fontWeight: 600,
                  }}
                >
                  <FiZap size={13} />
                  {tf("generateSummary", "AI Writing Assistant")}
                </button>
                <button
                  onClick={handleGenerateSummary}
                  style={{
                    ...btn.secondary,
                    padding: "6px 12px",
                    fontSize: "11px",
                    background: "#F0FDF4",
                    borderColor: "#86EFAC",
                    color: "#15803D",
                    flex: "1 1 auto",
                    minWidth: "70px",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    borderRadius: radius.md,
                    fontWeight: 600,
                  }}
                >
                  <FiTrendingUp size={13} />
                  {tf("summarize", "Summarize")}
                </button>
                <button
                  onClick={handleGenerateFullReport}
                  style={{
                    ...btn.secondary,
                    padding: "6px 12px",
                    fontSize: "11px",
                    background: "#FEF3C7",
                    borderColor: "#FDE68A",
                    color: "#92400E",
                    flex: "1 1 auto",
                    minWidth: "70px",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    borderRadius: radius.md,
                    fontWeight: 600,
                  }}
                >
                  <FiBookOpen size={13} />
                  {tf("fullReport", "Full Report")}
                </button>
                <button
                  onClick={handleExport}
                  style={{
                    ...btn.secondary,
                    padding: isMobile ? "6px 10px" : "6px 14px",
                    fontSize: isMobile ? "13px" : "11px",
                    background: "#F3E8FF",
                    borderColor: "#D8B4FE",
                    color: "#6D28D9",
                    flex: isMobile ? "0 0 auto" : "1 1 auto",
                    minWidth: isMobile ? "36px" : "60px",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    borderRadius: radius.md,
                    fontWeight: 600,
                    gap: "4px",
                  }}
                  title={tc("export", "Export PDF")}
                >
                  <FiDownload size={isMobile ? 18 : 14} />
                  {!isMobile && <span>{tc("export", "Export PDF")}</span>}
                </button>
              </div>
            </div>
          </Section>

          {/* Gaps */}
          <DynamicFieldGroup
            title={tf("gaps", "Identified Gaps")}
            icon={<FiAlertCircle size={18} />}
            values={form.gaps}
            onAdd={() => addItem("gaps", "")}
            onRemove={(idx) => removeItem("gaps", idx)}
            onUpdate={(idx, val) => onTranslatableChange(`gaps:${idx}`, val)}
            onFieldBlur={(idx) => translateNow(`gaps:${idx}`)}
            renderStatus={(idx) => renderTrStatus(`gaps:${idx}`)}
            labelPrefix={tf("gapLabel", "Gap")}
            placeholderPrefix={tf("gapPlaceholder", "Identified gap")}
            helperText={tf(
              "gapHelper",
              "Identify gaps or challenges discussed in the forum",
            )}
            variant="danger"
            addFirstLabel={tf("addFirst", "Add First")}
            addAnotherLabel={tf("addAnother", "Add Another")}
          />

          {/* Agreements */}
          <DynamicFieldGroup
            title={tf("agreements", "Agreed Points")}
            icon={<FiCheckCircle size={18} />}
            values={form.agreements}
            onAdd={() => addItem("agreements", "")}
            onRemove={(idx) => removeItem("agreements", idx)}
            onUpdate={(idx, val) =>
              onTranslatableChange(`agreements:${idx}`, val)
            }
            onFieldBlur={(idx) => translateNow(`agreements:${idx}`)}
            renderStatus={(idx) => renderTrStatus(`agreements:${idx}`)}
            labelPrefix={tf("agreementLabel", "Agreement")}
            placeholderPrefix={tf("agreementPlaceholder", "Agreed point")}
            helperText={tf(
              "agreementHelper",
              "Document all points of agreement reached",
            )}
            variant="success"
            addFirstLabel={tf("addFirst", "Add First")}
            addAnotherLabel={tf("addAnother", "Add Another")}
          />

          {/* Signatures */}
          <Section
            title={tf("signatures", "Signatures")}
            icon={<FiPenTool size={18} />}
          >
            {attendanceMode === "sync" ? (
              <>
                <p style={{ ...text.muted, fontSize: 11, margin: "0 0 10px" }}>
                  <FiInfo size={12} style={{ marginRight: 4 }} />
                  {tf(
                    "sigHelper",
                    "Every present member signs here. Tap a card to sign. Absent members are not required.",
                  )}{" "}
                  <strong>
                    ({aligned.signedCount}/{signers.length}{" "}
                    {tf("sigProgress", "signed")})
                  </strong>
                </p>
                <SignatureCards
                  signers={signers}
                  signatureMap={signatureMap}
                  absentNames={attendance.absent.map((a) => a.name)}
                  onSign={(signer) =>
                    setSignatureModal({
                      isOpen: true,
                      signer,
                      index: null,
                      value: signatureMap[signer.key] || null,
                    })
                  }
                  tf={tf}
                />
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {form.signatures.map((sig, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px 14px",
                        background: C.cardBg,
                        borderRadius: radius.lg,
                        border: `1.5px solid ${sig ? C.primary : C.border}`,
                        transition: "all 0.3s ease",
                        cursor: isReportLocked ? "not-allowed" : "pointer",
                        position: "relative",
                      }}
                      onClick={() => {
                        if (!isReportLocked) {
                          setSignatureModal({
                            isOpen: true,
                            index: idx,
                            value: sig,
                            signer: null,
                          });
                        }
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: sig ? C.primary : C.muted,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FiPenTool size={12} />
                          {`${idx + 1}${tf("signatureN", " Signature")}`}
                        </span>
                        {sig && <FiCheck size={14} color="#10b981" />}
                        {form.signatures.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem("signatures", idx);
                            }}
                            style={{
                              ...btn.icon,
                              color: "#dc2626",
                              background: "#fee2e2",
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                            }}
                          >
                            <FiX size={12} />
                          </button>
                        )}
                      </div>
                      {sig ? (
                        <img
                          src={sig}
                          alt={`Signature ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: "50px",
                            objectFit: "contain",
                            background: "#fff",
                            borderRadius: 6,
                            border: `1px solid ${C.border}`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "50px",
                            background: "#f9fafb",
                            borderRadius: 6,
                            border: `1px dashed ${C.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            color: C.muted,
                          }}
                        >
                          {isReportLocked
                            ? tf("signatureLocked", "🔒 Locked")
                            : tf("signatureClickToSign", "Click to sign")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (!isReportLocked) {
                      const newIndex = form.signatures.length;
                      setForm((prev) => ({
                        ...prev,
                        signatures: [...prev.signatures, ""],
                      }));
                      setSignatureModal({
                        isOpen: true,
                        index: newIndex,
                        value: null,
                        signer: null,
                      });
                    }
                  }}
                  disabled={isReportLocked}
                  style={{
                    ...btn.secondary,
                    padding: "8px 16px",
                    fontSize: "12px",
                    marginTop: "10px",
                    width: "100%",
                    justifyContent: "center",
                    borderRadius: radius.lg,
                    borderStyle: "dashed",
                    borderWidth: "2px",
                    gap: "6px",
                    opacity: isReportLocked ? 0.5 : 1,
                  }}
                >
                  <FiPlus size={14} />
                  {tf("addSignature", "Add Signature")}
                </button>
              </>
            )}
          </Section>

          {/* Action bar */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "clamp(10px, 2vw, 16px)",
              justifyContent: "center",
              marginTop: "clamp(24px, 4vw, 36px)",
              paddingTop: "clamp(16px, 3vw, 24px)",
              borderTop: `2px solid ${C.border}`,
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: isMobile ? "11px" : "12px",
                color: C.muted,
                cursor: "pointer",
                userSelect: "none",
                flex: isMobile ? "1 1 100%" : "0 0 auto",
                justifyContent: isMobile ? "center" : "flex-start",
                order: isMobile ? -1 : 0,
              }}
            >
              <input
                type="checkbox"
                checked={includeAIForPdf}
                onChange={(e) => setIncludeAIForPdf(e.target.checked)}
                style={{
                  width: 14,
                  height: 14,
                  accentColor: C.primary,
                  cursor: "pointer",
                }}
              />
              {tf("includeAiInPdf", "Include AI content in PDF")}
            </label>

            <button
              style={{
                ...btn.danger,
                flex: isMobile ? "1" : "0.5",
                justifyContent: "center",
                padding: "clamp(10px, 2vw, 14px) clamp(20px, 4vw, 36px)",
                fontSize: isMobile ? "13px" : FONT_SIZES.body,
                gap: "6px",
                borderRadius: radius.lg,
              }}
              onClick={handleExport}
              title={tc("export", "Export PDF")}
            >
              <FiDownload size={isMobile ? 20 : 18} />
              {!isMobile && <span>{tc("export", "Export PDF")}</span>}
              {isMobile && <span style={{ fontSize: "10px" }}>PDF</span>}
            </button>

            <button
              style={{
                ...btn.secondary,
                flex: isMobile ? "1" : "0.5",
                justifyContent: "center",
                padding: "clamp(10px, 2vw, 14px) clamp(20px, 4vw, 36px)",
                fontSize: isMobile ? "13px" : FONT_SIZES.body,
                gap: "6px",
                borderRadius: radius.lg,
              }}
              onClick={() => {
                const hasContent =
                  form.present.some((p) => p && p.trim()) ||
                  form.topics.some((x) => x && x.trim()) ||
                  form.explanation.trim() ||
                  form.gaps.some((g) => g && g.trim()) ||
                  form.agreements.some((a) => a && a.trim());
                if (
                  hasContent &&
                  !window.confirm(
                    editingId
                      ? "Discard changes to this report and start fresh?"
                      : "Clear the form and start a new report?",
                  )
                ) {
                  return;
                }
                resetForm();
                showToast(
                  editingId ? "Changes discarded." : "Form cleared.",
                  "info",
                );
              }}
              title={tc("reset", "Reset")}
            >
              <FiRefreshCw size={isMobile ? 18 : 16} />
              {!isMobile && <span>{tc("reset", "Reset")}</span>}
            </button>

            <button
              style={{
                ...btn.primary,
                flex: "1",
                justifyContent: "center",
                padding: "clamp(10px, 2vw, 14px) clamp(16px, 4vw, 32px)",
                fontSize: FONT_SIZES.body,
                opacity: saving || isReportLocked ? 0.7 : 1,
                cursor: saving || isReportLocked ? "not-allowed" : "pointer",
                borderRadius: radius.lg,
                gap: "8px",
              }}
              onClick={handleSaveReport}
              disabled={saving || isReportLocked}
            >
              {saving ? (
                <>
                  <FiLoader
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  {tc("saving", "Saving...")}
                </>
              ) : (
                <>
                  <FiSave size={18} />
                  {editingId
                    ? tf("updateReport", "Update Report")
                    : tf("save", "Save Report")}
                </>
              )}
            </button>
          </div>
        </div>
      ) : activeForumTab === "history" ? (
        <ForumReportHistory
          teamId={selectedTeam?.id}
          onOpenReport={handleLoadReport}
          onCountChange={setHistoryCount}
          refreshKey={historyRefreshKey}
        />
      ) : (
        <ForumReportFeed t={t} isMobile={isMobile} teamId={selectedTeam?.id} />
      )}

      {/* Time Expired Modal */}
      <TimeExpiredModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        onRequestExtension={handleRequestExtension}
        onViewProgress={() => {
          setShowExpiredModal(false);
        }}
        isAdmin={isAdmin}
        t={tf}
      />

      {/* Signature Modal (works in both modes) */}
      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={() =>
          setSignatureModal({
            isOpen: false,
            index: null,
            value: null,
            signer: null,
          })
        }
        onConfirm={(dataUrl) => {
          if (signatureModal.signer) {
            handleSignatureMapConfirm(signatureModal.signer, dataUrl);
          } else if (signatureModal.index != null) {
            const updated = [...form.signatures];
            updated[signatureModal.index] = dataUrl || "";
            setForm((prev) => ({ ...prev, signatures: updated }));
          }
          setSignatureModal({
            isOpen: false,
            index: null,
            value: null,
            signer: null,
          });
        }}
        initialSignature={signatureModal.value}
        title={tf("signatureModalTitle", "Sign Your Report")}
        subtitle={
          signatureModal.signer
            ? signatureModal.signer.name
            : `${tf("signatureN", "Signature")} ${(signatureModal.index || 0) + 1}`
        }
        userName={user?.name || ""}
        teamName={selectedTeam?.name || ""}
        t={tf}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// ─── Tab style helper (kept outside component) ─────────────
function tabStyle(active, isMobile) {
  return {
    flex: 1,
    padding: isMobile ? "8px 14px" : "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: active ? "#fff" : "transparent",
    color: active ? "#0F172A" : "#64748B",
    fontWeight: 600,
    fontSize: isMobile ? "12px" : "14px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
  };
}
