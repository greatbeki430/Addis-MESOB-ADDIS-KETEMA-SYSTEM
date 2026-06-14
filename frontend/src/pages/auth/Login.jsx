import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
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

const loginStyles = {
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "clamp(24px, 5vw, 40px)",
    width: "calc(100% - 40px)",
    maxWidth: 420,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    position: "relative",
    zIndex: 1,
    margin: "auto",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "clamp(22px, 6vw, 28px)",
    fontWeight: 900,
    color: "#1a6b4a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: "clamp(12px, 3.5vw, 13px)",
    color: "#666",
    textAlign: "center",
    marginBottom: "clamp(20px, 5vw, 32px)",
  },
  inputGroup: {
    marginBottom: "clamp(14px, 4vw, 20px)",
  },
  label: {
    display: "block",
    fontSize: "clamp(11px, 3vw, 12px)",
    fontWeight: 600,
    color: "#333",
    marginBottom: 6,
  },
  // ✅ New style for password wrapper (input + eye button)
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "clamp(10px, 3vw, 12px) clamp(12px, 3vw, 14px)",
    border: "1.5px solid #d0ddd6",
    borderRadius: 8,
    fontSize: "clamp(13px, 3.5vw, 14px)",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  // ✅ Style for password input with space for eye button
  passwordInput: {
    width: "100%",
    padding:
      "clamp(10px, 3vw, 12px) clamp(40px, 10vw, 50px) clamp(10px, 3vw, 12px) clamp(12px, 3vw, 14px)",
    border: "1.5px solid #d0ddd6",
    borderRadius: 8,
    fontSize: "clamp(13px, 3.5vw, 14px)",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  // ✅ Eye button style
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
    transition: "color 0.2s",
  },
  button: {
    width: "100%",
    padding: "clamp(10px, 3vw, 12px)",
    background: "linear-gradient(135deg, #1a6b4a, #2aaa78)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "clamp(13px, 3.5vw, 14px)",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px",
    borderRadius: 8,
    fontSize: "clamp(11px, 3vw, 12px)",
    marginBottom: 16,
    wordBreak: "break-word",
  },
  link: {
    textAlign: "center",
    marginTop: "clamp(16px, 4vw, 20px)",
    fontSize: "clamp(11px, 3vw, 12px)",
    color: "#666",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#1a6b4a",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "clamp(11px, 3vw, 12px)",
  },
};

export default function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ Password visibility state
  const { login } = useAuth();

  useEffect(() => {
    removeBodyMargins();

    return () => {
      restoreBodyMargins();
    };
  }, []);

  const handleSubmit = async (e) => {
    console.log("=== HANDLE SUBMIT FIRED ===");
    console.log("Email:", email, "Password length:", password?.length);

    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Calling login from context...");
      const result = await login({ email, password });
      console.log("Login result:", result);

      if (!result.success) {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Unexpected error in handleSubmit:", err);
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={loginStyles.container}>
      <div style={loginStyles.overlay}></div>
      <div style={loginStyles.card}>
        <h1 style={loginStyles.title}>A-MESOB</h1>
        <p style={loginStyles.subtitle}>Login to your account</p>

        {error && <div style={loginStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={loginStyles.inputGroup}>
            <label style={loginStyles.label}>Email</label>
            <input
              type="email"
              style={loginStyles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={loginStyles.inputGroup}>
            <label style={loginStyles.label}>Password</label>
            {/* ✅ Password input with eye toggle */}
            <div style={loginStyles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                style={loginStyles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={loginStyles.eyeButton}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1a6b4a")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
              >
                {showPassword ? "👁️" : "🔒"}
              </button>
            </div>
          </div>

          <button type="submit" style={loginStyles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={loginStyles.link}>
          Don't have an account?{" "}
          <button onClick={onSwitchToRegister} style={loginStyles.linkButton}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
