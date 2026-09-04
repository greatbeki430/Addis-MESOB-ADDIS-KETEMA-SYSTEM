// src/components/golden-monday/PresenterSpotlight.jsx
// Enhanced Presenter Spotlight with stunning visuals and animations

import { useState, useEffect, useCallback, useRef } from "react";
import { C, F } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiStar,
  FiCalendar,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiThumbsUp,
  FiUser,
  FiBriefcase,
  FiAward,
  FiCpu,
  FiZap,
  FiHeart,
  FiActivity,
} from "react-icons/fi";

// Generate enhanced particle system with more particles
const generateParticles = () => {
  const particles = [];
  const colors = ["#F5C518", "#FFD700", "#FFA500", "#FF6B35", "#FFD93D"];
  for (let i = 0; i < 40; i++) {
    particles.push({
      id: i,
      size: 2 + (i % 6),
      opacity: 0.1 + ((i * 7) % 30) / 100,
      left: (i * 5) % 100,
      top: (i * 10) % 100,
      duration: 5 + (i % 10),
      delay: (i * 0.4) % 5,
      color: colors[i % colors.length],
    });
  }
  return particles;
};

const PARTICLES = generateParticles();

export default function PresenterSpotlight({ onRefresh }) {
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const [presenter, setPresenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showParticles, setShowParticles] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef(null);
  const isMounted = useRef(true);
  const isInitialLoad = useRef(true);

  // Load presenter data
  const loadPresenter = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const response = await goldenMondayAPI.getNextPresenter();
      if (!isMounted.current) return;

      // ✅ Check if we have valid presenter data
      if (response.data && response.data.name) {
        setPresenter(response.data);

        // ✅ Only fetch user details if we have a valid _id
        if (response.data._id) {
          try {
            const detailRes = await goldenMondayAPI.getUserDetails(
              response.data._id,
            );
            if (!isMounted.current) return;

            // ✅ Only update if we got valid data back
            if (detailRes.data && detailRes.data._id) {
              setPresenter((prev) => ({
                ...prev,
                ...detailRes.data,
              }));
            } else {
              // User not found - use the presenter data we already have
              console.warn(
                `⚠️ User ${response.data._id} not found - using base presenter data`,
              );
            }
          } catch (detailErr) {
            // Silently handle 404 - keep the presenter data
            if (detailErr.response?.status === 404) {
              console.warn(
                `⚠️ User ${response.data._id} not found - using base presenter data`,
              );
            } else {
              console.warn(
                "Could not fetch presenter user details:",
                detailErr,
              );
            }
          }
        }
      } else {
        // No presenter data - clear the presenter
        setPresenter(null);
      }
    } catch (error) {
      console.error("Failed to load presenter:", error);
      setPresenter(null);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Calculate time until next Monday
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(14, 0, 0, 0);

    const diff = nextMonday - now;
    if (diff <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining({ days, hours, minutes, seconds });
  }, []);

  // Glow animation loop
  useEffect(() => {
    let glowInterval;
    if (!loading && presenter) {
      glowInterval = setInterval(() => {
        setGlowIntensity((prev) => (prev + 1) % 100);
      }, 50);
    }
    return () => clearInterval(glowInterval);
  }, [loading, presenter]);

  // Load data on mount
  useEffect(() => {
    isMounted.current = true;

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadPresenter();
      calculateTimeRemaining();

      timerRef.current = setInterval(calculateTimeRemaining, 1000);

      const particleTimer = setTimeout(() => {
        if (isMounted.current) setShowParticles(true);
      }, 500);

      return () => {
        isMounted.current = false;
        if (timerRef.current) clearInterval(timerRef.current);
        clearTimeout(particleTimer);
      };
    }

    return () => {
      isMounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle refresh from parent
  const prevRefreshRef = useRef(onRefresh);

  useEffect(() => {
    if (onRefresh && onRefresh !== prevRefreshRef.current) {
      prevRefreshRef.current = onRefresh;
      loadPresenter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh]);

  const getGlowStyle = () => {
    const intensity = 50 + Math.sin(glowIntensity / 10) * 30;
    return {
      boxShadow: `0 0 ${intensity}px rgba(245, 197, 24, ${0.15 + Math.sin(glowIntensity / 15) * 0.1})`,
    };
  };

  const getGoldGradient = () => {
    const angle = glowIntensity % 360;
    return `conic-gradient(from ${angle}deg, #F5C518, #FFD700, #FFA500, #FF6B35, #FFD93D, #F5C518)`;
  };

  if (loading) {
    return (
      <div style={{ padding: "0 16px", marginTop: 20 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${C.dark}, ${C.primary})`,
            borderRadius: 16,
            padding: "40px 20px",
            textAlign: "center",
            minHeight: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: `3px solid ${C.gold}`,
              borderTopColor: "transparent",
              animation: "spin 1s linear infinite",
              marginBottom: 16,
            }}
          />
          <p style={{ color: "#fff", fontSize: 16 }}>
            <FiClock size={20} style={{ marginRight: 8 }} />
            Loading presenter spotlight...
          </p>
        </div>
      </div>
    );
  }

  if (!presenter || !presenter.name) {
    return (
      <div style={{ padding: "0 16px", marginTop: 20 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${C.dark}, ${C.primary})`,
            borderRadius: 16,
            padding: "40px 20px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              right: "-20%",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${C.gold}11, transparent 70%)`,
              animation: "pulse-ring 4s ease-in-out infinite",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <FiUsers size={48} style={{ opacity: 0.3, color: C.gold }} />
            <p style={{ color: "#fff", fontSize: 16, marginTop: 12 }}>
              No presenter assigned for this week yet.
            </p>
            <p
              style={{
                fontSize: 13,
                opacity: 0.7,
                marginTop: 4,
                color: "#c9d0f0",
              }}
            >
              Check back on Monday at 2:00 PM!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px", marginTop: 20 }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
          background: `linear-gradient(135deg, ${C.dark} 0%, ${C.primary} 40%, #0f0f3a 100%)`,
          boxShadow: "0 12px 48px rgba(26, 58, 173, 0.35)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* ── Animated Particles Background ── */}
        {showParticles && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {PARTICLES.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  borderRadius: "50%",
                  opacity: p.opacity,
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  animation: `float-${p.id % 3} ${p.duration}s ease-in-out infinite`,
                  animationDelay: `${p.delay}s`,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}33`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Gradient Orbs ── */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.gold}11, transparent 70%)`,
            animation: "pulse-ring 5s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-40%",
            left: "-10%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.primary}33, transparent 70%)`,
            animation: "pulse-ring 6s ease-in-out infinite reverse",
            pointerEvents: "none",
          }}
        />

        {/* ── Content ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "clamp(20px, 4vw, 32px) clamp(16px, 3vw, 28px)",
          }}
        >
          {/* ── Top Section: Photo + Info ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "clamp(16px, 3vw, 28px)",
              flexWrap: "wrap",
            }}
          >
            {/* ── Stunning Presenter Photo ── */}
            <div
              style={{
                position: "relative",
                width: "clamp(100px, 18vw, 160px)",
                height: "clamp(100px, 18vw, 160px)",
                flexShrink: 0,
              }}
            >
              {/* Animated rotating border ring */}
              <div
                style={{
                  position: "absolute",
                  inset: "-4px",
                  borderRadius: "50%",
                  background: getGoldGradient(),
                  animation: "spin-slow 10s linear infinite",
                  opacity: 0.8,
                }}
              />

              {/* Outer glow ring */}
              <div
                style={{
                  position: "absolute",
                  inset: "-8px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${C.gold}33, transparent 70%)`,
                  animation: "pulse-ring 2s ease-in-out infinite",
                }}
              />

              {/* Pulsing glow effect */}
              <div
                style={{
                  position: "absolute",
                  inset: "-15px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${C.gold}11, transparent 60%)`,
                  animation: "pulse-ring 3s ease-in-out infinite",
                  animationDelay: "0.5s",
                }}
              />

              {/* Photo container */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `3px solid ${C.gold}`,
                  boxShadow: getGlowStyle(),
                  transform: isHovering ? "scale(1.05)" : "scale(1)",
                  transition:
                    "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
                }}
              >
                {presenter.profilePhotoUrl ? (
                  <img
                    src={presenter.profilePhotoUrl}
                    alt={presenter.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "clamp(40px, 8vw, 64px)",
                      fontWeight: 700,
                      fontFamily: F.serif,
                    }}
                  >
                    {presenter.name?.charAt(0) || "?"}
                  </div>
                )}

                {/* Gold corner badge - Star */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    background: C.gold,
                    color: C.dark,
                    width: "clamp(24px, 4vw, 32px)",
                    height: "clamp(24px, 4vw, 32px)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${C.dark}`,
                    boxShadow: "0 0 20px rgba(245, 197, 24, 0.5)",
                    animation: "pulse-ring 2s ease-in-out infinite",
                  }}
                >
                  <FiStar size="clamp(12px, 2vw, 16px)" />
                </div>

                {/* Status indicator - Live/Upcoming */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "#10b981",
                    color: "#fff",
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: "9px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.5)",
                    animation: "pulse-ring 1.5s ease-in-out infinite",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#fff",
                    }}
                  />
                  {timeRemaining.days === 0 && timeRemaining.hours < 24
                    ? "Today"
                    : "Upcoming"}
                </div>
              </div>
            </div>

            {/* ── Presenter Info ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badge - Week of */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: `${C.gold}22`,
                  border: `1px solid ${C.gold}44`,
                  borderRadius: 999,
                  padding: "4px 14px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: C.goldLight,
                  marginBottom: 8,
                }}
              >
                <FiCalendar size={12} />
                {t.thisWeekPresenter || "This Week's Presenter"} ✨
              </div>

              {/* Name */}
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(22px, 4vw, 32px)",
                  fontWeight: 800,
                  fontFamily: F.serif,
                  color: "#fff",
                  lineHeight: 1.1,
                  textShadow: "0 0 40px rgba(245, 197, 24, 0.1)",
                }}
              >
                {presenter.name}
              </h2>

              {/* Department & Position */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  fontSize: "clamp(13px, 2vw, 15px)",
                  color: "#c9d0f0",
                  marginTop: 4,
                }}
              >
                {presenter.department && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 10px",
                      borderRadius: 6,
                    }}
                  >
                    <FiBriefcase size="14px" />
                    {presenter.department}
                  </span>
                )}
                {presenter.position && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 10px",
                      borderRadius: 6,
                    }}
                  >
                    <FiUser size="14px" />
                    {presenter.position}
                  </span>
                )}
              </div>

              {/* Presentation Title with animated border */}
              {presenter.presentationTitle && (
                <div
                  style={{
                    display: "inline-block",
                    background: `linear-gradient(135deg, ${C.gold}11, ${C.gold}22)`,
                    border: `1px solid ${C.gold}44`,
                    borderRadius: 8,
                    padding: "6px 16px",
                    fontSize: "clamp(13px, 2vw, 15px)",
                    color: C.goldLight,
                    marginTop: 8,
                    fontStyle: "italic",
                    maxWidth: "100%",
                    transition: "all 0.3s ease",
                    boxShadow: isHovering ? `0 0 30px ${C.gold}22` : "none",
                  }}
                >
                  "{presenter.presentationTitle}"
                </div>
              )}
            </div>
          </div>

          {/* ── Countdown Timer with animated digits ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(12px, 3vw, 24px)",
              padding: "clamp(12px, 2vw, 16px) 0",
              marginTop: 16,
              borderTop: `1px solid rgba(255,255,255,0.06)`,
              borderBottom: `1px solid rgba(255,255,255,0.06)`,
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
            }}
          >
            {[
              {
                value: timeRemaining.days,
                label: "Days",
                icon: <FiCalendar size={14} />,
              },
              {
                value: timeRemaining.hours,
                label: "Hours",
                icon: <FiClock size={14} />,
              },
              {
                value: timeRemaining.minutes,
                label: "Minutes",
                icon: <FiZap size={14} />,
              },
              {
                value: timeRemaining.seconds,
                label: "Seconds",
                icon: <FiActivity size={14} />,
              },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "clamp(22px, 4vw, 32px)",
                    fontWeight: 800,
                    color: C.gold,
                    fontFamily: F.serif,
                    lineHeight: 1.1,
                    textShadow: "0 0 30px rgba(245, 197, 24, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {String(item.value)
                    .padStart(2, "0")
                    .split("")
                    .map((digit, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          minWidth: "clamp(18px, 3vw, 28px)",
                          padding: "2px 4px",
                          background: "rgba(0,0,0,0.3)",
                          borderRadius: 4,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {digit}
                      </span>
                    ))}
                </div>
                <div
                  style={{
                    fontSize: "clamp(8px, 1.5vw, 10px)",
                    color: "#a9b3e0",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  {item.icon}
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Achievement Badges Row with animated hover ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
              gap: 8,
              paddingTop: 12,
            }}
          >
            {[
              {
                icon: <FiStar size="clamp(14px, 2vw, 18px)" />,
                label: "Presented",
                value: presenter.timesPresented || 0,
                suffix: "x",
                color: C.gold,
              },
              {
                icon: <FiThumbsUp size="clamp(14px, 2vw, 18px)" />,
                label: "Endorsements",
                value: presenter.endorsementCount || 0,
                suffix: "",
                color: "#10b981",
              },
              {
                icon: <FiTrendingUp size="clamp(14px, 2vw, 18px)" />,
                label: "Rating",
                value: presenter.averageRating
                  ? presenter.averageRating.toFixed(1)
                  : "N/A",
                suffix: "★",
                color: "#f59e0b",
              },
              {
                icon: <FiAward size="clamp(14px, 2vw, 18px)" />,
                label: "Status",
                value: presenter.isEligible ? "Active" : "Inactive",
                suffix: "",
                color: presenter.isEligible ? "#10b981" : "#ef4444",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "clamp(6px, 1vw, 10px)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.06)`,
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    color: item.color,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {item.icon}
                  <span
                    style={{
                      fontSize: "clamp(14px, 2vw, 18px)",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {item.value}
                    {item.suffix}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "clamp(8px, 1.2vw, 10px)",
                    color: "#a9b3e0",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer: AI Powered Badge ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              paddingTop: 8,
              borderTop: `1px solid rgba(255,255,255,0.04)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                fontWeight: 500,
              }}
            >
              <FiCpu size={12} />
              AI Powered Spotlight
              <span style={{ opacity: 0.3 }}>·</span>
              <FiHeart size={10} />
              Golden Monday
            </div>
          </div>
        </div>

        {/* ── Animations ── */}
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes float-0 {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-15px) scale(1.05); }
          }
          @keyframes float-1 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
          @keyframes float-2 {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-18px) scale(1.08); }
          }
          @keyframes pulse-ring {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .presenter-title-shimmer {
            background: linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold});
            background-size: 200% auto;
            animation: shimmer 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
