// frontend/src/pages/Settings.jsx
import { useState } from "react";
import { C, F, btn, card, radius, shadows } from "../styles/theme";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../hooks/useLanguage";
import {
  FiSettings,
  FiGlobe,
  FiBell,
  FiMoon,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiSave,
  FiVolume2,
  FiRadio,
  FiKey,
  FiShield,
  FiTrash2,
  FiChevronRight,
} from "react-icons/fi";
import "./Settings.css";

// Setting Toggle Component
const SettingToggle = ({ label, description, icon, value, onToggle }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: `1px solid ${C.border}`,
      flexWrap: "wrap",
      gap: 12,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          color: C.primary,
          fontSize: 20,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.bg,
          borderRadius: radius.md,
        }}
      >
        {icon}
      </span>
      <div>
        <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: C.muted }}>{description}</div>
        )}
      </div>
    </div>
    <button
      onClick={onToggle}
      style={{
        width: 48,
        height: 28,
        background: value ? C.primary : C.border,
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.3s ease",
        flexShrink: 0,
        padding: 0,
      }}
      aria-label={`Toggle ${label}`}
    >
      <div
        style={{
          width: 22,
          height: 22,
          background: "#fff",
          borderRadius: "50%",
          position: "absolute",
          top: 3,
          left: value ? 23 : 3,
          transition: "all 0.3s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  </div>
);

// Security Item Component
const SecurityItem = ({
  icon,
  label,
  description,
  onClick,
  danger = false,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "12px 16px",
      border: `1px solid ${C.border}`,
      borderRadius: radius.md,
      background: C.white,
      cursor: "pointer",
      transition: "all 0.2s ease",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = danger ? C.red : C.primary;
      e.currentTarget.style.boxShadow = shadows.md;
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <span
      style={{
        fontSize: 18,
        color: danger ? C.red : C.primary,
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontWeight: 600,
          color: danger ? C.red : C.dark,
          fontSize: 14,
        }}
      >
        {label}
      </div>
      {description && (
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
          {description}
        </div>
      )}
    </div>
    <FiChevronRight style={{ color: C.muted, flexShrink: 0 }} />
  </button>
);

export default function Settings() {
  const { language, changeLanguage } = useLanguage();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // ✅ FIXED: Lazy initialize state - reads from localStorage once
  // No useEffect needed! This runs once when the component mounts.
  const getInitialSettings = () => {
    const defaultSettings = {
      language: language || "en",
      notifications: true,
      darkMode: false,
      autoSave: true,
      emailNotifications: true,
      soundEffects: true,
      dataSaver: false,
    };

    try {
      const saved = localStorage.getItem("userSettings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
    } catch (err) {
      console.error("Failed to parse settings", err);
    }

    return defaultSettings;
  };

  // ✅ FIXED: Initialize state with lazy function
  const [settings, setSettings] = useState(getInitialSettings);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLanguageChange = (lang) => {
    setSettings((prev) => ({ ...prev, language: lang }));
    changeLanguage(lang);
    showToast(`Language changed to ${lang.toUpperCase()}`, "success");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("userSettings", JSON.stringify(settings));
      await new Promise((resolve) => setTimeout(resolve, 500));
      showToast("Settings saved successfully!", "success");
    } catch (err) {
      console.error("Failed to save settings", err);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 900,
              color: C.dark,
              fontFamily: F.serif,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FiSettings size={24} color={C.primary} />
            Settings
          </h1>
          <p
            style={{
              fontSize: "clamp(11px, 3vw, 13px)",
              color: C.muted,
              marginTop: 4,
              fontFamily: F.sans,
            }}
          >
            Customize your application preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...btn.primary,
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          <FiSave size={16} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Main Settings Card */}
      <div style={card}>
        {/* Language Section */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 20,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.dark,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiGlobe size={18} color={C.primary} />
            Language Preferences
          </h3>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {[
              { code: "en", label: "English", flag: "🇬🇧" },
              { code: "am", label: "አማርኛ", flag: "🇪🇹" },
              { code: "om", label: "Afaan Oromo", flag: "🇪🇹" },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  padding: "8px 16px",
                  background:
                    settings.language === lang.code ? C.primary : C.bg,
                  color: settings.language === lang.code ? "#fff" : C.dark,
                  border: `1px solid ${
                    settings.language === lang.code ? C.primary : C.border
                  }`,
                  borderRadius: radius.md,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: settings.language === lang.code ? 700 : 500,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (settings.language !== lang.code) {
                    e.currentTarget.style.background = C.gray;
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.language !== lang.code) {
                    e.currentTarget.style.background = C.bg;
                  }
                }}
              >
                <span>{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Section */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 20,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.dark,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiBell size={18} color={C.primary} />
            Notifications
          </h3>
          <SettingToggle
            label="Push Notifications"
            description="Receive notifications about important updates"
            icon={<FiBell size={18} />}
            value={settings.notifications}
            onToggle={() => handleToggle("notifications")}
          />
          <SettingToggle
            label="Email Notifications"
            description="Get updates via email"
            icon={<FiMail size={18} />}
            value={settings.emailNotifications}
            onToggle={() => handleToggle("emailNotifications")}
          />
        </div>

        {/* Preferences Section */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 20,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.dark,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiSettings size={18} color={C.primary} />
            Preferences
          </h3>
          <SettingToggle
            label="Dark Mode"
            description="Switch to dark theme"
            icon={<FiMoon size={18} />}
            value={settings.darkMode}
            onToggle={() => handleToggle("darkMode")}
          />
          <SettingToggle
            label="Auto Save"
            description="Automatically save your work"
            icon={<FiSave size={18} />}
            value={settings.autoSave}
            onToggle={() => handleToggle("autoSave")}
          />
          <SettingToggle
            label="Sound Effects"
            description="Play sounds for notifications"
            icon={<FiVolume2 size={18} />}
            value={settings.soundEffects}
            onToggle={() => handleToggle("soundEffects")}
          />
          <SettingToggle
            label="Data Saver"
            description="Reduce data usage"
            icon={<FiRadio size={18} />}
            value={settings.dataSaver}
            onToggle={() => handleToggle("dataSaver")}
          />
        </div>

        {/* Saved Indicator */}
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: "#f0fdf4",
            borderRadius: radius.md,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiCheckCircle size={18} color="#22c55e" />
          <span style={{ fontSize: 13, color: "#166534" }}>
            Your preferences are saved locally
          </span>
        </div>
      </div>

      {/* Security Section */}
      <div style={{ ...card, marginTop: 20 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.dark,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FiLock size={18} color={C.primary} />
          Security
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <SecurityItem
            icon={<FiKey size={18} />}
            label="Change Password"
            description="Update your password"
            onClick={() => showToast("Password change coming soon", "info")}
          />
          <SecurityItem
            icon={<FiShield size={18} />}
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
            onClick={() => showToast("2FA coming soon", "info")}
          />
          <SecurityItem
            icon={<FiTrash2 size={18} />}
            label="Delete Account"
            description="Permanently delete your account"
            danger
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete your account? This action cannot be undone!",
                )
              ) {
                showToast("Account deletion requested", "warning");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
