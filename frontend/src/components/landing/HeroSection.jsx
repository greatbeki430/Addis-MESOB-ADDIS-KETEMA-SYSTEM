// src/components/landing/HeroSection.jsx
// Hero section matching the A-MESOB THUMBNAIL design
// Pure CSS/React implementation - no image backgrounds

import { useState, useEffect } from "react";
import {
  FiLogIn,
  FiArrowRight,
  FiGrid,
  FiBarChart2,
  FiFileText,
  FiUsers,
  FiShield,
  FiCpu,
} from "react-icons/fi";
import { C, F } from "../../styles/theme";
import mesobLogo from "../../assets/mesoblogo.png";

const HeroSection = ({ t, onLogin }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: isMobile ? "auto" : "85vh",
        display: "flex",
        alignItems: "center",
        paddingTop: isMobile
          ? "clamp(40px, 8vw, 60px)"
          : "clamp(48px, 8vw, 80px)",
        paddingBottom: isMobile
          ? "clamp(40px, 8vw, 60px)"
          : "clamp(56px, 8vw, 88px)",
        paddingLeft: "clamp(16px, 5vw, 64px)",
        paddingRight: "clamp(16px, 5vw, 64px)",
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(26, 107, 74, 0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(245, 197, 24, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(26, 58, 173, 0.10) 0%, transparent 40%),
          linear-gradient(145deg, #0a1f1a 0%, #0d3327 35%, #1a4a3a 70%, #0a2a1e 100%)
        `,
        color: "#fff",
        borderBottom: "1px solid rgba(245, 197, 24, 0.12)",
      }}
    >
      {/* Animated decorative background elements */}
      <DecorativeBackground />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 1fr",
          gap: isMobile ? 40 : isTablet ? 40 : 60,
          alignItems: "center",
          width: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Left Column - Content */}
        <div style={{ order: isMobile ? 1 : 0 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(245, 197, 24, 0.12)",
              border: "1px solid rgba(245, 197, 24, 0.25)",
              color: C.goldLight,
              padding: isMobile ? "4px 12px" : "6px 16px",
              borderRadius: 999,
              fontSize: isMobile ? 10 : 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              marginBottom: isMobile ? 14 : 20,
            }}
          >
            <FiGrid size={isMobile ? 11 : 13} />
            {t("landing.eyebrow") || "Digital Ethiopia · Smart Services"}
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontFamily: F.serif,
              fontSize: isMobile
                ? "clamp(28px, 8vw, 38px)"
                : "clamp(38px, 6.5vw, 60px)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {t("landing.heroTitle") || "Every service, in one basket."}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: isMobile
                ? "clamp(14px, 4vw, 16px)"
                : "clamp(15px, 2.2vw, 18px)",
              lineHeight: 1.7,
              color: "#b8c4e8",
              maxWidth: isMobile ? "100%" : 520,
              marginTop: isMobile ? 14 : 18,
            }}
          >
            {t("landing.heroBody") ||
              "Addis MESOB is a unified digital platform that integrates government services such as registration, evaluation, reporting, documents, and AI assistance into one seamless experience for staff and citizens."}
          </p>

          {/* Feature Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 6 : 8,
              marginTop: isMobile ? 14 : 20,
            }}
          >
            {[
              {
                icon: <FiGrid size={isMobile ? 11 : 13} />,
                label: t("landing.serviceManagement") || "Service Management",
              },
              {
                icon: <FiBarChart2 size={isMobile ? 11 : 13} />,
                label:
                  t("landing.evaluationReporting") || "Evaluation & Reporting",
              },
              {
                icon: <FiShield size={isMobile ? 11 : 13} />,
                label: t("landing.secureReliable") || "Secure & Reliable",
              },
            ].map((item, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20,
                  padding: isMobile ? "4px 10px" : "5px 14px",
                  fontSize: isMobile ? 10 : 12,
                  color: "#c9d0f0",
                  whiteSpace: "nowrap",
                }}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 10 : 14,
              marginTop: isMobile ? 20 : 28,
              width: "100%",
            }}
          >
            <button
              onClick={onLogin}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                color: C.dark,
                border: "none",
                padding: isMobile ? "12px 24px" : "13px 28px",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: isMobile ? 14 : 14,
                cursor: "pointer",
                fontFamily: F.sans,
                boxShadow: "0 4px 20px rgba(245, 197, 24, 0.25)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? 48 : "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(245, 197, 24, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(245, 197, 24, 0.25)";
              }}
            >
              <FiLogIn size={isMobile ? 16 : 16} />
              {t("landing.ctaPrimary") || "Sign In"}
              <FiArrowRight size={isMobile ? 14 : 14} />
            </button>
            <a
              href="#features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: isMobile ? 14 : 14,
                border: "1.5px solid rgba(255,255,255,0.2)",
                padding: isMobile ? "12px 24px" : "13px 22px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                transition: "background 0.2s ease, border-color 0.2s ease",
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? 48 : "auto",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}
            >
              {t("landing.ctaSecondary") || "Explore Services"}
            </a>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: isMobile ? 20 : 40,
              marginTop: isMobile ? 28 : 40,
              flexWrap: "wrap",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: isMobile ? 16 : 24,
            }}
          >
            {[
              { value: "40+", label: t("landing.statServices") || "Services" },
              { value: "12", label: t("landing.statAgencies") || "Agencies" },
              { value: "3", label: t("landing.statLanguages") || "Languages" },
              { value: "24/7", label: t("landing.statAI") || "AI Support" },
            ].map((stat, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: F.serif,
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 900,
                    color: C.goldLight,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 10 : 12,
                    color: "#8899c0",
                    fontWeight: 500,
                    marginTop: 2,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Visual Display */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              order: isTablet ? 0 : 1,
            }}
          >
            <HeroVisual isTablet={isTablet} />
          </div>
        )}
      </div>

      {/* Mobile Visual - Simplified version for small screens */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 30,
            padding: "20px 0",
            width: "100%",
          }}
        >
          <MobileHeroVisual />
        </div>
      )}

      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes hero-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
        @keyframes hero-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hero-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes hero-badge-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes mobile-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        @media (max-width: 768px) {
          .hero-visual-container {
            padding: 20px 0;
          }
        }
        @media (max-width: 480px) {
          .hero-stats {
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
};

// ─── DECORATIVE BACKGROUND ──────────────────────────────────
const DecorativeBackground = () => {
  // Generate consistent positions without random
  const circles = Array.from({ length: 12 }, (_, i) => ({
    size: 40 + ((i * 7) % 60),
    x: 5 + ((i * 8) % 90),
    y: 5 + ((i * 13) % 90),
    delay: (i * 0.4) % 3,
    duration: 6 + (i % 4),
  }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {circles.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            left: `${c.x}%`,
            top: `${c.y}%`,
            background:
              i % 2 === 0
                ? `radial-gradient(circle, rgba(245,197,24,0.06), transparent)`
                : `radial-gradient(circle, rgba(26,107,74,0.08), transparent)`,
            animation: `hero-float ${c.duration}s ease-in-out ${c.delay}s infinite`,
            border: i % 3 === 0 ? "1px solid rgba(245,197,24,0.05)" : "none",
          }}
        />
      ))}

      {/* Animated gradient lines */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(245,197,24,0.08), transparent)",
          backgroundSize: "200% 100%",
          animation: "hero-shimmer 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(245,197,24,0.08), transparent)",
          backgroundSize: "200% 100%",
          animation: "hero-shimmer 8s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
};

// ─── HERO VISUAL - Matching the Thumbnail Design ────────────
const HeroVisual = ({ isTablet }) => {
  const iconSize = isTablet ? 14 : 18;
  const badgeSize = isTablet ? 32 : 40;
  const radius = isTablet ? 45 : 58;
  const labelRadius = isTablet ? 62 : 78;

  const platforms = [
    { icon: <FiGrid size={iconSize} />, label: "React", color: "#61dafb" },
    { icon: <FiCpu size={iconSize} />, label: "Node.js", color: "#68a063" },
    { icon: <FiFileText size={iconSize} />, label: "Express", color: "#000" },
    { icon: <FiUsers size={iconSize} />, label: "MongoDB", color: "#4db33d" },
    { icon: <FiBarChart2 size={iconSize} />, label: "Vite", color: "#646cff" },
  ];

  const serviceLabels = [
    { icon: "🎤", label: "Presentations" },
    { icon: "📊", label: "Reports" },
    { icon: "📋", label: "Evaluation" },
    { icon: "📁", label: "Documents" },
    { icon: "🤖", label: "AI Assistant" },
  ];

  return (
    <div
      className="hero-visual-container"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: isTablet ? 380 : 480,
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,197,24,0.06), transparent 70%)",
          animation: "hero-pulse-ring 4s ease-in-out infinite",
        }}
      />

      {/* Concentric rings */}
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          style={{
            position: "absolute",
            width: `${60 + ring * 15}%`,
            height: `${60 + ring * 15}%`,
            borderRadius: "50%",
            border: `${ring === 1 ? 2 : 1}px solid ${ring === 1 ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.04)"}`,
            borderStyle: ring % 2 === 0 ? "solid" : "dashed",
            animation:
              ring === 1 ? "hero-spin-slow 30s linear infinite" : "none",
          }}
        />
      ))}

      {/* Center basket / mesob visual */}
      <div
        style={{
          position: "relative",
          width: "45%",
          height: "45%",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}22, ${C.gold}08)`,
          border: `2px solid ${C.gold}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
          boxShadow: `0 0 60px rgba(245,197,24,0.08)`,
          animation: "hero-float 6s ease-in-out infinite",
        }}
      >
        <img
          src={mesobLogo}
          alt="Addis MESOB"
          style={{
            width: isTablet ? 32 : 40,
            height: isTablet ? 32 : 40,
            borderRadius: 10,
            objectFit: "contain",
          }}
        />
        <span
          style={{
            fontFamily: F.serif,
            fontSize: isTablet ? 10 : 12,
            fontWeight: 900,
            color: C.goldLight,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          MESOB
        </span>
        <span
          style={{
            fontSize: isTablet ? 6 : 8,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          One Basket
        </span>
      </div>

      {/* Orbiting tech badges */}
      {platforms.map((platform, i) => {
        const angle = (i / platforms.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              animation: `hero-badge-float ${3 + i * 0.3}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <div
              style={{
                width: badgeSize,
                height: badgeSize,
                borderRadius: "50%",
                background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
                border: `1px solid ${platform.color}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: platform.color,
                backdropFilter: "blur(4px)",
                fontSize: isTablet ? 12 : 16,
              }}
            >
              {platform.icon}
            </div>
            <span
              style={{
                fontSize: isTablet ? 6 : 8,
                color: "rgba(255,255,255,0.4)",
                fontWeight: 600,
                letterSpacing: 0.3,
                background: "rgba(0,0,0,0.3)",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {platform.label}
            </span>
          </div>
        );
      })}

      {/* Orbiting service labels */}
      {serviceLabels.map((item, i) => {
        const angle = (i / serviceLabels.length) * Math.PI * 2 + Math.PI / 2;
        const x = 50 + Math.cos(angle) * labelRadius;
        const y = 50 + Math.sin(angle) * labelRadius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              animation: `hero-badge-float ${4 + i * 0.4}s ease-in-out ${i * 0.6}s infinite`,
            }}
          >
            <div
              style={{
                width: isTablet ? 26 : 32,
                height: isTablet ? 26 : 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isTablet ? 12 : 14,
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: isTablet ? 6 : 7,
                color: "rgba(255,255,255,0.3)",
                fontWeight: 600,
                letterSpacing: 0.2,
                background: "rgba(0,0,0,0.2)",
                padding: "1px 4px",
                borderRadius: 3,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      {/* "Digital Ethiopia" label at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: isTablet ? 4 : 8,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: isTablet ? 7 : 9,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.2)",
          padding: isTablet ? "3px 10px" : "4px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        Digital Ethiopia
      </div>
    </div>
  );
};

// ─── MOBILE HERO VISUAL - Simplified for small screens ──────
const MobileHeroVisual = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 280,
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,197,24,0.08), transparent 70%)",
          animation: "mobile-pulse 3s ease-in-out infinite",
        }}
      />

      {/* Simplified ring */}
      <div
        style={{
          position: "absolute",
          width: "80%",
          height: "80%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.1)",
          borderStyle: "dashed",
        }}
      />

      {/* Center basket */}
      <div
        style={{
          position: "relative",
          width: "50%",
          height: "50%",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}22, ${C.gold}08)`,
          border: `2px solid ${C.gold}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          boxShadow: `0 0 40px rgba(245,197,24,0.06)`,
          animation: "hero-float 6s ease-in-out infinite",
        }}
      >
        <img
          src={mesobLogo}
          alt="Addis MESOB"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            objectFit: "contain",
          }}
        />
        <span
          style={{
            fontFamily: F.serif,
            fontSize: 10,
            fontWeight: 900,
            color: C.goldLight,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          MESOB
        </span>
      </div>

      {/* Simplified orbiting labels */}
      {[
        { icon: "📊", label: "Reports" },
        { icon: "🤖", label: "AI" },
        { icon: "📁", label: "Docs" },
        { icon: "🎤", label: "Present" },
      ].map((item, i) => {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const radius = 62;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              animation: `hero-badge-float ${3 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: 6,
                color: "rgba(255,255,255,0.25)",
                fontWeight: 600,
                background: "rgba(0,0,0,0.2)",
                padding: "1px 4px",
                borderRadius: 3,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default HeroSection;
