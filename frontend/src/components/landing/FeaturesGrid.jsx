// src/components/landing/FeaturesGrid.jsx
// Features grid with cards

import { forwardRef } from "react";
import { C, F } from "../../styles/theme";
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
} from "react-icons/fi";

const FEATURES = [
  {
    icon: <FiBarChart2 size={24} />,
    big: true,
    titleKey: "dashboardAnalytics",
    bodyKey: "dashboardAnalyticsBody",
  },
  {
    icon: <FiSunrise size={24} />,
    big: true,
    titleKey: "goldenMonday",
    bodyKey: "goldenMondayBody",
  },
  {
    icon: <FiMessageSquare size={20} />,
    titleKey: "peerForum",
    bodyKey: "peerForumBody",
  },
  {
    icon: <FiStar size={20} />,
    titleKey: "evaluation",
    bodyKey: "evaluationBody",
  },
  {
    icon: <FiFileText size={20} />,
    titleKey: "dailyForumReports",
    bodyKey: "dailyForumReportsBody",
  },
  {
    icon: <FiShield size={20} />,
    titleKey: "documentVault",
    bodyKey: "documentVaultBody",
  },
  {
    icon: <FiCpu size={20} />,
    titleKey: "aiAssistant",
    bodyKey: "aiAssistantBody",
  },
  {
    icon: <FiUsers size={20} />,
    titleKey: "teamUserManagement",
    bodyKey: "teamUserManagementBody",
  },
  {
    icon: <FiGlobe size={20} />,
    titleKey: "threeLanguages",
    bodyKey: "threeLanguagesBody",
  },
];

const T = {
  weave: "rgba(245,197,24,0.14)",
};

const FeaturesGrid = forwardRef(({ t, copy, ...props }, ref) => {
  const getFeatureTitle = (key) => {
    const titles = {
      dashboardAnalytics:
        t("landing.featureDashboardAnalytics") || "Dashboard & Analytics",
      goldenMonday: t("landing.featureGoldenMonday") || "Golden Monday",
      peerForum: t("landing.featurePeerForum") || "Peer Forum",
      evaluation: t("landing.featureEvaluation") || "Evaluation",
      dailyForumReports:
        t("landing.featureDailyForumReports") || "Daily & Forum Reports",
      documentVault: t("landing.featureDocumentVault") || "Document Vault",
      aiAssistant:
        t("landing.featureAiAssistant") || "AI Assistant, everywhere",
      teamUserManagement:
        t("landing.featureTeamUserManagement") || "Team & User Management",
      threeLanguages:
        t("landing.featureThreeLanguages") || "Three languages, natively",
    };
    return titles[key] || key;
  };

  const getFeatureBody = (key) => {
    const bodies = {
      dashboardAnalyticsBody:
        t("landing.featureDashboardAnalyticsBody") ||
        "Live overview of organizational performance...",
      goldenMondayBody:
        t("landing.featureGoldenMondayBody") ||
        "Weekly capacity-building program...",
      peerForumBody:
        t("landing.featurePeerForumBody") ||
        "A shared space for teams to discuss cases...",
      evaluationBody:
        t("landing.featureEvaluationBody") ||
        "Structured, criteria-based staff evaluation...",
      dailyForumReportsBody:
        t("landing.featureDailyForumReportsBody") ||
        "Team leaders log activity once...",
      documentVaultBody:
        t("landing.featureDocumentVaultBody") ||
        "Secure, traceable storage with AI auto-fill...",
      aiAssistantBody:
        t("landing.featureAiAssistantBody") ||
        "A floating assistant and inline AI summaries...",
      teamUserManagementBody:
        t("landing.featureTeamUserManagementBody") ||
        "Admins manage teams, roles, and access...",
      threeLanguagesBody:
        t("landing.featureThreeLanguagesBody") ||
        "Every screen works in English, Amharic, and Afaan Oromo...",
    };
    return bodies[key] || key;
  };

  // Section Heading component inline
  const SectionHeading = ({ eyebrow, title, sub, center }) => (
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
      {sub && (
        <p
          style={{
            marginTop: 12,
            fontSize: 15,
            lineHeight: 1.65,
            color: C.muted,
            maxWidth: 580,
            margin: center ? "12px auto 0" : "12px 0 0",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );

  return (
    <section
      ref={ref}
      {...props}
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) 12px",
        ...props.style,
      }}
    >
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        sub={copy.sub}
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
              background: "#fff",
              borderRadius: 18,
              padding: f.big ? 30 : 22,
              border: "1px solid #e5e7eb",
              position: "relative",
              overflow: "hidden",
              transition:
                "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 16px 36px rgba(6,11,46,0.12)";
              e.currentTarget.style.borderColor = C.primary + "55";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#e5e7eb";
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
              {getFeatureTitle(f.titleKey)}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                lineHeight: 1.6,
                color: C.muted,
              }}
            >
              {getFeatureBody(f.bodyKey)}
            </p>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { 
          #lp-features-grid { grid-template-columns: repeat(2, 1fr) !important; } 
          #lp-features-grid > div { grid-column: span 1 !important; } 
        }
        @media (max-width: 560px) { 
          #lp-features-grid { grid-template-columns: 1fr !important; } 
        }
      `}</style>
    </section>
  );
});

export default FeaturesGrid;
