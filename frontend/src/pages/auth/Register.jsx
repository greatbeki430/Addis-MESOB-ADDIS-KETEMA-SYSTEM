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
  inputGroup: { marginBottom: 16 },
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
  },
};

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

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    // Create new object without confirmPassword
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      setSuccess(`User ${formData.name} created successfully!`);
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "member",
        phone: "",
      });
      // Close modal after 1.5 seconds
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
  );
}
