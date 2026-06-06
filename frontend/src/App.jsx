import { useState } from "react";
import {
  exportForumReportToPDF,
  exportDailyReportToPDF,
  exportEvaluationReportToPDF,
} from "./utils/pdfExport";

// ════════════════════════════════════════════════════════════
// i18n/translations.js (inlined)
// ════════════════════════════════════════════════════════════
const translations = {
  en: {
    appName: "Addis Messob",
    appSub: "Addis Ketema · One-Stop Service",
    year: "2018 E.C.",
    nav: {
      dashboard: "Dashboard",
      forum: "Peer Forum",
      evaluation: "Evaluation",
      report: "Daily Report",
      services: "Services",
    },
    sidebar: {
      main: "Main Menu",
      reports: "Reports",
      settings: "Settings",
      language: "Language",
      logout: "Logout",
    },
    dashboard: {
      title: "Dashboard",
      todayServices: "Today's Services",
      male: "Male",
      female: "Female",
      departments: "Departments",
      deptReport: "Daily Department Report",
      forumAgendas: "Standing Forum Agendas",
      criteriaOverview: "Evaluation Criteria Overview",
      subCriteria: "sub-criteria",
    },
    forum: {
      title: "Peer Forum Report Form",
      subtitle: "Addis Ababa City Admin · Addis Messob · Addis Ketema Center",
      meetingTime: "📅 Meeting Time",
      date: "Date",
      startTime: "Start Time",
      endTime: "End Time",
      presentMembers: "👥 Present Members",
      absentMembers: "🚫 Absent Members & Reasons",
      memberN: " Member",
      name: "Name",
      reason: "Reason",
      prevResults: "📋 Results from Previous Meeting",
      todayTopics: "💬 Today's Discussion Topics",
      topic: "Topic",
      standingAgendas: "Standing Agendas:",
      explanation: "📝 Explanation Given (Brief)",
      explanationPlaceholder: "Write explanation...",
      gaps: "⚠️ Identified Gaps",
      agreements: "✅ Agreed Points",
      signatures: "✍️ Signatures",
      signatureN: " Signature",
      save: "Save Report ✓",
      newReport: "New Report ➤",
      saved: "Report Saved!",
      savedSub: "Peer Forum report completed successfully.",
    },
    evaluation: {
      title: "Peer Forum Evaluation",
      subtitle: "Addis Ababa City Admin · Public Service Bureau",
      outOf: "Out of 100 pts",
      teamMembers: "👥 Team Members",
      bestPerformer: "Best Performer",
      bestPlaceholder: "Enter name...",
      total: "Total",
      save: "Save Evaluation",
      reset: "Reset",
      weight: "Weight",
      maxPts: "Max Pts",
    },
    dailyReport: {
      title: "Daily Report",
      reportDate: "📅 Report Date",
      serviceList: "📋 Service List",
      colNo: "#",
      colDept: "Department",
      colService: "Service",
      colMale: "M",
      colFemale: "F",
      colTotal: "Total",
      grandTotal: "Grand Total",
      addRow: "+ Add Row",
      save: "💾 Save Report",
    },
    services: {
      title: "Addis Messob · Services",
      subtitle: "Digital One-Stop · Services",
      search: "🔍 Search services...",
      all: "All",
      active: "✓ Active",
      inactive: "✗ Inactive",
      noneFound: "No services found",
      catalogue: "Service Catalogue",
    },
    criteria: {
      c1: "Effective Service Delivery",
      c2: "Strong Work Ethics",
      c3: "Timely & Quality Execution",
      c4: "Creating Exemplary Work",
      c5: "Principle-Based Cooperation",
    },
    agendas: [
      "Establishing good governance",
      "Fighting corrupt practices",
      "Streamlining service delivery",
      "Implementing QMS standards",
      "Weekly exemplary works",
      "Problems encountered",
      "How they were resolved",
    ],
  },
  am: {
    appName: "አዲስ መሶብ",
    appSub: "አዲስ ከተማ · የአንድ ማዕከል አገልግሎት",
    year: "2018 ዓ.ም",
    nav: {
      dashboard: "ዳሽቦርድ",
      forum: "አቻ ፎረም",
      evaluation: "ምዘና",
      report: "ዕለታዊ ሪፖርት",
      services: "አገልግሎቶች",
    },
    sidebar: {
      main: "ዋና ምናሌ",
      reports: "ሪፖርቶች",
      settings: "ቅንብሮች",
      language: "ቋንቋ",
      logout: "ውጣ",
    },
    dashboard: {
      title: "ዳሽቦርድ",
      todayServices: "ዛሬ አገልግሎት",
      male: "ወንድ",
      female: "ሴት",
      departments: "ዘርፎች",
      deptReport: "ዕለታዊ ዘርፍ ሪፖርት",
      forumAgendas: "ቋሚ አቻ ፎረም አጀንዳዎች",
      criteriaOverview: "የምዘና መስፈርቶች አጠቃላይ እይታ",
      subCriteria: "ንዑስ መስፈርቶች",
    },
    forum: {
      title: "የአቻ ፎረም ሪፖርት ቅጽ",
      subtitle: "በአዲስ አበባ ከተማ አስተዳደር አዲስ መሶብ · አዲስ ከተማ ማዕከል",
      meetingTime: "📅 ስብሰባ ጊዜ",
      date: "ቀን",
      startTime: "ጀምሮ (ሰዓት)",
      endTime: "ጨርሶ (ሰዓት)",
      presentMembers: "👥 ስብሰባው ላይ የተገኙ አባላት",
      absentMembers: "🚫 ያልተገኙ አባላትና ምክንያት",
      memberN: "ኛ አባል",
      name: "ስም",
      reason: "ምክንያት",
      prevResults: "📋 ባለፈው ስብሰባ ላይ የታዩ ውጤቶች",
      todayTopics: "💬 የእለቱ መወያያ ርዕሶች",
      topic: "ርዕስ",
      standingAgendas: "ቋሚ አጀንዳዎች፡",
      explanation: "📝 የተሰጠ ማብራሪያ (በአጭሩ)",
      explanationPlaceholder: "ማብራሪያ ይጻፉ...",
      gaps: "⚠️ የታዩ ክፍተቶች",
      agreements: "✅ የጋራ ስምምነት የተደረገባቸው ነጥቦች",
      signatures: "✍️ ፊርማዎች",
      signatureN: "ኛ ፊርማ",
      save: "ሪፖርቱን አስቀምጥ ✓",
      newReport: "አዲስ ሪፖርት ➤",
      saved: "ሪፖርቱ ተሞልቷል!",
      savedSub: "የአቻ ፎረም ሪፖርት በተሳካ ሁኔታ ተጠናቋል።",
    },
    evaluation: {
      title: "የአቻ ፎረም ምዘና",
      subtitle: "በአዲስ አበባ ከተማ አስተዳደር · ፐብሊክ ሰርቪስ ቢሮ",
      outOf: "ከ100 ነጥብ",
      teamMembers: "🧑 የቡድን አባላት",
      bestPerformer: "ምርጥ ፈጻሚ",
      bestPlaceholder: "ስም ያስገቡ...",
      total: "ጠቅላላ",
      save: "ምዘና አስቀምጥ",
      reset: "ዳግም ጀምር",
      weight: "ክብደት",
      maxPts: "ከፍ. ነጥብ",
    },
    dailyReport: {
      title: "ዕለታዊ ሪፖርት",
      reportDate: "📅 የሪፖርቱ ቀን",
      serviceList: "📋 አገልግሎት ዝርዝር",
      colNo: "#",
      colDept: "ዘርፍ",
      colService: "አገልግሎት",
      colMale: "ወ",
      colFemale: "ሴ",
      colTotal: "ድምር",
      grandTotal: "ጠቅላላ ድምር",
      addRow: "+ ረድፍ ጨምር",
      save: "💾 ሪፖርት አስቀምጥ",
    },
    services: {
      title: "አዲስ መሶብ · አገልግሎቶች",
      subtitle: "ዲጂታል አንድ ማዕከል · አገልግሎቶች",
      search: "🔍 አገልግሎት ፈልግ...",
      all: "ሁሉም",
      active: "✓ ንቁ",
      inactive: "✗ ያልጀመረ",
      noneFound: "ምንም አገልግሎት አልተገኘም",
      catalogue: "Service Catalogue",
    },
    criteria: {
      c1: "ውጤታማ የአገልግሎት አሰጣጥ",
      c2: "ጠንካራ የሥራ ሥነ ምግባር",
      c3: "ሥራ በወቅቱ፣ በጥራት መፈጸም",
      c4: "አብነታዊ ሥራ መፍጠር",
      c5: "መርህ ላይ የተመሠረተ ትብብር",
    },
    agendas: [
      "በተቋሙ መልካም አስተዳደር ማስፈን",
      "ብልሹ አሰራር ከመታገል አንጻር",
      "መደበኛ አገልግሎት አሰጣጥን ማሳለጥ",
      "QMS ስታንዳርድ ማስፈጸም",
      "ሳምንታዊ አብነታዊ ስራዎች",
      "ያጋጠሙ ችግሮች",
      "የተፈታበት አግባብ",
    ],
  },
  or: {
    appName: "Addis Mesob",
    appSub: "Addis Ketema · Tajaajila Tokkicha",
    year: "2018 A.L.",
    nav: {
      dashboard: "Gabatee",
      forum: "Foramii",
      evaluation: "Madaallii",
      report: "Gabaasa",
      services: "Tajaajila",
    },
    sidebar: {
      main: "Filannoowwan",
      reports: "Gabaasaalee",
      settings: "Qindaa'ina",
      language: "Afaan",
      logout: "Ba'i",
    },
    dashboard: {
      title: "Gabatee",
      todayServices: "Har'a Tajaajila",
      male: "Dhiira",
      female: "Dubartii",
      departments: "Waajjiraalee",
      deptReport: "Gabaasa Guyyaa",
      forumAgendas: "Ajandaalee Foramii",
      criteriaOverview: "Qabxiilee Madaallii",
      subCriteria: "qabxiilee xiqqaa",
    },
    forum: {
      title: "Gabaasa Foramii",
      subtitle:
        "Bulchiinsa Magaalaa Addis Ababa · Addis Mesob · Wiirtuu Addis Ketema",
      meetingTime: "📅 Yeroo Walga'ii",
      date: "Guyyaa",
      startTime: "Yeroo Jalqabaa",
      endTime: "Yeroo Xumuraa",
      presentMembers: "👥 Miseensota Argaman",
      absentMembers: "🚫 Miseensota Dhabaaman & Sababa",
      memberN: "ffaa Miseensa",
      name: "Maqaa",
      reason: "Sababa",
      prevResults: "📋 Bu'aawwan Walga'ii Darbee",
      todayTopics: "💬 Mata-dureen Har'aa",
      topic: "Mata-duree",
      standingAgendas: "Ajandaalee Dhaabbataa:",
      explanation: "📝 Ibsa Kenname",
      explanationPlaceholder: "Ibsa barreessi...",
      gaps: "⚠️ Hanqinaalee Argaman",
      agreements: "✅ Waliigaltee",
      signatures: "✍️ Mallattoowwan",
      signatureN: "ffaa Mallattoo",
      save: "Gabaasa Olkaa'i ✓",
      newReport: "Gabaasa Haaraa ➤",
      saved: "Gabaasni Ol Kaa'ame!",
      savedSub: "Gabaasni Foramii milkaa'inaan xumurameera.",
    },
    evaluation: {
      title: "Madaallii Foramii",
      subtitle: "Bulchiinsa Magaalaa Addis Ababa · Biiroo Tajaajila Ummataa",
      outOf: "Qabxii 100 keessaa",
      teamMembers: "👥 Miseensota Garee",
      bestPerformer: "Hojjetaa Caalaame",
      bestPlaceholder: "Maqaa galchi...",
      total: "Waliigala",
      save: "Madaallii Olkaa'i",
      reset: "Deebi'i",
      weight: "Ulfina",
      maxPts: "Qabxii Ol.",
    },
    dailyReport: {
      title: "Gabaasa Guyyaa",
      reportDate: "📅 Guyyaa Gabaasaa",
      serviceList: "📋 Tarree Tajaajilaa",
      colNo: "#",
      colDept: "Waajjira",
      colService: "Tajaajila",
      colMale: "D",
      colFemale: "D",
      colTotal: "Waliigala",
      grandTotal: "Waliigala Guutuu",
      addRow: "+ Tarree Dabalata",
      save: "💾 Gabaasa Olkaa'i",
    },
    services: {
      title: "Addis Mesob · Tajaajila",
      subtitle: "Wiirtuu Dijitaalaa · Tajaajila",
      search: "🔍 Tajaajila barbaadi...",
      all: "Hunda",
      active: "✓ Hojjechaa jira",
      inactive: "✗ Hin jalqabne",
      noneFound: "Tajaajilli hin argamne",
      catalogue: "Tajaajila Catalogue",
    },
    criteria: {
      c1: "Tajaajila Bu'a qabeessa",
      c2: "Amala Hojii Cimaa",
      c3: "Yeroo fi Qulqullina",
      c4: "Hojii Fakkeenya",
      c5: "Tumsa Madaallii",
    },
    agendas: [
      "Bulchiinsa gaarii mirkaneessuu",
      "Hojii badaa loluu",
      "Tajaajila fooyyessuu",
      "QMS hojiirra oolchuu",
      "Hojii fakkeenya torbee",
      "Rakkoolee muudatan",
      "Akkamitti furamuu",
    ],
  },
};

