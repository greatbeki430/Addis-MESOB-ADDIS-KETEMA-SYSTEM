import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const registerStyles = {
  container: {
    background: "#fff",
    borderRadius: 16,
    padding: "clamp(20px, 5vw, 40px)",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 20px 40px rgba(26,58,173,0.15)",
    margin: "0 auto",
    boxSizing: "border-box",
    animation: "fadeInUp 0.4s ease",
  },
  title: {
    fontSize: "clamp(22px, 6vw, 28px)",
    fontWeight: 900,
    background: "linear-gradient(135deg, #0d1a5e, #1a3aad)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: "clamp(12px, 3.5vw, 13px)",
    color: "#5a6a99",
    textAlign: "center",
    marginBottom: "clamp(16px, 4vw, 24px)",
  },
  inputGroup: { marginBottom: "clamp(12px, 3vw, 14px)" },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 14,
  },
  label: {
    display: "block",
    fontSize: "clamp(11px, 3vw, 12px)",
    fontWeight: 600,
    color: "#0d1a5e",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)",
    border: "1.5px solid #c8d0ef",
    borderRadius: 8,
    fontSize: "clamp(13px, 3.5vw, 14px)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    background: "#fafffe",
  },
  select: {
    width: "100%",
    padding: "clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)",
    border: "1.5px solid #c8d0ef",
    borderRadius: 8,
    fontSize: "clamp(13px, 3.5vw, 14px)",
    background: "#fff",
    boxSizing: "border-box",
    color: "#0d1a5e",
    outline: "none",
    cursor: "pointer",
  },
  button: {
    flex: 1,
    padding: "clamp(10px, 3vw, 12px)",
    background: "linear-gradient(135deg, #1a3aad, #2952cc)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "clamp(13px, 3.5vw, 14px)",
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 44,
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 14px rgba(26,58,173,0.3)",
  },
  error: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px",
    borderRadius: 8,
    fontSize: "clamp(11px, 3vw, 12px)",
    marginBottom: 16,
  },
  success: {
    background: "#eef1fc",
    color: "#1a3aad",
    padding: "10px",
    borderRadius: 8,
    fontSize: "clamp(11px, 3vw, 12px)",
    marginBottom: 16,
    animation: "fadeInUp 0.3s ease",
    border: "1px solid #c8d0ef",
  },
  buttonRow: { display: "flex", gap: 12, marginTop: 16 },
  cancelButton: {
    flex: 1,
    padding: "clamp(10px, 3vw, 12px)",
    background: "#eef1fc",
    color: "#5a6a99",
    border: "1px solid #c8d0ef",
    borderRadius: 8,
    fontSize: "clamp(13px, 3.5vw, 14px)",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
    transition: "background 0.2s, color 0.2s",
  },
  // Gold accent divider between sections
  divider: {
    height: 2,
    background: "linear-gradient(90deg, transparent, #f5c518, transparent)",
    margin: "16px 0",
    borderRadius: 2,
    opacity: 0.6,
  },
};

export default function Register({ onClose, t }) {
  const tu = t?.userManagement || {};
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
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
      setError(t?.auth?.passwordMismatch || "Passwords do not match");
      return;
    }

    setLoading(true);
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword: _confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      setSuccess(
        `${tu.fullName || "User"} ${formData.name} ${t?.common?.success || "created successfully!"}`,
      );
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "employee",
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
    <div style={registerStyles.container}>
      <h1 style={registerStyles.title}>➕ {tu.addNewUser || "Add New User"}</h1>
      <p style={registerStyles.subtitle}>
        {tu.createAccount ||
          "Create a new user account with specific role permissions"}
      </p>

      {/* Gold accent divider */}
      <div style={registerStyles.divider} />

      {error && <div style={registerStyles.error}>❌ {error}</div>}
      {success && <div style={registerStyles.success}>✅ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={registerStyles.inputGroup}>
          <label style={registerStyles.label}>
            {tu.fullName || "Full Name"}{" "}
            <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            style={registerStyles.input}
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., John Doe"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#1a3aad";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(26,58,173,0.13)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#c8d0ef";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={registerStyles.inputGroup}>
          <label style={registerStyles.label}>
            {tu.email || "Email"} <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            style={registerStyles.input}
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="user@example.com"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#1a3aad";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(26,58,173,0.13)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#c8d0ef";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={registerStyles.row}>
          <div>
            <label style={registerStyles.label}>
              {tu.password || "Password"}{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="password"
              name="password"
              style={registerStyles.input}
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min 6 characters"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a3aad";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(26,58,173,0.13)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#c8d0ef";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <div>
            <label style={registerStyles.label}>
              {t?.auth?.confirmPassword || "Confirm Password"}{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              style={registerStyles.input}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm password"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a3aad";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(26,58,173,0.13)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#c8d0ef";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        <div style={registerStyles.row}>
          <div>
            <label style={registerStyles.label}>
              {tu.role || "Role"} <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              name="role"
              style={registerStyles.select}
              value={formData.role}
              onChange={handleChange}
            >
              <option value="employee">Employee</option>
              <option value="leader">Team Leader</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div>
            <label style={registerStyles.label}>
              {tu.phoneOptional || "Phone (Optional)"}
            </label>
            <input
              type="tel"
              name="phone"
              style={registerStyles.input}
              value={formData.phone}
              onChange={handleChange}
              placeholder="+251 9XX XXX XXX"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a3aad";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(26,58,173,0.13)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#c8d0ef";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        <div style={registerStyles.buttonRow}>
          <button
            type="button"
            style={registerStyles.cancelButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#c8d0ef";
              e.currentTarget.style.color = "#1a3aad";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#eef1fc";
              e.currentTarget.style.color = "#5a6a99";
            }}
          >
            {tu.cancel || "Cancel"}
          </button>
          <button
            type="submit"
            style={registerStyles.button}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(26,58,173,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(26,58,173,0.3)";
            }}
          >
            {loading ? "⏳ Creating..." : "✅ Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
