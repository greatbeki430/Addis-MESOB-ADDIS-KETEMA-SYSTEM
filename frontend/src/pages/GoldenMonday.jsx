// src/pages/GoldenMonday.jsx
// ════════════════════════════════════════════════════════════
// "Golden Monday" — weekly capacity-building landing page
// Doubles as a general MESOB home / welcome page.
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { C, F } from "../styles/theme";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { goldenMondayAPI } from "../services/api";
import { showToast } from "../utils/toastHelper";
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
  FiSun, // ✅ Replaces FiLightbulb
  FiStar, // ✅ Replaces FiSparkles
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────
// PILLARS DATA (static content - now uses translations)
// ─────────────────────────────────────────────────────────────
const PILLARS_KEYS = [
  {
    icon: <FiSunrise size={22} />,
    titleKey: "reset",
    bodyKey: "resetBody",
  },
  {
    icon: <FiUsers size={22} />,
    titleKey: "peerLed",
    bodyKey: "peerLedBody",
  },
  {
    icon: <FiTrendingUp size={22} />,
    titleKey: "multiskilling",
    bodyKey: "multiskillingBody",
  },
];

// ─────────────────────────────────────────────────────────────
// STATIC TIMELINE DATA
// ─────────────────────────────────────────────────────────────
const TIMELINE = [
  {
    date: {
      en: "Jul 2018 E.C. · Jan 2026",
      am: "ጥር 04/2018 ዓ.ም",
      om: "Hagayya 2018 E.C. · Amajjii 2026",
    },
    org: {
      en: "Addis Ababa Traffic Management Authority",
      am: "የአዲስ አበባ ትራፊክ ማኔጅመንት ባለሥልጣን",
      om: "Murtii Bulchiinsa Tiraafikii Finfinnee",
    },
    en: "The Parking Administration team lead opened up about her path into public service — the community that raised her, the setbacks along the way, and how she works through challenges on the job. The session closed with an open Q&A with staff.",
    am: "የፓርኪንግ አስተዳደር ቡድን መሪ የህይወት ጉዞዋን አካፍላለች — ስላደገችበት ማህበረሰብ፣ ስላጋጠሟት ተግዳሮቶች እና በስራ ቦታ ውጤታማ ለመሆን ስለተጠቀመችባቸው መንገዶች ተናገረች። መርሃ-ግብሩ በሰራተኞች ጥያቄና መልስ ተጠናቋል።",
    om: "Hoogganaan garee bulchiinsa paarkii waan gahii tajaajila ummataa keessa seenuu irratti ifa baase — hawaasa inni ishee guddisse, dadhabbiin karaa irratti, fi akka itti rakkina hojii irratti itti hojjatu. Walga'iin gaaffii fi deebii hafteewwan waliin xumurame.",
  },
  {
    date: {
      en: "Feb 2, 2026 · Tir 25, 2018 E.C.",
      am: "የካቲት 2፣ 2026 · ጥር 25/2018 ዓ.ም",
      om: "Guraandhala 2, 2026 · Tir 25, 2018 E.C.",
    },
    org: {
      en: "Addis Ababa Food & Drug Authority",
      am: "የአዲስ አበባ ምግብና መድሃኒት ባለስልጣን",
      om: "Murtii Qoricha fi Nyaata Finfinnee",
    },
    en: 'The Deputy Director General for Administration made the case for multiskilling directly: relying on one skill set "is no longer sufficient" in a fast-changing world, and staff were urged to build versatility across both technical and general knowledge.',
    am: "የአስተዳደር ዘርፍ ም/ዋና ዳይሬክተር ስለ ብዙ ክህሎት አስፈላጊነት አብራሩ፤ በፍጥነት በሚቀያየር ዓለም ውስጥ በአንድ ክህሎት ብቻ መተማመን በቂ አለመሆኑን ገልጸው፣ ሰራተኞች በቴክኖሎጂና በተለያዩ የእውቀት መስኮች እራሳቸውን እንዲያዳብሩ አሳሰቡ።",
    om: "Dirreectoraan Morkii Bulchiinsa kallattiin waan dandeettii baay'ee barbaachisu dubbate: dandeettii tokko irratti of hundaa'uun 'ammas ga'aa miti' addunyaa saffisaa jiru keessatti, hojjattoonnis dandeettii ogummaa fi beekumsa waliigalaa keessatti of tolchuuf jajjabeessan.",
  },
  {
    date: {
      en: "Aug 19, 2017 E.C.",
      am: "ነሐሴ 19/2017 ዓ.ም",
      om: "Hagayya 19, 2017 E.C.",
    },
    org: {
      en: "Addis Ababa Food & Drug Authority",
      am: "የአዲስ አበባ ምግብና መድሃኒት ባለስልጣን",
      om: "Murtii Qoricha fi Nyaata Finfinnee",
    },
    en: "A wide-ranging discussion on what success actually takes — staying the course, building a resilient mindset, and committing to continuous growth — with participants also weighing in on the authority's recognition program.",
    am: "ስኬት ምን እንደሚጠይቅ ላይ ሰፊ ውይይት ተካሂዷል — ጉዞን መቀጠል፣ ጠንካራ አስተሳሰብ መገንባትና ለቀጣይ እድገት ቁርጠኝነት፤ ተሳታፊዎችም ስለ ባለስልጣኑ የእውቅና መርሃ-ግብር አስተያየታቸውን ሰጥተዋል።",
    om: "Marii bal'aa waan milkaa'in dhugaa barbaadu irratti — karaa itti fufuu, yaada jabaa ijaaruu, fi guddina itti fufuuf of kennuu — qoodduun yeroo sanatti sagantaa beekumsaa murtiirratti yaada isaanii dabalan.",
  },
  {
    date: {
      en: "Jun 9, 2017 E.C.",
      am: "ሰኔ 09/2017 ዓ.ም",
      om: "Waxabajjii 9, 2017 E.C.",
    },
    org: {
      en: "Addis Ababa Food & Drug Authority",
      am: "የአዲስ አበባ ምግብና መድሃኒት ባለስልጣን",
      om: "Murtii Qoricha fi Nyaata Finfinnee",
    },
    en: "A hands-on training on the standard performance registration form — how it's calculated, documented, and used as the basis for staff evaluation going forward.",
    am: "በመደበኛ የአፈጻጸም ምዝገባ ቅጽ አጠቃቀም ላይ ተግባራዊ ስልጠና ተሰጥቷል — አፈጻጸም እንዴት እንደሚሰላ፣ እንደሚመዘገብና ለወደፊት ግምገማ መሰረት እንደሚሆን ተብራርቷል።",
    om: "Leenjiin harkaan unka galmee hojii idileetti - akka itti lakkaa'amu, galmeeffamu, fi madaallii hojjattootaa itti fufuuf bu'uura ta'u irratti kenname.",
  },
  {
    date: {
      en: "2018 E.C. Planning",
      am: "የ2018 ዓ.ም እቅድ",
      om: "Karoora 2018 E.C.",
    },
    org: {
      en: "Addis Ababa Food & Drug Authority — HR Directorate",
      am: "የአዲስ አበባ ምግብና መድሃኒት ባለስልጣን — የሰው ሀብት አመራር",
      om: "Murtii Qoricha fi Nyaata Finfinnee - Bulchiinsa Hojjattoota",
    },
    en: "HR leadership confirmed the program continues weekly (2:00–2:50) with a mayor's-office mandate behind it, plus a planned breakfast component and short add-on trainings.",
    am: "የሰው ሀብት አመራር መርሃ-ግብሩ በየሳምንቱ ከ2፡00–2፡50 እንደሚቀጥል አረጋግጦ፣ ይህም ከከንቲባ ጽ/ቤት አቅጣጫ የመነጨ መሆኑን፣ ተጨማሪ የቁርስ ፕሮግራምና አጫጭር ስልጠናዎች እንደሚካተቱ ገልጿል።",
    om: "Hooggantoonni HR akka sagantaan torbaniin (2:00–2:50) itti fufuuf akka yaadu mirkaneessan, kunis ajaja biiroo maayiraa irraa kan dhufe, akkasumas sagantaa ciree fi leenjii gabaabaa itti dabalamu.",
  },
];

