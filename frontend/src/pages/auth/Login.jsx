import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const loginStyles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a6b4a 0%, #2aaa78 100%)",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: "#1a6b4a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#333",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #d0ddd6",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #1a6b4a, #2aaa78)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px",
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
    color: "#666",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#1a6b4a",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 12,
  },
};

export default function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login({ email, password });

    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={loginStyles.container}>
      <div style={loginStyles.card}>
        <h1 style={loginStyles.title}>Addis MESOB</h1>
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
            <input
              type="password"
              style={loginStyles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
