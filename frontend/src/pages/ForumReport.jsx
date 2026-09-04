/* eslint-disable react-hooks/set-state-in-effect */
// frontend/src/pages/ForumReport.jsx
// Enhanced Professional Forum Report Page with AI Integration - FULLY ENHANCED

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
import { forumReportTranslations } from "../constants/translations/forumReport";
import { commonTranslations } from "../constants/translations/common";
import { isAdminOrAbove } from "../utils/roles";

// ─── Timer Features ──────────────────────────────────────────
import { useMeetingTimer } from "../hooks/useMeetingTimer";
import MeetingTimer from "../components/forum-report/MeetingTimer";
import TimeExpiredModal from "../components/forum-report/TimeExpiredModal";
import AutoSaveIndicator from "../components/forum-report/AutoSaveIndicator";
import { forumReportService } from "../services/forumReportService";
import SignatureModal from "../components/forum-report/SignatureModal";

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
} from "react-icons/fi";

// ─── FONT SIZES ──────────────────────────────────────────────
const FONT_SIZES = {
  h1: "clamp(20px, 4.5vw, 32px)",
  h2: "clamp(16px, 3.5vw, 26px)",
  h3: "clamp(14px, 3vw, 20px)",
  body: "clamp(12px, 2.8vw, 15px)",
  small: "clamp(10px, 2.2vw, 13px)",
};

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

      {/* Search Input */}
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

      {/* Teams Grid */}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
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

// ─── Enhanced Dynamic Field Group ────────────────────────────
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
}) => {
  const handleAdd = () => {
    if (values.length < maxItems) {
      onAdd();
    }
  };

  const variants = {
    default: {
      bg: C.cardBg,
      border: C.border,
      hoverBg: "#f0f3ff",
    },
    primary: {
      bg: "#EFF6FF",
      border: "#BFDBFE",
      hoverBg: "#DBEAFE",
    },
    success: {
      bg: "#F0FDF4",
      border: "#86EFAC",
      hoverBg: "#DCFCE7",
    },
    warning: {
      bg: "#FFFBEB",
      border: "#FDE68A",
      hoverBg: "#FEF3C7",
    },
    danger: {
      bg: "#FEF2F2",
      border: "#FCA5A5",
      hoverBg: "#FEE2E2",
    },
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
                  placeholder={`${placeholderPrefix} ${idx + 1}`}
                />
              )}
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
          Add {values.length === 0 ? "First" : "Another"}
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
  const tf = useCallback(
    (key, fallback) => safeT?.forum?.[key] || fallback,
    [safeT],
  );
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

