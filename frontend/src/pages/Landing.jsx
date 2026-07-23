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
import { publicAPI } from "../services/api";
import mesobLogo from "../assets/mesoblogo.png";
import {
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
  FiMenu,
  FiX,
  FiArrowUp,
  FiHelpCircle,
  FiMail,
  FiSearch,
  FiGrid,
  FiTool,
  FiPackage,
  FiBox,
  FiCheck,
  FiBriefcase,
  FiSettings,
  FiAward,
  FiUser,
  FiClock,
  FiCalendar,
  FiPhone,
  FiLoader,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────
// TOKENS — extending the existing brand palette, not replacing it
// ─────────────────────────────────────────────────────────────
const T = {
  ink: "#060b2e",
  paper: "#fbfaf6",
  weave: "rgba(245,197,24,0.14)",
};

// ─────────────────────────────────────────────────────────────
// COPY
// ─────────────────────────────────────────────────────────────
const LANDING_COPY = {
  eyebrow: {
    en: "Digital Ethiopia · Addis MESOB Platform",
    am: "ዲጂታል ኢትዮጵያ · አዲስ መሶብ መድረክ",
    om: "Itoophiyaa Dijitaalaa · Addis MESOB Platform",
  },
  heroTitle: {
    en: "Every service, in one basket.",
    am: "ሁሉም አገልግሎት፣ በአንድ መሶብ።",
    om: "Tajaajila Hunda, Guuboo Tokko Keessatti.",
  },
  heroBody: {
    en: "For generations, a mesob has meant many dishes served from one vessel. Addis MESOB carries that same idea into government service — registration, evaluation, reporting, documents, and AI assistance, gathered into one digital basket for staff and citizens alike.",
    am: "ለብዙ ትውልዶች መሶብ ማለት ከአንድ ዕቃ የሚቀርቡ የተለያዩ ምግቦችን ማለት ነው። አዲስ መሶብ ይህንኑ ሀሳብ ወደ መንግስት አገልግሎት ያመጣል — ምዝገባ፣ ግምገማ፣ ሪፖርት፣ ሰነድ እና በAI የታገዘ ድጋፍ በአንድ ዲጂታል መሶብ ውስጥ ተሰብስበዋል።",
    om: "Dhaloota hedduuf, gubbeen waan nyaata garaagaraa meeshaa tokko irraa dhiheessu jechuudha. Addis MESOB yaadicha gara tajaajila mootummaatti fida — galmee, madaallii, gabaasa, ragaa, fi deeggarsa AI, hundi gubbeen dijitaalaa tokko keessatti walitti qabaman.",
  },
  ctaPrimary: {
    en: "Sign in to your account",
    am: "ወደ መለያዎ ይግቡ",
    om: "Gara Herrega Keetii Seeni",
  },
  ctaSecondary: {
    en: "See what's inside",
    am: "የያዘውን ይመልከቱ",
    om: "Waan Keessa Jiru Ilaali",
  },
  statServices: { en: "Services", am: "አገልግሎቶች", om: "Tajaajiloota" },
  statAgencies: { en: "Agencies", am: "ተቋማት", om: "Dhaabbilee" },
  statLanguages: { en: "Languages", am: "ቋንቋዎች", om: "Afaanota" },
  statAI: { en: "AI-assisted", am: "በAI የተደገፈ", om: "AI-n Deeggarame" },
  deptsEyebrow: {
    en: "One login, every department",
    am: "አንድ መግቢያ፣ ሁሉም ክፍል",
    om: "Seensa Tokko, Kutaa Hunda",
  },
  featuresEyebrow: {
    en: "What's inside the basket",
    am: "በመሶቡ ውስጥ ያለው",
    om: "Wanti Guuboo Keessa Jiru",
  },
  featuresTitle: {
    en: "Everything your organization needs, in one place",
    am: "ድርጅትዎ የሚያስፈልገው ሁሉ በአንድ ቦታ",
    om: "Wanti Dhaabbileen Keessan Barbaadu Hundi Bakka Tokkotti",
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
    en: "Ethiopia's weekly Golden Monday (ወርቃማ ሰኞ) sessions push every employee toward multiskilling and peer-led learning. Addis MESOB carries that same drive for less friction into how citizens actually get things done — and the program itself now lives inside the platform for every signed-in team.",
    am: "የኢትዮጵያ ሳምንታዊ ወርቃማ ሰኞ ስብሰባዎች እያንዳንዱን ሰራተኛ ወደ ብዙ ክህሎትና በእኩዮች ወደሚመራ ትምህርት ይገፋፋሉ። አዲስ መሶብ ያንኑ ግፊት ወደ ዜጎች ትክክለኛ አገልግሎት አሰጣጥ ተግባራዊ ያደርገዋል — ፕሮግራሙም ራሱ ለተመዘገበ እያንዳንዱ ቡድን በመድረኩ ውስጥ ይገኛል።",
    om: "Walga'iiwwan Wiixata Warqee (ወርቃማ ሰኞ) torbaniin Itoophiyaa hojjetaa hunda gara dandeettii hedduu fi barnoota hiriyaan durfamu geggeessa. Addis MESOB dhiibbaa wal fakkaataa kanaan rakkina hir'isuun, akkaataa lammiin dhugumaan waan hojjetan irratti hojjeta — sagantichi mataan isaas amma garee seenan hundaaf waltajjicha keessatti argama.",
  },
  gmCta: {
    en: "Sign in to view this week's session",
    am: "የዚህ ሳምንት ስብሰባን ለማየት ይግቡ",
    om: "Walga'ii Torban Kanaa Ilaaluuf Seeni",
  },
  faqEyebrow: {
    en: "Questions",
    am: "ጥያቄዎች",
    om: "Gaaffilee",
  },
  faqTitle: {
    en: "Frequently asked questions",
    am: "በተደጋጋሚ የሚነሱ ጥያቄዎች",
    om: "Gaaffilee Yeroo Baay'ee Gaafataman",
  },
  footerTagline: {
    en: "A one-stop digital service platform for Digital Ethiopia.",
    am: "ለዲጂታል ኢትዮጵያ የአንድ ማዕከል ዲጂታል አገልግሎት መድረክ።",
    om: "Waltajjii tajaajila dijitaalaa bakka tokkotti Itoophiyaa Dijitaalaatiif.",
  },
  footerPrivacy: {
    en: "Privacy Policy",
    am: "የግላዊነት ፖሊሲ",
    om: "Imaammata Dhuunfaa",
  },
  footerTerms: {
    en: "Terms of Service",
    am: "የአገልግሎት ውሎች",
    om: "Haala Tajaajilaa",
  },
  footerContact: { en: "Contact Us", am: "ያግኙን", om: "Nu Qunnamaa" },
  skipToContent: {
    en: "Skip to content",
    am: "ወደ ይዘቱ ዝለል",
    om: "Gara Qabiyyeetti Utaali",
  },
  backToTop: { en: "Back to top", am: "ወደ ላይ ተመለስ", om: "Gara Olii Deebi'i" },
};

// ─────────────────────────────────────────────────────────────
// FAQ CONTENT
// ─────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: {
      en: "Do I need a separate account for each service?",
      am: "ለእያንዳንዱ አገልግሎት የተለየ መለያ ያስፈልገኛል?",
      om: "Tajaajila hundaaf herrega addaa naa barbaachisaa?",
    },
    a: {
      en: "No. One organization account signs you into every module — dashboard, evaluations, reports, documents, and Golden Monday — with access automatically scoped to your role.",
      am: "አያስፈልግም። አንድ የድርጅት መለያ ወደ ሁሉም ክፍሎች — ዳሽቦርድ፣ ግምገማ፣ ሪፖርት፣ ሰነድ እና ወርቃማ ሰኞ — ያስገባዎታል፣ ተደራሽነትም በራስ-ሰር በሚናዎ መሰረት ይወሰናል።",
      om: "Lakki. Herregni dhaabbilee tokko moduulii hunda keessatti si seensisa — daashboordii, madaallii, gabaasa, ragaa, fi Wiixata Warqee — dhaqqabamummaanis akkaataa gahee keetiitiin ofumaan murtaa'a.",
    },
  },
  {
    q: {
      en: "Who can register new employees or create teams?",
      am: "አዲስ ሰራተኞችን መመዝገብ ወይም ቡድን መፍጠር የሚችለው ማን ነው?",
      om: "Hojjetoota haaraa galmeessuu ykn garee uumuu kan danda'u eenyu?",
    },
    a: {
      en: "Team leaders and admins can register employees and manage rosters. Creating and renaming departments, and full user management, is reserved for admins and super admins.",
      am: "ቡድን መሪዎችና አድሚኖች ሰራተኞችን መመዝገብና ዝርዝሮችን ማስተዳደር ይችላሉ። ክፍል መፍጠርና እንደገና መሰየም እንዲሁም ሙሉ የተጠቃሚ አስተዳደር ለአድሚኖችና ለሱፐር አድሚኖች ብቻ የተከለለ ነው።",
      om: "Hoogganoonni garee fi admin-oonni hojjetoota galmeessuu fi tarree bulchuu ni danda'u. Kutaa uumuu fi maqaa jijjiiruu, akkasumas bulchiinsa fayyadamaa guutuu, admin-oota fi super admin-ootaaf qofa kan qophaa'edha.",
    },
  },
  {
    q: {
      en: "Can I use the platform in Amharic or Afaan Oromo?",
      am: "መድረኩን በአማርኛ ወይም በአፋን ኦሮሞ መጠቀም እችላለሁ?",
      om: "Waltajjicha Afaan Amaaraa ykn Afaan Oromootiin fayyadamuu danda'aa?",
    },
    a: {
      en: "Yes — every screen works in English, Amharic, and Afaan Oromo. Switch anytime using the language selector in the top navigation.",
      am: "አዎ — እያንዳንዱ ገጽ በእንግሊዝኛ፣ በአማርኛና በአፋን ኦሮሞ ይሰራል። በላይኛው ዳሰሳ ውስጥ ባለው የቋንቋ መራጭ በማንኛውም ጊዜ መቀየር ይችላሉ።",
      om: "Eeyyee — fuulli hundi Ingiliffaan, Amaariffaan, fi Afaan Oromootiin hojjeta. Filannoo afaanii kan gubbaa jiru fayyadamuun yeroo barbaadanitti jijjiiruu ni dandeessu.",
    },
  },
  {
    q: {
      en: "What does the AI assistant actually do?",
      am: "የAI ረዳቱ በትክክል ምን ያደርጋል?",
      om: "Deeggartuun AI dhugumaan maal godha?",
    },
    a: {
      en: "It drafts recap summaries for Golden Monday sessions, suggests presentation topics, auto-fills scanned document fields, and answers questions inline across dashboards and reports.",
      am: "ለወርቃማ ሰኞ ስብሰባዎች ማጠቃለያ ረቂቅ ያዘጋጃል፣ የአቀራረብ ርዕሶችን ይጠቁማል፣ የተቃኙ ሰነድ መስኮችን በራስ-ሰር ይሞላል፣ እንዲሁም በዳሽቦርድና ሪፖርቶች ላይ ጥያቄዎችን በቀጥታ ይመልሳል።",
      om: "Cuunfaa walga'ii Wiixata Warqeetiif qopheessa, mata duree dhiyeessii ni yaada, unka ragaa sikaanamee ofumaan guuta, gaaffiiwwan dashboard fi gabaasa keessattis kallattiin ni deebisa.",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// ORBITING SERVICE ICONS
// ─────────────────────────────────────────────────────────────
const ORBIT_ICONS = [
  { icon: <FiBarChart2 size={18} />, label: "Dashboard" },
  { icon: <FiMessageSquare size={18} />, label: "Forum" },
  { icon: <FiStar size={18} />, label: "Evaluation" },
  { icon: <FiFileText size={18} />, label: "Reports" },
  { icon: <FiShield size={18} />, label: "Documents" },
  { icon: <FiSunrise size={18} />, label: "Golden Monday" },
];

// ─────────────────────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <FiBarChart2 size={24} />,
    big: true,
    title: {
      en: "Dashboard & Analytics",
      am: "ዳሽቦርድና ትንተና",
      om: "Daashboordii fi Xiinxala",
    },
    body: {
      en: "Live overview of organizational performance, submissions, and trends, with drill-down reports for leaders and admins.",
      am: "የድርጅት አፈጻጸም፣ ማስገቢያዎችና አዝማሚያዎች ቀጥታ ዕይታ፣ ለመሪዎችና አድሚኖች ዝርዝር ሪፖርቶች ጋር።",
      om: "Ilaalcha yeroo dhugaa raawwii dhaabbilee, galmee fi ce'umsaa, gabaasa bal'aa hoogganootaa fi admin-oota waliin.",
    },
  },
  {
    icon: <FiSunrise size={24} />,
    big: true,
    title: { en: "Golden Monday", am: "ወርቃማ ሰኞ", om: "Wiixata Warqee" },
    body: {
      en: "Weekly capacity-building program — session recaps, presenter rotation, and AI-suggested topics, right inside the app.",
      am: "ሳምንታዊ የአቅም ግንባታ መርሃ-ግብር — የስብሰባ ማጠቃለያ፣ የአቅራቢ ሽክርክር እና በAI የተጠቆሙ ርዕሶች በመተግበሪያው ውስጥ።",
      om: "Sagantaa dandeettii ijaarsaa torbanii — cuunfaa walga'ii, naanna'iinsa dhiheessituu, fi mata duree AI-n yaadame, appii keessatti.",
    },
  },
  {
    icon: <FiMessageSquare size={20} />,
    title: { en: "Peer Forum", am: "የእኩዮች መድረክ", om: "Waltajjii Hiriyootaa" },
    body: {
      en: "A shared space for teams to discuss cases and learn from one another day to day.",
      am: "ቡድኖች ጉዳዮችን ለመወያየትና በየቀኑ ከእርስ በርስ ለመማር የሚጠቀሙበት የጋራ ቦታ።",
      om: "Bakka waloo garee waliin haala dubbachuuf fi guyyaa guyyaan waliin baruuf.",
    },
  },
  {
    icon: <FiStar size={20} />,
    title: { en: "Evaluation", am: "ግምገማ", om: "Madaallii" },
    body: {
      en: "Structured, criteria-based staff evaluation that feeds directly into recognition and growth planning.",
      am: "በተዋቀሩ መስፈርቶች ላይ የተመሰረተ የሰራተኛ ግምገማ ለእውቅናና ለእድገት እቅድ በቀጥታ ግብዓት የሚሆን።",
      om: "Madaallii hojjetaa ulaagaa irratti hundaa'e kan beekamtii fi karoora guddinaatiif kallattiin galtee ta'u.",
    },
  },
  {
    icon: <FiFileText size={20} />,
    title: {
      en: "Daily & Forum Reports",
      am: "ዕለታዊና የመድረክ ሪፖርት",
      om: "Gabaasa Guyyaa fi Waltajjii",
    },
    body: {
      en: "Team leaders log activity once — it flows into analytics, PDFs, and leadership reviews automatically.",
      am: "ቡድን መሪዎች እንቅስቃሴን አንዴ ይመዘግባሉ — ወደ ትንተና፣ PDFና ግምገማ ራሱ በራሱ ይፈስሳል።",
      om: "Hoogganoonni garee sochii yeroo tokko galmeessu — gara xiinxalaa fi PDF ofumaan dabra.",
    },
  },
  {
    icon: <FiShield size={20} />,
    title: { en: "Document Vault", am: "የሰነድ ማከማቻ", om: "Kuusaa Ragaa" },
    body: {
      en: "Secure, traceable storage with AI auto-fill that reads scanned forms and populates them for you.",
      am: "ደህንነቱ የተጠበቀ የሰነድ ማከማቻ፣ የተቃኙ ቅጾችን በራስ-ሰር በሚሞላ AI የተደገፈ።",
      om: "Kuusaa ragaa nageenya qabu, dandeettii AI-tiin unka sikaanamee ofumaan guutu.",
    },
  },
  {
    icon: <FiCpu size={20} />,
    title: {
      en: "AI Assistant, everywhere",
      am: "የAI ረዳት፣ በየትም",
      om: "Deeggartuu AI, Bakka Hundatti",
    },
    body: {
      en: "A floating assistant and inline AI summaries across dashboards and reports.",
      am: "በዳሽቦርድና ሪፖርቶች ላይ ተንሳፋፊ ረዳትና በውስጥ የተካተቱ የAI ማጠቃለያዎች።",
      om: "Deeggartuu dafqee fi cuunfaa AI dashboard fi gabaasaa keessatti.",
    },
  },
  {
    icon: <FiUsers size={20} />,
    title: {
      en: "Team & User Management",
      am: "የቡድንና ተጠቃሚ አስተዳደር",
      om: "Bulchiinsa Garee fi Fayyadamaa",
    },
    body: {
      en: "Admins manage teams, roles, and access from one control center — no spreadsheets required.",
      am: "አድሚኖች ቡድኖችን፣ ሚናዎችንና ተደራሽነትን ከአንድ ማዕከል ያስተዳድራሉ።",
      om: "Admin-oonni garee, gahee, fi dhaqqabamummaa bakka tokko irraa bulchu.",
    },
  },
  {
    icon: <FiGlobe size={20} />,
    title: {
      en: "Three languages, natively",
      am: "ለሶስት ቋንቋዎች የተገነባ",
      om: "Afaan Sadiif Ijaarame",
    },
    body: {
      en: "Every screen works in English, Amharic, and Afaan Oromo, switchable anytime.",
      am: "እያንዳንዱ ገጽ በእንግሊዝኛ፣ በአማርኛና በአፋን ኦሮሞ ይሰራል፣ በማንኛውም ጊዜ ሊቀየር ይችላል።",
      om: "Fuulli hundi Ingiliffaan, Amaariffaan, fi Afaan Oromootiin hojjeta.",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: <FiLogIn size={20} />,
    title: {
      en: "Sign in with your organization account",
      am: "በድርጅትዎ መለያ ይግቡ",
      om: "Herrega Dhaabbilee Keetiin Seeni",
    },
    body: {
      en: "Your admin creates your account; you sign in and land straight on your dashboard.",
      am: "የድርጅትዎ አድሚን መለያዎን ይፈጥራል፤ ይግቡና በቀጥታ ወደ ዳሽቦርድዎ ይደርሳሉ።",
      om: "Admin-iin dhaabbilee keetii herrega siif uuma; seentee kallattiin gara daashboordii keetiitti geessa.",
    },
  },
  {
    icon: <FiUsers size={20} />,
    title: {
      en: "Your role decides what you see",
      am: "ሚናዎ የሚያዩትን ይወስናል",
      om: "Gaheen Kee Waan Argitu Murteessa",
    },
    body: {
      en: "Employees, team leaders, admins, and super admins each get exactly the tools their role needs.",
      am: "ሰራተኞች፣ ቡድን መሪዎች፣ አድሚኖችና ሱፐር አድሚኖች ለሚናቸው የሚያስፈልጋቸውን መሳሪያ በትክክል ያገኛሉ።",
      om: "Hojjettoonni, hoogganoonni garee, admin-oonni, fi super admin-oonni meeshaa gaheen isaanii barbaadu qofa argatu.",
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
      en: "Log activity, evaluate staff, upload documents — AI summaries are one click away the whole time.",
      am: "እንቅስቃሴ ይመዝግቡ፣ ሰራተኛ ይገምግሙ፣ ሰነድ ይስቀሉ — የAI ማጠቃለያ ሁልጊዜ በአንድ ጠቅታ ርቀት ላይ ነው።",
      om: "Sochii galmeessi, hojjetaa madaali, ragaa fe'i — cuunfaan AI yeroo hunda tuqaa tokko fagaatu.",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────
function AnimatedStat({ value, active }) {
  const match = /^(\d+)(.*)$/.exec(String(value));
  const numeric = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";
  const [display, setDisplay] = useState(numeric === null ? value : 0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!active || numeric === null || hasRun.current) return;
    hasRun.current = true;
    const duration = 900;
    const steps = 24;
    const increment = numeric / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = numeric;
        clearInterval(timer);
      }
      setDisplay(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [active, numeric]);

  return <>{numeric === null ? value : display + suffix}</>;
}

// ─────────────────────────────────────────────────────────────
// FAQ ACCORDION
// ─────────────────────────────────────────────────────────────
function FAQAccordion({ items, getText }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "16px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: F.sans,
              }}
            >
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: C.dark,
                }}
              >
                {getText(item.q)}
              </span>
              <FiChevronDown
                size={18}
                color={C.muted}
                style={{
                  flexShrink: 0,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
            <div
              style={{
                maxHeight: isOpen ? 200 : 0,
                overflow: "hidden",
                transition: "max-height 0.25s ease",
              }}
            >
              <p
                style={{
                  margin: 0,
                  padding: "0 20px 16px",
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  color: C.muted,
                }}
              >
                {getText(item.a)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIGNATURE VISUAL — "Digital Mesob"
// ─────────────────────────────────────────────────────────────
function DigitalMesob() {
  const radius = 150;
  return (
    <div
      style={{
        position: "relative",
        width: 340,
        height: 340,
        maxWidth: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 340 340"
        width="340"
        height="340"
        style={{ position: "absolute", inset: 0, zIndex: 3 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="weaveGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0.9" />
            <stop offset="100%" stopColor={C.goldLight} stopOpacity="0.5" />
          </linearGradient>
          <path
            id="mesobOrbitTextPath"
            d="M170,170 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0"
          />
        </defs>
        {[0, 1, 2].map((ring) => (
          <circle
            key={ring}
            cx="170"
            cy="170"
            r={70 + ring * 40}
            fill="none"
            stroke={ring === 1 ? "url(#weaveGold)" : "rgba(255,255,255,0.14)"}
            strokeWidth={ring === 1 ? 2 : 1}
            strokeDasharray={ring % 2 === 0 ? "3 7" : "1 5"}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const x1 = 170 + Math.cos(angle) * 34;
          const y1 = 170 + Math.sin(angle) * 34;
          const x2 = 170 + Math.cos(angle + Math.PI) * 34;
          const y2 = 170 + Math.sin(angle + Math.PI) * 34;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={C.goldLight}
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          );
        })}
        <g className="mesob-orbit-text">
          <text
            fill={C.goldLight}
            fontSize="13.5"
            fontWeight="800"
            letterSpacing="3.5"
            style={{ fontFamily: F.sans }}
          >
            <textPath href="#mesobOrbitTextPath" startOffset="0%">
              ADDIS MESOB • ADDIS MESOB •&nbsp;
            </textPath>
          </text>
        </g>
      </svg>

      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 0 8px rgba(245,197,24,0.12), 0 12px 32px rgba(0,0,0,0.35)`,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: F.serif,
            fontSize: 38,
            fontWeight: 900,
            color: C.dark,
          }}
        >
          አ
        </span>
      </div>

      {ORBIT_ICONS.map((item, i) => {
        const angle = (i / ORBIT_ICONS.length) * Math.PI * 2 - Math.PI / 2;
        const x = 170 + Math.cos(angle) * radius;
        const y = 170 + Math.sin(angle) * radius;
        return (
          <div
            key={item.label}
            title={item.label}
            className="mesob-node"
            style={{
              position: "absolute",
              left: x - 20,
              top: y - 20,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.goldLight,
              animation: `mesob-float 5s ease-in-out ${i * 0.35}s infinite`,
            }}
          >
            {item.icon}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION HEADING
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
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: dark ? C.gold : C.primary,
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: F.serif,
          fontSize: "clamp(24px, 4vw, 34px)",
          fontWeight: 800,
          letterSpacing: "-0.01em",
          margin: 0,
          color: dark ? "#fff" : C.dark,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            marginTop: 12,
            fontSize: 15,
            lineHeight: 1.65,
            color: dark ? "#a9b3e0" : C.muted,
            maxWidth: 580,
            margin: center ? "12px auto 0" : "12px 0 0",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN LANDING COMPONENT - UPDATED WITH REAL DATA FROM DATABASE
// ─────────────────────────────────────────────────────────────
export default function Landing() {
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [visible, setVisible] = useState({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Real data from database via public API (no authentication required)
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [departments, setDepartments] = useState(["All"]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 12,
  });
  const sectionRefs = useRef({});
  const abortControllerRef = useRef(null);

  // ─── Load services from database ──────────────────────────────
  const loadServices = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await publicAPI.getServices({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        department: filterDept !== "All" ? filterDept : undefined,
      });

      if (response.data.success) {
        setServices(response.data.data);
        setPagination({
          page: response.data.pagination.page,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
          limit: response.data.pagination.limit || 12,
        });
      }
    } catch (error) {
      if (error.name !== "AbortError" && error.code !== "ERR_CANCELED") {
        console.error("Failed to load services:", error);
        setError("Failed to load services. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filterDept]);

  // ─── Load departments ──────────────────────────────────────────
  const loadDepartments = useCallback(async () => {
    try {
      const response = await publicAPI.getDepartments();
      if (response.data.success) {
        setDepartments(["All", ...response.data.data]);
      }
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  }, []);

  // ─── Initial load ──────────────────────────────────────────────
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadInitialData = async () => {
      await loadDepartments();
      await loadServices();
    };

    loadInitialData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadDepartments, loadServices]);

  // ─── Handle search/filter changes with debounce ───────────────
  // ─── Handle search/filter changes with debounce ───────────────
  useEffect(() => {
    // Skip initial load - only run when search or filter changes
    if (!searchTerm && filterDept === "All") return;

    const timer = setTimeout(() => {
      loadServices();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filterDept, loadServices]);

  // ─── Memoized stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    const agencies = new Set((services || []).map((s) => s.dept || s.deptEn))
      .size;
    return { services: (services || []).length, agencies };
  }, [services]);

  // ─── Departments list for marquee ─────────────────────────────
  const departmentsList = useMemo(() => {
    const seen = new Set();
    const list = [];
    (services || []).forEach((s) => {
      const dept = s.dept || s.deptEn;
      if (dept && !seen.has(dept)) {
        seen.add(dept);
        list.push(dept);
      }
    });
    return list;
  }, [services]);

  // ─── Get service icon ──────────────────────────────────────────
  const getServiceIcon = (index) => {
    const icons = [
      <FiTool size={24} />,
      <FiPackage size={24} />,
      <FiBox size={24} />,
      <FiSettings size={24} />,
      <FiStar size={24} />,
      <FiAward size={24} />,
      <FiBriefcase size={24} />,
      <FiUsers size={24} />,
      <FiUser size={24} />,
      <FiClock size={24} />,
      <FiCalendar size={24} />,
      <FiMapPin size={24} />,
      <FiPhone size={24} />,
      <FiMail size={24} />,
      <FiGlobe size={24} />,
    ];
    return icons[index % icons.length];
  };

  // ─── Register refs ──────────────────────────────────────────
  const registerRef = useCallback(
    (key) => (el) => {
      if (el) sectionRefs.current[key] = el;
    },
    [],
  );

  // ─── Scroll observer ────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = entry.target.dataset.reveal;
          if (entry.isIntersecting) {
            setVisible((v) => ({ ...v, [key]: true }));
            if (key === "features" || key === "how") {
              setActiveSection(key);
            }
          }
        });
      },
      { threshold: 0.12, rootMargin: "-72px 0px -60% 0px" },
    );
    const currentRefs = { ...sectionRefs.current };
    const elements = Object.values(currentRefs).filter(Boolean);
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  // ─── Back-to-top ──────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Mobile nav close ──────────────────────────────────────
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  const revealStyle = (key) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  });

  const goLogin = () => navigate("/login");
  const getText = (obj) => obj[language] || obj.en;
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // ─── Load more ──────────────────────────────────────────────────
  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  return (
    <div
      style={{ fontFamily: F.sans, background: T.paper, minHeight: "100vh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700;800&family=Noto+Serif+Ethiopic:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; }

        @keyframes lp-sweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes mesob-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes mesob-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes lp-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .mesob-orbit-text {
          transform-origin: 170px 170px;
          transform-box: fill-box;
          animation: mesob-spin 22s linear infinite;
        }

        .lp-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .lp-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(6,11,46,0.12); border-color: ${C.primary}55; }
        .lp-cta { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .lp-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 28px ${C.primary}4d; }
        .lp-nav-link { transition: opacity 0.15s ease, color 0.15s ease; position: relative; }
        .lp-nav-link:hover { opacity: 0.72; }
        .lp-nav-link.active { color: ${C.gold} !important; }
        .lp-nav-link.active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -6px;
          height: 2px;
          background: ${C.gold};
          border-radius: 2px;
        }
        .lp-lang-btn { transition: opacity 0.15s ease, transform 0.15s ease; }
        .lp-lang-btn:hover { opacity: 0.85; }
        .lp-marquee-track:hover { animation-play-state: paused; }
        .lp-back-to-top { transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease; }
        .lp-back-to-top:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(6,11,46,0.35); }
        a, button { -webkit-tap-highlight-color: transparent; }

        a:focus-visible, button:focus-visible {
          outline: 2px solid ${C.gold};
          outline-offset: 2px;
        }

        .lp-skip-link {
          position: absolute;
          top: -48px;
          left: 12px;
          background: ${C.gold};
          color: ${C.dark};
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          z-index: 100;
          transition: top 0.2s ease;
        }
        .lp-skip-link:focus { top: 12px; }

        .lp-desktop-only { display: flex; }
        .lp-mobile-toggle { display: none; }
        @media (max-width: 720px) {
          .lp-desktop-only { display: none !important; }
          .lp-mobile-toggle { display: inline-flex !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      {/* ── SKIP LINK ───────────────────────────────────── */}
      <a href="#main-content" className="lp-skip-link">
        {getText(LANDING_COPY.skipToContent)}
      </a>

      {/* ── TOP NAV ─────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(6,11,46,0.9)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
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

        <div
          className="lp-desktop-only"
          style={{ alignItems: "center", gap: 20 }}
        >
          <a
            href="#features"
            className={`lp-nav-link${activeSection === "features" ? " active" : ""}`}
            style={{
              color: activeSection === "features" ? C.gold : "#c9d0f0",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Features
          </a>
          <a
            href="#services"
            className="lp-nav-link"
            style={{
              color: "#c9d0f0",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Services
          </a>
          <a
            href="#how"
            className={`lp-nav-link${activeSection === "how" ? " active" : ""}`}
            style={{
              color: activeSection === "how" ? C.gold : "#c9d0f0",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            How it works
          </a>
          <a
            href="#faq"
            className="lp-nav-link"
            style={{
              color: "#c9d0f0",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            FAQ
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
              justifyContent: "center",
              gap: 6,
              minWidth: "clamp(140px, 15vw, 180px)",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
              color: C.dark,
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: F.sans,
              whiteSpace: "nowrap",
            }}
          >
            <FiLogIn size={14} />
            {getText(LANDING_COPY.ctaPrimary)}
          </button>
        </div>

        <button
          className="lp-mobile-toggle"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 8,
            width: 38,
            height: 38,
            color: "#fff",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {mobileNavOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
      </header>

      {mobileNavOpen && (
        <div
          style={{
            background: T.ink,
            padding: "16px clamp(16px, 5vw, 48px) 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            animation: "lp-fade-in 0.2s ease",
          }}
        >
          <a
            href="#features"
            style={{ color: "#c9d0f0", fontSize: 14, fontWeight: 600 }}
            onClick={() => setMobileNavOpen(false)}
          >
            Features
          </a>
          <a
            href="#services"
            style={{ color: "#c9d0f0", fontSize: 14, fontWeight: 600 }}
            onClick={() => setMobileNavOpen(false)}
          >
            Services
          </a>
          <a
            href="#how"
            style={{ color: "#c9d0f0", fontSize: 14, fontWeight: 600 }}
            onClick={() => setMobileNavOpen(false)}
          >
            How it works
          </a>
          <a
            href="#faq"
            style={{ color: "#c9d0f0", fontSize: 14, fontWeight: 600 }}
            onClick={() => setMobileNavOpen(false)}
          >
            FAQ
          </a>
          <div style={{ display: "flex", gap: 6 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                style={{
                  background:
                    language === l.code ? C.gold : "rgba(255,255,255,0.08)",
                  color: language === l.code ? C.dark : "#c9d0f0",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {l.flag}
              </button>
            ))}
          </div>
          <button
            onClick={goLogin}
            style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
              color: C.dark,
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {getText(LANDING_COPY.ctaPrimary)}
          </button>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        id="main-content"
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(120deg, ${T.ink} 0%, ${C.dark} 40%, ${C.primary} 75%, #8a6a10 100%)`,
          backgroundSize: "220% 220%",
          animation: "lp-sweep 18s ease infinite alternate",
          padding:
            "clamp(48px, 8vw, 80px) clamp(20px, 6vw, 64px) clamp(56px, 8vw, 88px)",
          color: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            gap: 48,
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
                border: "1px solid rgba(245,197,24,0.33)",
                color: C.goldLight,
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.4,
                marginBottom: 24,
              }}
            >
              <FiMapPin size={13} />
              {getText(LANDING_COPY.eyebrow)}
            </div>
            <h1
              style={{
                fontFamily: F.serif,
                fontSize: "clamp(34px, 6vw, 58px)",
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: "-0.015em",
                margin: 0,
              }}
            >
              {getText(LANDING_COPY.heroTitle)}
            </h1>
            <p
              style={{
                fontSize: "clamp(15px, 2.2vw, 18px)",
                lineHeight: 1.7,
                color: "#dfe4ff",
                maxWidth: 600,
                marginTop: 22,
              }}
            >
              {getText(LANDING_COPY.heroBody)}
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
                }}
              >
                {getText(LANDING_COPY.ctaPrimary)}
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
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  padding: "13px 22px",
                  borderRadius: 10,
                }}
              >
                {getText(LANDING_COPY.ctaSecondary)}
                <FiChevronDown size={16} />
              </a>
            </div>

            <div
              ref={registerRef("stats")}
              data-reveal="stats"
              style={{
                display: "flex",
                gap: 30,
                marginTop: 48,
                flexWrap: "wrap",
              }}
            >
              {[
                [stats.services + "+", LANDING_COPY.statServices],
                [(stats.agencies || 0) + "", LANDING_COPY.statAgencies],
                ["3", LANDING_COPY.statLanguages],
                ["24/7", LANDING_COPY.statAI],
              ].map(([num, label], i) => (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: 26,
                      fontWeight: 900,
                      color: C.goldLight,
                    }}
                  >
                    <AnimatedStat value={num} active={!!visible.stats} />
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#a9b3e0",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {getText(label)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              flex: "1 1 340px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <DigitalMesob />
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS MARQUEE ──────────────────────────── */}
      {departmentsList.length > 0 && (
        <section
          style={{
            background: C.dark,
            padding: "18px 0",
            overflow: "hidden",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: C.gold,
              marginBottom: 10,
            }}
          >
            {getText(LANDING_COPY.deptsEyebrow)}
          </div>
          <div style={{ display: "flex", width: "max-content" }}>
            <div
              className="lp-marquee-track"
              style={{
                display: "flex",
                gap: 32,
                paddingRight: 32,
                animation: "marquee-scroll 32s linear infinite",
              }}
            >
              {[...departmentsList, ...departmentsList].map((d, i) => (
                <span
                  key={i}
                  style={{
                    color: "#c9d0f0",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section
        id="features"
        ref={registerRef("features")}
        data-reveal="features"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) 12px",
          ...revealStyle("features"),
        }}
      >
        <SectionHeading
          eyebrow={getText(LANDING_COPY.featuresEyebrow)}
          title={getText(LANDING_COPY.featuresTitle)}
          sub={getText(LANDING_COPY.featuresSub)}
          center
        />
        <div
          id="lp-features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
            marginTop: 40,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="lp-card"
              style={{
                gridColumn: f.big ? "span 2" : "span 1",
                background: C.white,
                borderRadius: 18,
                padding: f.big ? 30 : 22,
                border: `1px solid ${C.border}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {f.big && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: T.weave,
                  }}
                />
              )}
              <div
                style={{
                  width: f.big ? 48 : 40,
                  height: f.big ? 48 : 40,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: f.big ? 18 : 15.5,
                  color: C.dark,
                  fontFamily: F.serif,
                  fontWeight: 800,
                }}
              >
                {getText(f.title)}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: C.muted,
                }}
              >
                {getText(f.body)}
              </p>
            </div>
          ))}
        </div>
        <style>{`
          @media (max-width: 900px) { #lp-features-grid { grid-template-columns: repeat(2, 1fr) !important; } #lp-features-grid > div { grid-column: span 1 !important; } }
          @media (max-width: 560px) { #lp-features-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* ── SERVICES SECTION ─────────────────────────────── */}
      <section
        id="services"
        ref={registerRef("services")}
        data-reveal="services"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) 12px",
          ...revealStyle("services"),
        }}
      >
        <SectionHeading
          eyebrow={
            <>
              <FiGrid size={14} style={{ marginRight: 4 }} />
              Available Services
            </>
          }
          title="Browse our service catalogue"
          sub="Explore all available services. Login to access full features and management."
          center
        />

        {/* Search and Filter */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: "2 1 200px", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.muted,
              }}
            >
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 14,
                background: C.white,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            style={{
              padding: "10px 14px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 14,
              background: C.white,
              minWidth: 140,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
            <FiLoader
              size={32}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p>Loading services from database...</p>
          </div>
        ) : error ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#dc2626" }}
          >
            {error}
          </div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
            <FiPackage size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No services found matching your criteria</p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
                gap: 16,
              }}
            >
              {services.map((s, i) => (
                <div
                  key={s._id || i}
                  style={{
                    background: C.white,
                    borderRadius: 12,
                    padding: "16px 18px",
                    border: `1px solid ${C.border}`,
                    transition: "all 0.3s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  <div
                    style={{ fontSize: 28, color: C.primary, marginBottom: 8 }}
                  >
                    {getServiceIcon(i)}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: C.dark,
                      marginBottom: 2,
                    }}
                  >
                    {language === "en" ? s.nameEn || s.name : s.name}
                  </div>
                  {s.nameEn && language === "en" && (
                    <div
                      style={{ fontSize: 11, color: "#bbb", marginBottom: 4 }}
                    >
                      {s.name}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 8,
                    }}
                  >
                    <FiBriefcase size={12} />
                    {language === "en" ? s.deptEn || s.dept : s.dept}
                  </div>
                  <span
                    style={{
                      background: s.active ? C.bg : "#ffeee8",
                      color: s.active ? C.primary : C.orange,
                      borderRadius: 12,
                      padding: "2px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {s.active ? (
                      <>
                        <FiCheck size={10} /> Active
                      </>
                    ) : (
                      "Inactive"
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination - Load More */}
            {pagination.totalPages > 1 && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                  onClick={loadMore}
                  disabled={pagination.page >= pagination.totalPages}
                  style={{
                    padding: "10px 24px",
                    background: C.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor:
                      pagination.page >= pagination.totalPages
                        ? "not-allowed"
                        : "pointer",
                    opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (pagination.page < pagination.totalPages) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}44`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {pagination.page >= pagination.totalPages
                    ? "No More Services"
                    : "Load More Services"}
                </button>
                <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                  Showing {services.length} of {pagination.total} services
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section
        id="how"
        ref={registerRef("how")}
        data-reveal="how"
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) 12px",
          ...revealStyle("how"),
        }}
      >
        <SectionHeading
          eyebrow={getText(LANDING_COPY.howEyebrow)}
          title={getText(LANDING_COPY.howTitle)}
          center
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 36,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                background: C.white,
                borderRadius: 16,
                padding: 24,
                border: `1px solid ${C.border}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -14,
                  left: 22,
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
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: C.bg,
                  color: C.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  marginTop: 8,
                }}
              >
                {s.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 15.5,
                  color: C.dark,
                  fontFamily: F.serif,
                  fontWeight: 800,
                }}
              >
                {getText(s.title)}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: C.muted,
                }}
              >
                {getText(s.body)}
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
          background: T.ink,
          color: "#fff",
          marginTop: 40,
          padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px)",
          ...revealStyle("gm"),
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            gap: 36,
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
              eyebrow={getText(LANDING_COPY.gmEyebrow)}
              title={getText(LANDING_COPY.gmTitle)}
              sub={getText(LANDING_COPY.gmBody)}
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
              }}
            >
              {getText(LANDING_COPY.gmCta)}
              <FiArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section
        id="faq"
        ref={registerRef("faq")}
        data-reveal="faq"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding:
            "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) clamp(40px, 6vw, 60px)",
          ...revealStyle("faq"),
        }}
      >
        <SectionHeading
          eyebrow={
            <>
              <FiHelpCircle size={14} style={{ marginRight: 4 }} />{" "}
              {getText(LANDING_COPY.faqEyebrow)}
            </>
          }
          title={getText(LANDING_COPY.faqTitle)}
          center
        />
        <div style={{ marginTop: 32 }}>
          <FAQAccordion items={FAQ_ITEMS} getText={getText} />
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer
        style={{
          background: "#04081f",
          color: "#8892c0",
          padding: "40px clamp(20px, 6vw, 40px) 28px",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 24,
            paddingBottom: 24,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={mesobLogo}
                alt="Addis MESOB"
                style={{ width: 28, height: 28, borderRadius: 6 }}
              />
              <span
                style={{
                  fontFamily: F.serif,
                  fontWeight: 800,
                  color: "#fff",
                  fontSize: 15,
                }}
              >
                Addis MESOB
              </span>
            </div>
            <p style={{ fontSize: 12.5, margin: "12px 0 0" }}>
              {getText(LANDING_COPY.footerTagline)}
            </p>
          </div>
          <nav
            aria-label="Footer"
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              fontSize: 12.5,
            }}
          >
            <a
              href="/privacy"
              style={{ color: "#8892c0", textDecoration: "none" }}
            >
              {getText(LANDING_COPY.footerPrivacy)}
            </a>
            <a
              href="/terms"
              style={{ color: "#8892c0", textDecoration: "none" }}
            >
              {getText(LANDING_COPY.footerTerms)}
            </a>
            <a
              href="mailto:support@addismesob.example"
              style={{
                color: "#8892c0",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <FiMail size={12} />
              {getText(LANDING_COPY.footerContact)}
            </a>
          </nav>
        </div>
        <p style={{ fontSize: 11, margin: "18px 0 0", textAlign: "center" }}>
          © {new Date().getFullYear()} Digital Ethiopia · Addis MESOB
        </p>
      </footer>

      {/* ── BACK TO TOP ──────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        aria-label={getText(LANDING_COPY.backToTop)}
        className="lp-back-to-top"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
          color: C.dark,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 18px rgba(6,11,46,0.3)",
          zIndex: 40,
          opacity: showBackToTop ? 1 : 0,
          pointerEvents: showBackToTop ? "auto" : "none",
        }}
      >
        <FiArrowUp size={18} />
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
