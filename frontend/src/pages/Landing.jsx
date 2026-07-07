// src/pages/Landing.jsx
// ════════════════════════════════════════════════════════════
// Public system-wide landing page for Addis MESOB.
// Shown to unauthenticated visitors at "/". Introduces the whole
// platform (not a single feature) and funnels into /login.
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../styles/theme";
import { useLanguage } from "../hooks/useLanguage";
import { LANGUAGES } from "../constants/translations";
import { SERVICES } from "../constants/services";
import mesobLogo from "../assets/mesoblogo.png";
import heroArt from "../assets/hero.png";
import {
  FiGrid,
  FiMessageSquare,
  FiStar,
  FiFileText,
  FiBarChart2,
  FiUsers,
  FiShield,
  FiGlobe,
  FiSunrise,
  FiCpu,
  FiArrowRight,
  FiChevronDown,
  FiCheckCircle,
  FiLogIn,
  FiMapPin,
  FiZap,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────
// STATIC BILINGUAL CONTENT
// ─────────────────────────────────────────────────────────────
const COPY = {
  eyebrow: {
    en: "Addis Ketema Sub-City · CRRSA Digital Services",
    am: "አዲስ ከተማ ክ/ከተማ · የCRRSA ዲጂታል አገልግሎቶች",
    om: "Magaalaa Addis Ketema · Tajaajila Dijitaalaa CRRSA",
  },
  heroTitle: {
    en: "One platform for every CRRSA service.",
    am: "ለሁሉም የCRRSA አገልግሎቶች አንድ መድረክ።",
    om: "Waltajjii tokko tajaajila CRRSA hunda dura.",
  },
  heroBody: {
    en: "Addis MESOB brings registration, evaluation, reporting, document handling, and AI-assisted service management into one digital front door for Addis Ketema sub-city's civil registration and residency departments.",
    am: "አዲስ መሶብ ምዝገባን፣ ግምገማን፣ ሪፖርት ማድረግን፣ የሰነድ አያያዝንና በአርቴፊሻል ኢንተለጀንስ የታገዘ የአገልግሎት አስተዳደርን ለአዲስ ከተማ ክ/ከተማ የሲቪል ምዝገባና ነዋሪነት መምሪያዎች በአንድ ዲጂታል በር ስር ያመጣል።",
    om: "Addis MESOB galmee, madaallii, gabaasa, qabiinsa ragaa fi bulchiinsa tajaajilaa AI-tiin deeggaramu, kutaalee bulchiinsa galmee lammummaa fi jireenyaa magaalaa Addis Ketema tokkicha keessatti walitti fida.",
  },
  ctaPrimary: {
    en: "Sign in to your account",
    am: "ወደ መለያዎ ይግቡ",
    om: "Gara Herrega Keetii Seeni",
  },
  ctaSecondary: {
    en: "Explore what's inside",
    am: "የያዘውን ይመልከቱ",
    om: "Waan Keessa Jiru Ilaali",
  },
  statServices: {
    en: "Digital services",
    am: "ዲጂታል አገልግሎቶች",
    om: "Tajaajiloota Dijitaalaa",
  },
  statAgencies: {
    en: "Partner agencies",
    am: "አጋር ተቋማት",
    om: "Dhaabbilee Hiriyaa",
  },
  statLanguages: {
    en: "Languages supported",
    am: "የሚደገፉ ቋንቋዎች",
    om: "Afaanota Deeggaraman",
  },
  statAI: {
    en: "AI-assisted",
    am: "በAI የታገዘ",
    om: "AI-n Deeggarame",
  },
  featuresEyebrow: {
    en: "One login, every tool",
    am: "አንድ መግቢያ፣ ሁሉም መሳሪያ",
    om: "Seensa Tokko, Meeshaa Hunda",
  },
  featuresTitle: {
    en: "Everything your team needs, in one place",
    am: "ቡድንዎ የሚያስፈልገው ሁሉ በአንድ ቦታ",
    om: "Wanti Garee Keessan Barbaadu Hundi Bakka Tokkotti",
  },
  featuresSub: {
    en: "Access adapts automatically to your role — employee, team leader, admin, or super admin.",
    am: "ተደራሽነት እንደ ሚና ደረጃዎ በራስ-ሰር ይስተካከላል — ሰራተኛ፣ ቡድን መሪ፣ አድሚን ወይም ሱፐር አድሚን።",
    om: "Dhaqqabamummaan akkaataa gahee keetiitiin ofumaan sirreeffama — hojjetaa, hoogganaa garee, admin, ykn super admin.",
  },
  howEyebrow: {
    en: "How it works",
    am: "እንዴት እንደሚሰራ",
    om: "Akkaataa Hojjatuu",
  },
  howTitle: {
    en: "Three steps from login to done",
    am: "ከመግቢያ እስከ ማጠናቀቅ ሶስት ደረጃዎች",
    om: "Seensaa hanga Xumuraatti Tarkaanfii Sadii",
  },
  gmEyebrow: {
    en: "The philosophy behind it",
    am: "ከበስተጀርባ ያለው ፍልስፍና",
    om: "Yaad-rimee Duuba Jiru",
  },
  gmTitle: {
    en: "Built on the Golden Monday mindset",
    am: "በወርቃማ ሰኞ አስተሳሰብ ላይ የተገነባ",
    om: "Yaad-rimee Wiixata Warqee Irratti Ijaarame",
  },
  gmBody: {
    en: "Addis Ketema's weekly Golden Monday (ወርቃማ ሰኞ) sessions push every employee toward multiskilling and peer-led learning. Addis MESOB is that same drive for less friction, applied to how residents actually get things done — and the program itself now lives inside the platform for every signed-in team.",
    am: "የአዲስ ከተማ ሳምንታዊ ወርቃማ ሰኞ ስብሰባዎች እያንዳንዱን ሰራተኛ ወደ ብዙ ክህሎትና በእኩዮች ወደሚመራ ትምህርት ይገፋፋሉ። አዲስ መሶብ ያንኑ ግፊት ወደ ነዋሪዎች ትክክለኛ አገልግሎት አሰጣጥ ተግባራዊ ያደርገዋል — ፕሮግራሙም ራሱ ለተመዘገበ እያንዳንዱ ቡድን በመድረኩ ውስጥ ይገኛል።",
    om: "Walga'iiwwan Wiixata Warqee (ወርቃማ ሰኞ) torbaniin Addis Ketema hojjetaa hunda gara dandeettii hedduu fi barnoota hiriyaan durfamu geggeessa. Addis MESOB dhiibbaa wal fakkaataa kanaan rakkina hir'isuun, akkaataa jiraattoonni dhugumaan waan hojjetan irratti hojjeta — sagantichi mataan isaas amma garee seenan hundaaf waltajjicha keessatti argama.",
  },
  gmCta: {
    en: "Sign in to view this week's session",
    am: "የዚህ ሳምንት ስብሰባን ለማየት ይግቡ",
    om: "Walga'ii Torban Kanaa Ilaaluuf Seeni",
  },
  footerTagline: {
    en: "A one-stop digital service platform for Addis Ketema sub-city.",
    am: "ለአዲስ ከተማ ክ/ከተማ የአንድ ማዕከል ዲጂታል አገልግሎት መድረክ።",
    om: "Waltajjii tajaajila dijitaalaa bakka tokkotti kutaa magaalaa Addis Ketema-tiif.",
  },
};

const FEATURES = [
  {
    icon: <FiBarChart2 size={22} />,
    title: {
      en: "Dashboard & Analytics",
      am: "ዳሽቦርድና ትንተና",
      om: "Daashboordii fi Xiinxala",
    },
    body: {
      en: "Live overview of team performance, submissions, and trends, with drill-down reports for leaders and admins.",
      am: "የቡድን አፈጻጸም፣ ማስገቢያዎችና አዝማሚያዎች ቀጥታ ዕይታ፣ ለመሪዎችና አድሚኖች ዝርዝር ሪፖርቶች ጋር።",
      om: "Ilaalcha yeroo dhugaa raawwii garee, galmee fi ce'umsaa, gabaasa bal'aa hoogganootaa fi admin-oota waliin.",
    },
  },
  {
    icon: <FiMessageSquare size={22} />,
    title: { en: "Peer Forum", am: "የእኩዮች መድረክ", om: "Waltajjii Hiriyootaa" },
    body: {
      en: "A shared space for teams to discuss cases, ask questions, and learn from one another day to day.",
      am: "ቡድኖች ጉዳዮችን ለመወያየት፣ ጥያቄ ለመጠየቅና በየቀኑ ከእርስ በርስ ለመማር የሚጠቀሙበት የጋራ ቦታ።",
      om: "Bakka waloo garee waliin haala dubbachuuf, gaaffii gaafachuuf, fi guyyaa guyyaan waliin baruuf.",
    },
  },
  {
    icon: <FiStar size={22} />,
    title: { en: "Evaluation", am: "ግምገማ", om: "Madaallii" },
    body: {
      en: "Structured, criteria-based staff evaluation that feeds directly into recognition and growth planning.",
      am: "በተዋቀሩ መስፈርቶች ላይ የተመሰረተ የሰራተኛ ግምገማ ለእውቅናና ለእድገት እቅድ በቀጥታ ግብዓት የሚሆን።",
      om: "Madaallii hojjetaa ulaagaa irratti hundaa'e kan beekamtii fi karoora guddinaatiif kallattiin galtee ta'u.",
    },
  },
  {
    icon: <FiFileText size={22} />,
    title: {
      en: "Daily Reports & Forum Reports",
      am: "ዕለታዊ ሪፖርትና የመድረክ ሪፖርት",
      om: "Gabaasa Guyyaa fi Waltajjii",
    },
    body: {
      en: "Team leaders log daily activity once — it flows into analytics, PDFs, and leadership reviews automatically.",
      am: "ቡድን መሪዎች ዕለታዊ እንቅስቃሴን አንዴ ይመዘግባሉ — ወደ ትንተና፣ PDFና የአመራር ግምገማ ራሱ በራሱ ይፈስሳል።",
      om: "Hoogganoonni garee sochii guyyaa yeroo tokko galmeessu — gara xiinxalaa, PDF, fi ilaalcha hooggantootaatti ofumaan dabra.",
    },
  },
  {
    icon: <FiGrid size={22} />,
    title: {
      en: "Service Catalogue",
      am: "የአገልግሎት ካታሎግ",
      om: "Kaataloogii Tajaajilaa",
    },
    body: {
      en: "The full CRRSA service list across every partner agency, kept current by admins in one shared registry.",
      am: "በሁሉም አጋር ተቋማት የተሟላ የCRRSA አገልግሎት ዝርዝር፣ በአድሚኖች በአንድ የጋራ መዝገብ ውስጥ ወቅታዊ ሆኖ የሚቆይ።",
      om: "Tarreeffama guutuu tajaajila CRRSA dhaabbilee hiriyaa hunda keessatti, admin-oonni galmee waloo tokko keessatti haaromsan.",
    },
  },
  {
    icon: <FiShield size={22} />,
    title: {
      en: "CRRSA Document Vault",
      am: "የCRRSA ሰነድ ማከማቻ",
      om: "Kuusaa Ragaa CRRSA",
    },
    body: {
      en: "Secure, traceable document storage with Gemini vision auto-fill that reads a scanned form and populates it for you.",
      am: "ደህንነቱ የተጠበቀና ክትትል የሚደረግበት የሰነድ ማከማቻ፣ የተቃኘ ቅጽን በማንበብ ራስ-ሰር በሚሞላ Gemini vision ችሎታ የተደገፈ።",
      om: "Kuusaa ragaa nageenya qabu, hordoffii qabu, fi dandeettii Gemini vision-tiin unka sikaanamee dubbisee ofumaan guutu.",
    },
  },
  {
    icon: <FiCpu size={22} />,
    title: {
      en: "AI Assistant, everywhere",
      am: "የAI ረዳት፣ በየትም",
      om: "Deeggartuu AI, Bakka Hundatti",
    },
    body: {
      en: "A floating assistant and inline AI summaries across dashboards and reports, powered by Google Gemini.",
      am: "በዳሽቦርድና ሪፖርቶች ላይ ተንሳፋፊ ረዳትና በውስጥ የተካተቱ የAI ማጠቃለያዎች፣ በGoogle Gemini የተደገፉ።",
      om: "Deeggartuu dafqee fi cuunfaa AI dashboard fi gabaasaa keessatti, Google Gemini-tiin deeggarame.",
    },
  },
  {
    icon: <FiSunrise size={22} />,
    title: { en: "Golden Monday", am: "ወርቃማ ሰኞ", om: "Wiixata Warqee" },
    body: {
      en: "The city's weekly capacity-building program — session recaps, presenter rotation, and AI-suggested topics, right inside the app.",
      am: "የከተማው ሳምንታዊ የአቅም ግንባታ መርሃ-ግብር — የስብሰባ ማጠቃለያ፣ የአቅራቢ ሽክርክር እና በAI የተጠቆሙ ርዕሶች በመተግበሪያው ውስጥ።",
      om: "Sagantaa dandeettii ijaarsaa torbanii magaalaa — cuunfaa walga'ii, naanna'iinsa dhiheessituu, fi mata duree AI-n yaadame, appii keessatti.",
    },
  },
  {
    icon: <FiUsers size={22} />,
    title: {
      en: "Team & User Management",
      am: "የቡድንና ተጠቃሚ አስተዳደር",
      om: "Bulchiinsa Garee fi Fayyadamaa",
    },
    body: {
      en: "Admins and super admins manage teams, roles, and access from one control center — no spreadsheets required.",
      am: "አድሚኖችና ሱፐር አድሚኖች ቡድኖችን፣ ሚናዎችንና ተደራሽነትን ከአንድ መቆጣጠሪያ ማዕከል ያስተዳድራሉ — ስፕሬድሺት አያስፈልግም።",
      om: "Admin-oonni fi super admin-oonni garee, gahee, fi dhaqqabamummaa bakka bulchiinsaa tokko irraa bulchu — spreadsheet hin barbaachisu.",
    },
  },
  {
    icon: <FiGlobe size={22} />,
    title: {
      en: "Built for three languages",
      am: "ለሶስት ቋንቋዎች የተገነባ",
      om: "Afaan Sadiif Ijaarame",
    },
    body: {
      en: "Every screen works in English, Amharic, and Afaan Oromo, switchable at any time from the sidebar.",
      am: "እያንዳንዱ ገጽ በእንግሊዝኛ፣ በአማርኛና በአፋን ኦሮሞ ይሰራል፣ በማንኛውም ጊዜ ከጎን አሞሌ ሊቀየር ይችላል።",
      om: "Fuulli hundi Ingiliffaan, Amaariffaan, fi Afaan Oromootiin hojjeta, yeroo kamiyyuu sidebaar irraa jijjiiramuu danda'a.",
    },
  },
];

const STEPS = [
  {
    icon: <FiLogIn size={20} />,
    title: {
      en: "Sign in with your CRRSA account",
      am: "በCRRSA መለያዎ ይግቡ",
      om: "Herrega CRRSA Keetiin Seeni",
    },
    body: {
      en: "Your sub-city admin creates your account; you sign in and land straight on your dashboard.",
      am: "የክ/ከተማ አድሚንዎ መለያዎን ይፈጥራል፤ ይግቡና በቀጥታ ወደ ዳሽቦርድዎ ይደርሳሉ።",
      om: "Admin-iin kutaa magaalaa keetii herrega siif uuma; seentee kallattiin gara daashboordii keetiitti geessa.",
    },
  },
  {
    icon: <FiZap size={20} />,
    title: {
      en: "Your role decides what you see",
      am: "ሚናዎ የሚያዩትን ይወስናል",
      om: "Gaheen Kee Waan Argitu Murteessa",
    },
    body: {
      en: "Employees, team leaders, admins, and super admins each get exactly the tools their role needs — nothing more, nothing less.",
      am: "ሰራተኞች፣ ቡድን መሪዎች፣ አድሚኖችና ሱፐር አድሚኖች እያንዳንዳቸው ለሚናቸው የሚያስፈልጋቸውን መሳሪያ በትክክል ያገኛሉ።",
      om: "Hojjettoonni, hoogganoonni garee, admin-oonni, fi super admin-oonni tokkoon tokkoon isaanii meeshaa gaheen isaanii barbaadu qofa argatu.",
    },
  },
  {
    icon: <FiCheckCircle size={20} />,
    title: {
      en: "Work, report, and let AI help",
      am: "ይስሩ፣ ሪፖርት ያድርጉ፣ AIም ያግዝዎት",
      om: "Hojjedhu, Gabaasi, AI-nis si Gargaaru",
    },
    body: {
      en: "Log activity, evaluate staff, upload documents — AI summaries and the chatbot are one click away the whole time.",
      am: "እንቅስቃሴ ይመዝግቡ፣ ሰራተኛ ይገምግሙ፣ ሰነድ ይስቀሉ — የAI ማጠቃለያና ቻትቦት ሁልጊዜ በአንድ ጠቅታ ርቀት ላይ ናቸው።",
      om: "Sochii galmeessi, hojjetaa madaali, ragaa fe'i — cuunfaan AI fi chatbot-ni yeroo hunda tuqaa tokko fagaatu.",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// SECTION HEADING (shared visual language with in-app pages)
// ─────────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, sub, dark, center }) {
  return (
    <div style={{ textAlign: center ? "center" : "left" }}>
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
          fontSize: "clamp(24px, 4vw, 32px)",
          margin: 0,
          color: dark ? "#fff" : C.dark,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            marginTop: 10,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: dark ? "#a9b3e0" : C.muted,
            maxWidth: 580,
            margin: center ? "10px auto 0" : "10px 0 0",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Landing() {
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [visible, setVisible] = useState({});
  const sectionRefs = useRef({});

  const stats = useMemo(() => {
    const agencies = new Set(SERVICES.map((s) => s.deptEn)).size;
    return {
      services: SERVICES.length,
      agencies,
    };
  }, []);

  const registerRef = useCallback(
    (key) => (el) => {
      if (el) sectionRefs.current[key] = el;
    },
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((v) => ({ ...v, [entry.target.dataset.reveal]: true }));
          }
        });
      },
      { threshold: 0.12 },
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

  const goLogin = () => navigate("/login");

  return (
    <div style={{ fontFamily: F.sans, background: C.gray, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700;800&family=Noto+Serif+Ethiopic:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; }
        @keyframes lp-rise {
          0% { transform: translateY(6px); opacity: 0.85; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0.85; }
        }
        @keyframes lp-sweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .lp-card:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(13,26,94,0.14); }
        .lp-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 26px ${C.primary}55; }
        .lp-nav-link:hover { opacity: 0.75; }
        .lp-lang-btn:hover { opacity: 0.85; }
      `}</style>

      {/* ── TOP NAV ─────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(13,26,94,0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${C.primary}55`,
          padding: "12px clamp(16px, 5vw, 48px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={mesobLogo}
            alt="Addis MESOB"
            style={{ width: 34, height: 34, borderRadius: 8 }}
          />
          <span
            style={{
              fontFamily: F.serif,
              fontWeight: 800,
              fontSize: 18,
              color: "#fff",
            }}
          >
            Addis MESOB
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <a
            href="#features"
            className="lp-nav-link"
            style={{
              color: "#c9d0f0",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              display: window.innerWidth < 560 ? "none" : "inline",
            }}
          >
            Features
          </a>
          <div style={{ display: "flex", gap: 4 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className="lp-lang-btn"
                onClick={() => changeLanguage(l.code)}
                title={l.label}
                style={{
                  background:
                    language === l.code ? C.gold : "rgba(255,255,255,0.08)",
                  color: language === l.code ? C.dark : "#c9d0f0",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: F.sans,
                }}
              >
                {l.flag}
              </button>
            ))}
          </div>
          <button
            onClick={goLogin}
            className="lp-cta"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
              color: C.dark,
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <FiLogIn size={14} />
            {COPY.ctaPrimary[language] || COPY.ctaPrimary.en}
          </button>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(120deg, ${C.dark} 0%, ${C.primary} 45%, #b8860b 100%)`,
          backgroundSize: "220% 220%",
          animation: "lp-sweep 16s ease infinite alternate",
          padding:
            "clamp(48px, 8vw, 80px) clamp(20px, 6vw, 64px) clamp(56px, 8vw, 80px)",
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
            animation: "lp-rise 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            gap: 40,
            alignItems: "center",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ flex: "1 1 480px" }}>
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
              <FiMapPin size={13} />
              {COPY.eyebrow[language] || COPY.eyebrow.en}
            </div>

            <h1
              style={{
                fontFamily: F.serif,
                fontSize: "clamp(32px, 6vw, 54px)",
                fontWeight: 900,
                lineHeight: 1.12,
                margin: 0,
              }}
            >
              {COPY.heroTitle[language] || COPY.heroTitle.en}
            </h1>

            <p
              style={{
                fontSize: "clamp(15px, 2.2vw, 18px)",
                lineHeight: 1.65,
                color: "#eaeeff",
                maxWidth: 620,
                marginTop: 22,
              }}
            >
              {COPY.heroBody[language] || COPY.heroBody.en}
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 32,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={goLogin}
                className="lp-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                  color: C.dark,
                  border: "none",
                  padding: "13px 24px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: F.sans,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {COPY.ctaPrimary[language] || COPY.ctaPrimary.en}
                <FiArrowRight size={16} />
              </button>
              <a
                href="#features"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "1.5px solid rgba(255,255,255,0.35)",
                  padding: "13px 22px",
                  borderRadius: 10,
                }}
              >
                {COPY.ctaSecondary[language] || COPY.ctaSecondary.en}
                <FiChevronDown size={16} />
              </a>
            </div>

            {/* Quick stats */}
            <div
              style={{
                display: "flex",
                gap: 28,
                marginTop: 44,
                flexWrap: "wrap",
              }}
            >
              {[
                [stats.services + "+", COPY.statServices],
                [stats.agencies, COPY.statAgencies],
                ["3", COPY.statLanguages],
                ["AI", COPY.statAI],
              ].map(([num, label], i) => (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: 28,
                      fontWeight: 900,
                      color: C.goldLight,
                    }}
                  >
                    {num}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#c9d0f0",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {label[language] || label.en}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              flex: "1 1 320px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={heroArt}
              alt=""
              style={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 20,
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section
        id="features"
        ref={registerRef("features")}
        data-reveal="features"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(48px, 8vw, 76px) clamp(20px, 6vw, 40px) 12px",
          ...revealStyle("features"),
        }}
      >
        <SectionHeading
          eyebrow={COPY.featuresEyebrow[language] || COPY.featuresEyebrow.en}
          title={COPY.featuresTitle[language] || COPY.featuresTitle.en}
          sub={COPY.featuresSub[language] || COPY.featuresSub.en}
          center
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginTop: 36,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="lp-card"
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
                {f.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 16,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                {f.title[language] || f.title.en}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: C.muted,
                }}
              >
                {f.body[language] || f.body.en}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section
        ref={registerRef("how")}
        data-reveal="how"
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "clamp(48px, 8vw, 76px) clamp(20px, 6vw, 40px) 12px",
          ...revealStyle("how"),
        }}
      >
        <SectionHeading
          eyebrow={COPY.howEyebrow[language] || COPY.howEyebrow.en}
          title={COPY.howTitle[language] || COPY.howTitle.en}
          center
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 32,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                background: C.white,
                borderRadius: 16,
                padding: 22,
                border: `1px solid ${C.border}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -14,
                  left: 20,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                  color: C.dark,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 13,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: C.bg,
                  color: C.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                  marginTop: 6,
                }}
              >
                {s.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 15,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                {s.title[language] || s.title.en}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: C.muted,
                }}
              >
                {s.body[language] || s.body.en}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GOLDEN MONDAY TEASER ─────────────────────────── */}
      <section
        ref={registerRef("gm")}
        data-reveal="gm"
        style={{
          background: C.dark,
          color: "#fff",
          marginTop: 24,
          padding: "clamp(48px, 8vw, 76px) clamp(20px, 6vw, 40px)",
          ...revealStyle("gm"),
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            gap: 32,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
              color: C.dark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FiSunrise size={30} />
          </div>
          <div style={{ flex: "1 1 480px" }}>
            <SectionHeading
              eyebrow={COPY.gmEyebrow[language] || COPY.gmEyebrow.en}
              title={COPY.gmTitle[language] || COPY.gmTitle.en}
              sub={COPY.gmBody[language] || COPY.gmBody.en}
              dark
            />
            <button
              onClick={goLogin}
              className="lp-cta"
              style={{
                marginTop: 22,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                color: C.dark,
                border: "none",
                padding: "12px 22px",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: F.sans,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {COPY.gmCta[language] || COPY.gmCta.en}
              <FiArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer
        style={{
          background: "#091350",
          color: "#c9d0f0",
          padding: "32px clamp(20px, 6vw, 40px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <img
            src={mesobLogo}
            alt="Addis MESOB"
            style={{ width: 26, height: 26, borderRadius: 6 }}
          />
          <span style={{ fontFamily: F.serif, fontWeight: 800, color: "#fff" }}>
            Addis MESOB
          </span>
        </div>
        <p style={{ fontSize: 12.5, margin: "0 0 6px" }}>
          {COPY.footerTagline[language] || COPY.footerTagline.en}
        </p>
        <p style={{ fontSize: 11, color: "#7a8fc8", margin: 0 }}>
          © {new Date().getFullYear()} Addis Ketema Sub-City · CRRSA
        </p>
      </footer>
    </div>
  );
}
