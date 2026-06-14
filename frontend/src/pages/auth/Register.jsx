import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const registerStyles = {
  container: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    margin: "0 auto",
    boxSizing: "border-box",
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
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 14 },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 14,
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
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #d0ddd6",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  button: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #1a6b4a, #2aaa78)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 44,
  },
  error: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px",
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 16,
  },
  success: {
    background: "#e8f5ee",
    color: "#1a6b4a",
    padding: "10px",
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 16,
  },
  buttonRow: { display: "flex", gap: 12, marginTop: 16 },
  cancelButton: {
    flex: 1,
    padding: "12px",
    background: "#f0f7f4",
    color: "#666",
    border: "1px solid #d0ddd6",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
  },
};

// Inject responsive CSS once — mobile only tweaks
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  .register-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
    background: rgba(0,0,0,0.05);
  }
  .register-card {
    width: 100%;
    max-width: 480px;
  }
  @media (max-width: 480px) {
    .register-wrapper {
      padding: 10px;
    }
    .register-card {
      border-radius: 12px !important;
      padding: 24px 16px !important;
    }
  }
`;
if (!document.head.querySelector("#register-styles")) {
  styleTag.id = "register-styles";
  document.head.appendChild(styleTag);
}

export default function Register({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "member",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      setSuccess(`User ${formData.name} created successfully!`);
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "member",
        phone: "",
      });
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="register-wrapper">
      <div className="register-card" style={registerStyles.container}>
        <h1 style={registerStyles.title}>Create User Account</h1>
        <p style={registerStyles.subtitle}>Add a new team member</p>

        {error && <div style={registerStyles.error}>{error}</div>}
        {success && <div style={registerStyles.success}>{success}</div>}

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

          <div style={registerStyles.buttonRow}>
            <button
              type="button"
              style={registerStyles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={registerStyles.button}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
