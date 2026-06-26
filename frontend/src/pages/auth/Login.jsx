import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import mesobLogo from "../../assets/mesoblogo.png";

const removeBodyMargins = () => {
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.top = "0";
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.bottom = "0";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  const root = document.getElementById("root");
  if (root) {
    root.style.minHeight = "100vh";
    root.style.overflow = "hidden";
    root.style.position = "fixed";
    root.style.top = "0";
    root.style.left = "0";
    root.style.right = "0";
    root.style.bottom = "0";
    root.style.width = "100%";
    root.style.height = "100%";
  }
};

const restoreBodyMargins = () => {
  document.body.style.margin = "";
  document.body.style.padding = "";
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.bottom = "";
  document.body.style.width = "";
  document.body.style.height = "";
  const root = document.getElementById("root");
  if (root) {
    root.style.minHeight = "";
    root.style.overflow = "";
    root.style.position = "";
    root.style.top = "";
    root.style.left = "";
    root.style.right = "";
    root.style.bottom = "";
    root.style.width = "";
    root.style.height = "";
  }
};

const generateParticles = () => {
  const seed = 12345;
  const pseudoRandom = (index) => {
    const x = Math.sin(index * 9301 + seed * 49297) * 49297;
    return x - Math.floor(x);
  };
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: 5 + pseudoRandom(i) * 90,
    duration: 10 + pseudoRandom(i + 100) * 20,
    delay: pseudoRandom(i + 200) * 10,
    width: 2 + pseudoRandom(i + 300) * 4,
    height: 2 + pseudoRandom(i + 400) * 4,
  }));
};

const STATIC_PARTICLES = generateParticles();

// ✅ Brand colors from logo
const COLORS = {
  primary: "#1a3aad",
  secondary: "#2952cc",
  gold: "#f5c518",
  goldLight: "#fde98a",
  dark: "#0d1a5e",
  white: "#ffffff",
};

