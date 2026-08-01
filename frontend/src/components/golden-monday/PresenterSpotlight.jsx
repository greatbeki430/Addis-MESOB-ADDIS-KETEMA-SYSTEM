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
  for (let i = 0; i < 30; i++) {
    particles.push({
      id: i,
      size: 2 + (i % 6),
      opacity: 0.1 + ((i * 7) % 30) / 100,
      left: (i * 3.3) % 100,
      top: (i * 7.7) % 100,
      duration: 5 + (i % 10),
      delay: (i * 0.3) % 5,
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

  // Load data on mount - using isInitialLoad ref to prevent double execution
  useEffect(() => {
    isMounted.current = true;

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadPresenter();
      calculateTimeRemaining();

      // Start timer
      timerRef.current = setInterval(calculateTimeRemaining, 1000);

      // Show particles after a delay
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

  // Handle refresh from parent - using a flag to prevent unnecessary calls
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
          borderRadius: 20,
          padding: "40px",
          textAlign: "center",
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#fff", fontSize: 18 }}>
          <FiClock size={30} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 12 }}>Loading presenter...</p>
        </div>
      </div>
    );
  }

  if (!presenter || !presenter.name) {
    return (
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark}, ${C.primary})`,
          borderRadius: 20,
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#fff", fontSize: 16 }}>
          <FiUsers size={40} style={{ opacity: 0.5 }} />
          <p style={{ marginTop: 12 }}>
            No presenter assigned for this week yet.
          </p>
          <p style={{ fontSize: 14, opacity: 0.7 }}>
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
        borderRadius: 20,
        marginBottom: 32,
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.primary} 50%, #1a1a4e 100%)`,
        boxShadow: "0 20px 60px rgba(26, 58, 173, 0.3)",
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
          right: "-10%",
          width: "400px",
          height: "400px",
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
          padding: "clamp(24px, 4vw, 40px)",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "clamp(20px, 3vw, 40px)",
          alignItems: "center",
        }}
      >
        {/* ── Presenter Photo ── */}
        <div
          style={{
            position: "relative",
            width: "clamp(80px, 10vw, 140px)",
            height: "clamp(80px, 10vw, 140px)",
            flexShrink: 0,
          }}
        >
          {/* Animated border ring */}
          <div
            style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, ${C.gold}, ${C.goldLight}, ${C.gold}, ${C.goldLight}, ${C.gold})`,
              animation: "spin-slow 8s linear infinite",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              background: `conic-gradient(from 180deg, ${C.primary}, ${C.gold}, ${C.primary})`,
              animation: "spin-slow 12s linear infinite reverse",
              opacity: 0.3,
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
              border: `3px solid ${C.gold}`,
              boxShadow: "0 0 30px rgba(245, 197, 24, 0.2)",
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
                  fontSize: "clamp(32px, 4vw, 56px)",
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
                bottom: 0,
                right: 0,
                background: C.gold,
                color: C.dark,
                width: "clamp(24px, 3vw, 36px)",
                height: "clamp(24px, 3vw, 36px)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${C.dark}`,
                fontSize: "clamp(10px, 1.2vw, 14px)",
              }}
            >
              <FiStar size="clamp(12px, 1.5vw, 18px)" />
            </div>
          </div>
        </div>

        {/* ── Presenter Info ── */}
        <div style={{ color: "#fff" }}>
          {/* Badge - Week of */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: `${C.gold}22`,
              border: `1px solid ${C.gold}55`,
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: 11,
              fontWeight: 600,
              color: C.goldLight,
              marginBottom: 10,
            }}
          >
            <FiCalendar size={13} />
            {t.thisWeekPresenter || "This Week's Presenter"}
          </div>

          {/* Name */}
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: "clamp(20px, 2.8vw, 32px)",
              fontWeight: 800,
              fontFamily: F.serif,
              color: "#fff",
            }}
          >
            {presenter.name}
          </h2>

          {/* Department & Position */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 8,
              fontSize: "clamp(13px, 1.2vw, 15px)",
              color: "#c9d0f0",
            }}
          >
            {presenter.department && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FiBriefcase size={14} />
                {presenter.department}
              </span>
            )}
            {presenter.position && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FiUser size={14} />
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
                border: `1px solid ${C.gold}44`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: "clamp(13px, 1.2vw, 15px)",
                color: C.goldLight,
                marginBottom: 12,
                fontStyle: "italic",
              }}
            >
              "{presenter.presentationTitle}"
            </div>
          )}

          {/* Countdown Timer */}
          <div
            style={{
              display: "flex",
              gap: "clamp(12px, 2vw, 24px)",
              marginTop: 4,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(18px, 2.2vw, 28px)",
                  fontWeight: 700,
                  color: C.gold,
                  fontFamily: F.serif,
                }}
              >
                {String(timeRemaining.days).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 10, color: "#a9b3e0" }}>Days</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(18px, 2.2vw, 28px)",
                  fontWeight: 700,
                  color: C.gold,
                  fontFamily: F.serif,
                }}
              >
                {String(timeRemaining.hours).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 10, color: "#a9b3e0" }}>Hours</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(18px, 2.2vw, 28px)",
                  fontWeight: 700,
                  color: C.gold,
                  fontFamily: F.serif,
                }}
              >
                {String(timeRemaining.minutes).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 10, color: "#a9b3e0" }}>Min</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(18px, 2.2vw, 28px)",
                  fontWeight: 700,
                  color: C.gold,
                  fontFamily: F.serif,
                }}
              >
                {String(timeRemaining.seconds).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 10, color: "#a9b3e0" }}>Sec</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Achievement Badges Row ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: "clamp(16px, 2vw, 30px)",
          padding: "clamp(12px, 2vw, 20px) clamp(20px, 4vw, 40px)",
          borderTop: `1px solid rgba(255,255,255,0.06)`,
          background: "rgba(0,0,0,0.2)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `${C.gold}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.gold,
            }}
          >
            <FiStar size={14} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a9b3e0" }}>
              {t.timesPresented || "Times Presented"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {presenter.timesPresented || 0}x
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `${C.gold}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.gold,
            }}
          >
            <FiThumbsUp size={14} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a9b3e0" }}>
              {t.endorsements || "Endorsements"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {presenter.endorsementCount || 0}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `${C.gold}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.gold,
            }}
          >
            <FiTrendingUp size={14} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a9b3e0" }}>
              {t.avgRating || "Avg Rating"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {presenter.averageRating
                ? `${presenter.averageRating.toFixed(1)} ★`
                : "N/A"}
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
          50% { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
