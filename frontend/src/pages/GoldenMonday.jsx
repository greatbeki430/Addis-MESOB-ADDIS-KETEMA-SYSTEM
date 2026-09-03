// src/pages/GoldenMonday.jsx
// ════════════════════════════════════════════════════════════
// COMPLETE Golden Monday Management System - Premium Redesign
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { C, F } from "../styles/theme";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { goldenMondayAPI, authAPI, uploadAPI } from "../services/api";
import { showToast } from "../utils/toastHelper";
import { ROLES, hasMinRole } from "../utils/roles";
import { goldenMondayTranslations } from "../constants/goldenMondayTranslations";
import GoldenMondayRotationPanel from "../components/golden-monday/GoldenMondayRotationPanel";
import AttendancePanel from "../components/golden-monday/AttendancePanel";
import GalleryGrid from "../components/golden-monday/GalleryGrid";
import ReportExport from "../components/golden-monday/ReportExport";
import ExperiencesAndResults from "../components/golden-monday/ExperiencesAndResults";
import PresenterSpotlight from "../components/golden-monday/PresenterSpotlight";
import ConfirmModal from "../components/common/ConfirmModal";
import ResourceLibrary from "../components/golden-monday/ResourceLibrary";
import NotificationBell from "../components/golden-monday/NotificationBell";
import QRCheckIn from "../components/golden-monday/QRCheckIn";
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
  FiStar,
  FiRefreshCw,
  FiInfo,
  FiTrash2,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiBell,
  FiCamera,
  FiFileText,
  FiClipboard,
  FiMessageCircle,
  FiFile,
  // FiSparkles,
  FiPlay,
} from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";

// ─────────────────────────────────────────────────────────────
// SAFE DATA HELPERS
// ─────────────────────────────────────────────────────────────
const safeArray = (data, fallback = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(Object.values(data)[0])) return Object.values(data)[0];
  }
  return fallback;
};

// ─────────────────────────────────────────────────────────────
// GLASSMORPHISM STYLES
// ─────────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
};

// ─────────────────────────────────────────────────────────────
// STATIC PILLARS (fallback data with translations)
// ─────────────────────────────────────────────────────────────
const FALLBACK_PILLARS = [
  {
    icon: "FiSunrise",
    title: {
      en: "A weekly reset",
      am: "ሳምንታዊ ዳግም መነሳት",
      om: "Torbanii haaraa bu'uura",
    },
    body: {
      en: "Every Monday morning, offices across the organization pause the routine for shared learning — a deliberate start to the work week instead of a rushed one.",
      am: "በየሳምንቱ ሰኞ ጠዋት፣ በድርጅቱ ውስጥ ያሉ ቢሮዎች ለጋራ ትምህርት የወትሮውን ተግባር ያቋርጣሉ — የስራ ሳምንቱ በፍጥነት ሳይሆን በአስተዋይ ሁኔታ ይጀምራል።",
      om: "Guyyaa wiixata ganama hunda, biiroowwan dhaabbilee keessatti sochii yeroo barachuuf ni addaan kutu — jalqaba itti yaadame kan torbanii hojii.",
    },
  },
  {
    icon: "FiUsers",
    title: {
      en: "Peer-led, not top-down",
      am: "በእኩዮች የሚመራ፣ ከላይ ወደ ታች አይደለም",
      om: "Hiriyaan durfama, gubbaa gaditti miti",
    },
    body: {
      en: "Sessions are usually carried by colleagues themselves — department heads, team leaders, and long-serving staff sharing real experience, not scripted lectures.",
      am: "መርሃ-ግብሮቹ ብዙውን ጊዜ የሚካሄዱት በራሱ ሰራተኞች ነው — የዘርፍ ኃላፊዎች፣ የቡድን መሪዎች እና የረጅም ጊዜ ሰራተኞች ከተሞክሮ የተገኘ እውቀት ያካፍላሉ፣ ከመጽሀፍ የተዘጋጁ ትምህርቶች አይደሉም።",
      om: "Walga'iin yeroo baay'ee hiriyaan ofii isaanii — hoogganaa kutaa, hoogganaa garee, fi hojjattoota yeroo dheeraa, muuxannoo dhugaa qoodu, utuu hin taane barsiisa qophaa'e.",
    },
  },
  {
    icon: "FiTrendingUp",
    title: {
      en: "Built for multiskilling",
      am: "ለብዙ ክህሎት የተገነባ",
      om: "Dandeettii hedduutiif ijaarame",
    },
    body: {
      en: "The stated goal is to push every employee beyond a single fixed skill set — technology literacy, service standards, and adaptability all get airtime over time.",
      am: "ዋናው ግብ እያንዳንዱን ሰራተኛ ከአንድ የተወሰነ ክህሎት ባሻገር ማሳደግ ነው — የቴክኖሎጂ እውቀት፣ የአገልግሎት ደረጃዎች እና መላመድ ሁሉም ጊዜያቸውን ያገኛሉ።",
      om: "Kaayyoon ibsame hojjetaa tokkoon tokkoo dandeettii tokkoo ol isa dabarsuu — ogummaa teeknoolojii, sadarkaa tajaajila, fi mirkanaa'uu yeroo hundaaf bakka kenname.",
    },
  },
];

const PILLAR_ICONS = {
  FiSunrise: <FiSunrise size={22} />,
  FiUsers: <FiUsers size={22} />,
  FiTrendingUp: <FiTrendingUp size={22} />,
};

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
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid " + C.border,
  fontSize: 13,
  fontFamily: F.sans,
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.3s ease",
  background: "rgba(255,255,255,0.8)",
};

