// src/components/landing/FAQSection.jsx
// FAQ Accordion section

import { forwardRef, useState } from "react";
import { C, F } from "../../styles/theme";
import { FiHelpCircle, FiChevronDown } from "react-icons/fi";

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

const FAQAccordion = ({ items, getText }) => {
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
};

const FAQSection = forwardRef(({ t, copy, language, ...props }, ref) => {
  const getText = (obj) => obj[language] || obj.en;

  const SectionHeading = ({ eyebrow, title, center }) => (
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
          color: C.primary,
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
          color: C.dark,
        }}
      >
        {title}
      </h2>
    </div>
  );

  return (
    <section
      ref={ref}
      {...props}
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding:
          "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) clamp(40px, 6vw, 60px)",
        ...props.style,
      }}
    >
      <SectionHeading
        eyebrow={
          <>
            <FiHelpCircle size={14} style={{ marginRight: 4 }} /> {copy.eyebrow}
          </>
        }
        title={copy.title}
        center
      />
      <div style={{ marginTop: 32 }}>
        <FAQAccordion items={FAQ_ITEMS} getText={getText} />
      </div>
    </section>
  );
});

export default FAQSection;