const LANGUAGES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "am", label: "አማርኛ", flag: "አማ" },
  { code: "or", label: "Afaan Oromo", flag: "OR" },
];

// ════════════════════════════════════════════════════════════
// data/constants.js (inlined)
// ════════════════════════════════════════════════════════════
const CRITERIA = [
  {
    id: 1,
    key: "c1",
    weight: 25,
    color: "#1a6b4a",
    titleEn: "Effective Service Delivery",
    items: [
      { text: "የቡድኑ አባላት ተጨባጭ ዉጤት ያስመዘገቡ", points: 4 },
      { text: "ሰርተው ጥቅምን ለማግኘት የሚተጉ", points: 3 },
      { text: "ያልቆራረጠ አፈጻጸም ያሳዩ", points: 3 },
      { text: "ብልሹ አሰራርን ታግለዋል", points: 4 },
      { text: "ምርጥ ፈጻሚዎች በጎ ተጽዕኖ ፈጥረዋል", points: 3 },
      { text: "ቀሪ ሥራዎችን ለመፈፀም ክህሎት ተምስክሯል", points: 4 },
      { text: "አደገኛ አዝማሚያዎች ፈትተዋል", points: 4 },
    ],
  },
  {
    id: 2,
    key: "c2",
    weight: 22,
    color: "#1e4d8c",
    titleEn: "Strong Work Ethics",
    items: [
      { text: "ሥራ የሚበድሉትን ወደ መስመር ያስገቡ", points: 9 },
      { text: "ጠንካራ የሥራ መንፈስ ያሳዩ", points: 9 },
      { text: "የአገልጋይነት መንፈስ ያዳበሩ", points: 4 },
    ],
  },
  {
    id: 3,
    key: "c3",
    weight: 23,
    color: "#7b2d8b",
    titleEn: "Timely & Quality Execution",
    items: [
      { text: "ራዕይና ተልዕኮ ጠንቅቀው ያውቃሉ", points: 4 },
      { text: "ከተማዋን ለማሻሻል የሚጥሩ", points: 3 },
      { text: "የፖሊሲዎች እምነት ያላቸዉ", points: 4 },
      { text: "ግልፅና ተገቢ አቋም ያላቸው", points: 3 },
      { text: "ተጨባጭ ለውጥ ያመጡ", points: 4 },
      { text: "ሥራ በጥራት፣ ፍጥነት ፈጽሟል", points: 5 },
    ],
  },
  {
    id: 4,
    key: "c4",
    weight: 15,
    color: "#c25a00",
    titleEn: "Creating Exemplary Work",
    items: [
      { text: "አዳዲስ ሀሳቦችን ተግባር አድርገዋል", points: 7 },
      { text: "ሁሉም ሀሳብ ነፃነት ይቀርብበት አደረጃጀት", points: 4 },
      { text: "ዘመናዊ ቴክኖሎጅ ተጠቅመዋል", points: 4 },
    ],
  },
  {
    id: 5,
    key: "c5",
    weight: 15,
    color: "#8b1a1a",
    titleEn: "Principle-Based Cooperation",
    items: [
      { text: "ተልዕኮ ማዕከል ያደረገ መደጋገፍ", points: 5 },
      { text: "ጥንካሬ/ድክመት ለቀጣዩ ተጠቀሙ", points: 4 },
      { text: "ተጠያቂነት ስርዓት ተፈጸሟል", points: 4 },
      { text: "የታታሪ ሠራተኛ መረጃ ለሥራ ዋሉ", points: 2 },
    ],
  },
];

