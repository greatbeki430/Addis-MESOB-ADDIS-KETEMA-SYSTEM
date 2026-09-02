// src/components/landing/GoldenMondayTeaser.jsx
// Golden Monday promotional section

import { forwardRef } from "react";
import { C, F } from "../../styles/theme";
import { FiSunrise, FiArrowRight } from "react-icons/fi";

const T = {
  ink: "#081d17",
};

const GoldenMondayTeaser = forwardRef(({ copy, onLogin, ...props }, ref) => {
  const SectionHeading = ({ eyebrow, title, sub, dark }) => (
    <div>
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
        background: T.ink,
        color: "#fff",
        marginTop: 40,
        padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px)",
        ...props.style,
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
            eyebrow={copy.eyebrow}
            title={copy.title}
            sub={copy.body}
            dark
          />
          <button
            onClick={onLogin}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 28px rgba(245,197,24,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {copy.cta}
            <FiArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
});

export default GoldenMondayTeaser;