const btnStyle = (bg = C.primary, color = "#fff") => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 18px",
  borderRadius: 10,
  border: "none",
  background: bg,
  color: color,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: F.sans,
  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
});

// ─────────────────────────────────────────────────────────────
// SECTION HEADING COMPONENT
// ─────────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, sub, dark, centered }) {
  return (
    <div style={{ textAlign: centered ? "center" : "left" }}>
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
          maxWidth: centered ? "none" : 520,
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
function StatsDashboard({ stats, nextPresenter, loading, t }) {
  if (loading || !stats) {
    return (
      <div
        style={{
          ...glass,
          borderRadius: 16,
          padding: "24px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `3px solid ${C.border}`,
            borderTopColor: C.primary,
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        />
        <p style={{ color: C.muted, marginTop: 12 }}>
          {t.loading || "Loading stats..."}
        </p>
      </div>
    );
  }

  const statItems = [
    {
      label: t.statTotalSessions || "Total Sessions",
      value: stats.totalSessions || 0,
      icon: <FiCalendar size={20} />,
      color: C.primary,
    },
    {
      label: t.statPresenters || "Presenters",
      value: stats.totalPresenters || 0,
      icon: <FiUsers size={20} />,
      color: "#10b981",
    },
    {
      label: t.statUpcoming || "Upcoming",
      value: stats.upcomingSessions || 0,
      icon: <FiClock size={20} />,
      color: "#f59e0b",
    },
    {
      label: t.statAvgRating || "Avg Rating",
      value: stats.averageRating
        ? stats.averageRating.toFixed(1)
        : t.statNoRating || "N/A",
      icon: <FiStar size={20} />,
      color: "#f5c518",
    },
  ];

  return (
    <div
      style={{
        ...glass,
        borderRadius: 20,
        padding: "clamp(20px, 3vw, 32px)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 16,
      }}
    >
      {statItems.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: `${item.color}15`,
              color: item.color,
              marginBottom: 8,
            }}
          >
            {item.icon}
          </div>
          <div
            style={{
              fontSize: "clamp(20px, 2.5vw, 28px)",
              fontWeight: 800,
              color: C.dark,
            }}
          >
            {item.value}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{item.label}</div>
        </motion.div>
      ))}

      {nextPresenter && nextPresenter.name && (
        <div
          style={{
            textAlign: "center",
            borderLeft: `1px solid ${C.border}`,
            paddingLeft: 16,
          }}
        >
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
            {t.statNextPresenter || "Next Presenter"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {nextPresenter.profilePhotoUrl ? (
              <img
                src={nextPresenter.profilePhotoUrl}
                alt={nextPresenter.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${C.gold}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
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
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, color: C.dark, fontSize: 13 }}>
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
function TelegramPostButton({ sessionId, onPosted, t }) {
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    setPosting(true);
    try {
      await goldenMondayAPI.postToTelegram(sessionId);
      showToast(
        t.postedToTelegramToast || "Posted to Telegram successfully!",
        "success",
      );
      if (onPosted) onPosted();
    } catch {
      showToast(t.failedPostTelegram || "Failed to post to Telegram", "error");
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
      {posting
        ? t.postingToTelegram || "Posting..."
        : t.postToTelegram || "Post to Telegram"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SESSION CARD COMPONENT - ENHANCED
// ─────────────────────────────────────────────────────────────
function SessionCard({ session, language, isAdmin, onRefresh, t }) {
  const [expanded, setExpanded] = useState(false);

  const getTranslatedText = useCallback(
    (obj) => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj[language] || obj.en || "";
    },
    [language],
  );

  if (!session) return null;

  const date = session.date ? new Date(session.date) : new Date();
  const isUpcoming = session.status === "scheduled" || date > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: C.white,
        borderRadius: 14,
        padding: "16px 20px",
        border: `1px solid ${isUpcoming ? `${C.gold}66` : C.border}`,
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.primary;
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(13,26,94,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isUpcoming
          ? `${C.gold}66`
          : C.border;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Glow accent for upcoming */}
      {isUpcoming && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})`,
            backgroundSize: "200% 100%",
            animation: "gm-sweep 3s ease-in-out infinite",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: isUpcoming
                ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`
                : C.primary,
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
            <div
              style={{
                fontWeight: 600,
                color: C.dark,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {getTranslatedText(session.presentationTitle) ||
                session.title ||
                t.untitledSession ||
                "Untitled Session"}
              {isUpcoming && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 10px",
                    borderRadius: 999,
                    background: `${C.gold}33`,
                    color: C.gold,
                  }}
                >
                  {t.upcomingBadge || "Upcoming"}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 500, color: C.dark }}>
                {getTranslatedText(session.presenterName) ||
                  t.noPresenter ||
                  "No presenter"}
              </span>
              <span>·</span>
              <span>
                {date.toLocaleDateString(t.locale || "en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {session.averageRating > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    color: C.gold,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <FiStar size={12} /> {session.averageRating.toFixed(1)}
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
                fontSize: 12,
                color: C.primary,
                textDecoration: "none",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 6,
                background: `${C.primary}11`,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${C.primary}22`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = `${C.primary}11`)
              }
              onClick={(e) => e.stopPropagation()}
            >
              <FiPlay size={12} /> {t.watchLabel || "Watch"}
            </a>
          )}
          {isAdmin && isUpcoming && (
            <div onClick={(e) => e.stopPropagation()}>
              <TelegramPostButton
                sessionId={session._id}
                onPosted={onRefresh}
                t={t}
              />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
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
              style={{
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.3s ease",
              }}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              overflow: "hidden",
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            {session.presentationDescription && (
              <p style={{ fontSize: 13, color: C.dark, marginBottom: 8 }}>
                {getTranslatedText(session.presentationDescription)}
              </p>
            )}
            {session.suggestedTopics &&
              Array.isArray(session.suggestedTopics) &&
              session.suggestedTopics.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiCpu size={12} /> {t.aiSuggestedLabel || "AI Suggested:"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    {session.suggestedTopics.slice(0, 5).map((topic, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10,
                          background: `${C.primary}11`,
                          padding: "2px 12px",
                          borderRadius: 999,
                          color: C.primary,
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
                  style={{
                    fontSize: 12,
                    color: C.primary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiInfo size={12} /> {t.viewAiRecap || "View AI Recap"}
                </summary>
                <p
                  style={{
                    fontSize: 13,
                    color: C.dark,
                    marginTop: 8,
                    padding: 12,
                    background: C.bg,
                    borderRadius: 8,
                    lineHeight: 1.6,
                  }}
                >
                  {getTranslatedText(session.recapEn)}
                </p>
              </details>
            )}
            {session.photos &&
              Array.isArray(session.photos) &&
              session.photos.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {session.photos.slice(0, 4).map((photo, i) => (
                    <img
                      key={i}
                      src={photo.url}
                      alt={photo.caption || "Session photo"}
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                      }}
                    />
                  ))}
                  {session.photos.length > 4 && (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        background: C.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.muted,
                      }}
                    >
                      +{session.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL COMPONENT WITH PHOTO UPLOAD - ENHANCED
// ─────────────────────────────────────────────────────────────
function EmployeeRegistrationModal({
  show,
  onClose,
  onRegister,
  employeeForm,
  setEmployeeForm,
  registering,
  filteredUsers,
  selectedUser,
  setSelectedUser,
  userSearch,
  setUserSearch,
  handleSelectUser,
  setPhotoFile,
  photoPreview,
  setPhotoPreview,
  handlePhotoChange,
  uploadingPhoto,
  t,
}) {
  if (!show) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ duration: 0.3, type: "spring", damping: 25 }}
        style={{
          background: "#ffffff",
          borderRadius: 24,
          padding: 32,
          maxWidth: 520,
          width: "92%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${C.primary}, ${C.gold}, ${C.primary})`,
            backgroundSize: "200% 100%",
            animation: "gm-sweep 4s ease-in-out infinite",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: C.dark,
              fontFamily: F.serif,
              fontSize: 22,
            }}
          >
            {t.registerEmployeeTitle || "Register Employee"}
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
            <FiX size={22} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {/* Employee Selection */}
          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              {t.employeeLabel || "Employee"}{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </label>
            {selectedUser ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.primary}`,
                  background: `${C.primary}06`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
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
                    {selectedUser.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                    >
                      {selectedUser.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {selectedUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setEmployeeForm({ ...employeeForm, userId: "" });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.muted,
                    padding: "4px",
                  }}
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : (
              <>
                <input
                  placeholder={
                    t.searchUserPlaceholder || "Search by name or email…"
                  }
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={inputStyle}
                />
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    marginTop: 6,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    background: C.white,
                  }}
                >
                  {filteredUsers.length === 0 ? (
                    <div
                      style={{
                        padding: 14,
                        fontSize: 13,
                        color: C.muted,
                        textAlign: "center",
                      }}
                    >
                      {t.noMatchingUsers || "No matching users found"}
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => handleSelectUser(u)}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontSize: 13,
                          borderBottom: `1px solid ${C.border}`,
                          transition: "background 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = C.bg)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: C.primary,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {u.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: C.dark }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Department */}
          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              {t.departmentLabel || "Department"}
            </label>
            <input
              placeholder={t.departmentPlaceholder || "Department name"}
              value={employeeForm.department}
              onChange={(e) =>
                setEmployeeForm({ ...employeeForm, department: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          {/* Position */}
          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              {t.positionLabel || "Position"}
            </label>
            <input
              placeholder={t.positionPlaceholder || "Job position"}
              value={employeeForm.position}
              onChange={(e) =>
                setEmployeeForm({ ...employeeForm, position: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              {t.profilePhotoLabel || "Profile Photo"}
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{
                  ...inputStyle,
                  padding: "8px",
                  cursor: "pointer",
                  flex: 1,
                }}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && (
                <FiLoader
                  size={20}
                  style={{
                    animation: "spin 1s linear infinite",
                    color: C.primary,
                  }}
                />
              )}
            </div>
            {photoPreview && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `2px solid ${C.primary}`,
                  }}
                />
                <button
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {t.removeBtn || "Remove"}
                </button>
              </div>
            )}
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              {t.photoUploadHint ||
                "Upload a photo from your computer (JPG, PNG, GIF) - Max 5MB"}
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <label
              style={{
                fontSize: 13,
                color: C.muted,
                display: "block",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              {t.photoUrlLabel || "Photo URL"} ({t.optional || "optional"})
            </label>
            <input
              placeholder={
                t.photoUrlPlaceholder || "https://example.com/photo.jpg"
              }
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

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 8,
              paddingTop: 18,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {t.cancelBtn || "Cancel"}
            </button>
            <button
              onClick={onRegister}
              disabled={registering || !employeeForm.userId || uploadingPhoto}
              style={{
                padding: "10px 28px",
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor:
                  registering || !employeeForm.userId || uploadingPhoto
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  registering || !employeeForm.userId || uploadingPhoto
                    ? 0.6
                    : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.3s ease",
              }}
            >
              {registering || uploadingPhoto ? (
                <FiLoader
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <FiUserPlus size={16} />
              )}
              {registering || uploadingPhoto
                ? t.processingBtn || "Processing..."
                : t.registerBtn || "Register Employee"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function GoldenMonday() {
  const { language } = useLanguage();
  const { user } = useAuth();

  // ── Get translations from goldenMondayTranslations ──
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // ── Active Tab State ──
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // ── Tabs with translations ──
  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: t.tabOverview || "Overview",
        icon: <FiGrid size={16} />,
      },
      {
        id: "attendance",
        label: t.tabAttendance || "Attendance",
        icon: <FiClipboard size={16} />,
      },
      {
        id: "gallery",
        label: t.tabGallery || "Gallery",
        icon: <FiCamera size={16} />,
      },
      {
        id: "resources",
        label: t.tabResources || "Resources",
        icon: <FiFile size={16} />,
      },
      {
        id: "reports",
        label: t.tabReports || "Reports",
        icon: <FiFileText size={16} />,
      },
      {
        id: "experience-result",
        label: t.tabExperienceResult || "Experiences & Results",
        icon: <FiMessageCircle size={16} />,
      },
    ],
    [t],
  );

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

  // ── Admin Panel State ──
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    userId: "",
    department: "",
    position: "",
    profilePhotoUrl: "",
  });
  const [registering, setRegistering] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState({
    isOpen: false,
    userId: null,
    name: "",
  });

  // ── Photo Upload State ──
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // ── Translation helper for objects - stable reference ──
  const getTranslatedText = useCallback(
    (obj) => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj[language] || obj.en || "";
    },
    [language],
  );

  // ── Load all data from API ──
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        upcomingRes,
        pastRes,
        nextPresenterRes,
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

      setUpcomingSessions(safeArray(upcomingRes.data));
      setPastSessions(safeArray(pastRes.data?.sessions));
      setNextPresenter(nextPresenterRes.data || null);
      setEmployees(safeArray(employeesRes.data));
      setStats(statsRes.data || null);

      const pillarsData = pillarsRes.data;
      if (Array.isArray(pillarsData) && pillarsData.length > 0) {
        setPillars(pillarsData);
      } else {
        const extracted = safeArray(pillarsData);
        setPillars(extracted.length > 0 ? extracted : FALLBACK_PILLARS);
      }

      const upcoming = safeArray(upcomingRes.data);
      const past = safeArray(pastRes.data?.sessions);
      if (upcoming.length > 0) {
        setSelectedSessionId(upcoming[0]._id);
      } else if (past.length > 0) {
        setSelectedSessionId(past[0]._id);
      }
    } catch (error) {
      console.error("Failed to load Golden Monday data:", error);
      showToast(t.error || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    showToast(t.success || "Data refreshed", "success");
  }, [loadAllData, t]);

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

  // ── Load users when modal opens ──
  useEffect(() => {
    if (!showEmployeeModal) return;
    authAPI
      .getUsers()
      .then((res) => setAllUsers(res.data || []))
      .catch(() =>
        showToast(t.failedLoadUsers || "Failed to load users", "error"),
      );
  }, [showEmployeeModal, t]);

  const rosterUserIds = new Set(
    employees.map((e) => (e.user?._id || e.user || "").toString()),
  );

  const filteredUsers = allUsers.filter((u) => {
    if (rosterUserIds.has(u._id)) return false;
    const q = userSearch.toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setEmployeeForm((f) => ({ ...f, userId: u._id }));
  };

  // ── Photo Upload Handler ──
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(t.photoTooLarge || "Photo must be less than 5MB", "error");
        e.target.value = "";
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

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
      showToast(
        t.titleNotesRequired || "Title and notes are required",
        "warning",
      );
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
      showToast(
        t.sessionSavedToast || "Session saved with AI recap!",
        "success",
      );
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          t.failedSaveSession ||
          "Failed to save session",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  // ── Admin Handlers ──
  const handleRegisterEmployee = async () => {
    if (!employeeForm.userId) {
      showToast(t.selectEmployeeWarn || "Please select an employee", "warning");
      return;
    }
    setRegistering(true);
    try {
      let profilePhotoUrl = employeeForm.profilePhotoUrl;

      if (photoFile) {
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append("photo", photoFile);
        const response = await uploadAPI.uploadEmployeePhoto(formData);
        profilePhotoUrl = response.data.url;
        setUploadingPhoto(false);
      }

      await goldenMondayAPI.registerEmployee({
        ...employeeForm,
        profilePhotoUrl,
      });

      showToast(
        t.employeeRegisteredToast || "Employee registered successfully!",
        "success",
      );
      setShowEmployeeModal(false);
      setEmployeeForm({
        userId: "",
        department: "",
        position: "",
        profilePhotoUrl: "",
      });
      setSelectedUser(null);
      setUserSearch("");
      setPhotoFile(null);
      setPhotoPreview(null);
      await refreshData();
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          t.failedRegisterEmployee ||
          "Failed to register employee",
        "error",
      );
    } finally {
      setRegistering(false);
      setUploadingPhoto(false);
    }
  };

  const handleRemoveEmployee = (userId, name = "") => {
    setRemoveConfirm({
      isOpen: true,
      userId,
      name,
    });
  };

  const confirmRemoveEmployee = async () => {
    try {
      await goldenMondayAPI.removeEmployee(removeConfirm.userId);
      showToast(t.employeeRemovedToast || "Employee removed", "success");
      await refreshData();
    } catch {
      showToast(t.failedRemoveEmployee || "Failed to remove employee", "error");
    } finally {
      setRemoveConfirm({ isOpen: false, userId: null, name: "" });
    }
  };

  const handleToggleEligibility = async (userId, isEligible) => {
    try {
      await goldenMondayAPI.updateEmployeeEligibility(userId, !isEligible);
      showToast(
        isEligible
          ? t.inactiveLabel || "Deactivated"
          : t.activeLabel || "Activated",
        "success",
      );
      await refreshData();
    } catch {
      showToast(
        t.failedUpdateEligibility || "Failed to update eligibility",
        "error",
      );
    }
  };

  // ── Get sessions for dropdown ──
  const allSessions = [...upcomingSessions, ...pastSessions];
  const sessionOptions = allSessions.map((s) => ({
    id: s._id,
    label: `${s.presentationTitle || s.title || t.untitledSession || "Untitled"} - ${new Date(
      s.date,
    ).toLocaleDateString(t.locale || "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`,
  }));

  return (
    <div style={{ fontFamily: F.sans, background: C.gray, minHeight: "100vh" }}>
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
          70% { box-shadow: 0 0 0 20px ${C.gold}00; }
          100% { box-shadow: 0 0 0 0 ${C.gold}00; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gm-card {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gm-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(13,26,94,0.12);
        }
        .gm-cta {
          transition: all 0.3s ease;
        }
        .gm-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245,197,24,0.4);
        }
        .gm-refresh-btn {
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gm-refresh-btn:hover {
          transform: rotate(180deg);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }
        .tab-btn {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .tab-btn.active {
          background: ${C.primary};
          color: #fff;
          box-shadow: 0 4px 16px ${C.primary}44;
        }
        .tab-btn:not(.active):hover {
          background: rgba(13,26,94,0.06);
          transform: translateY(-1px);
        }
        .shimmer-text {
          background: linear-gradient(90deg, #f5c518, #d4a017, #f5c518);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
        }
        .hero-glow {
          animation: gm-pulse-ring 3s ease-in-out infinite;
        }
        .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${C.dark} 0%, ${C.primary} 50%, #1a1a4e 100%)`,
          padding:
            "clamp(60px, 10vw, 100px) clamp(20px, 6vw, 64px) clamp(40px, 6vw, 60px)",
          color: "#fff",
        }}
      >
        {/* Animated background orbs */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-100px",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.gold}33, transparent 70%)`,
            animation: "gm-rise 8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(245,197,24,0.15), transparent 70%)`,
            animation: "gm-rise 10s ease-in-out infinite reverse",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "30%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)`,
            animation: "gm-rise 12s ease-in-out infinite 2s",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ flex: 1, minWidth: 280 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(245,197,24,0.15)",
                  border: `1px solid ${C.gold}44`,
                  padding: "6px 18px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.goldLight,
                  marginBottom: 18,
                }}
              >
                <FiClock size={13} />
                {t.eyebrow || "Every Monday · 2:00 – 2:50"}
              </div>

              <h1
                style={{
                  fontFamily: F.serif,
                  fontSize: "clamp(36px, 7vw, 64px)",
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
                  className="hero-glow"
                  style={{
                    display: "inline-flex",
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                    color: C.dark,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FiSunrise size={32} />
                </span>
                <span
                  className="shimmer-text"
                  style={{ WebkitTextFillColor: "transparent" }}
                >
                  {t.title || "Golden Monday"}
                </span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(15px, 2vw, 20px)",
                  lineHeight: 1.7,
                  color: "#c8d0f0",
                  maxWidth: 600,
                  marginTop: 16,
                }}
              >
                {t.subtitle ||
                  "The organization's weekly ritual for shared learning — and the philosophy behind why Addis MESOB exists at all."}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 24,
                  flexWrap: "wrap",
                  alignItems: "center",
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
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = C.gold;
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = `${C.gold}66`;
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  {t.scroll || "Explore the story"} <FiChevronDown size={16} />
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
                      background: "rgba(255,255,255,0.08)",
                      border: `1px solid rgba(255,255,255,0.15)`,
                      borderRadius: 8,
                      padding: "6px 16px",
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FiRefreshCw
                      size={14}
                      style={{
                        animation: refreshing
                          ? "spin 1s linear infinite"
                          : "none",
                      }}
                    />
                    {refreshing
                      ? t.refreshing || "Refreshing..."
                      : t.refresh || "Refresh"}
                  </button>
                )}

                <NotificationBell />
              </div>
            </div>

            {/* Stats Mini-Card */}
            {stats && (
              <div
                style={{
                  ...glass,
                  borderRadius: 16,
                  padding: "20px 24px",
                  minWidth: 200,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: C.goldLight,
                      }}
                    >
                      {stats.totalSessions || 0}
                    </div>
                    <div style={{ fontSize: 10, color: "#a9b3e0" }}>
                      {t.statTotalSessions || "Sessions"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: C.goldLight,
                      }}
                    >
                      {stats.totalPresenters || 0}
                    </div>
                    <div style={{ fontSize: 10, color: "#a9b3e0" }}>
                      {t.statPresenters || "Presenters"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: C.goldLight,
                      }}
                    >
                      {stats.upcomingSessions || 0}
                    </div>
                    <div style={{ fontSize: 10, color: "#a9b3e0" }}>
                      {t.statUpcoming || "Upcoming"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: C.goldLight,
                      }}
                    >
                      {stats.averageRating
                        ? stats.averageRating.toFixed(1)
                        : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "#a9b3e0" }}>
                      {t.statAvgRating || "Rating"}
                    </div>
                  </div>
                </div>
              </div>
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
          t={t}
        />
      </section>

      {/* ── PRESENTER SPOTLIGHT ── */}
      <PresenterSpotlight onRefresh={refreshData} />

      {/* ── TAB NAVIGATION ── */}
      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "clamp(16px, 3vw, 24px) clamp(20px, 6vw, 40px) 0",
        }}
      >
        <div
          style={{
            ...glass,
            borderRadius: 16,
            padding: "6px",
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            position: "sticky",
            top: 0,
            zIndex: 100,
            transition: "all 0.3s ease",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 10,
                background: activeTab === tab.id ? C.primary : "transparent",
                color: activeTab === tab.id ? "#fff" : C.muted,
                border: "none",
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                fontFamily: F.sans,
              }}
            >
              {tab.icon}
              <span
                style={{ display: window.innerWidth < 600 ? "none" : "inline" }}
              >
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#fff",
                    marginLeft: 2,
                    animation: "gm-pulse-ring 2s ease-in-out infinite",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── TAB CONTENT ── */}
      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "clamp(16px, 3vw, 24px) clamp(20px, 6vw, 40px)",
        }}
      >
        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* PILLARS */}
              <div
                id="gm-pillars"
                ref={registerRef("pillars")}
                data-reveal="pillars"
                style={{
                  marginBottom: 32,
                  ...revealStyle("pillars"),
                }}
              >
                <SectionHeading
                  eyebrow={<FiCompass size={14} />}
                  title={t.pillarsTitle || "Why a golden morning"}
                  sub={
                    t.pillarsSub || "Three things every session comes back to."
                  }
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 20,
                    marginTop: 28,
                  }}
                >
                  {Array.isArray(pillars) && pillars.length > 0 ? (
                    pillars.map((pillar, i) => {
                      const IconComponent = PILLAR_ICONS[pillar.icon] || (
                        <FiCompass size={22} />
                      );
                      const translatedTitle = getTranslatedText(pillar.title);
                      const translatedBody = getTranslatedText(pillar.body);

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.4 }}
                          className="gm-card"
                          style={{
                            background: C.white,
                            borderRadius: 16,
                            padding: 24,
                            border: `1px solid ${C.border}`,
                            transition:
                              "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease",
                          }}
                        >
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 12,
                              background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: 16,
                            }}
                          >
                            {IconComponent}
                          </div>
                          <h3
                            style={{
                              margin: "0 0 8px",
                              fontSize: 16,
                              color: C.dark,
                              fontFamily: F.serif,
                            }}
                          >
                            {translatedTitle || pillar.title?.en || "Untitled"}
                          </h3>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13.5,
                              lineHeight: 1.7,
                              color: C.muted,
                            }}
                          >
                            {translatedBody || pillar.body?.en || ""}
                          </p>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        textAlign: "center",
                        color: C.muted,
                        padding: "40px 0",
                      }}
                    >
                      <FiCompass
                        size={32}
                        style={{ marginBottom: 12, opacity: 0.5 }}
                      />
                      <p>{t.loading || "Loading pillars..."}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI SESSION STUDIO (Leader/Admin only) */}
              {isLeaderOrAbove && (
                <div
                  ref={registerRef("aiStudio")}
                  data-reveal="aiStudio"
                  style={{
                    marginBottom: 32,
                    ...revealStyle("aiStudio"),
                  }}
                >
                  <div
                    style={{
                      ...glass,
                      borderRadius: 20,
                      padding: "clamp(20px, 3vw, 28px)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.dark,
                          }}
                        >
                          <LuSparkles size={22} />
                        </div>
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 17,
                              color: C.dark,
                              fontFamily: F.serif,
                            }}
                          >
                            {t.aiTitle || "AI Session Studio"}
                          </h3>
                          <p
                            style={{ margin: 0, fontSize: 12, color: C.muted }}
                          >
                            {t.aiSub ||
                              "Log notes — AI turns them into a polished recap"}
                          </p>
                        </div>
                      </div>
                      {!showComposer && (
                        <button
                          onClick={() => setShowComposer(true)}
                          style={{
                            padding: "8px 22px",
                            borderRadius: 10,
                            border: "none",
                            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                            color: C.dark,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.03)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 16px rgba(245,197,24,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <FiPlus size={16} /> {t.aiNewSession || "New Session"}
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showComposer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{ display: "grid", gap: 12, paddingTop: 8 }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 12,
                              }}
                            >
                              <input
                                placeholder={t.aiFormTitle || "Session title"}
                                value={form.title}
                                onChange={handleFormChange("title")}
                                style={inputStyle}
                              />
                              <input
                                placeholder={t.aiFormOrg || "Organization"}
                                value={form.organization}
                                onChange={handleFormChange("organization")}
                                style={inputStyle}
                              />
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 12,
                              }}
                            >
                              <input
                                placeholder={t.aiFormSpeaker || "Speaker"}
                                value={form.speaker}
                                onChange={handleFormChange("speaker")}
                                style={inputStyle}
                              />
                              <input
                                type="date"
                                value={form.date}
                                onChange={handleFormChange("date")}
                                style={inputStyle}
                              />
                            </div>
                            <textarea
                              placeholder={
                                t.aiFormNotes ||
                                "Raw notes — AI will clean it up"
                              }
                              value={form.rawNotes}
                              onChange={handleFormChange("rawNotes")}
                              rows={4}
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
                                style={{
                                  padding: "8px 22px",
                                  borderRadius: 10,
                                  border: `1px solid ${C.border}`,
                                  background: "transparent",
                                  color: C.muted,
                                  fontWeight: 600,
                                  fontSize: 13,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = C.bg)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                {t.aiCancel || "Cancel"}
                              </button>
                              <button
                                onClick={handleGenerateAndSave}
                                disabled={generating}
                                style={{
                                  padding: "8px 28px",
                                  borderRadius: 10,
                                  border: "none",
                                  background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  cursor: generating
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: generating ? 0.7 : 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {generating ? (
                                  <FiLoader
                                    size={16}
                                    style={{
                                      animation: "spin 1s linear infinite",
                                    }}
                                  />
                                ) : (
                                  <FiSend size={16} />
                                )}
                                {generating
                                  ? t.aiGenerating || "Generating..."
                                  : t.aiGenerate || "Generate & Save"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ROTATION PANEL */}
              <div style={{ marginBottom: 32 }}>
                <GoldenMondayRotationPanel onRefresh={refreshData} />
              </div>

              {/* UPCOMING & PAST SESSIONS TIMELINE */}
              <div
                ref={registerRef("timeline")}
                data-reveal="timeline"
                style={revealStyle("timeline")}
              >
                <div
                  style={{
                    ...glass,
                    borderRadius: 20,
                    padding: "clamp(20px, 3vw, 28px)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${C.primary}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.primary,
                      }}
                    >
                      <FiCalendar size={18} />
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                        color: C.dark,
                        fontFamily: F.serif,
                      }}
                    >
                      {t.timelineTitle || "Session Timeline"}
                    </h3>
                  </div>

                  {/* Upcoming Sessions */}
                  {upcomingSessions.length > 0 && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 12,
                          marginTop: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: C.gold,
                            animation: "gm-pulse-ring 2s ease-in-out infinite",
                          }}
                        />
                        <h4 style={{ fontSize: 14, color: C.dark, margin: 0 }}>
                          {t.upcomingSessionsHeader || "Upcoming Sessions"}
                        </h4>
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        {upcomingSessions.map((session) => (
                          <SessionCard
                            key={session._id}
                            session={session}
                            language={language}
                            isAdmin={isAdminOrAbove}
                            onRefresh={refreshData}
                            t={t}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Past Sessions */}
                  {pastSessions.length > 0 && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: upcomingSessions.length > 0 ? 28 : 0,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: C.muted,
                          }}
                        />
                        <h4 style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                          {t.pastSessionsHeader || "Past Sessions"}
                        </h4>
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        {pastSessions.slice(0, 10).map((session) => (
                          <SessionCard
                            key={session._id}
                            session={session}
                            language={language}
                            isAdmin={isAdminOrAbove}
                            onRefresh={refreshData}
                            t={t}
                          />
                        ))}
                        {pastSessions.length > 10 && (
                          <p
                            style={{
                              textAlign: "center",
                              fontSize: 12,
                              color: C.muted,
                              marginTop: 4,
                            }}
                          >
                            +{pastSessions.length - 10} more sessions
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {upcomingSessions.length === 0 &&
                    pastSessions.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px 0",
                          color: C.muted,
                        }}
                      >
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: C.dark,
                          }}
                        >
                          {t.noSessionsYet || "No sessions recorded yet"}
                        </p>
                        <p style={{ fontSize: 13 }}>
                          {t.noSessionsSub ||
                            "Start by logging a session with AI!"}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* ADMIN PANEL (Admin/SuperAdmin only) */}
              {isAdminOrAbove && (
                <div
                  ref={registerRef("admin")}
                  data-reveal="admin"
                  style={{
                    marginTop: 40,
                    ...revealStyle("admin"),
                  }}
                >
                  <div
                    style={{
                      ...glass,
                      borderRadius: 20,
                      padding: "clamp(20px, 3vw, 28px)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: `${C.primary}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.primary,
                          }}
                        >
                          <FiUsers size={18} />
                        </div>
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 17,
                              color: C.dark,
                              fontFamily: F.serif,
                            }}
                          >
                            {t.adminPanelTitle || "Employee Management"}
                          </h3>
                          <p
                            style={{ margin: 0, fontSize: 12, color: C.muted }}
                          >
                            {t.adminPanelSub ||
                              "Register and manage employees for Golden Monday rotation"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEmployeeModal(true)}
                        style={btnStyle(C.primary)}
                      >
                        <FiUserPlus size={14} />{" "}
                        {t.registerEmployeeBtn || "Register Employee"}
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {employees.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "30px 0",
                            color: C.muted,
                            border: `1.5px dashed ${C.border}`,
                            borderRadius: 12,
                          }}
                        >
                          <p style={{ fontSize: 13 }}>
                            {t.noEmployeesYet ||
                              'No employees registered yet. Click "Register Employee" to add.'}
                          </p>
                        </div>
                      ) : (
                        employees.map((emp) => (
                          <div
                            key={emp.user?._id || emp._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 16px",
                              borderRadius: 10,
                              background: emp.isEligible ? C.bg : "#fef2f2",
                              border: `1px solid ${emp.isEligible ? C.border : "#fecaca"}`,
                              flexWrap: "wrap",
                              gap: 8,
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              {emp.profilePhotoUrl ? (
                                <img
                                  src={emp.profilePhotoUrl}
                                  alt={emp.name}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: `2px solid ${emp.isEligible ? C.primary : "#ef4444"}`,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: emp.isEligible
                                      ? C.primary
                                      : "#ef4444",
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
                                  {emp.department ||
                                    t.noDepartment ||
                                    "No department"}{" "}
                                  ·{" "}
                                  {emp.position ||
                                    t.noPosition ||
                                    "No position"}
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
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 12px",
                                  borderRadius: 999,
                                  background: emp.isEligible
                                    ? "#d1fae5"
                                    : "#fef2f2",
                                  color: emp.isEligible ? "#065f46" : "#991b1b",
                                }}
                              >
                                {emp.isEligible
                                  ? t.activeLabel || "Active"
                                  : t.inactiveLabel || "Inactive"}
                              </span>
                              <span style={{ fontSize: 11, color: C.muted }}>
                                {t.presentedLabel || "Presented"}:{" "}
                                {emp.timesPresented || 0}x
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
                                  padding: "4px 12px",
                                }}
                              >
                                {emp.isEligible ? (
                                  <FiUserX size={12} />
                                ) : (
                                  <FiUserCheck size={12} />
                                )}
                                {emp.isEligible
                                  ? t.deactivateBtn || "Deactivate"
                                  : t.activateBtn || "Activate"}
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() =>
                                    handleRemoveEmployee(
                                      emp.user?._id || emp._id,
                                      emp.name,
                                    )
                                  }
                                  style={{
                                    ...btnStyle("#ef4444", "#fff"),
                                    fontSize: 11,
                                    padding: "4px 12px",
                                  }}
                                >
                                  <FiTrash2 size={12} />{" "}
                                  {t.removeBtn || "Remove"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── EXPERIENCE & RESULT TAB ─── */}
          {activeTab === "experience-result" && (
            <motion.div
              key="experience-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ExperiencesAndResults sessionId={selectedSessionId} />
            </motion.div>
          )}

          {/* ─── ATTENDANCE TAB ─── */}
          {activeTab === "attendance" && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {sessionOptions.length > 0 && (
                <div
                  style={{
                    ...glass,
                    borderRadius: 16,
                    padding: "16px 20px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.dark,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FiCalendar size={16} />{" "}
                    {t.selectSession || "Select Session:"}
                  </label>
                  <select
                    value={selectedSessionId || ""}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    style={{
                      padding: "8px 14px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      fontSize: 13,
                      background: C.white,
                      outline: "none",
                      flex: 1,
                      minWidth: 180,
                    }}
                  >
                    {sessionOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSessionId && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <QRCheckIn
                      sessionId={selectedSessionId}
                      onCheckIn={refreshData}
                    />
                  </div>
                  <AttendancePanel
                    sessionId={selectedSessionId}
                    onRefresh={refreshData}
                  />
                </>
              )}

              {!selectedSessionId && (
                <div
                  style={{
                    ...glass,
                    borderRadius: 20,
                    padding: "60px 20px",
                    textAlign: "center",
                    color: C.muted,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <p style={{ fontSize: 16, marginBottom: 4 }}>
                    {t.noSessionsAvailable || "No sessions available"}
                  </p>
                  <p style={{ fontSize: 13, color: "#999" }}>
                    {t.createSessionFirst ||
                      "Create a session first to record attendance"}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── RESOURCES TAB ─── */}
          {activeTab === "resources" && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ResourceLibrary
                sessionId={selectedSessionId}
                onRefresh={refreshData}
              />
            </motion.div>
          )}

          {/* ─── GALLERY TAB ─── */}
          {activeTab === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <GalleryGrid
                sessionId={selectedSessionId}
                onRefresh={refreshData}
              />
            </motion.div>
          )}

          {/* ─── REPORTS TAB ─── */}
          {activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ReportExport sessionId={selectedSessionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

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
                title={t.mesobTitle || "The platform this mindset built"}
                sub={
                  t.mesobSub ||
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
                  padding: "12px 28px",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {t.mesobCta || "Open Document Vault"}
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
                    padding: "14px 18px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "all 0.3s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.15)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
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
                      lineHeight: 1.6,
                      color: "#dfe4ff",
                    }}
                  >
                    {getTranslatedText(pt)}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `${C.gold}22`,
              color: C.gold,
              marginBottom: 12,
            }}
          >
            <FiSunrise size={24} />
          </div>
          <h3
            style={{
              fontFamily: F.serif,
              fontSize: "clamp(20px, 3vw, 26px)",
              color: C.dark,
              margin: "0 0 8px",
            }}
          >
            {t.closingTitle || "Start your week here"}
          </h3>
          <p
            style={{
              color: C.muted,
              fontSize: 14,
              maxWidth: 440,
              margin: "0 auto",
            }}
          >
            {t.closingBody ||
              "Golden Monday is a standing fixture — check back weekly for the next session's write-up."}
          </p>
        </motion.div>
      </section>

      {/* ── REGISTER EMPLOYEE MODAL ── */}
      <EmployeeRegistrationModal
        show={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setSelectedUser(null);
          setUserSearch("");
          setPhotoFile(null);
          setPhotoPreview(null);
        }}
        onRegister={handleRegisterEmployee}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        registering={registering}
        filteredUsers={filteredUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        handleSelectUser={handleSelectUser}
        setPhotoFile={setPhotoFile}
        photoPreview={photoPreview}
        setPhotoPreview={setPhotoPreview}
        handlePhotoChange={handlePhotoChange}
        uploadingPhoto={uploadingPhoto}
        t={t}
      />

      {/* ── REMOVE CONFIRMATION MODAL ── */}
      <ConfirmModal
        isOpen={removeConfirm.isOpen}
        onClose={() =>
          setRemoveConfirm({ isOpen: false, userId: null, name: "" })
        }
        onConfirm={confirmRemoveEmployee}
        title={t.confirmRemoveTitle || "Remove Employee"}
        message={
          t.confirmRemoveMessage ||
          `Are you sure you want to remove "${removeConfirm.name}" from the rotation?`
        }
        confirmText={t.removeBtn || "Remove"}
        confirmColor="#dc2626"
      />
    </div>
  );
}
