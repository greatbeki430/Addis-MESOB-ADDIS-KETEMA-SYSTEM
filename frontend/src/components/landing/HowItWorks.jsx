// src/components/landing/HowItWorks.jsx
// How it works - 3 step guide

import { forwardRef } from "react";
import { C, F } from "../../styles/theme";
import { FiLogIn, FiUsers, FiCheckCircle } from "react-icons/fi";

const STEPS = [
  {
    icon: <FiLogIn size={20} />,
    titleKey: "step1Title",
    bodyKey: "step1Body",
  },
  {
    icon: <FiUsers size={20} />,
    titleKey: "step2Title",
    bodyKey: "step2Body",
  },
  {
    icon: <FiCheckCircle size={20} />,
    titleKey: "step3Title",
    bodyKey: "step3Body",
  },
];

const HowItWorks = forwardRef(({ t, copy, ...props }, ref) => {
  const getStepTitle = (key) => {
    const titles = {
      step1Title:
        t("landing.step1Title") || "Sign in with your organization account",
      step2Title: t("landing.step2Title") || "Your role decides what you see",
      step3Title: t("landing.step3Title") || "Work, report, and let AI help",
    };
    return titles[key] || key;
  };

  const getStepBody = (key) => {
    const bodies = {
      step1Body:
        t("landing.step1Body") ||
        "Your admin creates your account; you sign in and land straight on your dashboard.",
      step2Body:
        t("landing.step2Body") ||
        "Employees, team leaders, admins, and super admins each get exactly the tools their role needs.",
      step3Body:
        t("landing.step3Body") ||
        "Log activity, evaluate staff, upload documents — AI summaries are one click away the whole time.",
    };
    return bodies[key] || key;
  };

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
        maxWidth: 1000,
        margin: "0 auto",
        padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) 12px",
        ...props.style,
      }}
    >
      <SectionHeading eyebrow={copy.eyebrow} title={copy.title} center />
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
              {getStepTitle(s.titleKey)}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
                color: C.muted,
              }}
            >
              {getStepBody(s.bodyKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default HowItWorks;