const SERVICES = [
  {
    dept: "ገቢዎች",
    deptEn: "Revenue",
    name: "ቲን ሬጅስትሬሽን",
    nameEn: "TIN Registration",
    active: true,
  },
  {
    dept: "ገቢዎች",
    deptEn: "Revenue",
    name: "አዲስ የንግድ ፍቃድ",
    nameEn: "New Business License",
    active: true,
  },
  {
    dept: "ገቢዎች",
    deptEn: "Revenue",
    name: "የንግድ ፍቃድ ዕድሳት",
    nameEn: "Business License Renewal",
    active: true,
  },
  {
    dept: "ገቢዎች",
    deptEn: "Revenue",
    name: "ንግድ ምዝገባ ማሻሻያ",
    nameEn: "Trade Reg. Amendment",
    active: true,
  },
  {
    dept: "ገቢዎች",
    deptEn: "Revenue",
    name: "የንግድ ምዝገባ ምትክ",
    nameEn: "Trade Reg. Replacement",
    active: true,
  },
  {
    dept: "አሽ/ተሽ",
    deptEn: "Transport",
    name: "የአሽከርካሪ ፈቃድ ዕድሳት",
    nameEn: "Driver License Renewal",
    active: true,
  },
  {
    dept: "አሽ/ተሽ",
    deptEn: "Transport",
    name: "ዓመታዊ ቴክ. ምርመራ",
    nameEn: "Annual Vehicle Inspection",
    active: true,
  },
  {
    dept: "ሲቪል ምዝገባ",
    deptEn: "Civil Registry",
    name: "የልደት ምዝገባ",
    nameEn: "Birth Registration",
    active: true,
  },
  {
    dept: "ሲቪል ምዝገባ",
    deptEn: "Civil Registry",
    name: "ወሳኝ ኩነት ማረጋገጥ",
    nameEn: "Vital Events Verification",
    active: true,
  },
  {
    dept: "ሲቪል ምዝገባ",
    deptEn: "Civil Registry",
    name: "የነዋሪነት መታወቂያ",
    nameEn: "Resident ID",
    active: true,
  },
  {
    dept: "ኢንቨስትመንት",
    deptEn: "Investment",
    name: "አዲስ የኢንቨስትመንት ፍቃድ",
    nameEn: "New Investment License",
    active: true,
  },
  {
    dept: "ስራና ክህሎት",
    deptEn: "Labor & Skills",
    name: "ስራ ፈላጊዎች ምዝገባ",
    nameEn: "Jobseeker Registration",
    active: true,
  },
  {
    dept: "ስራና ክህሎት",
    deptEn: "Labor & Skills",
    name: "መረጃ፣ ምክርና ግንዛቤ",
    nameEn: "Info & Counseling",
    active: true,
  },
  {
    dept: "ቤቶች",
    deptEn: "Housing",
    name: "የቤት ኪራይ ውል ማደስ",
    nameEn: "Rental Contract Renewal",
    active: true,
  },
];

