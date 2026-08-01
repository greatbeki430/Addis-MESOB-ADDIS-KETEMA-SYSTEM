// src/components/golden-monday/PresenterSpotlight.jsx
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
} from "react-icons/fi";

// Generate consistent particle positions (no Math.random during render)
const generateParticles = () => {
  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: i,
      size: 2 + (i % 4),
      opacity: 0.1 + ((i * 7) % 20) / 100,
      left: (i * 5) % 100,
      top: (i * 10) % 100,
      duration: 5 + (i % 8),
      delay: (i * 0.4) % 4,
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
      setPresenter(response.data);

      // Get full presenter details with photo
      if (response.data && response.data._id) {
        try {
          const detailRes = await goldenMondayAPI.getUserDetails(
            response.data._id,
          );
          if (!isMounted.current) return;
          setPresenter((prev) => ({
            ...prev,
            ...detailRes.data,
          }));
        } catch (detailErr) {
          console.warn("Could not fetch user details:", detailErr);
        }
      }
    } catch (error) {
      console.error("Failed to load presenter:", error);
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

  if (loading) {
    return (
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark}, ${C.primary})`,
          borderRadius: 16,
          padding: "30px 20px",
          textAlign: "center",
          minHeight: "150px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#fff", fontSize: 16 }}>
          <FiClock size={24} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 10, fontSize: 14 }}>Loading presenter...</p>
        </div>
      </div>
    );
  }

  if (!presenter || !presenter.name) {
    return (
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark}, ${C.primary})`,
          borderRadius: 16,
          padding: "30px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#fff", fontSize: 14 }}>
          <FiUsers size={32} style={{ opacity: 0.5 }} />
          <p style={{ marginTop: 10 }}>
            No presenter assigned for this week yet.
          </p>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Check back on Monday at 2:00 PM!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        marginBottom: 24,
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.primary} 50%, #1a1a4e 100%)`,
        boxShadow: "0 8px 32px rgba(26, 58, 173, 0.25)",
      }}
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
                background: C.gold,
                borderRadius: "50%",
                opacity: p.opacity,
                left: `${p.left}%`,
                top: `${p.top}%`,
                animation: `float ${p.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Glow Ring Animation ── */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.gold}22, transparent 70%)`,
          animation: "pulse-ring 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* ── Top Section: Photo + Info ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* ── Presenter Photo ── */}
          <div
            style={{
              position: "relative",
              width: "64px",
              height: "64px",
              flexShrink: 0,
            }}
          >
            {/* Animated border ring */}
            <div
              style={{
                position: "absolute",
                inset: "-3px",
                borderRadius: "50%",
                background: `conic-gradient(from 0deg, ${C.gold}, ${C.goldLight}, ${C.gold}, ${C.goldLight}, ${C.gold})`,
                animation: "spin-slow 8s linear infinite",
                opacity: 0.6,
              }}
            />

            {/* Photo */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
                border: `2px solid ${C.gold}`,
                boxShadow: "0 0 20px rgba(245, 197, 24, 0.15)",
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
                    fontSize: "24px",
                    fontWeight: 700,
                  }}
                >
                  {presenter.name?.charAt(0) || "?"}
                </div>
              )}

              {/* Gold corner badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: C.gold,
                  color: C.dark,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${C.dark}`,
                  fontSize: "10px",
                }}
              >
                <FiStar size="10px" />
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
                gap: 4,
                background: `${C.gold}22`,
                border: `1px solid ${C.gold}44`,
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 9,
                fontWeight: 600,
                color: C.goldLight,
                marginBottom: 4,
              }}
            >
              <FiCalendar size={10} />
              {t.thisWeekPresenter || "This Week's Presenter"}
            </div>

            {/* Name */}
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: F.serif,
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              {presenter.name}
            </h2>

            {/* Department & Position */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
                fontSize: "12px",
                color: "#c9d0f0",
                marginTop: 2,
              }}
            >
              {presenter.department && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <FiBriefcase size="12px" />
                  {presenter.department}
                </span>
              )}
              {presenter.position && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <FiUser size="12px" />
                  {presenter.position}
                </span>
              )}
            </div>

            {/* Presentation Title */}
            {presenter.presentationTitle && (
              <div
                style={{
                  display: "inline-block",
                  background: `${C.gold}11`,
                  border: `1px solid ${C.gold}33`,
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: "11px",
                  color: C.goldLight,
                  marginTop: 4,
                  fontStyle: "italic",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                "{presenter.presentationTitle}"
              </div>
            )}
          </div>
        </div>

        {/* ── Countdown Timer ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            padding: "8px 0",
            borderTop: `1px solid rgba(255,255,255,0.06)`,
            borderBottom: `1px solid rgba(255,255,255,0.06)`,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: C.gold,
                fontFamily: F.serif,
                lineHeight: 1.2,
              }}
            >
              {String(timeRemaining.days).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 8,
                color: "#a9b3e0",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Days
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: C.gold,
                fontFamily: F.serif,
                lineHeight: 1.2,
              }}
            >
              {String(timeRemaining.hours).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 8,
                color: "#a9b3e0",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Hours
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: C.gold,
                fontFamily: F.serif,
                lineHeight: 1.2,
              }}
            >
              {String(timeRemaining.minutes).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 8,
                color: "#a9b3e0",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Min
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: C.gold,
                fontFamily: F.serif,
                lineHeight: 1.2,
              }}
            >
              {String(timeRemaining.seconds).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 8,
                color: "#a9b3e0",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Sec
            </div>
          </div>
        </div>

        {/* ── Achievement Badges Row ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            gap: 4,
            paddingTop: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: `${C.gold}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.gold,
              }}
            >
              <FiStar size="12px" />
            </div>
            <div>
              <div style={{ fontSize: 8, color: "#a9b3e0" }}>Presented</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                {presenter.timesPresented || 0}x
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: `${C.gold}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.gold,
              }}
            >
              <FiThumbsUp size="12px" />
            </div>
            <div>
              <div style={{ fontSize: 8, color: "#a9b3e0" }}>Endorsements</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                {presenter.endorsementCount || 0}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: `${C.gold}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.gold,
              }}
            >
              <FiTrendingUp size="12px" />
            </div>
            <div>
              <div style={{ fontSize: 8, color: "#a9b3e0" }}>Rating</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                {presenter.averageRating
                  ? `${presenter.averageRating.toFixed(1)}★`
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 400px) {
          .presenter-title {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
