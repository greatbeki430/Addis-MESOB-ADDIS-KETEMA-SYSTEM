// src/components/landing/HeroSection.jsx
// ✨ PREMIUM HERO SECTION - Unique, Stunning, Modern

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
  FiTrendingUp,
  FiZap,
  FiChevronRight,
  FiSparkles,
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
          ? "clamp(20px, 5vw, 40px)"
          : "clamp(30px, 6vw, 50px)",
        paddingBottom: isMobile
          ? "clamp(30px, 6vw, 50px)"
          : "clamp(40px, 6vw, 60px)",
        paddingLeft: "clamp(16px, 5vw, 64px)",
        paddingRight: "clamp(16px, 5vw, 64px)",
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(245, 197, 24, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(26, 107, 74, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(26, 58, 173, 0.04) 0%, transparent 60%),
          linear-gradient(160deg, #0a1f1a 0%, #0d3327 25%, #1a4a3a 55%, #0a2a1e 100%)
        `,
        color: "#fff",
      }}
    >
      {/* ✨ Animated Background */}
      <AnimatedBackground />

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
          {/* ✨ Premium Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(245, 197, 24, 0.08)",
              border: "1px solid rgba(245, 197, 24, 0.15)",
              color: C.goldLight,
              padding: isMobile ? "6px 14px" : "8px 20px",
              borderRadius: 999,
              fontSize: isMobile ? 10 : 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              marginBottom: isMobile ? 14 : 20,
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 30px rgba(245, 197, 24, 0.05)",
              position: "relative",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.gold,
                display: "inline-block",
                animation: "pulse-glow 2s ease-in-out infinite",
                boxShadow: "0 0 20px rgba(245, 197, 24, 0.3)",
              }}
            />
            {t("landing.eyebrow") || "Digital Ethiopia · Smart Services"}
            <FiSparkles
              size={12}
              style={{
                opacity: 0.5,
                animation: "sparkle 3s ease-in-out infinite",
              }}
            />
          </div>

          {/* ✨ Main Title with Premium Gradient */}
          <h1
            style={{
              fontFamily: F.serif,
              fontSize: isMobile
                ? "clamp(32px, 10vw, 44px)"
                : "clamp(44px, 7vw, 68px)",
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              margin: 0,
              background: `linear-gradient(135deg, #ffffff 0%, ${C.goldLight} 30%, ${C.gold} 60%, #ffffff 100%)`,
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer-slow 8s ease-in-out infinite",
            }}
          >
            {t("landing.heroTitle") || "Every service, in one basket."}
          </h1>

          {/* ✨ Subtitle with Quote Style */}
          <div
            style={{
              position: "relative",
              marginTop: isMobile ? 16 : 22,
              maxWidth: isMobile ? "100%" : 540,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -8,
                top: -10,
                fontSize: 48,
                color: C.gold,
                opacity: 0.15,
                fontFamily: F.serif,
                lineHeight: 1,
              }}
            >
              "
            </div>
            <p
              style={{
                fontSize: isMobile
                  ? "clamp(14px, 4vw, 16px)"
                  : "clamp(16px, 2.2vw, 19px)",
                lineHeight: 1.8,
                color: "#c9d0f0",
                paddingLeft: isMobile ? 0 : 20,
                position: "relative",
                fontStyle: "italic",
              }}
            >
              {t("landing.heroBody") ||
                "For generations, a mesob has meant many dishes served from one vessel. Addis MESOB carries that same idea into government service — registration, evaluation, reporting, documents, and AI assistance, gathered into one digital basket for staff and citizens alike."}
            </p>
          </div>

          {/* ✨ Premium Feature Tags */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 8 : 12,
              marginTop: isMobile ? 18 : 26,
            }}
          >
            {[
              {
                icon: <FiZap size={isMobile ? 12 : 15} />,
                label: t("landing.serviceManagement") || "Service Management",
                color: C.gold,
                gradient: "linear-gradient(135deg, #f5c518, #f59e0b)",
              },
              {
                icon: <FiTrendingUp size={isMobile ? 12 : 15} />,
                label:
                  t("landing.evaluationReporting") || "Evaluation & Reporting",
                color: "#34d399",
                gradient: "linear-gradient(135deg, #34d399, #059669)",
              },
              {
                icon: <FiShield size={isMobile ? 12 : 15} />,
                label: t("landing.secureReliable") || "Secure & Reliable",
                color: "#60a5fa",
                gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.06)`,
                  borderRadius: 12,
                  padding: isMobile ? "8px 14px" : "10px 20px",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = `${item.color}44`;
                  e.currentTarget.style.boxShadow = `0 8px 30px ${item.color}15`;
                  e.currentTarget.style.background = `rgba(255,255,255,0.06)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <span
                  style={{
                    color: item.color,
                    fontSize: isMobile ? 12 : 15,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 600,
                    color: "#e8ecf5",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* ✨ Premium CTA Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 12 : 16,
              marginTop: isMobile ? 24 : 32,
              width: "100%",
            }}
          >
            {/* Primary CTA - Login Button */}
            <button
              onClick={onLogin}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: `linear-gradient(135deg, ${C.gold}, #f59e0b, ${C.goldLight})`,
                backgroundSize: "200% 200%",
                color: C.dark,
                border: "none",
                padding: isMobile ? "14px 28px" : "16px 36px",
                borderRadius: 14,
                fontWeight: 800,
                fontSize: isMobile ? 14 : 16,
                cursor: "pointer",
                fontFamily: F.sans,
                boxShadow: "0 4px 30px rgba(245, 197, 24, 0.25)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? 52 : "auto",
                position: "relative",
                overflow: "hidden",
                animation: "gradient-shift 4s ease-in-out infinite",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 8px 50px rgba(245, 197, 24, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 30px rgba(245, 197, 24, 0.25)";
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiLogIn size={isMobile ? 16 : 18} />
                {t("landing.ctaPrimary") || "Sign In"}
                <FiArrowRight
                  size={isMobile ? 14 : 16}
                  style={{
                    transition: "transform 0.3s ease",
                  }}
                  className="arrow-icon"
                />
              </span>
              <span
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.1), transparent 60%)",
                  opacity: 0,
                  transition: "opacity 0.5s ease",
                  pointerEvents: "none",
                }}
                className="shine-effect"
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
              />
            </button>

            {/* Secondary CTA - Explore */}
            <a
              href="#features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: isMobile ? 14 : 16,
                border: "1.5px solid rgba(255,255,255,0.12)",
                padding: isMobile ? "14px 28px" : "16px 36px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                transition: "all 0.3s ease",
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? 52 : "auto",
                textAlign: "center",
                backdropFilter: "blur(8px)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {t("landing.ctaSecondary") || "Explore Services"}
              <FiChevronRight size={isMobile ? 14 : 16} />
            </a>
          </div>

          {/* ✨ Premium Stats with Icons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)"
                : "repeat(4, auto)",
              gap: isMobile ? 16 : 32,
              marginTop: isMobile ? 24 : 36,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: isMobile ? 16 : 24,
            }}
          >
            {[
              {
                value: "40+",
                label: t("landing.statServices") || "Services",
                icon: <FiGrid size={isMobile ? 14 : 18} />,
                color: C.gold,
              },
              {
                value: "12",
                label: t("landing.statAgencies") || "Agencies",
                icon: <FiUsers size={isMobile ? 14 : 18} />,
                color: "#34d399",
              },
              {
                value: "3",
                label: t("landing.statLanguages") || "Languages",
                icon: <FiFileText size={isMobile ? 14 : 18} />,
                color: "#60a5fa",
              },
              {
                value: "24/7",
                label: t("landing.statAI") || "AI Support",
                icon: <FiCpu size={isMobile ? 14 : 18} />,
                color: "#a78bfa",
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
                    width: isMobile ? 32 : 38,
                    height: isMobile ? 32 : 38,
                    borderRadius: "50%",
                    background: `rgba(255,255,255,0.04)`,
                    border: `1px solid rgba(255,255,255,0.06)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: stat.color,
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: isMobile ? 18 : 22,
                      fontWeight: 900,
                      color: "#fff",
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

        {/* ─── RIGHT COLUMN - Premium 3D Visual ─── */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              order: isTablet ? 0 : 1,
            }}
          >
            <Premium3DVisual isTablet={isTablet} />
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
            padding: "10px 0",
            width: "100%",
          }}
        >
          <MobilePremiumVisual />
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 20px rgba(245, 197, 24, 0.3); }
          50% { opacity: 0.6; transform: scale(0.8); box-shadow: 0 0 40px rgba(245, 197, 24, 0.5); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: rotate(0deg) scale(1); }
          50% { opacity: 1; transform: rotate(180deg) scale(1.2); }
        }
        @keyframes shimmer-slow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-3d {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes orbit-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes pulse-ring-3d {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow-pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }

        .arrow-icon {
          transition: transform 0.3s ease;
        }
        button:hover .arrow-icon {
          transform: translateX(4px);
        }

        .shine-effect {
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .hero-3d-container {
            padding: 20px 0;
          }
        }
      `}</style>
    </section>
  );
};

// ─── ANIMATED BACKGROUND ──────────────────────────────────────
const AnimatedBackground = () => {
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
      {/* Floating orbs */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "5%",
          width: "40%",
          height: "60%",
          background:
            "radial-gradient(ellipse, rgba(245,197,24,0.04), transparent 70%)",
          borderRadius: "50%",
          animation: "glow-pulse-slow 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          width: "35%",
          height: "50%",
          background:
            "radial-gradient(ellipse, rgba(26,107,74,0.05), transparent 70%)",
          borderRadius: "50%",
          animation: "glow-pulse-slow 10s ease-in-out infinite reverse",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 30 }, (_, i) => ({
        size: 1.5 + (i % 3),
        x: 2 + ((i * 13) % 96),
        y: 2 + ((i * 17) % 96),
        delay: (i * 0.7) % 5,
        duration: 10 + (i % 8),
        opacity: 0.03 + ((i * 5) % 15) / 100,
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
            animation: `float-3d ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Grid pattern overlay (subtle) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />
    </div>
  );
};

