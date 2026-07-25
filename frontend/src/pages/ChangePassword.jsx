// frontend/src/pages/ChangePassword.jsx
// Change Password page for users to update their credentials

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { authAPI } from "../services/api";
import { C, F } from "../styles/theme";
import {
  FiLock,
  FiKey,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiShield,
} from "react-icons/fi";

export default function ChangePassword() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Weak",
    color: "#ef4444",
  });

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { label: "Very Weak", color: "#ef4444", score: 0 },
      { label: "Weak", color: "#f59e0b", score: 1 },
      { label: "Fair", color: "#f59e0b", score: 2 },
      { label: "Good", color: "#3b82f6", score: 3 },
      { label: "Strong", color: "#10b981", score: 4 },
      { label: "Very Strong", color: "#10b981", score: 5 },
    ];

    return levels.find((l) => l.score === score) || levels[0];
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    const strength = checkPasswordStrength(value);
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All fields are required", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters long", "warning");
      return;
    }

    if (newPassword === currentPassword) {
      showToast(
        "New password must be different from current password",
        "warning",
      );
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword,
        newPassword,
      });
      showToast("Password changed successfully!", "success");

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength({ score: 0, label: "Weak", color: "#ef4444" });
    } catch (error) {
      console.error("Password change error:", error);
      const message =
        error.response?.data?.message || "Failed to change password";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Password requirements
  const requirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    {
      label: "At least 12 characters (recommended)",
      met: newPassword.length >= 12,
    },
    {
      label: "Uppercase & lowercase letters",
      met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    { label: "At least one number", met: /\d/.test(newPassword) },
    {
      label: "At least one special character",
      met: /[^a-zA-Z0-9]/.test(newPassword),
    },
  ];

  const progressPercentage = (passwordStrength.score / 5) * 100;

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 24px)",
        fontFamily: F.sans,
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          padding: "clamp(24px, 4vw, 40px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.primary}20, ${C.gold}20)`,
              marginBottom: 16,
            }}
          >
            <FiShield size={28} color={C.primary} />
          </div>
          <h1
            style={{
              fontSize: "clamp(20px, 4vw, 26px)",
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.serif,
              margin: 0,
            }}
          >
            Change Password
          </h1>
          <p
            style={{
              fontSize: 13,
              color: C.muted,
              marginTop: 4,
            }}
          >
            {user?.name
              ? `Hi ${user.name}, update your password`
              : "Update your password to keep your account secure"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: C.dark,
                marginBottom: 6,
              }}
            >
              Current Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 14px",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: F.sans,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  padding: "4px",
                }}
              >
                {showCurrentPassword ? (
                  <FiEyeOff size={18} />
                ) : (
                  <FiEye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: C.dark,
                marginBottom: 6,
              }}
            >
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={handleNewPasswordChange}
                placeholder="Enter your new password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 14px",
                  border: `1.5px solid ${newPassword ? (passwordStrength.score >= 3 ? "#10b981" : C.border) : C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: F.sans,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = newPassword
                    ? passwordStrength.score >= 3
                      ? "#10b981"
                      : C.border
                    : C.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  padding: "4px",
                }}
              >
                {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* Password Strength Bar */}
            {newPassword && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercentage}%`,
                      borderRadius: 2,
                      background: passwordStrength.color,
                      transition: "width 0.3s ease, background 0.3s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontSize: 11,
                    color: passwordStrength.color,
                  }}
                >
                  <span>Strength: {passwordStrength.label}</span>
                  <span>{passwordStrength.score}/5</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: C.dark,
                marginBottom: 6,
              }}
            >
              Confirm New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 14px",
                  border: `1.5px solid ${
                    confirmPassword && newPassword
                      ? confirmPassword === newPassword
                        ? "#10b981"
                        : "#ef4444"
                      : C.border
                  }`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: F.sans,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    confirmPassword && newPassword
                      ? confirmPassword === newPassword
                        ? "#10b981"
                        : "#ef4444"
                      : C.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  padding: "4px",
                }}
              >
                {showConfirmPassword ? (
                  <FiEyeOff size={18} />
                ) : (
                  <FiEye size={18} />
                )}
              </button>
            </div>
            {confirmPassword &&
              newPassword &&
              confirmPassword !== newPassword && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiAlertCircle size={14} />
                  Passwords do not match
                </div>
              )}
            {confirmPassword &&
              newPassword &&
              confirmPassword === newPassword && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiCheckCircle size={14} />
                  Passwords match
                </div>
              )}
          </div>

          {/* Password Requirements */}
          {newPassword && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                background: C.bg,
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.dark,
                  marginBottom: 6,
                }}
              >
                Password Requirements:
              </p>
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: req.met ? "#10b981" : "#999",
                    padding: "2px 0",
                  }}
                >
                  {req.met ? (
                    <FiCheckCircle size={12} />
                  ) : (
                    <FiAlertCircle size={12} />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              newPassword.length < 8
            }
            style={{
              width: "100%",
              padding: "14px",
              background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: F.sans,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 24px ${C.primary}44`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>
                Changing Password...
              </>
            ) : (
              <>
                <FiLock size={18} />
                Change Password
              </>
            )}
          </button>

          <div
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 12,
              color: C.muted,
            }}
          >
            <FiKey size={12} style={{ marginRight: 4 }} />
            For security, use a strong and unique password
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
