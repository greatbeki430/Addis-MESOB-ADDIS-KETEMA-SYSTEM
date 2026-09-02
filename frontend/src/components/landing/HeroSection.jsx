// src/components/landing/HeroSection.jsx
// Stunning, premium hero section with unique visual identity

import { useState, useEffect } from "react";
import {
  FiLogIn,
  FiArrowRight,
  FiGrid,
  FiBarChart2,
  FiShield,
  FiCpu,
  FiUsers,
  FiFileText,
  FiZap,
  FiTrendingUp,
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
        minHeight: isMobile ? "auto" : "100vh",
        display: "flex",
        alignItems: "center",
        paddingTop: isMobile
          ? "clamp(30px, 6vw, 50px)"
          : "clamp(40px, 8vw, 70px)",
        paddingBottom: isMobile
          ? "clamp(30px, 6vw, 50px)"
          : "clamp(50px, 8vw, 80px)",
        paddingLeft: "clamp(16px, 5vw, 64px)",
        paddingRight: "clamp(16px, 5vw, 64px)",
        background: `
          radial-gradient(ellipse at 15% 40%, rgba(245, 197, 24, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 85% 60%, rgba(26, 107, 74, 0.12) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 10%, rgba(26, 58, 173, 0.06) 0%, transparent 40%),
          linear-gradient(155deg, #0a1f1a 0%, #0d3327 30%, #1a4a3a 65%, #0a2a1e 100%)
        `,
        color: "#fff",
        borderBottom: "1px solid rgba(245, 197, 24, 0.08)",
      }}
    >
      {/* Premium Decorative Background */}
      <PremiumBackground />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 1fr",
          gap: isMobile ? 30 : isTablet ? 30 : 50,
          alignItems: "center",
          width: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* ─── LEFT COLUMN ─── */}
        <div style={{ order: isMobile ? 1 : 0 }}>
          {/* Premium Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(245, 197, 24, 0.12)",
              border: "1px solid rgba(245, 197, 24, 0.2)",
              color: C.goldLight,
              padding: isMobile ? "6px 14px" : "8px 20px",
              borderRadius: 999,
              fontSize: isMobile ? 10 : 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              marginBottom: isMobile ? 14 : 20,
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(245, 197, 24, 0.05)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.gold,
                display: "inline-block",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            {t("landing.eyebrow") || "Digital Ethiopia · Smart Services"}
          </div>

          {/* Main Title with Gradient */}
          <h1
            style={{
              fontFamily: F.serif,
              fontSize: isMobile
                ? "clamp(30px, 9vw, 40px)"
                : "clamp(42px, 6.5vw, 62px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
              background: `linear-gradient(135deg, #ffffff 0%, ${C.goldLight} 40%, ${C.gold} 70%, #ffffff 100%)`,
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer-text 6s ease-in-out infinite",
            }}
          >
            {t("landing.heroTitle") || "Every service, in one basket."}
          </h1>

          {/* Subtitle with Enhanced Styling */}
          <p
            style={{
              fontSize: isMobile
                ? "clamp(14px, 4vw, 16px)"
                : "clamp(16px, 2.2vw, 19px)",
              lineHeight: 1.7,
              color: "#b8c4e8",
              maxWidth: isMobile ? "100%" : 520,
              marginTop: isMobile ? 14 : 20,
              position: "relative",
              paddingLeft: isMobile ? 0 : 16,
              borderLeft: isMobile ? "none" : `3px solid ${C.gold}55`,
            }}
          >
            {t("landing.heroBody") ||
              "Addis MESOB unifies government services — registration, evaluation, reporting, documents, and AI — into one seamless digital basket for everyone."}
          </p>

          {/* Premium Feature Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 8 : 10,
              marginTop: isMobile ? 16 : 24,
            }}
          >
            {[
              {
                icon: <FiZap size={isMobile ? 12 : 14} />,
                label: t("landing.serviceManagement") || "Service Management",
                color: "#f59e0b",
              },
              {
                icon: <FiTrendingUp size={isMobile ? 12 : 14} />,
                label:
                  t("landing.evaluationReporting") || "Evaluation & Reporting",
                color: "#34d399",
              },
              {
                icon: <FiShield size={isMobile ? 12 : 14} />,
                label: t("landing.secureReliable") || "Secure & Reliable",
                color: "#60a5fa",
              },
            ].map((item, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: `rgba(255,255,255,0.04)`,
                  border: `1px solid ${item.color}33`,
                  borderRadius: 20,
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  fontSize: isMobile ? 10 : 12,
                  color: item.color,
                  fontWeight: 600,
                  backdropFilter: "blur(4px)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${item.color}15`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 8px 25px ${item.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>

          {/* Premium CTA Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 12 : 16,
              marginTop: isMobile ? 24 : 32,
              width: "100%",
            }}
          >
            <button
              onClick={onLogin}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                color: C.dark,
                border: "none",
                padding: isMobile ? "14px 28px" : "15px 32px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: isMobile ? 14 : 15,
                cursor: "pointer",
                fontFamily: F.sans,
                boxShadow: "0 4px 25px rgba(245, 197, 24, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? 52 : "auto",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 8px 40px rgba(245, 197, 24, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 25px rgba(245, 197, 24, 0.3)";
              }}
            >
              <FiLogIn size={isMobile ? 16 : 18} />
              {t("landing.ctaPrimary") || "Sign In"}
              <FiArrowRight
                size={isMobile ? 14 : 16}
                style={{
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              />
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
                fontSize: isMobile ? 14 : 15,
                border: "1.5px solid rgba(255,255,255,0.15)",
                padding: isMobile ? "14px 28px" : "15px 32px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                transition: "all 0.3s ease",
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? 52 : "auto",
                textAlign: "center",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {t("landing.ctaSecondary") || "Explore Services"}
            </a>
          </div>

          {/* Enhanced Stats */}
          <div
            style={{
              display: "flex",
              gap: isMobile ? 24 : 48,
              marginTop: isMobile ? 28 : 40,
              flexWrap: "wrap",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: isMobile ? 16 : 24,
            }}
          >
            {[
              {
                value: "40+",
                label: t("landing.statServices") || "Services",
                icon: <FiGrid size={16} />,
              },
              {
                value: "12",
                label: t("landing.statAgencies") || "Agencies",
                icon: <FiUsers size={16} />,
              },
              {
                value: "3",
                label: t("landing.statLanguages") || "Languages",
                icon: <FiFileText size={16} />,
              },
              {
                value: "24/7",
                label: t("landing.statAI") || "AI Support",
                icon: <FiCpu size={16} />,
              },
            ].map((stat, i) => (
              <div
                key={i}
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
                    borderRadius: "50%",
                    background: "rgba(245, 197, 24, 0.08)",
                    border: "1px solid rgba(245, 197, 24, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.goldLight,
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: isMobile ? 20 : 24,
                      fontWeight: 900,
                      color: C.goldLight,
                      lineHeight: 1.1,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? 10 : 12,
                      color: "#8899c0",
                      fontWeight: 500,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT COLUMN - Premium Visual ─── */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              order: isTablet ? 0 : 1,
            }}
          >
            <PremiumHeroVisual isTablet={isTablet} />
          </div>
        )}
      </div>

      {/* ─── MOBILE VISUAL ─── */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20,
            padding: "20px 0 10px",
            width: "100%",
          }}
        >
          <MobilePremiumVisual />
        </div>
      )}

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(2deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(var(--radius)) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(var(--radius)) rotate(-360deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer-line {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes mobile-glow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }

        @media (max-width: 768px) {
          .hero-visual-container {
            padding: 10px 0;
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

// ─── PREMIUM BACKGROUND ──────────────────────────────────────
const PremiumBackground = () => {
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
      {/* Gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "60%",
          height: "80%",
          background:
            "radial-gradient(ellipse, rgba(245,197,24,0.04), transparent 70%)",
          borderRadius: "50%",
          animation: "glow-pulse 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "50%",
          height: "70%",
          background:
            "radial-gradient(ellipse, rgba(26,107,74,0.06), transparent 70%)",
          borderRadius: "50%",
          animation: "glow-pulse 10s ease-in-out infinite reverse",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }, (_, i) => ({
        size: 2 + (i % 4),
        x: 5 + ((i * 7) % 90),
        y: 5 + ((i * 11) % 90),
        delay: (i * 0.5) % 4,
        duration: 8 + (i % 6),
        opacity: 0.05 + ((i * 3) % 10) / 100,
      })).map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: i % 2 === 0 ? C.gold : "#fff",
            animation: `float-slow ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Animated shimmer lines */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(245,197,24,0.05), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer-line 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "25%",
          left: "15%",
          right: "15%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(245,197,24,0.04), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer-line 8s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
};

// ─── PREMIUM HERO VISUAL ──────────────────────────────────────
const PremiumHeroVisual = ({ isTablet }) => {
  const iconSize = isTablet ? 14 : 18;
  const badgeSize = isTablet ? 34 : 42;
  const centerSize = isTablet ? 100 : 140;

  const techItems = [
    {
      icon: <FiGrid size={iconSize} />,
      label: "React",
      color: "#61dafb",
      delay: 0,
    },
    {
      icon: <FiCpu size={iconSize} />,
      label: "Node.js",
      color: "#68a063",
      delay: 0.5,
    },
    {
      icon: <FiFileText size={iconSize} />,
      label: "Express",
      color: "#fff",
      delay: 1,
    },
    {
      icon: <FiUsers size={iconSize} />,
      label: "MongoDB",
      color: "#4db33d",
      delay: 1.5,
    },
    {
      icon: <FiBarChart2 size={iconSize} />,
      label: "Vite",
      color: "#646cff",
      delay: 2,
    },
  ];

  const serviceItems = [
    { icon: "🎤", label: "Presentations" },
    { icon: "📊", label: "Reports" },
    { icon: "📋", label: "Evaluation" },
    { icon: "📁", label: "Documents" },
    { icon: "🤖", label: "AI Assistant" },
  ];

  const radius = isTablet ? 50 : 65;
  const labelRadius = isTablet ? 68 : 85;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: isTablet ? 400 : 500,
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
            "radial-gradient(circle, rgba(245,197,24,0.05), transparent 70%)",
          animation: "pulse-ring 5s ease-in-out infinite",
        }}
      />

      {/* Concentric decorative rings */}
      <div
        style={{
          position: "absolute",
          width: "92%",
          height: "92%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.06)",
          borderStyle: "dashed",
          animation: "spin-slow 40s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "76%",
          height: "76%",
          borderRadius: "50%",
          border: "2px solid rgba(245,197,24,0.04)",
          animation: "spin-slow 30s linear infinite reverse",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.08)",
          animation: "spin-slow 20s linear infinite",
        }}
      />

      {/* Center basket / mesob */}
      <div
        style={{
          position: "relative",
          width: centerSize,
          height: centerSize,
          borderRadius: "50%",
          background: `linear-gradient(145deg, ${C.gold}15, ${C.gold}05)`,
          border: `2px solid ${C.gold}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
          boxShadow: `0 0 80px rgba(245,197,24,0.06), inset 0 0 60px rgba(245,197,24,0.04)`,
          animation: "float-slow 7s ease-in-out infinite",
        }}
      >
        <img
          src={mesobLogo}
          alt="Addis MESOB"
          style={{
            width: isTablet ? 36 : 48,
            height: isTablet ? 36 : 48,
            borderRadius: 12,
            objectFit: "contain",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        />
        <span
          style={{
            fontFamily: F.serif,
            fontSize: isTablet ? 11 : 14,
            fontWeight: 900,
            color: C.goldLight,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: 0.5,
          }}
        >
          MESOB
        </span>
        <span
          style={{
            fontSize: isTablet ? 7 : 9,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          One Basket
        </span>
      </div>

      {/* Orbiting tech badges with staggered animation */}
      {techItems.map((item, i) => {
        const angle = (i / techItems.length) * Math.PI * 2 - Math.PI / 2;
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
              animation: `float-badge ${4 + i * 0.3}s ease-in-out ${i * 0.6}s infinite`,
            }}
          >
            <div
              style={{
                width: badgeSize,
                height: badgeSize,
                borderRadius: "50%",
                background: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`,
                border: `1px solid ${item.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
                backdropFilter: "blur(8px)",
                fontSize: isTablet ? 12 : 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${item.color}15`;
                e.currentTarget.style.transform = "scale(1.15)";
                e.currentTarget.style.boxShadow = `0 8px 30px ${item.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`;
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: isTablet ? 6 : 8,
                color: "rgba(255,255,255,0.35)",
                fontWeight: 600,
                letterSpacing: 0.3,
                background: "rgba(0,0,0,0.3)",
                padding: "2px 8px",
                borderRadius: 4,
                backdropFilter: "blur(4px)",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Orbiting service labels */}
      {serviceItems.map((item, i) => {
        const angle = (i / serviceItems.length) * Math.PI * 2 + Math.PI / 2;
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
              animation: `float-badge ${5 + i * 0.4}s ease-in-out ${i * 0.7}s infinite`,
            }}
          >
            <div
              style={{
                width: isTablet ? 28 : 34,
                height: isTablet ? 28 : 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isTablet ? 12 : 15,
                backdropFilter: "blur(4px)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(245,197,24,0.05)";
                e.currentTarget.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: isTablet ? 6 : 7,
                color: "rgba(255,255,255,0.25)",
                fontWeight: 600,
                letterSpacing: 0.3,
                background: "rgba(0,0,0,0.2)",
                padding: "2px 6px",
                borderRadius: 3,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      {/* "Digital Ethiopia" label */}
      <div
        style={{
          position: "absolute",
          bottom: isTablet ? 6 : 10,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: isTablet ? 8 : 10,
          fontWeight: 700,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.15)",
          padding: isTablet ? "4px 14px" : "6px 20px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.03)",
          backdropFilter: "blur(4px)",
        }}
      >
        Digital Ethiopia
      </div>
    </div>
  );
};

// ─── MOBILE PREMIUM VISUAL ────────────────────────────────────
const MobilePremiumVisual = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 260,
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,197,24,0.06), transparent 70%)",
          animation: "mobile-glow 4s ease-in-out infinite",
        }}
      />

      {/* Rings */}
      <div
        style={{
          position: "absolute",
          width: "85%",
          height: "85%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.06)",
          borderStyle: "dashed",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "70%",
          height: "70%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.04)",
        }}
      />

      {/* Center */}
      <div
        style={{
          position: "relative",
          width: "45%",
          height: "45%",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}15, ${C.gold}05)`,
          border: `2px solid ${C.gold}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          boxShadow: `0 0 40px rgba(245,197,24,0.04)`,
          animation: "float-slow 6s ease-in-out infinite",
        }}
      >
        <img
          src={mesobLogo}
          alt="Addis MESOB"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            objectFit: "contain",
          }}
        />
        <span
          style={{
            fontFamily: F.serif,
            fontSize: 9,
            fontWeight: 900,
            color: C.goldLight,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          MESOB
        </span>
      </div>

      {/* Orbiting labels */}
      {[
        { icon: "🎤", label: "Present" },
        { icon: "📊", label: "Reports" },
        { icon: "🤖", label: "AI" },
        { icon: "📁", label: "Docs" },
      ].map((item, i) => {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const radius = 60;
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
              animation: `float-badge ${3.5 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: 6,
                color: "rgba(255,255,255,0.2)",
                fontWeight: 600,
                background: "rgba(0,0,0,0.2)",
                padding: "1px 6px",
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