const SAMPLE_DATA = [
  { dept: "ገቢዎች", service: "ቲን ሬጅስትሬሽን", male: 8, female: 5, total: 13 },
  { dept: "ገቢዎች", service: "አዲስ ፍቃድ", male: 30, female: 18, total: 48 },
  { dept: "ገቢዎች", service: "ፍቃድ ዕድሳት", male: 15, female: 12, total: 27 },
  { dept: "አሽ/ተሽ", service: "ፈቃድ ዕድሳት", male: 24, female: 9, total: 33 },
  { dept: "አሽ/ተሽ", service: "ቴክ. ምርመራ", male: 58, female: 5, total: 63 },
  { dept: "ሲቪል ምዝገባ", service: "ወሳኝ ኩነት", male: 8, female: 5, total: 13 },
  { dept: "ሲቪል ምዝገባ", service: "የነዋሪነት ID", male: 4, female: 1, total: 5 },
  { dept: "ስራና ክህሎት", service: "ምዝገባ", male: 23, female: 8, total: 31 },
  { dept: "ቤቶች", service: "ኪራይ ውል", male: 40, female: 22, total: 62 },
];

// ════════════════════════════════════════════════════════════
// styles/theme.js (inlined)
// ════════════════════════════════════════════════════════════
const C = {
  primary: "#1a6b4a",
  light: "#2aaa78",
  bg: "#e8f5ee",
  dark: "#0d1f14",
  gray: "#f2f6f3",
  white: "#fff",
  muted: "#666",
  border: "#d0ddd6",
  cardBg: "#f8faf9",
  blue: "#1e4d8c",
  purple: "#7b2d8b",
  orange: "#c25a00",
  red: "#8b1a1a",
};
const F = {
  sans: "'Noto Sans Ethiopic',sans-serif",
  serif: "'Noto Serif Ethiopic',serif",
};
const btn = {
  primary: {
    background: `linear-gradient(135deg,${C.primary},${C.light})`,
    color: "#fff",
    border: "none",
    padding: "11px 26px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: F.sans,
    boxShadow: `0 4px 14px ${C.primary}44`,
  },
  secondary: {
    background: C.bg,
    color: C.primary,
    border: `2px solid ${C.primary}`,
    padding: "9px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: F.sans,
  },
};
const inp = {
  border: `1.5px solid ${C.border}`,
  borderRadius: 7,
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: F.sans,
  outline: "none",
  background: "#fafffe",
  width: "100%",
};
const card = {
  background: C.white,
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 2px 12px #0002",
};

// ════════════════════════════════════════════════════════════
// components/layout/Sidebar
// ════════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", icon: "⬢" },
  { id: "forum", icon: "◈" },
  { id: "evaluation", icon: "◉" },
  { id: "report", icon: "◫" },
  { id: "services", icon: "◧" },
];

function Sidebar({ tab, setTab, lang, setLang, t, collapsed, setCollapsed }) {
  return (
    <aside
      style={{
        width: collapsed ? 62 : 220,
        minHeight: "100vh",
        background: C.dark,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s",
        borderRight: `2px solid ${C.primary}`,
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "16px 0" : "16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid #1a3a26",
          cursor: "pointer",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          style={{
            width: 34,
            height: 34,
            minWidth: 34,
            background: `linear-gradient(135deg,${C.primary},${C.light})`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 900,
            color: "#fff",
            fontFamily: F.serif,
            marginLeft: collapsed ? "auto" : 0,
            marginRight: collapsed ? "auto" : 0,
          }}
        >
          አ
        </div>
        {!collapsed && (
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: C.light,
                fontFamily: F.serif,
              }}
            >
              {t.appName}
            </div>
            <div style={{ fontSize: 9, color: "#6aaa88", letterSpacing: 0.5 }}>
              One-Stop
            </div>
          </div>
        )}
      </div>

      {/* Nav label */}
      {!collapsed && (
        <div
          style={{
            padding: "10px 14px 2px",
            fontSize: 9,
            color: "#4a7a5a",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {t.sidebar.main}
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "4px 0" }}>
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              title={t.nav[n.id]}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "11px 0" : "10px 16px",
                background: active ? "#1a6b4a22" : "none",
                border: "none",
                borderLeft: active
                  ? `3px solid ${C.light}`
                  : "3px solid transparent",
                color: active ? C.light : "#7a9a88",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                fontFamily: F.sans,
                transition: "all .18s",
                marginBottom: 1,
              }}
            >
              <span style={{ fontSize: 17 }}>{n.icon}</span>
              {!collapsed && <span>{t.nav[n.id]}</span>}
            </button>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div
        style={{
          borderTop: "1px solid #1a3a26",
          padding: collapsed ? "10px 0" : "12px 10px",
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: 9,
              color: "#4a7a5a",
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            {t.sidebar.language}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            gap: 4,
            alignItems: collapsed ? "center" : "flex-start",
            flexWrap: "wrap",
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              title={l.label}
              style={{
                background: lang === l.code ? C.primary : "transparent",
                color: lang === l.code ? "#fff" : "#5a8a6a",
                border: `1px solid ${lang === l.code ? C.primary : "#2a5a3a"}`,
                borderRadius: 5,
                padding: collapsed ? "5px 3px" : "3px 7px",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: F.sans,
              }}
            >
              {l.flag}
            </button>
          ))}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: "#162c1e",
          border: "none",
          color: "#4a7a5a",
          padding: "8px",
          cursor: "pointer",
          fontSize: 13,
          borderTop: "1px solid #1a3a26",
        }}
      >
        {collapsed ? "▶" : "◀"}
      </button>
    </aside>
  );
}