// ─── PREMIUM 3D VISUAL ────────────────────────────────────────
const Premium3DVisual = ({ isTablet }) => {
  const iconSize = isTablet ? 14 : 18;
  const badgeSize = isTablet ? 36 : 44;
  const centerSize = isTablet ? 110 : 150;

  const orbitItems = [
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
      delay: 0.6,
    },
    {
      icon: <FiFileText size={iconSize} />,
      label: "Express",
      color: "#fff",
      delay: 1.2,
    },
    {
      icon: <FiUsers size={iconSize} />,
      label: "MongoDB",
      color: "#4db33d",
      delay: 1.8,
    },
    {
      icon: <FiBarChart2 size={iconSize} />,
      label: "Vite",
      color: "#646cff",
      delay: 2.4,
    },
  ];

  const outerOrbitItems = [
    { icon: "🎤", label: "Presentations" },
    { icon: "📊", label: "Reports" },
    { icon: "📋", label: "Evaluation" },
    { icon: "📁", label: "Documents" },
    { icon: "🤖", label: "AI Assistant" },
    { icon: "📈", label: "Analytics" },
  ];

  const radius = isTablet ? 48 : 62;
  const outerRadius = isTablet ? 65 : 82;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: isTablet ? 420 : 520,
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
      }}
    >
      {/* 3D Depth Layers */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 30%, rgba(245,197,24,0.03), transparent 60%)",
          animation: "pulse-ring-3d 6s ease-in-out infinite",
        }}
      />

      {/* Decorative Rings */}
      <div
        style={{
          position: "absolute",
          width: "94%",
          height: "94%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.05)",
          animation: "orbit-reverse 50s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "78%",
          height: "78%",
          borderRadius: "50%",
          border: "2px solid rgba(245,197,24,0.03)",
          animation: "float-3d 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "62%",
          height: "62%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.06)",
          animation: "orbit-reverse 30s linear infinite reverse",
        }}
      />

      {/* Center 3D Basket */}
      <div
        style={{
          position: "relative",
          width: centerSize,
          height: centerSize,
          borderRadius: "50%",
          background: `linear-gradient(145deg, ${C.gold}12, ${C.gold}04)`,
          border: `2px solid ${C.gold}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
          boxShadow: `
            0 0 80px rgba(245,197,24,0.04),
            inset 0 0 60px rgba(245,197,24,0.03)
          `,
          animation: "float-3d 7s ease-in-out infinite",
          transform: "perspective(800px) rotateX(5deg)",
        }}
      >
        <img
          src={mesobLogo}
          alt="Addis MESOB"
          style={{
            width: isTablet ? 38 : 50,
            height: isTablet ? 38 : 50,
            borderRadius: 14,
            objectFit: "contain",
            boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
          }}
        />
        <span
          style={{
            fontFamily: F.serif,
            fontSize: isTablet ? 12 : 15,
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
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          One Basket
        </span>
        {/* Inner glow */}
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(245,197,24,0.05), transparent 60%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Orbiting Tech Items */}
      {orbitItems.map((item, i) => {
        const angle = (i / orbitItems.length) * Math.PI * 2 - Math.PI / 2;
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
              animation: `float-card ${4 + i * 0.3}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <div
              style={{
                width: badgeSize,
                height: badgeSize,
                borderRadius: "50%",
                background: `linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`,
                border: `1px solid ${item.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
                backdropFilter: "blur(10px)",
                fontSize: isTablet ? 12 : 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: "perspective(400px) rotateY(10deg)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "perspective(400px) rotateY(0deg) scale(1.15)";
                e.currentTarget.style.background = `${item.color}15`;
                e.currentTarget.style.boxShadow = `0 8px 40px ${item.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "perspective(400px) rotateY(10deg) scale(1)";
                e.currentTarget.style.background =
                  "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: isTablet ? 6 : 8,
                color: "rgba(255,255,255,0.3)",
                fontWeight: 600,
                letterSpacing: 0.3,
                background: "rgba(0,0,0,0.2)",
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

      {/* Outer Orbiting Service Labels */}
      {outerOrbitItems.map((item, i) => {
        const angle = (i / outerOrbitItems.length) * Math.PI * 2 + Math.PI / 2;
        const x = 50 + Math.cos(angle) * outerRadius;
        const y = 50 + Math.sin(angle) * outerRadius;

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
              animation: `float-card ${5 + i * 0.4}s ease-in-out ${i * 0.6}s infinite`,
            }}
          >
            <div
              style={{
                width: isTablet ? 28 : 34,
                height: isTablet ? 28 : 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isTablet ? 12 : 14,
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
                color: "rgba(255,255,255,0.2)",
                fontWeight: 600,
                letterSpacing: 0.3,
                background: "rgba(0,0,0,0.15)",
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

      {/* Bottom Label */}
      <div
        style={{
          position: "absolute",
          bottom: isTablet ? 4 : 8,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: isTablet ? 7 : 9,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.1)",
          padding: isTablet ? "4px 14px" : "6px 20px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.02)",
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
        maxWidth: 240,
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
            "radial-gradient(circle, rgba(245,197,24,0.05), transparent 70%)",
          animation: "pulse-ring-3d 4s ease-in-out infinite",
        }}
      />

      {/* Rings */}
      <div
        style={{
          position: "absolute",
          width: "88%",
          height: "88%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.04)",
          borderStyle: "dashed",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "72%",
          height: "72%",
          borderRadius: "50%",
          border: "1px solid rgba(245,197,24,0.03)",
        }}
      />

      {/* Center */}
      <div
        style={{
          position: "relative",
          width: "42%",
          height: "42%",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}12, ${C.gold}04)`,
          border: `2px solid ${C.gold}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          boxShadow: `0 0 40px rgba(245,197,24,0.04)`,
          animation: "float-3d 6s ease-in-out infinite",
        }}
      >
        <img
          src={mesobLogo}
          alt="Addis MESOB"
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            objectFit: "contain",
          }}
        />
        <span
          style={{
            fontFamily: F.serif,
            fontSize: 8,
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
        { icon: "📊", label: "Reports" },
        { icon: "🤖", label: "AI" },
        { icon: "📁", label: "Docs" },
        { icon: "🎤", label: "Present" },
        { icon: "📋", label: "Evaluate" },
      ].map((item, i) => {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const radius = 58;
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
              animation: `float-card ${3.5 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: 5.5,
                color: "rgba(255,255,255,0.15)",
                fontWeight: 600,
                background: "rgba(0,0,0,0.15)",
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