// ─── Format AI Response ──────────────────────────────────────
const formatAIResponse = (text) => {
  if (!text) return "";

  let formatted = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/### /g, "")
    .replace(/---/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/^[•·-]\s*/gm, "• ")
    .replace(/\(\s*\)/g, "")
    .trim();

  formatted = formatted.replace(/\*/g, "");
  formatted = formatted.replace(/\s{2,}/g, " ");

  const sections = [
    "MEETING MINUTES",
    "Date:",
    "Attendees:",
    "AGENDA ITEMS & DECISIONS",
    "ACTION ITEMS",
    "NEXT MEETING",
  ];

  sections.forEach((section) => {
    const regex = new RegExp(`(${section})`, "g");
    formatted = formatted.replace(regex, "\n$1\n");
  });

  formatted = formatted.replace(/•\s*Topics:/g, "• Topics:");
  formatted = formatted.replace(/•\s*Explanation:/g, "• Explanation:");
  formatted = formatted.replace(/•\s*Gaps:/g, "• Gaps:");
  formatted = formatted.replace(/•\s*Agreements:/g, "• Agreements:");
  formatted = formatted.replace(/•\s*\(no details recorded\)/g, "");
  formatted = formatted.replace(/•\s*No/g, "• No");
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
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

  const safeT = useMemo(() => t || {}, [t]);
  const safeYear = safeT.year || "2018 E.C.";

  const tf = useCallback(
    (key, fallback) => safeT?.forum?.[key] || fallback,
    [safeT],
  );
  const tc = useCallback(
    (key, fallback) => safeT?.common?.[key] || fallback,
    [safeT],
  );

  const { showToast } = useToast();
  const formRef = useRef(null);

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

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [activeForumTab, setActiveForumTab] = useState("form");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ─── Timer State ──────────────────────────────────────────────
  const [timerActive, setTimerActive] = useState(false);
  const [isReportLocked, setIsReportLocked] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState(null);
  const [savedProgressId, setSavedProgressId] = useState(null);
  const [extensionRequested, setExtensionRequested] = useState(false);
  // ─── Signature Modal State ──────────────────────────────────
  const [signatureModal, setSignatureModal] = useState({
    isOpen: false,
    index: null,
    value: null,
  });

  const isAdmin = isAdminOrAbove(user);

  // ─── LocalStorage Key ──────────────────────────────────────────
  const STORAGE_KEY = `forum_report_timer_${selectedTeam?.id || "default"}`;

  // ─── Get initial time remaining from localStorage ────────────
  const getInitialTimeRemaining = useCallback(() => {
    if (!selectedTeam) return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
        const remaining = Math.max(0, data.timeRemaining - elapsed);
        if (remaining > 0) {
          console.log(`📊 Restored timer: ${remaining} seconds remaining`);
          return remaining;
        }
      } catch (e) {
        console.error("Failed to load timer state:", e);
      }
    }
    return null;
  }, [selectedTeam, STORAGE_KEY]);

  // ─── Load timer state from localStorage ──────────────────────
  useEffect(() => {
    if (selectedTeam) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
          const remaining = Math.max(0, data.timeRemaining - elapsed);
          if (remaining > 0) {
            setTimerActive(true);
          }
        } catch (e) {
          console.error("Failed to load timer state:", e);
        }
      }
    }
  }, [selectedTeam, STORAGE_KEY]);

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
      handleAutoSave();
      setShowExpiredModal(true);
      localStorage.removeItem(STORAGE_KEY);
    },
    onWarning: (message) => {
      setWarningMessage(message);
      showToast(message, "warning");
      setTimeout(() => setWarningMessage(null), 5000);
    },
    onTick: (remaining) => {
      // Save timer state to localStorage on every tick
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          timeRemaining: remaining,
          timestamp: Date.now(),
        }),
      );
    },
  });

  // ─── Auto-save handler ───────────────────────────────────────
  const handleAutoSave = useCallback(async () => {
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
        teamId: selectedTeam?.id || selectedTeam?._id,
        teamName: selectedTeam?.name || "Unknown Team",
        isAutoSave: true,
        status: "in_progress",
      };

      const response = await forumReportService.autoSave(reportData);
      setLastAutoSaveTime(new Date());
      setSavedProgressId(response.meeting?._id || response._id);
      return response;
    } catch (error) {
      console.error("Auto-save failed:", error);
      showToast(tf("autoSaveError") || "Auto-save failed", "error");
      throw error;
    }
  }, [form, selectedTeam, tf, showToast]);

  // ─── Extension request handler ──────────────────────────────
  const handleRequestExtension = async (reason) => {
    if (!reason?.trim()) {
      showToast(tf("reasonRequired") || "Please provide a reason", "warning");
      return;
    }

    try {
      await forumReportService.requestExtension(savedProgressId, reason);
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

  // ─── Resume report handler (admin only) ─────────────────────
  const handleResumeReport = async () => {
    if (!isAdmin) return;
    try {
      await forumReportService.resumeReport(savedProgressId);
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
  useEffect(() => {
    if (!selectedTeam) {
      const loadTeams = async () => {
        try {
          setLoadingTeams(true);
          const response = await teamAPI.getAll();
          if (response.data && Array.isArray(response.data)) {
            const formattedTeams = response.data.map((team) => ({
              id: team._id,
              name: team.name,
              description: team.department || "",
              leader: team.leader?.name || tf("notAssigned", "Not assigned"),
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
  }, [selectedTeam, tf]);

  // ─── Calculate form progress ───────────────────────────────
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

  const addItem = (field, defaultValue = "") => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], defaultValue] }));
  };

  const removeItem = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addAbsent = () => {
    setForm((prev) => ({
      ...prev,
      absent: [...prev.absent, { name: "", reason: "" }],
    }));
  };

  const removeAbsent = (index) => {
    setForm((prev) => ({
      ...prev,
      absent: prev.absent.filter((_, i) => i !== index),
    }));
  };

  const updateAbsent = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.absent];
      updated[index][field] = value;
      return { ...prev, absent: updated };
    });
  };

  // ─── Enhanced AI Apply Handler ─────────────────────────────
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

  // ─── Handle AI Summary Generation ──────────────────────────
  const handleGenerateSummary = async () => {
    try {
      const context = {
        title: `${tf("title", "Peer Forum Report")} - ${selectedTeam?.name || ""}`,
        date: form.date,
        attendees: form.present.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((t) => t.trim()),
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

  // ─── Handle Full Report Generation ──────────────────────────
  const handleGenerateFullReport = async () => {
    try {
      const context = {
        title: `${tf("title", "Peer Forum Report")} - ${selectedTeam?.name || ""}`,
        date: form.date,
        attendees: form.present.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((t) => t.trim()),
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

      let content = response.data?.minutes || response.data?.insight || "";
      const formattedContent = formatAIResponse(content);

      const fullReport = `
📋 PEER FORUM MEETING REPORT
${"=".repeat(50)}

📅 Date: ${form.date}
👥 Attendees: ${context.attendees.join(", ") || "Not specified"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 TOPICS DISCUSSED:
${context.topics.map((t, i) => `${i + 1}. ${t}`).join("\n") || "No topics listed"}

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

  // ─── Handle Export ──────────────────────────────────────────
  const handleExport = () => {
    try {
      exportForumReportToPDF(form, t, lang, selectedTeam?.name);
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
        teamId: selectedTeam?.id || selectedTeam?._id,
        teamName: selectedTeam?.name || "Unknown Team",
        aiGeneratedContent: aiGeneratedContent,
      };

      await meetingAPI.create(reportData);

      if (onReportSaved) {
        onReportSaved(selectedTeam.id, form);
      }
      setSubmitted(true);
      showToast(tf("saveSuccess", "✅ Report saved successfully!"), "success");
    } catch (error) {
      console.error("Failed to save report:", error);
      showToast(
        error.response?.data?.message ||
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

  // ─── Submitted State ──────────────────────────────────────
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
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
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
              style={{
                ...btn.primary,
                padding: "12px 28px",
                gap: "8px",
              }}
              onClick={() => setSubmitted(false)}
            >
              <FiPlus size={18} />
              {tf("newReport", "New Report")}
            </button>
            <button
              style={{
                ...btn.secondary,
                padding: "12px 24px",
                gap: "8px",
              }}
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
                  attendees: form.present.filter((p) => p.trim() !== ""),
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

  // ─── No Team Selected ──────────────────────────────────────
  if (!selectedTeam) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <TeamSelector
          teams={teams}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          lang={lang || "en"}
          loading={loadingTeams}
        />
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
      {/* Header */}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
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

      {/* ─── Timer Display ─────────────────────────────────────── */}
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
        />
      </div>

      {/* ─── Locked/Extension Status Badge ─────────────────────── */}
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
          ) : extensionRequested ? (
            <>
              <FiClock size={18} color="#D97706" />
              <span style={{ fontSize: "13px", color: "#92400E" }}>
                {tf("extensionPending") ||
                  "⏳ Extension request pending admin approval."}
              </span>
            </>
          ) : null}
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
          {formProgress < 30 && "🚀 Start filling in the report details below"}
          {formProgress >= 30 &&
            formProgress < 70 &&
            "💪 You're making good progress! Keep going."}
          {formProgress >= 70 &&
            "🎯 Almost there! Review and save your report."}
        </span>
      </AIInsightBadge>

      <StandingAgendasPanel t={safeT} />

      {/* ✅ TABS */}
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
          style={{
            flex: 1,
            padding: isMobile ? "8px 14px" : "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: activeForumTab === "form" ? "#fff" : "transparent",
            color: activeForumTab === "form" ? "#0F172A" : "#64748B",
            fontWeight: 600,
            fontSize: isMobile ? "12px" : "14px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow:
              activeForumTab === "form" ? `0 2px 8px rgba(0,0,0,0.08)` : "none",
          }}
          onMouseEnter={(e) => {
            if (activeForumTab !== "form") {
              e.currentTarget.style.color = "#0F172A";
            }
          }}
          onMouseLeave={(e) => {
            if (activeForumTab !== "form") {
              e.currentTarget.style.color = "#64748B";
            }
          }}
        >
          <FiEdit3 size={isMobile ? 14 : 16} />
          {tf("newReport", "New Report")}
        </button>
        <button
          onClick={() => setActiveForumTab("feed")}
          style={{
            flex: 1,
            padding: isMobile ? "8px 14px" : "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: activeForumTab === "feed" ? "#fff" : "transparent",
            color: activeForumTab === "feed" ? "#0F172A" : "#64748B",
            fontWeight: 600,
            fontSize: isMobile ? "12px" : "14px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow:
              activeForumTab === "feed" ? `0 2px 8px rgba(0,0,0,0.08)` : "none",
          }}
          onMouseEnter={(e) => {
            if (activeForumTab !== "feed") {
              e.currentTarget.style.color = "#0F172A";
            }
          }}
          onMouseLeave={(e) => {
            if (activeForumTab !== "feed") {
              e.currentTarget.style.color = "#64748B";
            }
          }}
        >
          <FiMessageSquare size={isMobile ? 14 : 16} />
          {tf("feed", "Feed")}
        </button>
      </div>

      {/* ─── MAIN FORM ────────────────────────────────────────────── */}
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
          {/* Auto-Save Indicator */}
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

          {/* Meeting Time */}
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
                  // Auto-calculate end time when start time is set
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

                    // Start the timer when start time is set
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

          {/* Present Members */}
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
          />

          {/* Absent Members */}
          <Section
            title={tf("absentMembers", "Absent Members & Reasons")}
            icon={<FiUserX size={18} />}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {form.absent.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "14px 16px",
                    background: C.cardBg,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: radius.lg,
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.background = "#f0f3ff";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.background = C.cardBg;
                    e.currentTarget.style.transform = "translateX(0)";
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
                    <Field
                      label={tf("reason", "Reason")}
                      value={item.reason}
                      onChange={(v) => updateAbsent(idx, "reason", v)}
                      placeholder={tf(
                        "reasonPlaceholder",
                        "Reason for absence",
                      )}
                    />
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
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
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
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.background = `${C.primary}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FiPlus size={14} />
              {tf("addAbsent", "Add Absent Member")}
            </button>
          </Section>

          {/* Previous Results */}
          <DynamicFieldGroup
            title={tf("prevResults", "Results from Previous Meeting")}
            icon={<FiFileText size={18} />}
            values={form.prevResults}
            onAdd={() => addItem("prevResults", "")}
            onRemove={(idx) => removeItem("prevResults", idx)}
            onUpdate={(idx, val) => {
              const updated = [...form.prevResults];
              updated[idx] = val;
              setForm((prev) => ({ ...prev, prevResults: updated }));
            }}
            labelPrefix={tf("resultLabel", "Result")}
            placeholderPrefix={tf("prevResultPlaceholder", "Previous result")}
            helperText={tf(
              "prevResultHelper",
              "List outcomes and action items from the previous meeting",
            )}
            variant="warning"
          />

          {/* Today's Topics */}
          <DynamicFieldGroup
            title={tf("todayTopics", "Today's Discussion Topics")}
            icon={<FiMessageSquare size={18} />}
            values={form.topics}
            onAdd={() => addItem("topics", "")}
            onRemove={(idx) => removeItem("topics", idx)}
            onUpdate={(idx, val) => {
              const updated = [...form.topics];
              updated[idx] = val;
              setForm((prev) => ({ ...prev, topics: updated }));
            }}
            labelPrefix={tf("topic", "Topic")}
            placeholderPrefix={tf("topicPlaceholder", "Discussion topic")}
            helperText={tf(
              "topicHelper",
              "Enter each discussion topic separately",
            )}
            variant="primary"
          />

          {/* Explanation - Enhanced with AI Actions */}
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
              onChange={(e) => upd("explanation", e.target.value)}
              onFocus={() => setFocusedField("explanation")}
              onBlur={() => setFocusedField(null)}
              placeholder={tf("explanationPlaceholder", "Write explanation...")}
            />

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
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#DBEAFE";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#EFF6FF";
                    e.currentTarget.style.transform = "scale(1)";
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
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#DCFCE7";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F0FDF4";
                    e.currentTarget.style.transform = "scale(1)";
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
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FDE68A";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FEF3C7";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiBookOpen size={13} />
                  {tf("fullReport", "Full Report")}
                </button>

                {/* ✅ EXPORT BUTTON - Text on Desktop, Icon on Mobile */}
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
                    transition: "all 0.3s ease",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#EDE9FE";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F3E8FF";
                    e.currentTarget.style.transform = "scale(1)";
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
            onUpdate={(idx, val) => {
              const updated = [...form.gaps];
              updated[idx] = val;
              setForm((prev) => ({ ...prev, gaps: updated }));
            }}
            labelPrefix={tf("gapLabel", "Gap")}
            placeholderPrefix={tf("gapPlaceholder", "Identified gap")}
            helperText={tf(
              "gapHelper",
              "Identify gaps or challenges discussed in the forum",
            )}
            variant="danger"
          />

          {/* Agreements */}
          <DynamicFieldGroup
            title={tf("agreements", "Agreed Points")}
            icon={<FiCheckCircle size={18} />}
            values={form.agreements}
            onAdd={() => addItem("agreements", "")}
            onRemove={(idx) => removeItem("agreements", idx)}
            onUpdate={(idx, val) => {
              const updated = [...form.agreements];
              updated[idx] = val;
              setForm((prev) => ({ ...prev, agreements: updated }));
            }}
            labelPrefix={tf("agreementLabel", "Agreement")}
            placeholderPrefix={tf("agreementPlaceholder", "Agreed point")}
            helperText={tf(
              "agreementHelper",
              "Document all points of agreement reached",
            )}
            variant="success"
          />

          {/* Signatures - With Modal */}
          <Section
            title={tf("signatures", "Signatures")}
            icon={<FiPenTool size={18} />}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    if (!isReportLocked) {
                      setSignatureModal({
                        isOpen: true,
                        index: idx,
                        value: sig,
                      });
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isReportLocked) {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.background = `${C.primary}05`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = shadows.sm;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = sig
                      ? C.primary
                      : C.border;
                    e.currentTarget.style.background = C.cardBg;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
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
                          transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fecaca";
                          e.currentTarget.style.transform =
                            "scale(1.1) rotate(90deg)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                          e.currentTarget.style.transform =
                            "scale(1) rotate(0)";
                        }}
                      >
                        <FiX size={12} />
                      </button>
                    )}
                  </div>

                  {/* Signature preview */}
                  {sig ? (
                    <div
                      style={{
                        width: "100%",
                        height: "50px",
                        background: "#fff",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={sig}
                        alt={`Signature ${idx + 1}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
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
                      {isReportLocked ? "🔒 Locked" : "Click to sign"}
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
                cursor: isReportLocked ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isReportLocked) {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.background = `${C.primary}08`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FiPlus size={14} />
              {tf("addSignature", "Add Signature")}
            </button>
          </Section>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "clamp(10px, 2vw, 16px)",
              justifyContent: "center",
              marginTop: "clamp(24px, 4vw, 36px)",
              paddingTop: "clamp(16px, 3vw, 24px)",
              borderTop: `2px solid ${C.border}`,
            }}
          >
            {/* ✅ EXPORT BUTTON - Text on Desktop, Icon on Mobile */}
            <button
              style={{
                ...btn.danger,
                flex: isMobile ? "1" : "0.5",
                justifyContent: "center",
                padding: isMobile
                  ? "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 20px)"
                  : "clamp(10px, 2vw, 14px) clamp(20px, 4vw, 36px)",
                fontSize: isMobile ? "13px" : FONT_SIZES.body,
                minWidth: 0,
                gap: "6px",
                borderRadius: radius.lg,
                transition: "all 0.3s ease",
              }}
              onClick={handleExport}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 25px rgba(220,38,38,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              title={tc("export", "Export PDF")}
            >
              <FiDownload size={isMobile ? 20 : 18} />
              {!isMobile && <span>{tc("export", "Export PDF")}</span>}
              {isMobile && <span style={{ fontSize: "10px" }}>PDF</span>}
            </button>

            <button
              style={{
                ...btn.primary,
                flex: isMobile ? "1" : "1",
                justifyContent: "center",
                padding: "clamp(10px, 2vw, 14px) clamp(16px, 4vw, 32px)",
                fontSize: FONT_SIZES.body,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? "not-allowed" : "pointer",
                borderRadius: radius.lg,
                gap: "8px",
                transition: "all 0.3s ease",
              }}
              onClick={handleSaveReport}
              disabled={saving}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = `0 8px 25px ${C.primary}44`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
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
                  {tf("save", "Save Report")}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ─── FORUM FEED TAB ────────────────────────────────────────── */
        <ForumReportFeed t={t} isMobile={isMobile} teamId={selectedTeam?.id} />
      )}

      {/* ─── Time Expired Modal ──────────────────────────────────── */}
      <TimeExpiredModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        onRequestExtension={handleRequestExtension}
        onViewProgress={() => {
          // Admin view progress functionality
          setShowExpiredModal(false);
        }}
        isAdmin={isAdmin}
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
      {/* ─── Signature Modal ──────────────────────────────────────── */}
      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={() =>
          setSignatureModal({ isOpen: false, index: null, value: null })
        }
        onConfirm={(dataUrl) => {
          const updated = [...form.signatures];
          updated[signatureModal.index] = dataUrl;
          setForm((prev) => ({ ...prev, signatures: updated }));
          setSignatureModal({ isOpen: false, index: null, value: null });
        }}
        initialSignature={signatureModal.value}
        title={tf("signatureModalTitle", "Sign Your Report")}
        subtitle={`${tf("signatureN", "Signature")} ${(signatureModal.index || 0) + 1}`}
        userName={user?.name || ""}
        teamName={selectedTeam?.name || ""}
        t={tf}
      />
    </div>
  );
}