// ════════════════════════════════════════════════════════════
// components/layout/Header
// ════════════════════════════════════════════════════════════
function Header({ tab, t, lang, setLang }) {
  const icons = {
    dashboard: "⬢",
    forum: "◈",
    evaluation: "◉",
    report: "◫",
    services: "◧",
  };
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <header
      style={{
        height: 52,
        background: C.white,
        borderBottom: "1px solid #e0ece4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        boxShadow: "0 1px 4px #0001",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, color: C.primary }}>
          {icons[tab] || "◈"}
        </span>
        <span style={{ color: C.muted, fontSize: 12, fontFamily: F.sans }}>
          {t.appName}
        </span>
        <span style={{ color: "#ccc" }}>›</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          {t.nav[tab]}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: F.sans }}>
          📅 {dateStr}
        </span>
        <div style={{ display: "flex", gap: 3 }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                background: lang === l.code ? C.primary : "#f0f7f4",
                color: lang === l.code ? "#fff" : C.primary,
                border: `1px solid ${lang === l.code ? C.primary : C.border}`,
                borderRadius: 5,
                padding: "3px 8px",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: F.sans,
              }}
            >
              {l.flag}
            </button>
          ))}
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            background: `linear-gradient(135deg,${C.primary},${C.light})`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: "#fff",
            fontWeight: 900,
            fontFamily: F.serif,
            cursor: "pointer",
            boxShadow: `0 2px 6px ${C.primary}44`,
          }}
        >
          አ
        </div>
      </div>
    </header>
  );
}