const MESOB_POINTS = [
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
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function GoldenMonday() {
  const { t, language } = useLanguage();
  const copy = t?.goldenMonday || {};
  const [visible, setVisible] = useState({});
  const sectionRefs = useRef({});
  const { isLeaderOrAbove } = useAuth();

  // ── Persisted sessions (from the AI-backed API) ──────────
  const [dbSessions, setDbSessions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  // ── AI session composer ───────────────────────────────────
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({
    title: "",
    organization: "",
    speaker: "",
    date: new Date().toISOString().slice(0, 10),
    rawNotes: "",
  });
  const [generating, setGenerating] = useState(false);

  // ── AI topic suggestions ──────────────────────────────────
  const [topics, setTopics] = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // ── Load sessions using useCallback ──
  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await goldenMondayAPI.getAll();
      setDbSessions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load Golden Monday sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load sessions on mount ──
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        await loadSessions();
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [loadSessions]);

  const handleFormChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleGenerateAndSave = async () => {
    if (!form.title.trim() || !form.rawNotes.trim()) {
      showToast(copy.aiFormTitle + " / " + copy.aiFormNotes, "warning");
      return;
    }
    try {
      setGenerating(true);
      const res = await goldenMondayAPI.create(form);
      setDbSessions((prev) => [res.data, ...prev]);
      setForm({
        title: "",
        organization: "",
        speaker: "",
        date: new Date().toISOString().slice(0, 10),
        rawNotes: "",
      });
      setShowComposer(false);
      showToast(
        copy.aiSaved || "Session saved with an AI-generated recap.",
        "success",
      );
    } catch (error) {
      console.error("Golden Monday AI recap failed:", error);
      showToast(
        error.response?.data?.message ||
          copy.aiError ||
          "AI couldn't complete that — please try again in a moment.",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestTopics = async () => {
    try {
      setLoadingTopics(true);
      const res = await goldenMondayAPI.suggestTopics();
      setTopics(Array.isArray(res.data?.topics) ? res.data.topics : []);
    } catch (error) {
      console.error("Golden Monday topic suggestions failed:", error);
      showToast(
        error.response?.data?.message ||
          copy.aiError ||
          "AI couldn't complete that — please try again in a moment.",
        "error",
      );
    } finally {
      setLoadingTopics(false);
    }
  };

  // ── Register refs using useCallback to avoid render-time access ──
  const registerRef = useCallback(
    (key) => (el) => {
      if (el) {
        sectionRefs.current[key] = el;
      }
    },
    [],
  );

  // ── Intersection Observer for scroll animations ──
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

    // Get current refs and observe them
    const currentRefs = { ...sectionRefs.current };
    const elements = Object.values(currentRefs).filter(Boolean);
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const revealStyle = (key) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  });

  const combinedTimeline = [
    ...dbSessions.map((s) => ({
      _id: s._id,
      live: true,
      date: {
        en: new Date(s.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        am: new Date(s.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        om: new Date(s.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      },
      org: {
        en: s.organization || "Addis MESOB",
        am: s.organization || "አዲስ መሶብ",
        om: s.organization || "Addis MESOB",
      },
      en: s.recapEn || s.rawNotes,
      am: s.recapAm || s.recapEn || s.rawNotes,
      om: s.recapAm || s.recapEn || s.rawNotes,
    })),
    ...TIMELINE,
  ];

  // Get pillar content from translations
  const getPillarContent = (key) => {
    const pillarMap = {
      reset: {
        title: copy.pillarResetTitle || "A weekly reset",
        body:
          copy.pillarResetBody ||
          "Every Monday morning, offices across the city administration pause the routine for shared learning — a deliberate start to the work week instead of a rushed one.",
      },
      peerLed: {
        title: copy.pillarPeerTitle || "Peer-led, not top-down",
        body:
          copy.pillarPeerBody ||
          "Sessions are usually carried by colleagues themselves — department heads, team leaders, and long-serving staff sharing real experience, not scripted lectures.",
      },
      multiskilling: {
        title: copy.pillarMultiTitle || "Built for multiskilling",
        body:
          copy.pillarMultiBody ||
          "The stated goal is to push every employee beyond a single fixed skill set — technology literacy, service standards, and adaptability all get airtime over time.",
      },
    };
    return pillarMap[key] || { title: "", body: "" };
  };

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
      `}</style>

      {/* ── HERO ─────────────────────────────────────────── */}
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
            {copy.eyebrow || "Every Monday · 2:00 – 2:50"}
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
            {copy.title || "Golden Monday"}
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
            {copy.subtitle ||
              "The city administration's weekly ritual for shared learning — and the philosophy behind why Addis MESOB exists at all."}
          </p>

          <a
            href="#gm-pillars"
            style={{
              marginTop: 34,
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
            {copy.scroll || "Explore the story"}
            <FiChevronDown size={16} />
          </a>
        </div>
      </section>

      {/* ── PILLARS ──────────────────────────────────────── */}
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
          title={copy.pillarsTitle || "Why a golden morning"}
          sub={copy.pillarsSub || "Three things every session comes back to."}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 28,
          }}
        >
          {PILLARS_KEYS.map((p, i) => {
            const content = getPillarContent(p.titleKey);
            return (
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
                  {p.icon}
                </div>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: 16,
                    color: C.dark,
                    fontFamily: F.serif,
                  }}
                >
                  {content.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: C.muted,
                  }}
                >
                  {content.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── AI SESSION STUDIO (leader/admin only) ───────────── */}
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
            title={copy.aiTitle || "AI session recap"}
            sub={
              copy.aiSub ||
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
                  {copy.aiNewSession || "Log a new session"}
                </button>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <input
                    placeholder={copy.aiFormTitle || "Session title"}
                    value={form.title}
                    onChange={handleFormChange("title")}
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                      placeholder={copy.aiFormOrg || "Organization"}
                      value={form.organization}
                      onChange={handleFormChange("organization")}
                      style={{ ...inputStyle, flex: "1 1 160px" }}
                    />
                    <input
                      placeholder={
                        copy.aiFormSpeaker || "Speaker / facilitator"
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
                      copy.aiFormNotes ||
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
                      {copy.aiCancel || "Cancel"}
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
                          {copy.aiGenerating || "Writing recap…"}
                        </>
                      ) : (
                        <>
                          <FiSend size={14} />
                          {copy.aiGenerate || "Generate & save with AI"}
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
                  <FiSun size={16} color={C.gold} />{" "}
                  {/* ✅ Replaced FiLightbulb with FiSun */}
                  {copy.aiTopicsTitle || "AI: suggest next topics"}
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
                    ? copy.aiTopicsLoading || "Thinking of topics…"
                    : copy.aiTopicsBtn || "Suggest topics"}
                </button>
              </div>

              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {topics === null && (
                  <p style={{ fontSize: 12.5, color: "#a9b3e0", margin: 0 }}>
                    {copy.aiTopicsEmpty ||
                      "Log a couple of sessions first so AI has something to build on."}
                  </p>
                )}
                {topics?.length === 0 && (
                  <p style={{ fontSize: 12.5, color: "#a9b3e0", margin: 0 }}>
                    {copy.aiTopicsEmpty ||
                      "Log a couple of sessions first so AI has something to build on."}
                  </p>
                )}
                {topics?.map((t, i) => (
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
                      {t.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#c9d0f0",
                        lineHeight: 1.5,
                      }}
                    >
                      {t.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── PRESENTER ROTATION & RECORDINGS ─────────────────── */}
      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 32px) 40px",
        }}
      >
        <GoldenMondayRotationPanel />
      </section>

      {/* ── TIMELINE ─────────────────────────────────────── */}
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
          title={copy.timelineTitle || "Recent sessions"}
          sub={copy.timelineSub || "A running record, not a one-off event."}
        />
        <div style={{ marginTop: 30, position: "relative" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 15,
              top: 8,
              bottom: 8,
              width: 2,
              background: `linear-gradient(${C.gold}, ${C.primary})`,
            }}
          />
          {combinedTimeline.map((item, i) => (
            <div
              key={item._id || i}
              style={{
                display: "flex",
                gap: 20,
                marginBottom: 30,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: C.white,
                  border: `3px solid ${item.live ? C.gold : C.primary}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: item.live ? C.gold : C.primary,
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                {item.live ? (
                  <FiStar size={14} /> /* ✅ Replaced FiSparkles with FiStar */
                ) : (
                  combinedTimeline.length - i
                )}
              </div>
              <div
                className="gm-card"
                style={{
                  background: C.white,
                  border: `1px solid ${item.live ? C.gold + "88" : C.border}`,
                  borderRadius: 14,
                  padding: "16px 20px",
                  flex: 1,
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.primary,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {item.org[language] || item.org.en}
                    {item.live && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: C.dark,
                          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                          padding: "2px 7px",
                          borderRadius: 999,
                          letterSpacing: 0.3,
                        }}
                      >
                        {copy.aiLive || "AI-generated"}
                      </span>
                    )}
                  </span>
                  <span
                    style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}
                  >
                    {item.date[language] || item.date.en}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: "#334",
                  }}
                >
                  {item[language] || item.en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MESOB PLATFORM ───────────────────────────────── */}
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
                title={copy.mesobTitle || "The platform this mindset built"}
                sub={
                  copy.mesobSub ||
                  "MESOB is the city's one-stop digital service platform — the same drive for less friction, applied to how residents actually get things done."
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
                {copy.mesobCta || "Open Document Vault"}
                <FiArrowRight size={16} />
              </a>
            </div>

            <div style={{ flex: "1 1 380px", display: "grid", gap: 12 }}>
              {MESOB_POINTS.map((pt, i) => (
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
                    {pt[language] || pt.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING ──────────────────────────────────────── */}
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
          {copy.closingTitle || "Start your week here"}
        </h3>
        <p
          style={{
            color: C.muted,
            fontSize: 14,
            maxWidth: 440,
            margin: "0 auto",
          }}
        >
          {copy.closingBody ||
            "Golden Monday is a standing fixture — check back weekly for the next session's write-up."}
        </p>
      </section>
    </div>
  );
}
