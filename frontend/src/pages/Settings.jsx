// frontend/src/pages/Settings.jsx
import { useState } from "react";
import { C, F, btn, card } from "../styles/theme";
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
} from "react-icons/fi";

// ✅ Move SettingToggle outside of the component (fixes the "created during render" error)
const SettingToggle = ({
  label,
  description,
  settingKey,
  icon,
  value,
  onToggle,
}) => (
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
      <span style={{ color: C.primary, fontSize: 20 }}>{icon}</span>
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
      onClick={() => onToggle(settingKey)}
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
      }}
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

// eslint-disable-next-line no-unused-vars
export default function Settings({ t }) {
  const { language, changeLanguage } = useLanguage();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    language: language || "en",
    notifications: true,
    darkMode: false,
    autoSave: true,
    emailNotifications: true,
  });

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
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
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

      <div style={card}>
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
            marginBottom: 24,
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
                  settings.language === lang.code ? C.primary : "#f3f4f6",
                color: settings.language === lang.code ? "#fff" : C.dark,
                border: `1px solid ${
                  settings.language === lang.code ? C.primary : C.border
                }`,
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: settings.language === lang.code ? 700 : 500,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>

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
          settingKey="notifications"
          icon={<FiBell size={18} />}
          value={settings.notifications}
          onToggle={handleToggle}
        />
        <SettingToggle
          label="Email Notifications"
          description="Get updates via email"
          settingKey="emailNotifications"
          icon={<FiMail size={18} />}
          value={settings.emailNotifications}
          onToggle={handleToggle}
        />

        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.dark,
            marginTop: 24,
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
          description="Toggle dark theme (coming soon)"
          settingKey="darkMode"
          icon={<FiMoon size={18} />}
          value={settings.darkMode}
          onToggle={handleToggle}
        />
        <SettingToggle
          label="Auto Save"
          description="Automatically save your work"
          settingKey="autoSave"
          icon={<FiSave size={18} />}
          value={settings.autoSave}
          onToggle={handleToggle}
        />

        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: "#f0fdf4",
            borderRadius: 8,
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
          <button
            style={{
              padding: "12px 16px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>
              Change Password
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Update your password
            </div>
          </button>
          <button
            style={{
              padding: "12px 16px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>
              Two-Factor Authentication
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Add an extra layer of security
            </div>
          </button>
          <button
            style={{
              padding: "12px 16px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontWeight: 600, color: "#ef4444", fontSize: 14 }}>
              Delete Account
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Permanently delete your account
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