// ════════════════════════════════════════════════════════════
// components/ui — Field, Section, StatCard
// ════════════════════════════════════════════════════════════
function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#555",
          fontFamily: F.sans,
        }}
      >
        {label}
      </label>
      <input
        style={inp}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div
      style={{
        marginBottom: 24,
        paddingBottom: 18,
        borderBottom: "1px solid #eee",
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: C.primary,
          marginBottom: 12,
          fontFamily: F.sans,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
function StatCard({ label, value, icon, color }) {
  return (
    <div
      style={{
        background: C.white,
        padding: "18px 14px",
        borderRadius: 12,
        textAlign: "center",
        boxShadow: "0 2px 12px #0002",
        borderTop: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6, color }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: C.dark }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: F.sans }}>
        {label}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// pages/Dashboard
// ════════════════════════════════════════════════════════════
function Dashboard({ t }) {
  const td = t.dashboard;
  const total = SAMPLE_DATA.reduce((a, r) => a + r.total, 0);
  const males = SAMPLE_DATA.reduce((a, r) => a + r.male, 0);
  const females = SAMPLE_DATA.reduce((a, r) => a + r.female, 0);
  const depts = SAMPLE_DATA.reduce((acc, r) => {
    acc[r.dept] = (acc[r.dept] || 0) + r.total;
    return acc;
  }, {});
  const maxD = Math.max(...Object.values(depts));
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          {td.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {t.year}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard
          label={td.todayServices}
          value={total}
          icon="◈"
          color={C.primary}
        />
        <StatCard label={td.male} value={males} icon="◉" color={C.blue} />
        <StatCard label={td.female} value={females} icon="◉" color={C.purple} />
        <StatCard
          label={td.departments}
          value={Object.keys(depts).length}
          icon="⬢"
          color={C.orange}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <div style={card}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: 15,
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {td.deptReport}
          </h3>
          {Object.entries(depts).map(([dept, val]) => (
            <div key={dept} style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{ fontSize: 12, color: "#444", fontFamily: F.sans }}
                >
                  {dept}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>
                  {val}
                </span>
              </div>
              <div
                style={{
                  background: C.bg,
                  height: 7,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(val / maxD) * 100}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: `linear-gradient(90deg,${C.primary},${C.light})`,
                    transition: "width .8s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3
            style={{
              margin: "0 0 14px",
              fontSize: 15,
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {td.forumAgendas}
          </h3>
          {t.agendas.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "6px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  minWidth: 22,
                  background: C.primary,
                  color: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#333",
                  fontFamily: F.sans,
                  lineHeight: 1.5,
                }}
              >
                {a}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: 15,
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          {td.criteriaOverview}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 10,
          }}
        >
          {CRITERIA.map((c) => (
            <div
              key={c.id}
              style={{
                background: C.cardBg,
                borderRadius: 8,
                padding: "14px 10px",
                textAlign: "center",
                borderTop: `4px solid ${c.color}`,
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: c.color,
                  marginBottom: 4,
                }}
              >
                {c.weight}%
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#222",
                  fontFamily: F.sans,
                  marginBottom: 3,
                }}
              >
                {t.criteria[c.key]}
              </div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 6 }}>
                {c.titleEn}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.primary,
                  background: C.bg,
                  borderRadius: 10,
                  padding: "2px 6px",
                  display: "inline-block",
                }}
              >
                {c.items.length} {td.subCriteria}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// pages/ForumReport
// ════════════════════════════════════════════════════════════
function ForumReport({ t }) {
  const tf = t.forum;
  const [form, setForm] = useState({
    date: "",
    timeStart: "",
    timeEnd: "",
    present: Array(7).fill(""),
    absent: Array(4).fill(""),
    absentReason: Array(4).fill(""),
    prevResults: ["", ""],
    topics: ["", "", "", ""],
    explanation: "",
    gaps: ["", ""],
    agreements: ["", ""],
  });
  const [submitted, setSubmitted] = useState(false);
  const upd = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const updArr = (f, i, v) =>
    setForm((p) => {
      const a = [...p[f]];
      a[i] = v;
      return { ...p, [f]: a };
    });

  if (submitted)
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: C.white,
            borderRadius: 16,
            boxShadow: "0 4px 24px #0002",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: C.primary,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              color: "#fff",
              margin: "0 auto 18px",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: C.primary,
              fontFamily: F.serif,
              marginBottom: 8,
            }}
          >
            {tf.saved}
          </h2>
          <p style={{ color: C.muted, marginBottom: 22, fontFamily: F.sans }}>
            {tf.savedSub}
          </p>
          <button style={btn.primary} onClick={() => setSubmitted(false)}>
            {tf.newReport}
          </button>
        </div>
      </div>
    );

  const g3 = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 };
  const g2 = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 8,
  };
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          {tf.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {t.year}
        </span>
      </div>
      <p
        style={{
          color: "#555",
          marginBottom: 24,
          fontSize: 13,
          fontFamily: F.sans,
        }}
      >
        {tf.subtitle}
      </p>

      <div
        style={{
          background: C.white,
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 2px 16px #0003",
        }}
      >
        <Section title={tf.meetingTime}>
          <div style={g3}>
            <Field
              label={tf.date}
              value={form.date}
              onChange={(v) => upd("date", v)}
              type="date"
            />
            <Field
              label={tf.startTime}
              value={form.timeStart}
              onChange={(v) => upd("timeStart", v)}
              type="time"
            />
            <Field
              label={tf.endTime}
              value={form.timeEnd}
              onChange={(v) => upd("timeEnd", v)}
              type="time"
            />
          </div>
        </Section>

        <Section title={tf.presentMembers}>
          <div style={g3}>
            {form.present.map((v, i) => (
              <Field
                key={i}
                label={`${i + 1}${tf.memberN}`}
                value={v}
                onChange={(val) => updArr("present", i, val)}
              />
            ))}
          </div>
        </Section>

        <Section title={tf.absentMembers}>
          {form.absent.map((_, i) => (
            <div key={i} style={g2}>
              <Field
                label={`${i + 1} ${tf.name}`}
                value={form.absent[i]}
                onChange={(v) => updArr("absent", i, v)}
              />
              <Field
                label={tf.reason}
                value={form.absentReason[i]}
                onChange={(v) => updArr("absentReason", i, v)}
              />
            </div>
          ))}
        </Section>

        <Section title={tf.prevResults}>
          {form.prevResults.map((v, i) => (
            <Field
              key={i}
              label={`${i + 1}.`}
              value={v}
              onChange={(val) => updArr("prevResults", i, val)}
            />
          ))}
        </Section>

        <Section title={tf.todayTopics}>
          {form.topics.map((v, i) => (
            <Field
              key={i}
              label={`${tf.topic} ${i + 1}`}
              value={v}
              onChange={(val) => updArr("topics", i, val)}
            />
          ))}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#444",
                fontFamily: F.sans,
              }}
            >
              {tf.standingAgendas}
            </span>
            {t.agendas.slice(0, 4).map((a, i) => (
              <label
                key={i}
                style={{
                  fontSize: 11,
                  color: "#555",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontFamily: F.sans,
                }}
              >
                <input type="checkbox" /> {a}
              </label>
            ))}
          </div>
        </Section>

        <Section title={tf.explanation}>
          <textarea
            style={{ ...inp, resize: "vertical", minHeight: 80 }}
            rows={3}
            value={form.explanation}
            onChange={(e) => upd("explanation", e.target.value)}
            placeholder={tf.explanationPlaceholder}
          />
        </Section>

        <Section title={tf.gaps}>
          {form.gaps.map((v, i) => (
            <Field
              key={i}
              label={`${i + 1}.`}
              value={v}
              onChange={(val) => updArr("gaps", i, val)}
            />
          ))}
        </Section>

        <Section title={tf.agreements}>
          {form.agreements.map((v, i) => (
            <Field
              key={i}
              label={`${i + 1}.`}
              value={v}
              onChange={(val) => updArr("agreements", i, val)}
            />
          ))}
        </Section>

        <Section title={tf.signatures}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 10,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Field
                key={n}
                label={`${n}${tf.signatureN}`}
                value=""
                onChange={() => {}}
              />
            ))}
          </div>
        </Section>

        {/* <div style={{ textAlign: "center", marginTop: 20 }}>
          <button style={btn.primary} onClick={() => setSubmitted(true)}>
            {tf.save}
          </button>
        </div> */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "11px 26px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
            }}
            onClick={() => exportForumReportToPDF(form, t, 1)}
          >
            📄 Export PDF
          </button>
          <button style={btn.primary} onClick={() => setSubmitted(true)}>
            {tf.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// pages/Evaluation
// ════════════════════════════════════════════════════════════
function Evaluation({ t }) {
  const te = t.evaluation;
  const [scores, setScores] = useState({});
  const [members, setMembers] = useState(["አባል 1", "አባል 2", "አባል 3"]);
  const setScore = (cId, iIdx, m, v) => {
    const key = `${cId}-${iIdx}-${m}`;
    const max = CRITERIA[cId - 1].items[iIdx].points;
    setScores((s) => ({ ...s, [key]: Math.min(Number(v), max) }));
  };
  const total = (m) =>
    CRITERIA.flatMap((c) =>
      c.items.map((_, i) => scores[`${c.id}-${i}-${m}`] || 0),
    ).reduce((a, b) => a + b, 0);

  const totals = members.map((m) => ({ name: m, total: total(m) }));
  const best = totals.reduce((a, b) => (b.total > a ? b.total : a), 0);

  const thS = {
    background: C.dark,
    color: C.light,
    padding: "9px 10px",
    textAlign: "left",
    fontFamily: F.sans,
    fontWeight: 700,
    fontSize: 11,
  };
  const tdS = {
    padding: "8px 10px",
    borderBottom: "1px solid #eef2ee",
    fontFamily: F.sans,
    fontSize: 11,
  };
  const totalScores = (member) => {
    return CRITERIA.flatMap((c) =>
      c.items.map((_, i) => scores[`${c.id}-${i}-${member}`] || 0),
    ).reduce((a, b) => a + b, 0);
  };
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          {te.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {te.outOf}
        </span>
      </div>
      <p
        style={{
          color: "#555",
          marginBottom: 22,
          fontSize: 13,
          fontFamily: F.sans,
        }}
      >
        {te.subtitle}
      </p>

      <div style={card}>
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: 14,
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          {te.teamMembers}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 10,
          }}
        >
          {members.map((m, i) => (
            <input
              key={i}
              style={inp}
              value={m}
              onChange={(e) => {
                const a = [...members];
                a[i] = e.target.value;
                setMembers(a);
              }}
            />
          ))}
        </div>
      </div>

      {CRITERIA.map((c) => (
        <div
          key={c.id}
          style={{
            ...card,
            borderLeft: `5px solid ${c.color}`,
            paddingLeft: 20,
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 800,
              color: c.color,
              fontFamily: F.sans,
            }}
          >
            {t.criteria[c.key]}{" "}
            <span
              style={{
                fontWeight: 400,
                fontSize: 12,
                color: "#888",
                marginLeft: 6,
              }}
            >
              ({c.weight}%)
            </span>
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thS, width: "42%" }}>መስፈርት / Criterion</th>
                  <th style={{ ...thS, textAlign: "center" }}>{te.maxPts}</th>
                  {members.map((m) => (
                    <th key={m} style={{ ...thS, textAlign: "center" }}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={idx % 2 === 0 ? { background: C.cardBg } : {}}
                  >
                    <td style={tdS}>{item.text}</td>
                    <td
                      style={{
                        ...tdS,
                        textAlign: "center",
                        fontWeight: 700,
                        color: c.color,
                      }}
                    >
                      {item.points}
                    </td>
                    {members.map((m) => (
                      <td key={m} style={{ ...tdS, textAlign: "center" }}>
                        <input
                          type="number"
                          min="0"
                          max={item.points}
                          style={{
                            width: 52,
                            border: `1.5px solid ${C.border}`,
                            borderRadius: 6,
                            padding: "4px 6px",
                            textAlign: "center",
                            fontSize: 13,
                          }}
                          value={scores[`${c.id}-${idx}-${m}`] || ""}
                          onChange={(e) =>
                            setScore(c.id, idx, m, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div style={card}>
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: 14,
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          📊 {te.total}
        </h3>
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {totals.map(({ name }) => {
            const isBest = total(name) === best && best > 0;
            return (
              <div
                key={name}
                style={{
                  flex: 1,
                  minWidth: 110,
                  background: isBest ? "#f0f9f4" : C.cardBg,
                  borderRadius: 10,
                  padding: 18,
                  textAlign: "center",
                  border: `2px solid ${isBest ? C.primary : "#e0eee8"}`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: F.sans,
                    marginBottom: 6,
                  }}
                >
                  {name}
                </div>
                <div
                  style={{ fontSize: 36, fontWeight: 900, color: C.primary }}
                >
                  {total(name)}
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>/100</div>
                {isBest && (
                  <div
                    style={{
                      marginTop: 6,
                      background: C.primary,
                      color: "#fff",
                      borderRadius: 10,
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ★ Best
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button style={btn.primary}>💾 {te.save}</button>
          <button style={btn.secondary} onClick={() => setScores({})}>
            ↺ {te.reset}
          </button>
        </div> */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "11px 26px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => {
              const bestPerformer =
                members.length > 0
                  ? members.reduce((a, b) => {
                      return totalScores(a) > totalScores(b) ? a : b;
                    }, members[0])
                  : null;
              exportEvaluationReportToPDF(
                scores,
                members,
                totalScores,
                bestPerformer,
                t,
              );
            }}
          >
            📄 Export PDF
          </button>
          <button style={btn.primary}>💾 {te.save}</button>
          <button style={btn.secondary} onClick={() => setScores({})}>
            ↺ {te.reset}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// pages/DailyReport
// ════════════════════════════════════════════════════════════
function DailyReport({ t }) {
  const td = t.dailyReport;
  const [rows, setRows] = useState(SAMPLE_DATA.map((r) => ({ ...r })));
  const [date, setDate] = useState("");
  const upd = (i, f, v) => {
    const u = [...rows];
    u[i] = { ...u[i], [f]: v };
    if (f === "male" || f === "female")
      u[i].total =
        (Number(f === "male" ? v : u[i].male) || 0) +
        (Number(f === "female" ? v : u[i].female) || 0);
    setRows(u);
  };
  const gT = rows.reduce((a, r) => a + (r.total || 0), 0);
  const gM = rows.reduce((a, r) => a + (r.male || 0), 0);
  const gF = rows.reduce((a, r) => a + (r.female || 0), 0);
  const th = {
    background: C.dark,
    color: C.light,
    padding: "9px 10px",
    textAlign: "left",
    fontFamily: F.sans,
    fontWeight: 700,
    fontSize: 11,
  };
  const td2 = {
    padding: "8px 10px",
    borderBottom: "1px solid #eef2ee",
    fontFamily: F.sans,
    verticalAlign: "middle",
  };
  const ti = {
    border: `1.5px solid ${C.border}`,
    borderRadius: 6,
    padding: "4px 6px",
    fontFamily: F.sans,
    background: "#fafffe",
  };
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          {td.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Daily Report
        </span>
      </div>
      <div style={{ ...card, marginBottom: 16 }}>
        <Field
          label={td.reportDate}
          value={date}
          onChange={setDate}
          type="date"
        />
      </div>
      <div style={card}>
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: 14,
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          {td.serviceList}
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr>
                {[
                  td.colNo,
                  td.colDept,
                  td.colService,
                  td.colMale,
                  td.colFemale,
                  td.colTotal,
                ].map((h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={i % 2 === 0 ? { background: C.cardBg } : {}}>
                  <td
                    style={{
                      ...td2,
                      textAlign: "center",
                      color: "#aaa",
                      fontSize: 11,
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={td2}>
                    <input
                      style={{ ...ti, width: 90, fontSize: 12 }}
                      value={r.dept}
                      onChange={(e) => upd(i, "dept", e.target.value)}
                    />
                  </td>
                  <td style={td2}>
                    <input
                      style={{ ...ti, width: 130, fontSize: 12 }}
                      value={r.service}
                      onChange={(e) => upd(i, "service", e.target.value)}
                    />
                  </td>
                  <td style={td2}>
                    <input
                      type="number"
                      style={{ ...ti, width: 52, textAlign: "center" }}
                      value={r.male}
                      onChange={(e) => upd(i, "male", Number(e.target.value))}
                    />
                  </td>
                  <td style={td2}>
                    <input
                      type="number"
                      style={{ ...ti, width: 52, textAlign: "center" }}
                      value={r.female}
                      onChange={(e) => upd(i, "female", Number(e.target.value))}
                    />
                  </td>
                  <td
                    style={{
                      ...td2,
                      textAlign: "center",
                      fontWeight: 700,
                      color: C.primary,
                      fontSize: 14,
                    }}
                  >
                    {r.total}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#f0f7f4" }}>
                <td
                  colSpan={3}
                  style={{
                    ...td2,
                    fontWeight: 700,
                    textAlign: "right",
                    fontSize: 12,
                  }}
                >
                  {td.grandTotal}
                </td>
                <td style={{ ...td2, fontWeight: 700, textAlign: "center" }}>
                  {gM}
                </td>
                <td style={{ ...td2, fontWeight: 700, textAlign: "center" }}>
                  {gF}
                </td>
                <td
                  style={{
                    ...td2,
                    fontWeight: 700,
                    textAlign: "center",
                    color: C.primary,
                    fontSize: 16,
                  }}
                >
                  {gT}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            style={btn.secondary}
            onClick={() =>
              setRows([
                ...rows,
                { dept: "", service: "", male: 0, female: 0, total: 0 },
              ])
            }
          >
            {td.addRow}
          </button>
          <button style={btn.primary}>{td.save}</button>
        </div> */}
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => exportDailyReportToPDF(rows, date, t)}
          >
            📄 Export PDF
          </button>
          <button
            style={btn.secondary}
            onClick={() =>
              setRows([
                ...rows,
                { dept: "", service: "", male: 0, female: 0, total: 0 },
              ])
            }
          >
            {td.addRow}
          </button>
          <button style={btn.primary}>{td.save}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// pages/Services
// ════════════════════════════════════════════════════════════
function Services({ t }) {
  const ts = t.services;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(ts.all);
  const depts = [ts.all, ...new Set(SERVICES.map((s) => s.dept))];
  const filtered = SERVICES.filter(
    (s) =>
      (filter === ts.all || s.dept === filter) &&
      (s.name.includes(search) ||
        s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        s.dept.includes(search)),
  );
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          {ts.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {ts.catalogue}
        </span>
      </div>
      <p
        style={{
          color: "#555",
          marginBottom: 22,
          fontSize: 13,
          fontFamily: F.sans,
        }}
      >
        {ts.subtitle} · {SERVICES.length}
      </p>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            style={{ ...inp, flex: 1 }}
            placeholder={ts.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={{ ...inp, width: "auto", cursor: "pointer" }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {depts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))",
          gap: 14,
        }}
      >
        {filtered.map((s, i) => (
          <div
            key={i}
            style={{
              background: C.white,
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 2px 10px #0002",
              border: "1px solid #e4ede8",
            }}
          >
            <div style={{ fontSize: 20, color: C.primary, marginBottom: 6 }}>
              ◈
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: F.sans,
                marginBottom: 2,
                color: "#1a1a1a",
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#bbb",
                fontFamily: F.sans,
                marginBottom: 3,
              }}
            >
              {s.nameEn}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#888",
                fontFamily: F.sans,
                marginBottom: 8,
              }}
            >
              {s.dept}
            </div>
            <span
              style={
                s.active
                  ? {
                      background: C.bg,
                      color: C.primary,
                      borderRadius: 9,
                      padding: "2px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                    }
                  : {
                      background: "#ffeee8",
                      color: C.orange,
                      borderRadius: 9,
                      padding: "2px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                    }
              }
            >
              {s.active ? ts.active : ts.inactive}
            </span>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#999",
            fontFamily: F.sans,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 10 }}>◎</div>
          <p>{ts.noneFound}</p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// App.jsx — Root
// ════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [lang, setLang] = useState("am");
  const [collapsed, setCollapsed] = useState(false);
  const t = translations[lang] || translations.am;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.gray,
        fontFamily: F.sans,
        display: "flex",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700;800&family=Noto+Serif+Ethiopic:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;}
        input:focus,textarea:focus,select:focus{border-color:#1a6b4a!important;outline:none;box-shadow:0 0 0 3px #1a6b4a22;}
        button{transition:opacity .15s,transform .15s;}
        button:hover{opacity:.88;transform:translateY(-1px);}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#f0f7f4;}
        ::-webkit-scrollbar-thumb{background:#a0d4b8;border-radius:3px;}
      `}</style>

      <Sidebar
        tab={tab}
        setTab={setTab}
        lang={lang}
        setLang={setLang}
        t={t}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Header tab={tab} t={t} lang={lang} setLang={setLang} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {tab === "dashboard" && <Dashboard t={t} />}
          {tab === "forum" && <ForumReport t={t} />}
          {tab === "evaluation" && <Evaluation t={t} />}
          {tab === "report" && <DailyReport t={t} />}
          {tab === "services" && <Services t={t} />}
        </main>
      </div>
    </div>
  );
}
