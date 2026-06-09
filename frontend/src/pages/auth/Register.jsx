import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const registerStyles = {
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
    maxWidth: 480,
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
    marginBottom: 16,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 16,
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
    padding: "10px 12px",
    border: "1.5px solid #d0ddd6",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #d0ddd6",
    borderRadius: 8,
    fontSize: 13,
    background: "#fff",
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
    marginTop: 16,
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

export default function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "member",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    // Remove confirmPassword before sending to API
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...registerData } = formData;

    const result = await register(registerData);

    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={registerStyles.container}>
      <div style={registerStyles.card}>
        <h1 style={registerStyles.title}>Create Account</h1>
        <p style={registerStyles.subtitle}>Register for Addis MESOB</p>

        {error && <div style={registerStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={registerStyles.inputGroup}>
            <label style={registerStyles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              style={registerStyles.input}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={registerStyles.inputGroup}>
            <label style={registerStyles.label}>Email</label>
            <input
              type="email"
              name="email"
              style={registerStyles.input}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={registerStyles.row}>
            <div>
              <label style={registerStyles.label}>Password</label>
              <input
                type="password"
                name="password"
                style={registerStyles.input}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label style={registerStyles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                style={registerStyles.input}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={registerStyles.row}>
            <div>
              <label style={registerStyles.label}>Role</label>
              <select
                name="role"
                style={registerStyles.select}
                value={formData.role}
                onChange={handleChange}
              >
                <option value="member">Member</option>
                <option value="leader">Team Leader</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={registerStyles.label}>Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                style={registerStyles.input}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            style={registerStyles.button}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div style={registerStyles.link}>
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} style={registerStyles.linkButton}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