export default function Login({ onSwitchToRegister }) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [isHovered, setIsHovered] = useState(false);
  const [titleRotation, setTitleRotation] = useState(0);

  useEffect(() => {
    removeBodyMargins();
    const interval = setInterval(() => {
      setTitleRotation((prev) => (prev + 0.3) % 360);
    }, 50);
    return () => {
      restoreBodyMargins();
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });
      if (!result.success) {
        setError(result.error || t?.auth?.loginFailed || "Login failed");
      }
    } catch {
      setError(t?.auth?.loginFailed || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      <div style={S.overlay} />

      {/* Particles */}
      <div style={S.particlesContainer}>
        {STATIC_PARTICLES.map((p) => (
          <div
            key={p.id}
            style={{
              ...S.particle,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              width: `${p.width}px`,
              height: `${p.height}px`,
            }}
          />
        ))}
      </div>

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoContainer}>
          <div
            style={{
              ...S.logoIcon,
              transform: `rotate(${titleRotation}deg)`,
            }}
          >
            አ
          </div>
          <div style={S.logoTextContainer}>
            <div style={S.logoText}>A-MESOB</div>
            <div style={S.logoSub}>
              <span style={S.logoSubHighlight}>Addis</span> MESOB
              <span style={S.logoSubDot}> · </span>
              <span style={S.logoSubHighlight}>One</span>-Stop
            </div>
          </div>
        </div>

        <p style={S.subtitle}>
          {t?.auth?.login || "Login"}{" "}
          {t?.auth?.toYourAccount || "to your account"}
        </p>

        {error && (
          <div style={S.error}>
            <span style={{ marginRight: 8 }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={S.inputGroup}>
            <label style={S.label}>{t?.auth?.email || "Email"}</label>
            <div style={S.inputWrapper}>
              <span style={S.inputIcon}>📧</span>
              <input
                type="email"
                style={{
                  ...S.input,
                  ...(isFocused.email ? S.inputFocused : {}),
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused({ ...isFocused, email: true })}
                onBlur={() => setIsFocused({ ...isFocused, email: false })}
                required
                placeholder={t?.auth?.emailPlaceholder || "you@example.com"}
              />
            </div>
          </div>

          {/* Password */}
          <div style={S.inputGroup}>
            <label style={S.label}>{t?.auth?.password || "Password"}</label>
            <div style={S.inputWrapper}>
              <span style={S.inputIcon}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                style={{
                  ...S.input,
                  ...(isFocused.password ? S.inputFocused : {}),
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused({ ...isFocused, password: true })}
                onBlur={() => setIsFocused({ ...isFocused, password: false })}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={S.eyeButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.gold;
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#999";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              ...S.button,
              ...(isHovered ? S.buttonHover : {}),
            }}
            disabled={loading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={S.spinner} />
                {t?.auth?.loggingIn || "Logging in..."}
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🚪</span>
                {t?.auth?.login || "Login"}
              </span>
            )}
          </button>
        </form>

        <div style={S.link}>
          {t?.auth?.noAccount || "Don't have an account?"}{" "}
          <button
            onClick={onSwitchToRegister}
            style={S.linkButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateX(4px)";
              e.currentTarget.style.color = COLORS.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.color = COLORS.primary;
            }}
          >
            {t?.auth?.register || "Register"}
          </button>
        </div>

        <div style={S.footer}>
          <span style={S.footerText}>
            {t?.appSub || "Addis Ketema · One-Stop Service"}
          </span>
          <span style={S.footerDot}>•</span>
          <span style={S.footerText}>{t?.year || "2018 E.C."}</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(26,58,173,0.4); }
          50% { box-shadow: 0 0 50px rgba(245,197,24,0.5); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-120px) translateX(20px); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes goldPulse {
          0%, 100% { border-color: rgba(245,197,24,0.3); }
          50% { border-color: rgba(245,197,24,0.8); }
        }
      `}</style>
    </div>
  );
}

const S = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundImage: `url(${mesobLogo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(135deg, rgba(13,26,94,0.88) 0%, rgba(26,58,173,0.75) 50%, rgba(13,26,94,0.88) 100%)",
    backdropFilter: "blur(3px)",
  },
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  particle: {
    position: "absolute",
    bottom: "-10px",
    background: "rgba(245,197,24,0.15)",
    borderRadius: "50%",
    animation: "particleFloat linear infinite",
  },
  card: {
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(20px)",
    borderRadius: "clamp(20px, 5vw, 30px)",
    padding: "clamp(30px, 6vw, 50px)",
    width: "calc(100% - 40px)",
    maxWidth: 440,
    boxShadow: "0 30px 80px rgba(13,26,94,0.4), 0 0 0 1px rgba(245,197,24,0.2)",
    position: "relative",
    zIndex: 1,
    margin: "auto",
    boxSizing: "border-box",
    animation: "fadeInUp 0.6s ease",
    border: "1px solid rgba(245,197,24,0.15)",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "clamp(12px, 3vw, 18px)",
    marginBottom: "clamp(16px, 4vw, 24px)",
  },
  logoIcon: {
    width: "clamp(55px, 13vw, 70px)",
    height: "clamp(55px, 13vw, 70px)",
    minWidth: "clamp(55px, 13vw, 70px)",
    background: "linear-gradient(135deg, #1a3aad, #f5c518)",
    borderRadius: "clamp(14px, 3vw, 20px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(28px, 7vw, 38px)",
    fontWeight: 900,
    color: "#fff",
    fontFamily: "'Noto Serif Ethiopic', serif",
    boxShadow: "0 8px 30px rgba(26,58,173,0.4)",
    transition: "transform 0.3s ease",
    animation: "pulseGlow 3s ease-in-out infinite",
  },
  logoTextContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  logoText: {
    fontSize: "clamp(30px, 8vw, 44px)",
    fontWeight: 900,
    background: "linear-gradient(135deg, #1a3aad, #f5c518)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontFamily: "'Noto Serif Ethiopic', serif",
    letterSpacing: "-0.5px",
    lineHeight: 1.1,
  },
  logoSub: {
    fontSize: "clamp(10px, 2.5vw, 12px)",
    color: "#666",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
    letterSpacing: "0.5px",
    marginTop: 2,
  },
  logoSubHighlight: {
    color: "#1a3aad",
    fontWeight: 700,
  },
  logoSubDot: {
    color: "#f5c518",
    margin: "0 4px",
    fontWeight: 900,
  },
  subtitle: {
    fontSize: "clamp(13px, 3.5vw, 14px)",
    color: "#6a7aaa",
    textAlign: "center",
    marginBottom: "clamp(24px, 5vw, 32px)",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
  },
  inputGroup: { marginBottom: "clamp(16px, 4vw, 20px)" },
  label: {
    display: "block",
    fontSize: "clamp(11px, 3vw, 12px)",
    fontWeight: 600,
    color: "#1a3aad",
    marginBottom: 6,
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
  },
  inputWrapper: { position: "relative", width: "100%" },
  inputIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "clamp(14px, 3.5vw, 16px)",
    opacity: 0.5,
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding:
      "clamp(12px, 3vw, 14px) clamp(40px, 10vw, 50px) clamp(12px, 3vw, 14px) clamp(40px, 10vw, 45px)",
    border: "2px solid #c8d0ef",
    borderRadius: "clamp(10px, 2.5vw, 12px)",
    fontSize: "clamp(14px, 3.5vw, 15px)",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    background: "#f5f7ff",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
    color: "#0d1a5e",
  },
  inputFocused: {
    borderColor: "#1a3aad",
    boxShadow: "0 0 0 4px rgba(26,58,173,0.1)",
    background: "#fff",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "clamp(16px, 4vw, 18px)",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    transition: "all 0.2s ease",
  },
  button: {
    width: "100%",
    padding: "clamp(14px, 3.5vw, 16px)",
    background:
      "linear-gradient(135deg, #1a3aad 0%, #2952cc 50%, #f5c518 100%)",
    backgroundSize: "200% 100%",
    color: "#fff",
    border: "none",
    borderRadius: "clamp(10px, 2.5vw, 12px)",
    fontSize: "clamp(14px, 3.5vw, 15px)",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    transition: "all 0.3s ease",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(26,58,173,0.35)",
  },
  buttonHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(26,58,173,0.45)",
    backgroundPosition: "right center",
  },
  spinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid #f5c518",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  error: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: "clamp(8px, 2vw, 10px)",
    fontSize: "clamp(12px, 3vw, 13px)",
    marginBottom: 16,
    wordBreak: "break-word",
    display: "flex",
    alignItems: "center",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
    border: "1px solid #fecaca",
    animation: "shake 0.5s ease",
  },
  link: {
    textAlign: "center",
    marginTop: "clamp(20px, 5vw, 24px)",
    fontSize: "clamp(12px, 3vw, 13px)",
    color: "#6a7aaa",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#1a3aad",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "clamp(12px, 3vw, 13px)",
    transition: "all 0.3s ease",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
    padding: "0 4px",
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "clamp(20px, 5vw, 28px)",
    paddingTop: "clamp(16px, 4vw, 20px)",
    borderTop: "1px solid #e8ecf8",
  },
  footerText: {
    fontSize: "clamp(10px, 2.5vw, 11px)",
    color: "#8899bb",
    fontFamily: "'Noto Sans Ethiopic', sans-serif",
  },
  footerDot: { color: "#f5c518", fontSize: "10px", fontWeight: 900 },
};
