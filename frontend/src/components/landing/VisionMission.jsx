// frontend/src/components/landing/VisionMission.jsx
import { useEffect, useRef, useState } from "react";
import { C, F } from "../../styles/theme";
import {
  FiEye,
  FiTarget,
  FiAward,
  FiGlobe,
  FiUsers,
  FiCpu,
} from "react-icons/fi";

const VisionMission = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Get translations or fallback
  const getTranslation = (key, fallback) => {
    return t ? t(key) || fallback : fallback;
  };

  const content = {
    eyebrow: getTranslation("landing.visionEyebrow", "🌟 Our Guiding Star"),
    title: getTranslation(
      "landing.visionTitle",
      "The Vision & Mission of Addis MESOB",
    ),
    subtitle: getTranslation(
      "landing.visionSubtitle",
      "Building a digital future for Ethiopia, one service at a time",
    ),
    vision: {
      title: getTranslation("landing.visionTitle", "Our Vision"),
      text: getTranslation(
        "landing.visionText",
        "To become Africa's premier digital government service hub by 2023, where technology empowers every citizen through seamless, accessible, and trusted government services.",
      ),
      icon: <FiEye size={28} />,
    },
    mission: {
      title: getTranslation("landing.missionTitle", "Our Mission"),
      text: getTranslation(
        "landing.missionText",
        "To revolutionize government service delivery in Addis Ababa through innovative digital solutions, ensuring every citizen experiences efficiency, transparency, and excellence in public service.",
      ),
      icon: <FiTarget size={28} />,
    },
    pillars: [
      {
        title: getTranslation("landing.pillar1Title", "Digital Excellence"),
        text: getTranslation(
          "landing.pillar1Text",
          "Leveraging cutting-edge technology to transform government services",
        ),
        icon: <FiCpu size={24} />,
      },
      {
        title: getTranslation("landing.pillar2Title", "Citizen First"),
        text: getTranslation(
          "landing.pillar2Text",
          "Every service designed around the needs of our citizens",
        ),
        icon: <FiUsers size={24} />,
      },
      {
        title: getTranslation("landing.pillar3Title", "Innovation Hub"),
        text: getTranslation(
          "landing.pillar3Text",
          "Fostering innovation and continuous improvement",
        ),
        icon: <FiGlobe size={24} />,
      },
      {
        title: getTranslation("landing.pillar4Title", "Trust & Integrity"),
        text: getTranslation(
          "landing.pillar4Text",
          "Building trust through transparency and accountability",
        ),
        icon: <FiAward size={24} />,
      },
    ],
  };

  // Animation styles for staggered entrance
  const getDelay = (index) => ({
    animationDelay: `${index * 0.15}s`,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(30px)",
    transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`,
  });

  return (
    <section
      ref={sectionRef}
      style={{
        padding: "80px clamp(20px, 5vw, 60px)",
        background: `linear-gradient(145deg, #0a1628 0%, #1a2a4a 50%, #0d1b2a 100%)`,
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Animated Particles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(245, 197, 24, 0.2); }
          50% { box-shadow: 0 0 40px rgba(245, 197, 24, 0.4); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(245, 197, 24, 0.3); }
          50% { border-color: rgba(245, 197, 24, 0.8); }
        }
        
        .vision-particle {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, ${C.gold}, ${C.goldLight});
          animation: float 6s ease-in-out infinite;
          pointer-events: none;
          opacity: 0.1;
        }
        .vision-particle:nth-child(1) { width: 200px; height: 200px; top: -50px; right: -50px; animation-delay: 0s; }
        .vision-particle:nth-child(2) { width: 150px; height: 150px; bottom: -30px; left: -30px; animation-delay: 2s; }
        .vision-particle:nth-child(3) { width: 100px; height: 100px; top: 50%; left: 10%; animation-delay: 4s; }
        .vision-particle:nth-child(4) { width: 80px; height: 80px; bottom: 20%; right: 15%; animation-delay: 1s; }
        
        .vision-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 197, 24, 0.08), transparent 70%);
          pointer-events: none;
        }
        .vision-glow:nth-child(5) { top: 20%; right: 10%; }
        .vision-glow:nth-child(6) { bottom: 20%; left: 10%; }
        
        .vision-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .vision-card::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, transparent, ${C.gold}33, transparent);
          border-radius: inherit;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .vision-card:hover::before {
          opacity: 1;
        }
        .vision-card:hover {
          transform: translateY(-8px);
          border-color: ${C.gold}55;
          box-shadow: 0 20px 60px rgba(245, 197, 24, 0.15);
        }
        
        .vision-main-card {
          background: linear-gradient(135deg, rgba(245, 197, 24, 0.08), rgba(245, 197, 24, 0.02));
          border: 2px solid rgba(245, 197, 24, 0.2);
          animation: pulse-border 3s ease-in-out infinite;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vision-main-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 50px rgba(245, 197, 24, 0.2);
          border-color: ${C.gold};
        }
        
        .vision-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${C.gold}22, ${C.gold}11);
          color: ${C.gold};
          transition: all 0.4s ease;
          flex-shrink: 0;
        }
        .vision-card:hover .vision-icon-wrapper {
          background: linear-gradient(135deg, ${C.gold}, ${C.goldLight});
          color: #fff;
          transform: scale(1.1) rotate(-10deg);
        }
        
        .vision-pillar-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, ${C.gold}33, ${C.gold}11);
          color: ${C.gold};
          transition: all 0.4s ease;
          flex-shrink: 0;
        }
        .vision-pillar-card:hover .vision-pillar-icon {
          background: linear-gradient(135deg, ${C.gold}, ${C.goldLight});
          color: #fff;
          transform: scale(1.1) rotate(5deg);
        }
        
        .vision-title-gradient {
          background: linear-gradient(135deg, ${C.gold}, ${C.goldLight}, ${C.gold});
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s ease-in-out infinite;
        }
        
        .vision-subtitle-glow {
          color: rgba(255, 255, 255, 0.6);
          text-shadow: 0 0 30px rgba(245, 197, 24, 0.1);
        }
        
        @media (max-width: 768px) {
          .vision-particle {
            display: none;
          }
          .vision-main-card {
            padding: 24px !important;
          }
          .vision-card {
            padding: 20px !important;
          }
        }
      `}</style>

      {/* Background Elements */}
      <div className="vision-particles">
        <div className="vision-particle"></div>
        <div className="vision-particle"></div>
        <div className="vision-particle"></div>
        <div className="vision-particle"></div>
        <div className="vision-glow"></div>
        <div className="vision-glow"></div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          width: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span
            style={{
              display: "inline-block",
              background: `linear-gradient(135deg, ${C.gold}33, ${C.gold}11)`,
              padding: "8px 20px",
              borderRadius: 100,
              color: C.gold,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 16,
              border: `1px solid ${C.gold}33`,
            }}
          >
            {content.eyebrow}
          </span>
          <h2
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 900,
              fontFamily: F.serif,
              margin: "12px 0 20px",
              lineHeight: 1.2,
            }}
            className="vision-title-gradient"
          >
            {content.title}
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              maxWidth: 700,
              margin: "0 auto",
              lineHeight: 1.8,
            }}
            className="vision-subtitle-glow"
          >
            {content.subtitle}
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 30,
            marginBottom: 60,
          }}
        >
          {/* Vision Card */}
          <div
            className="vision-main-card"
            style={{
              padding: "40px 32px",
              borderRadius: 20,
              ...getDelay(0),
            }}
            onMouseEnter={() => setHoveredCard("vision")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div className="vision-icon-wrapper">{content.vision.icon}</div>
              <div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#fff",
                    fontFamily: F.serif,
                    marginBottom: 12,
                  }}
                >
                  {content.vision.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.7)",
                    margin: 0,
                  }}
                >
                  {content.vision.text}
                </p>
              </div>
            </div>
          </div>

          {/* Mission Card */}
          <div
            className="vision-main-card"
            style={{
              padding: "40px 32px",
              borderRadius: 20,
              ...getDelay(1),
            }}
            onMouseEnter={() => setHoveredCard("mission")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div className="vision-icon-wrapper">{content.mission.icon}</div>
              <div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#fff",
                    fontFamily: F.serif,
                    marginBottom: 12,
                  }}
                >
                  {content.mission.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.7)",
                    margin: 0,
                  }}
                >
                  {content.mission.text}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values / Pillars */}
        <div style={{ marginTop: 20 }}>
          <h4
            style={{
              textAlign: "center",
              fontSize: "clamp(18px, 2.5vw, 28px)",
              fontWeight: 700,
              color: "#fff",
              fontFamily: F.serif,
              marginBottom: 40,
            }}
          >
            Our Core Values
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {content.pillars.map((pillar, index) => (
              <div
                key={index}
                className="vision-pillar-card vision-card"
                style={{
                  padding: "28px 24px",
                  borderRadius: 16,
                  textAlign: "center",
                  cursor: "pointer",
                  ...getDelay(index + 2),
                }}
                onMouseEnter={() => setHoveredCard(`pillar-${index}`)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div className="vision-pillar-icon">{pillar.icon}</div>
                  <h5
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#fff",
                      margin: 0,
                      fontFamily: F.serif,
                    }}
                  >
                    {pillar.title}
                  </h5>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.6)",
                      margin: 0,
                    }}
                  >
                    {pillar.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Divider */}
        <div
          style={{
            marginTop: 60,
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 100,
              background: `linear-gradient(135deg, ${C.gold}22, ${C.gold}11)`,
              border: `1px solid ${C.gold}33`,
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              ✦ {new Date().getFullYear()} · Digital Ethiopia ✦
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionMission;
