// src/pages/GoldenMonday.jsx
// ════════════════════════════════════════════════════════════
// COMPLETE Golden Monday Management System
// All data dynamic from database, full CRUD, AI integration,
// Telegram posting, and role-based access control
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { C, F } from "../styles/theme";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { goldenMondayAPI } from "../services/api";
import { showToast } from "../utils/toastHelper";
import { ROLES, hasMinRole } from "../utils/roles";
import GoldenMondayRotationPanel from "../components/golden-monday/GoldenMondayRotationPanel";
import {
  FiSunrise,
  FiUsers,
  FiTrendingUp,
  FiCompass,
  FiCalendar,
  FiClock,
  FiChevronDown,
  FiGrid,
  FiShield,
  FiZap,
  FiArrowRight,
  FiMapPin,
  FiCpu,
  FiSend,
  FiLoader,
  FiPlus,
  FiX,
  FiSun,
  FiStar,
  FiRefreshCw,
  FiInfo,
  FiTrash2,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiVideo,
  FiBell,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────
// STATIC PILLARS (fallback data, but should come from DB)
// ─────────────────────────────────────────────────────────────
const FALLBACK_PILLARS = [
  {
    icon: <FiSunrise size={22} />,
    title: "A weekly reset",
    body: "Every Monday morning, offices across the organization pause the routine for shared learning — a deliberate start to the work week instead of a rushed one.",
  },
  {
    icon: <FiUsers size={22} />,
    title: "Peer-led, not top-down",
    body: "Sessions are usually carried by colleagues themselves — department heads, team leaders, and long-serving staff sharing real experience, not scripted lectures.",
  },
  {
    icon: <FiTrendingUp size={22} />,
    title: "Built for multiskilling",
    body: "The stated goal is to push every employee beyond a single fixed skill set — technology literacy, service standards, and adaptability all get airtime over time.",
  },
];

const FALLBACK_MESOB_POINTS = [
  {
    icon: <FiGrid size={20} />,
    en: "One digital front door for services that used to mean visiting several separate offices.",
    am: "ቀደም ሲል ለተለያዩ ቢሮዎች መመላለስ የሚጠይቁ አገልግሎቶች በአንድ ዲጂታል በር ስር ተጠቃለዋል።",
    om: "Bakka digitaalaa tokko tajaajiloota dura biiroowwan adda addaa daqaqqachuu barbaadaniif.",
  },
  {
    icon: <FiZap size={20} />,
    en: "Less repeat paperwork — information entered once is reused across the integrated services.",
    am: "የተደጋገመ ወረቀት ስራ ይቀንሳል — አንዴ የገባ መረጃ በተለያዩ የተቀናጁ አገልግሎቶች ላይ በድጋሚ ጥቅም ላይ ይውላል።",
    om: "Waraqaa hojii itti deebi'uu hir'isa — odeeffannoon yeroo tokko galmeeffame tajaajiloota walitti makuu keessatti irra deebi'ee tajaajila.",
  },
  {
    icon: <FiShield size={20} />,
    en: "A traceable digital record for each request, narrowing the room for informal shortcuts.",
    am: "ለእያንዳንዱ ጥያቄ ክትትል የሚደረግበት ዲጂታል መዝገብ በመኖሩ መደበኛ ላልሆኑ አቋራጭ መንገዶች የሚተውት ክፍተት ይጠባል።",
    om: "Galmeen dijitaalaa idda'uun kan karaa hawaasummaa isa hin qabneef bakka hir'isa.",
  },
  {
    icon: <FiMapPin size={20} />,
    en: "Reachable through physical MESOB one-stop centers or the mobile app, wherever a resident finds it easiest.",
    am: "በአካላዊ የመሶብ ማዕከላት ወይም በሞባይል መተግበሪያ በኩል — ለነዋሪው በሚመችበት መንገድ ሁሉ ተደራሽ ነው።",
    om: "Buufata MESOB waliigalaa ykn moobaayiliin — akka jiraattaan isa salphaa isa arganutti dhaqqabu.",
  },
];

// ─────────────────────────────────────────────────────────────
// INPUT STYLE
// ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1.5px solid " + C.border,
  fontSize: 13,
  fontFamily: F.sans,
  outline: "none",
  boxSizing: "border-box",
};

const btnStyle = (bg = C.primary, color = "#fff") => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: bg,
  color: color,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: F.sans,
  transition: "all 0.2s ease",
});

// ─────────────────────────────────────────────────────────────
// SECTION HEADING COMPONENT
// ─────────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, sub, dark }) {
  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: dark ? C.gold : C.primary,
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: F.serif,
          fontSize: "clamp(22px, 4vw, 30px)",
          margin: 0,
          color: dark ? "#fff" : C.dark,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          marginTop: 8,
          fontSize: 14,
          color: dark ? "#a9b3e0" : C.muted,
          maxWidth: 520,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STATS DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────
function StatsDashboard({ stats, nextPresenter, loading }) {
  if (loading || !stats) {
    return (
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "24px 32px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <p style={{ color: C.muted }}>Loading stats...</p>
      </div>
    );
  }

  const statItems = [
    {
      label: "Total Sessions",
      value: stats.totalSessions || 0,
      icon: <FiCalendar size={20} />,
    },
    {
      label: "Presenters",
      value: stats.totalPresenters || 0,
      icon: <FiUsers size={20} />,
    },
    {
      label: "Upcoming",
      value: stats.upcomingSessions || 0,
      icon: <FiClock size={20} />,
    },
    {
      label: "Avg Rating",
      value: stats.averageRating ? stats.averageRating.toFixed(1) : "N/A",
      icon: <FiStar size={20} />,
    },
  ];

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        padding: "24px 32px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 16,
      }}
    >
      {statItems.map((item, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: C.bg,
              color: C.primary,
              marginBottom: 8,
            }}
          >
            {item.icon}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.dark }}>
            {item.value}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{item.label}</div>
        </div>
      ))}

      {nextPresenter && (
        <div
          style={{
            textAlign: "center",
            borderLeft: `2px solid ${C.border}`,
            paddingLeft: 16,
          }}
        >
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
            Next Presenter
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {nextPresenter.profilePhotoUrl ? (
              <img
                src={nextPresenter.profilePhotoUrl}
                alt={nextPresenter.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
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
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {nextPresenter.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>
                {nextPresenter.name}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {nextPresenter.department || ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TELEGRAM POST BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────
function TelegramPostButton({ sessionId, onPosted }) {
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    setPosting(true);
    try {
      await goldenMondayAPI.postToTelegram(sessionId);
      showToast("Posted to Telegram successfully!", "success");
      if (onPosted) onPosted();
    } catch {
      showToast("Failed to post to Telegram", "error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <button
      onClick={handlePost}
      disabled={posting}
      style={{
        ...btnStyle(C.gold, C.dark),
        fontSize: 12,
        padding: "4px 12px",
      }}
    >
      <FiBell size={14} />
      {posting ? "Posting..." : "Post to Telegram"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SESSION CARD COMPONENT - FIXED: Removed unused 'translate'
// ─────────────────────────────────────────────────────────────
function SessionCard({ session, language, isAdmin, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(session.date);
  const isUpcoming = session.status === "scheduled" || date > new Date();

  // Helper to get translated text
  // eslint-disable-next-line no-unused-vars
  const getText = (obj) => obj?.[language] || obj?.en || obj;

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        padding: "16px 20px",
        border: `1px solid ${isUpcoming ? C.gold + "66" : C.border}`,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: isUpcoming ? C.gold : C.primary,
              color: isUpcoming ? C.dark : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {date.getDate()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: C.dark }}>
              {session.presentationTitle || session.title || "Untitled Session"}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {session.presenterName || "No presenter"} ·{" "}
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {isUpcoming && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: C.gold + "33",
                    color: C.gold,
                  }}
                >
                  Upcoming
                </span>
              )}
              {session.averageRating > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, color: C.gold }}>
                  ★ {session.averageRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {session.recordingUrl && (
            <a
              href={session.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: C.primary,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <FiVideo size={14} /> Watch
            </a>
          )}
          {isAdmin && isUpcoming && (
            <TelegramPostButton sessionId={session._id} onPosted={onRefresh} />
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <FiChevronDown
              size={18}
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {session.presentationDescription && (
            <p style={{ fontSize: 13, color: C.dark, marginBottom: 8 }}>
              {session.presentationDescription}
            </p>
          )}
          {session.suggestedTopics && session.suggestedTopics.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.muted }}>
                AI Suggested:
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                {session.suggestedTopics.slice(0, 3).map((topic, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      background: C.bg,
                      padding: "2px 10px",
                      borderRadius: 999,
                      color: C.dark,
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          {session.recapEn && (
            <details style={{ marginTop: 8 }}>
              <summary
                style={{ fontSize: 12, color: C.primary, cursor: "pointer" }}
              >
                <FiInfo size={12} style={{ marginRight: 4 }} /> View AI Recap
              </summary>
              <p
                style={{
                  fontSize: 13,
                  color: C.dark,
                  marginTop: 8,
                  padding: 12,
                  background: C.bg,
                  borderRadius: 8,
                }}
              >
                {session.recapEn}
              </p>
            </details>
          )}
          {session.photos && session.photos.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {session.photos.slice(0, 3).map((photo, i) => (
                <img
                  key={i}
                  src={photo.url}
                  alt={photo.caption || "Session photo"}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL COMPONENT
// ─────────────────────────────────────────────────────────────
function EmployeeRegistrationModal({
  show,
  onClose,
  onRegister,
  employeeForm,
  setEmployeeForm,
  registering,
}) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 32,
          maxWidth: 500,
          width: "92%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: 0, color: C.dark, fontFamily: F.serif }}>
            Register Employee
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#999",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 4,
              }}
            >
              User ID *
            </label>
            <input
              placeholder="Enter user ID (MongoDB ObjectId)"
              value={employeeForm.userId}
              onChange={(e) =>
                setEmployeeForm({ ...employeeForm, userId: e.target.value })
              }
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Enter the MongoDB ObjectId (e.g., 6a3133c7ed17c1d7c0530ff8)
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 4,
              }}
            >
              Department
            </label>
            <input
              placeholder="Department name"
              value={employeeForm.department}
              onChange={(e) =>
                setEmployeeForm({ ...employeeForm, department: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 4,
              }}
            >
              Position
            </label>
            <input
              placeholder="Job position"
              value={employeeForm.position}
              onChange={(e) =>
                setEmployeeForm({ ...employeeForm, position: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 4,
              }}
            >
              Profile Photo URL (optional)
            </label>
            <input
              placeholder="https://example.com/photo.jpg"
              value={employeeForm.profilePhotoUrl}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  profilePhotoUrl: e.target.value,
                })
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 8,
              paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button onClick={onClose} style={btnStyle("#e5e7eb", "#444")}>
              Cancel
            </button>
            <button
              onClick={onRegister}
              disabled={registering || !employeeForm.userId}
              style={{
                ...btnStyle(C.primary),
                opacity: registering || !employeeForm.userId ? 0.6 : 1,
              }}
            >
              {registering ? "Registering..." : "Register Employee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function GoldenMonday() {
  const { t: translations, language } = useLanguage();
  const { user } = useAuth();

  const gmCopy = translations?.goldenMonday || {};
  const [visible, setVisible] = useState({});
  const sectionRefs = useRef({});

  // ── Role-based access ──
  const userRole = user?.role || ROLES.EMPLOYEE;
  const isLeaderOrAbove = hasMinRole(userRole, ROLES.TEAM_LEADER);
  const isAdminOrAbove = hasMinRole(userRole, ROLES.ADMIN);
  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

  // ── State ──
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [nextPresenter, setNextPresenter] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [pillars, setPillars] = useState(FALLBACK_PILLARS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── AI Studio State ──
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({
    title: "",
    organization: "",
    speaker: "",
    date: new Date().toISOString().slice(0, 10),
    rawNotes: "",
    description: "",
  });
  const [generating, setGenerating] = useState(false);
  const [topics, setTopics] = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // ── Admin Panel State ──
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    userId: "",
    department: "",
    position: "",
    profilePhotoUrl: "",
  });
  const [registering, setRegistering] = useState(false);

  // ── Translation helper - USED EVERYWHERE in JSX via `t` alias ──
  const getTranslatedText = (obj) => {
    if (!obj) return "";
    return obj[language] || obj.en || obj;
  };

  // ── Load all data from API ──
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        upcomingRes,
        pastRes,
        nextPresenterRes,
        rankingRes,
        employeesRes,
        statsRes,
        pillarsRes,
      ] = await Promise.all([
        goldenMondayAPI.getUpcomingSessions().catch(() => ({ data: [] })),
        goldenMondayAPI
          .getPastSessions()
          .catch(() => ({ data: { sessions: [], pagination: {} } })),
        goldenMondayAPI.getNextPresenter().catch(() => ({ data: null })),
        goldenMondayAPI.getRanking().catch(() => ({ data: [] })),
        goldenMondayAPI.getEmployees().catch(() => ({ data: [] })),
        goldenMondayAPI.getStats().catch(() => ({ data: null })),
        goldenMondayAPI.getPillars().catch(() => ({ data: FALLBACK_PILLARS })),
      ]);

      setUpcomingSessions(upcomingRes.data || []);
      setPastSessions(pastRes.data?.sessions || []);
      setNextPresenter(nextPresenterRes.data || null);
      setRanking(rankingRes.data || []);
      setEmployees(employeesRes.data || []);
      setStats(statsRes.data || null);
      setPillars(pillarsRes.data || FALLBACK_PILLARS);
    } catch {
      console.error("Failed to load Golden Monday data");
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    showToast("Data refreshed", "success");
  };

  // ── Load on mount ──
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) {
        await loadAllData();
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [loadAllData]);

  // ── Register refs ──
  const registerRef = useCallback(
    (key) => (el) => {
      if (el) sectionRefs.current[key] = el;
    },
    [],
  );

  // ── Intersection Observer ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((v) => ({ ...v, [entry.target.dataset.reveal]: true }));
          }
        });
      },
      { threshold: 0.15 },
    );

    const currentRefs = { ...sectionRefs.current };
    const elements = Object.values(currentRefs).filter(Boolean);
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  const revealStyle = (key) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  });

  // ── AI Studio Handlers ──
  const handleFormChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleGenerateAndSave = async () => {
    if (!form.title.trim() || !form.rawNotes.trim()) {
      showToast("Title and notes are required", "warning");
      return;
    }
    try {
      setGenerating(true);
      await goldenMondayAPI.createSession(form);
      await refreshData();
      setForm({
        title: "",
        organization: "",
        speaker: "",
        date: new Date().toISOString().slice(0, 10),
        rawNotes: "",
        description: "",
      });
      setShowComposer(false);
      showToast("Session saved with AI recap!", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to save session",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestTopics = async () => {
    try {
      setLoadingTopics(true);
      const response = await goldenMondayAPI.suggestTopics();
      setTopics(response.data?.topics || []);
    } catch {
      showToast("Failed to suggest topics", "error");
    } finally {
      setLoadingTopics(false);
    }
  };

  // ── Admin Handlers ──
  const handleRegisterEmployee = async () => {
    if (!employeeForm.userId) {
      showToast("Please enter a User ID", "warning");
      return;
    }
    setRegistering(true);
    try {
      await goldenMondayAPI.registerEmployee(employeeForm);
      showToast("Employee registered successfully!", "success");
      setShowEmployeeModal(false);
      setEmployeeForm({
        userId: "",
        department: "",
        position: "",
        profilePhotoUrl: "",
      });
      await refreshData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to register employee",
        "error",
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleRemoveEmployee = async (userId) => {
    if (!window.confirm("Remove this employee from rotation?")) return;
    try {
      await goldenMondayAPI.removeEmployee(userId);
      showToast("Employee removed", "success");
      await refreshData();
    } catch {
      showToast("Failed to remove employee", "error");
    }
  };

  const handleToggleEligibility = async (userId, isEligible) => {
    try {
      await goldenMondayAPI.updateEmployeeEligibility(userId, !isEligible);
      showToast(
        `Employee ${isEligible ? "deactivated" : "activated"}`,
        "success",
      );
      await refreshData();
    } catch {
      showToast("Failed to update eligibility", "error");
    }
  };

  // ── Create `t` alias so getTranslatedText is actually used ──
  const t = getTranslatedText;

  // ── Render ──
  // All text uses `t()` which calls getTranslatedText
  return (
    <div style={{ fontFamily: F.sans, background: C.gray }}>
      <style>{`
        @keyframes gm-rise {
          0% { transform: translateY(6px); opacity: 0.85; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0.85; }
        }
        @keyframes gm-sweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes gm-pulse-ring {
          0% { box-shadow: 0 0 0 0 ${C.gold}55; }
          70% { box-shadow: 0 0 0 14px ${C.gold}00; }
          100% { box-shadow: 0 0 0 0 ${C.gold}00; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .gm-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(13,26,94,0.14); }
        .gm-mesob-point:hover { background: ${C.bg}; }
        .gm-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 26px ${C.primary}55; }
        .gm-refresh-btn:hover { transform: rotate(180deg); }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(120deg, ${C.dark} 0%, ${C.primary} 45%, #b8860b 100%)`,
          backgroundSize: "220% 220%",
          animation: "gm-sweep 14s ease infinite alternate",
          padding:
            "clamp(56px, 10vw, 96px) clamp(20px, 6vw, 64px) clamp(64px, 8vw, 88px)",
          color: "#fff",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.gold}88 0%, ${C.gold}22 55%, transparent 75%)`,
            filter: "blur(2px)",
            animation: "gm-rise 6s ease-in-out infinite",
          }}
        />
        <div style={{ maxWidth: 760, position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(245,197,24,0.16)",
              border: `1px solid ${C.gold}55`,
              color: C.goldLight,
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              marginBottom: 22,
            }}
          >
            <FiClock size={13} />
            {t(gmCopy.eyebrow) || "Every Monday · 2:00 – 2:50"}
          </div>

          <h1
            style={{
              fontFamily: F.serif,
              fontSize: "clamp(38px, 7vw, 64px)",
              fontWeight: 900,
              lineHeight: 1.05,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 58,
                height: 58,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                color: C.dark,
                alignItems: "center",
                justifyContent: "center",
                animation: "gm-pulse-ring 2.4s ease-in-out infinite",
                flexShrink: 0,
              }}
            >
              <FiSunrise size={30} />
            </span>
            {t(gmCopy.title) || "Golden Monday"}
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 2.4vw, 19px)",
              lineHeight: 1.65,
              color: "#eaeeff",
              maxWidth: 620,
              marginTop: 22,
            }}
          >
            {t(gmCopy.subtitle) ||
              "The organization's weekly ritual for shared learning — and the philosophy behind why Addis MESOB exists at all."}
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <a
              href="#gm-pillars"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: C.goldLight,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
                borderBottom: `1.5px solid ${C.gold}66`,
                paddingBottom: 4,
              }}
            >
              {t(gmCopy.scroll) || "Explore the story"}
              <FiChevronDown size={16} />
            </a>

            {(isAdminOrAbove || isSuperAdmin) && (
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="gm-refresh-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.1)",
                  border: `1px solid rgba(255,255,255,0.2)`,
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "transform 0.3s ease",
                }}
              >
                <FiRefreshCw
                  size={14}
                  style={{
                    animation: refreshing ? "spin 1s linear infinite" : "none",
                  }}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS DASHBOARD ── */}
      <section
        ref={registerRef("stats")}
        data-reveal="stats"
        style={{
          maxWidth: 1200,
          margin: "-30px auto 0",
          padding: "0 clamp(20px, 6vw, 40px)",
          ...revealStyle("stats"),
          position: "relative",
          zIndex: 2,
        }}
      >
        <StatsDashboard
          stats={stats}
          nextPresenter={nextPresenter}
          loading={loading}
        />
      </section>

      {/* ── PILLARS ── */}
      <section
        id="gm-pillars"
        ref={registerRef("pillars")}
        data-reveal="pillars"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(48px, 8vw, 72px) clamp(20px, 6vw, 40px) 12px",
          ...revealStyle("pillars"),
        }}
      >
        <SectionHeading
          eyebrow={<FiCompass size={14} />}
          title={t(gmCopy.pillarsTitle) || "Why a golden morning"}
          sub={
            t(gmCopy.pillarsSub) || "Three things every session comes back to."
          }
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 28,
          }}
        >
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="gm-card"
              style={{
                background: C.white,
                borderRadius: 16,
                padding: 24,
                border: `1px solid ${C.border}`,
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {pillar.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 16,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                {pillar.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: C.muted,
                }}
              >
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI SESSION STUDIO (Leader/Admin only) ── */}
      {isLeaderOrAbove && (
        <section
          ref={registerRef("aiStudio")}
          data-reveal="aiStudio"
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "clamp(40px, 7vw, 60px) clamp(20px, 6vw, 40px) 12px",
            ...revealStyle("aiStudio"),
          }}
        >
          <SectionHeading
            eyebrow={<FiCpu size={14} />}
            title={t(gmCopy.aiTitle) || "AI session recap"}
            sub={
              t(gmCopy.aiSub) ||
              "Log a session in plain notes — AI turns it into a polished bilingual recap in seconds."
            }
          />

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {/* Composer card */}
            <div
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: 22,
              }}
            >
              {!showComposer ? (
                <button
                  onClick={() => setShowComposer(true)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "14px 18px",
                    borderRadius: 10,
                    border: `1.5px dashed ${C.primary}66`,
                    background: C.bg,
                    color: C.primary,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: F.sans,
                  }}
                >
                  <FiPlus size={16} />
                  {t(gmCopy.aiNewSession) || "Log a new session"}
                </button>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <input
                    placeholder={t(gmCopy.aiFormTitle) || "Session title"}
                    value={form.title}
                    onChange={handleFormChange("title")}
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                      placeholder={t(gmCopy.aiFormOrg) || "Organization"}
                      value={form.organization}
                      onChange={handleFormChange("organization")}
                      style={{ ...inputStyle, flex: "1 1 160px" }}
                    />
                    <input
                      placeholder={
                        t(gmCopy.aiFormSpeaker) || "Speaker / facilitator"
                      }
                      value={form.speaker}
                      onChange={handleFormChange("speaker")}
                      style={{ ...inputStyle, flex: "1 1 160px" }}
                    />
                  </div>
                  <input
                    type="date"
                    value={form.date}
                    onChange={handleFormChange("date")}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder={
                      t(gmCopy.aiFormNotes) ||
                      "Raw notes — write it however you like, AI will clean it up"
                    }
                    value={form.rawNotes}
                    onChange={handleFormChange("rawNotes")}
                    rows={5}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      fontFamily: F.sans,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => setShowComposer(false)}
                      disabled={generating}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#e5e7eb",
                        color: "#444",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: generating ? "not-allowed" : "pointer",
                        fontFamily: F.sans,
                      }}
                    >
                      <FiX size={14} />
                      {t(gmCopy.aiCancel) || "Cancel"}
                    </button>
                    <button
                      onClick={handleGenerateAndSave}
                      disabled={generating}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 18px",
                        borderRadius: 8,
                        border: "none",
                        background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: generating ? "not-allowed" : "pointer",
                        opacity: generating ? 0.75 : 1,
                        fontFamily: F.sans,
                      }}
                    >
                      {generating ? (
                        <>
                          <FiLoader
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                          {t(gmCopy.aiGenerating) || "Writing recap…"}
                        </>
                      ) : (
                        <>
                          <FiSend size={14} />
                          {t(gmCopy.aiGenerate) || "Generate & save with AI"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Topic suggestions card */}
            <div
              style={{
                background: C.dark,
                color: "#fff",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  <FiSun size={16} color={C.gold} />
                  {t(gmCopy.aiTopicsTitle) || "AI: suggest next topics"}
                </div>
                <button
                  onClick={handleSuggestTopics}
                  disabled={loadingTopics}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 999,
                    border: `1px solid ${C.gold}88`,
                    background: "transparent",
                    color: C.gold,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: loadingTopics ? "not-allowed" : "pointer",
                    fontFamily: F.sans,
                  }}
                >
                  {loadingTopics ? (
                    <FiLoader
                      size={13}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <FiCpu size={13} />
                  )}
                  {loadingTopics
                    ? t(gmCopy.aiTopicsLoading) || "Thinking of topics…"
                    : t(gmCopy.aiTopicsBtn) || "Suggest topics"}
                </button>
              </div>

              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {topics === null && (
                  <p style={{ fontSize: 12.5, color: "#a9b3e0", margin: 0 }}>
                    {t(gmCopy.aiTopicsEmpty) ||
                      "Log a couple of sessions first so AI has something to build on."}
                  </p>
                )}
                {topics?.length === 0 && (
                  <p style={{ fontSize: 12.5, color: "#a9b3e0", margin: 0 }}>
                    {t(gmCopy.aiTopicsEmpty) ||
                      "Log a couple of sessions first so AI has something to build on."}
                  </p>
                )}
                {topics?.map((topic, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.goldLight,
                        marginBottom: 4,
                      }}
                    >
                      {topic.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#c9d0f0",
                        lineHeight: 1.5,
                      }}
                    >
                      {topic.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ROTATION PANEL ── */}
      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 32px) 40px",
        }}
      >
        <GoldenMondayRotationPanel
          nextPresenter={nextPresenter}
          ranking={ranking}
          employees={employees}
          onRefresh={refreshData}
          isAdmin={isAdminOrAbove}
          onAssignPresenter={async (userId) => {
            try {
              await goldenMondayAPI.assignPresenter(userId);
              showToast("Presenter assigned!", "success");
              await refreshData();
            } catch {
              showToast("Failed to assign presenter", "error");
            }
          }}
        />
      </section>

      {/* ── UPCOMING & PAST SESSIONS TIMELINE ── */}
      <section
        ref={registerRef("timeline")}
        data-reveal="timeline"
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "clamp(48px, 8vw, 72px) clamp(20px, 6vw, 40px) 12px",
          ...revealStyle("timeline"),
        }}
      >
        <SectionHeading
          eyebrow={<FiCalendar size={14} />}
          title={t(gmCopy.timelineTitle) || "Sessions Timeline"}
          sub={
            t(gmCopy.timelineSub) || "A running record, not a one-off event."
          }
        />

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3 style={{ color: C.primary, fontSize: 16, marginBottom: 16 }}>
              <FiClock size={16} style={{ marginRight: 8 }} />
              Upcoming Sessions
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              {upcomingSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  language={language}
                  isAdmin={isAdminOrAbove}
                  onRefresh={refreshData}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3 style={{ color: C.muted, fontSize: 16, marginBottom: 16 }}>
              <FiStar size={16} style={{ marginRight: 8 }} />
              Past Sessions
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              {pastSessions.slice(0, 10).map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  language={language}
                  isAdmin={isAdminOrAbove}
                  onRefresh={refreshData}
                />
              ))}
            </div>
          </div>
        )}

        {upcomingSessions.length === 0 && pastSessions.length === 0 && (
          <p style={{ color: C.muted, textAlign: "center", padding: "40px 0" }}>
            No sessions recorded yet. Start by logging a session with AI!
          </p>
        )}
      </section>

      {/* ── ADMIN PANEL (Admin/SuperAdmin only) ── */}
      {isAdminOrAbove && (
        <section
          ref={registerRef("admin")}
          data-reveal="admin"
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "clamp(48px, 8vw, 72px) clamp(20px, 6vw, 40px) 12px",
            ...revealStyle("admin"),
          }}
        >
          <SectionHeading
            eyebrow={<FiUsers size={14} />}
            title="Employee Management"
            sub="Register and manage employees for Golden Monday rotation"
          />

          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: C.dark }}>
                  Registered Employees: {employees.length}
                </span>
              </div>
              <button
                onClick={() => setShowEmployeeModal(true)}
                style={btnStyle(C.primary)}
              >
                <FiUserPlus size={14} /> Register Employee
              </button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {employees.length === 0 ? (
                <p
                  style={{
                    color: C.muted,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No employees registered yet. Click "Register Employee" to add.
                </p>
              ) : (
                employees.map((emp) => (
                  <div
                    key={emp.user?._id || emp._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: emp.isEligible ? C.bg : "#fef2f2",
                      border: `1px solid ${emp.isEligible ? C.border : "#fecaca"}`,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      {emp.profilePhotoUrl ? (
                        <img
                          src={emp.profilePhotoUrl}
                          alt={emp.name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
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
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {emp.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: C.dark,
                            fontSize: 14,
                          }}
                        >
                          {emp.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted }}>
                          {emp.department || "No department"} ·{" "}
                          {emp.position || "No position"}
                        </div>
                      </div>
                    </div>
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
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: emp.isEligible ? "#d1fae5" : "#fef2f2",
                          color: emp.isEligible ? "#065f46" : "#991b1b",
                        }}
                      >
                        {emp.isEligible ? "Active" : "Inactive"}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        Presented: {emp.timesPresented || 0}x
                      </span>
                      <button
                        onClick={() =>
                          handleToggleEligibility(
                            emp.user?._id || emp._id,
                            emp.isEligible,
                          )
                        }
                        style={{
                          ...btnStyle(
                            emp.isEligible ? "#f59e0b" : "#10b981",
                            "#fff",
                          ),
                          fontSize: 11,
                          padding: "4px 10px",
                        }}
                      >
                        {emp.isEligible ? (
                          <FiUserX size={12} />
                        ) : (
                          <FiUserCheck size={12} />
                        )}
                        {emp.isEligible ? "Deactivate" : "Activate"}
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() =>
                            handleRemoveEmployee(emp.user?._id || emp._id)
                          }
                          style={{
                            ...btnStyle("#ef4444", "#fff"),
                            fontSize: 11,
                            padding: "4px 10px",
                          }}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── MESOB PLATFORM ── */}
      <section
        ref={registerRef("mesob")}
        data-reveal="mesob"
        style={{
          background: C.dark,
          color: "#fff",
          marginTop: 24,
          padding: "clamp(48px, 8vw, 72px) clamp(20px, 6vw, 40px)",
          ...revealStyle("mesob"),
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              gap: 40,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: "1 1 320px" }}>
              <SectionHeading
                eyebrow={<FiGrid size={14} />}
                title={
                  t(gmCopy.mesobTitle) || "The platform this mindset built"
                }
                sub={
                  t(gmCopy.mesobSub) ||
                  "MESOB is the organization's one-stop digital service platform — the same drive for less friction, applied to how citizens actually get things done."
                }
                dark
              />
              <a
                className="gm-cta"
                href="/documents"
                style={{
                  marginTop: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                  color: C.dark,
                  padding: "12px 22px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {t(gmCopy.mesobCta) || "Open Document Vault"}
                <FiArrowRight size={16} />
              </a>
            </div>

            <div style={{ flex: "1 1 380px", display: "grid", gap: 12 }}>
              {FALLBACK_MESOB_POINTS.map((pt, i) => (
                <div
                  key={i}
                  className="gm-mesob-point"
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(245,197,24,0.15)",
                      color: C.gold,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {pt.icon}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: "#dfe4ff",
                    }}
                  >
                    {t(pt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section
        style={{
          textAlign: "center",
          padding: "clamp(40px, 7vw, 60px) 20px clamp(56px, 9vw, 80px)",
        }}
      >
        <h3
          style={{
            fontFamily: F.serif,
            fontSize: "clamp(20px, 3vw, 26px)",
            color: C.dark,
            margin: "0 0 8px",
          }}
        >
          {t(gmCopy.closingTitle) || "Start your week here"}
        </h3>
        <p
          style={{
            color: C.muted,
            fontSize: 14,
            maxWidth: 440,
            margin: "0 auto",
          }}
        >
          {t(gmCopy.closingBody) ||
            "Golden Monday is a standing fixture — check back weekly for the next session's write-up."}
        </p>
      </section>

      {/* ── REGISTER EMPLOYEE MODAL ── */}
      <EmployeeRegistrationModal
        show={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onRegister={handleRegisterEmployee}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        registering={registering}
      />
    </div>
  );
}
