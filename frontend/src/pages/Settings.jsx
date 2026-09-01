// frontend/src/pages/Settings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { C, F } from "../styles/theme";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../hooks/useLanguage";
import {
  FiSettings,
  FiGlobe,
  FiBell,
  FiMoon,
  FiSun,
  FiMonitor,
  FiMail,
  FiMessageSquare,
  FiLock,
  FiCheckCircle,
  FiSave,
  FiVolume2,
  FiRadio,
  FiKey,
  FiShield,
  FiTrash2,
  FiChevronRight,
  FiChevronDown,
  FiUser,
  FiType,
  FiDroplet,
  FiLayers,
  FiHardDrive,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiSmartphone,
  FiLogOut,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiHelpCircle,
  FiAlertTriangle,
  FiClock,
  FiActivity,
  FiSearch,
  FiCopy,
  FiCheck,
  FiX,
  FiRotateCcw,
  FiCamera,
} from "react-icons/fi";
import "./Settings.css";

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const STORAGE_KEY = "userSettings";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "am", label: "አማርኛ", flag: "🇪🇹" },
  { code: "om", label: "Afaan Oromo", flag: "🇪🇹" },
];

const TIMEZONES = [
  { id: "Africa/Addis_Ababa", label: "East Africa Time — Addis Ababa (UTC+3)" },
  { id: "UTC", label: "Coordinated Universal Time (UTC)" },
  { id: "Europe/London", label: "London (UTC+0/+1)" },
  { id: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { id: "America/New_York", label: "New York (UTC-5/-4)" },
];

const DATE_FORMATS = [
  { id: "DD/MM/YYYY", label: "31/12/2026" },
  { id: "MM/DD/YYYY", label: "12/31/2026" },
  { id: "YYYY-MM-DD", label: "2026-12-31" },
];

const DEPARTMENTS = [
  "Administration",
  "Service Delivery",
  "IT & Systems",
  "Customer Relations",
  "Finance",
  "Human Resources",
];

const DIGEST_OPTIONS = [
  { id: "immediate", label: "Immediately" },
  { id: "daily", label: "Daily digest" },
  { id: "weekly", label: "Weekly digest" },
  { id: "off", label: "Don't send a digest" },
];

const SOUND_OPTIONS = [
  { id: "chime", label: "Chime" },
  { id: "ping", label: "Ping" },
  { id: "none", label: "Silent" },
];

const ACCENT_OPTIONS = [
  { id: "primary", label: "Institutional green", value: null },
  { id: "gold", label: "Gold", value: "#C25A00" },
  { id: "red", label: "Red", value: "#B3352C" },
  { id: "blue", label: "Blue", value: "#2E5FA3" },
  { id: "purple", label: "Purple", value: "#6B4FA0" },
];

const FONT_SIZES = [
  { id: "small", label: "Small", scale: 0.92 },
  { id: "medium", label: "Medium", scale: 1 },
  { id: "large", label: "Large", scale: 1.1 },
];

const FONT_FAMILIES = [
  { id: "sans", label: "Sans-serif" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Monospace" },
];

const TABS = [
  {
    id: "profile",
    label: "Profile",
    icon: <FiUser size={17} />,
    keywords: "name email phone bio avatar photo picture job title department",
  },
  {
    id: "language",
    label: "Language & Region",
    icon: <FiGlobe size={17} />,
    keywords: "language timezone date format region time zone week",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <FiBell size={17} />,
    keywords: "notifications email sms push alerts quiet hours digest sound",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: <FiDroplet size={17} />,
    keywords:
      "theme dark light mode accent color font size density motion contrast",
  },
  {
    id: "security",
    label: "Privacy & Security",
    icon: <FiLock size={17} />,
    keywords:
      "password two factor authentication 2fa sessions devices delete account backup codes",
  },
  {
    id: "activity",
    label: "Activity Log",
    icon: <FiActivity size={17} />,
    keywords: "activity log history sign in events",
  },
  {
    id: "data",
    label: "Data & Storage",
    icon: <FiHardDrive size={17} />,
    keywords: "storage cache export import data saver autosave backup",
  },
  {
    id: "about",
    label: "About",
    icon: <FiInfo size={17} />,
    keywords: "about version support update reset",
  },
];

const DEFAULT_SETTINGS = {
  language: "en",
  timezone: "Africa/Addis_Ababa",
  dateFormat: "DD/MM/YYYY",
  firstDayOfWeek: "mon",
  profile: {
    name: "",
    email: "",
    phone: "",
    bio: "",
    jobTitle: "",
    department: "",
    avatar: null,
    profileVisible: true,
  },
  notifications: true,
  emailNotifications: true,
  smsNotifications: false,
  notifySystemAlerts: true,
  notifyServiceRequests: true,
  notifyTeamUpdates: true,
  digestFrequency: "immediate",
  notificationSound: "chime",
  quietHoursEnabled: false,
  quietStart: "21:00",
  quietEnd: "07:00",
  themeMode: "light", // 'light' | 'dark' | 'system'
  accentColor: null,
  fontSize: "medium",
  fontFamily: "sans",
  compactDensity: false,
  reduceMotion: false,
  highContrast: false,
  autoSave: true,
  soundEffects: true,
  dataSaver: false,
  loginAlerts: true,
  twoFactorEnabled: false,
  backupCodes: [],
};

const MOCK_SESSIONS = [
  {
    id: 1,
    device: "Chrome on Windows",
    icon: <FiMonitor size={16} />,
    location: "Addis Ababa, Ethiopia",
    lastActive: "Active now",
    current: true,
  },
  {
    id: 2,
    device: "Safari on iPhone",
    icon: <FiSmartphone size={16} />,
    location: "Addis Ababa, Ethiopia",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: 3,
    device: "Chrome on Android",
    icon: <FiSmartphone size={16} />,
    location: "Adama, Ethiopia",
    lastActive: "3 days ago",
    current: false,
  },
];

const ACTIVITY_LOG = [
  {
    id: 1,
    type: "security",
    message: "Signed in from Chrome on Windows",
    time: "Today, 09:12",
  },
  {
    id: 2,
    type: "profile",
    message: "Updated phone number",
    time: "Yesterday, 17:40",
  },
  { id: 3, type: "security", message: "Password changed", time: "3 days ago" },
  {
    id: 4,
    type: "settings",
    message: "Enabled email notifications",
    time: "1 week ago",
  },
  {
    id: 5,
    type: "security",
    message: "New sign-in from Adama, Ethiopia",
    time: "2 weeks ago",
  },
  {
    id: 6,
    type: "profile",
    message: "Updated profile bio",
    time: "3 weeks ago",
  },
];

const ACTIVITY_ICONS = {
  security: <FiShield size={14} />,
  profile: <FiUser size={14} />,
  settings: <FiSettings size={14} />,
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function readStoredSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
      };
    }
  } catch (err) {
    console.error("Failed to parse settings", err);
  }
  return DEFAULT_SETTINGS;
}

// Rough but real: sums the UTF-16 byte size of every localStorage entry.
function getStorageBreakdownKB() {
  const breakdown = {};
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const size = (localStorage[key].length + key.length) * 2;
      total += size;
      const bucket = key.split(/[:_]/)[0] || key;
      breakdown[bucket] = (breakdown[bucket] || 0) + size;
    }
  }
  return { total: total / 1024, breakdown };
}

const initials = (name) =>
  name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "?";

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
  return { score, label: labels[score] };
}

function generateSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return Array.from(
    { length: 32 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const a = Math.random().toString(36).slice(2, 6).toUpperCase();
    const b = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${a}-${b}`;
  });
}

async function copyToClipboard(
  text,
  showToast,
  message = "Copied to clipboard",
) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message, "success");
  } catch {
    showToast("Couldn't copy — select and copy manually", "error");
  }
}

// ---------------------------------------------------------------------------
// Reusable pieces
// ---------------------------------------------------------------------------

const SectionHeader = ({ icon, title, description, action }) => (
  <div className="s-section-header">
    <div className="s-section-header-main">
      <span className="s-section-icon">{icon}</span>
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
    {action}
  </div>
);

const Panel = ({ id, children }) => (
  <section className="s-panel" id={id ? `panel-${id}` : undefined}>
    {children}
  </section>
);

const Row = ({ icon, label, description, children, last = false }) => (
  <div className={`s-row${last ? " s-row-last" : ""}`}>
    <div className="s-row-main">
      {icon && <span className="s-row-icon">{icon}</span>}
      <div>
        <div className="s-row-label">{label}</div>
        {description && <div className="s-row-desc">{description}</div>}
      </div>
    </div>
    <div className="s-row-control">{children}</div>
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    className={`s-switch${checked ? " is-on" : ""}`}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
  >
    <span className="s-switch-knob" />
  </button>
);

const SelectField = ({ value, onChange, options, ariaLabel }) => (
  <div className="s-select-wrap">
    <select
      className="s-select"
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
    >
      {options.map((opt) => (
        <option key={opt.id || opt} value={opt.id || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
    <FiChevronDown size={14} className="s-select-caret" />
  </div>
);

const SegmentedControl = ({ options, value, onChange }) => (
  <div className="s-segmented">
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        className={`s-segmented-btn${value === opt.id ? " is-active" : ""}`}
        onClick={() => onChange(opt.id)}
      >
        {opt.icon}
        {opt.label}
      </button>
    ))}
  </div>
);

const TextField = ({ label, hint, ...inputProps }) => (
  <div className="s-field">
    <label className="s-field-label">{label}</label>
    <input className="s-input" {...inputProps} />
    {hint && <div className="s-field-hint">{hint}</div>}
  </div>
);

const Modal = ({ title, onClose, children, footer, wide = false }) => (
  <div
    className="s-modal-overlay"
    onMouseDown={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className={`s-modal${wide ? " s-modal-wide" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="s-modal-header">
        <h3>{title}</h3>
        <button className="s-icon-btn" onClick={onClose} aria-label="Close">
          <FiX size={18} />
        </button>
      </div>
      <div className="s-modal-body">{children}</div>
      {footer && <div className="s-modal-footer">{footer}</div>}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Settings() {
  const { language, changeLanguage } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [settings, setSettings] = useState(() => {
    const initial = readStoredSettings();
    return { ...initial, language: language || initial.language };
  });
  const [lastSaved, setLastSaved] = useState(settings);
  const [preResetSnapshot, setPreResetSnapshot] = useState(null);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(lastSaved),
    [settings, lastSaved],
  );

  // ---- security tab state ----
  const [activeSecurityPanel, setActiveSecurityPanel] = useState(null); // null | 'password' | 'sessions'
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [twoFAModalOpen, setTwoFAModalOpen] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(1);
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [pendingBackupCodes, setPendingBackupCodes] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ---- activity log filter ----
  const [activityFilter, setActivityFilter] = useState("all");

  // ---- storage ----
  const [
    { total: storageUsageKB, breakdown: storageBreakdown },
    setStorageStats,
  ] = useState(getStorageBreakdownKB());
  const importInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // ---- resolved theme (supports 'system') ----
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e) => setSystemPrefersDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const isDark =
    settings.themeMode === "dark" ||
    (settings.themeMode === "system" && systemPrefersDark);

  const accent =
    ACCENT_OPTIONS.find((a) => a.id === settings.accentColor)?.value ||
    C.primary;

  const fontFamilyValue =
    settings.fontFamily === "serif"
      ? F.serif
      : settings.fontFamily === "mono"
        ? "'Courier New', monospace"
        : F.sans;

  const cssVars = {
    "--s-bg": isDark ? "#0b0d10" : "#F3F5F4",
    "--s-surface": isDark ? "#15181d" : "#FFFFFF",
    "--s-surface-2": isDark ? "#1c2027" : "#EAEDEB",
    "--s-border": isDark ? "#272c34" : "#E1E5E2",
    "--s-text": isDark ? "#F2F4F3" : "#16211C",
    "--s-muted": isDark ? "#8B93A0" : "#5B675F",
    "--s-accent": accent,
    "--s-accent-soft": `${accent}1F`,
    "--s-danger": "#B3352C",
    "--s-gold": "#C25A00",
    "--s-radius": settings.highContrast ? "4px" : "10px",
    "--s-font-serif": F.serif,
    "--s-font-body": fontFamilyValue,
    "--s-pad": settings.compactDensity ? "10px" : "16px",
    "--s-motion": settings.reduceMotion ? "0s" : "0.18s",
    "--s-border-w": settings.highContrast ? "2px" : "1px",
  };

  const fontScale =
    FONT_SIZES.find((f) => f.id === settings.fontSize)?.scale || 1;

  // ---- generic setters ----
  const setField = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));
  const setProfileField = (key, value) =>
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, [key]: value },
    }));
  const handleToggle = (key) => setField(key, !settings[key]);

  const handleLanguageChange = (lang) => {
    setField("language", lang);
    changeLanguage(lang);
    showToast(`Language changed to ${lang.toUpperCase()}`, "success");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      await new Promise((resolve) => setTimeout(resolve, 350));
      setLastSaved(settings);
      setStorageStats(getStorageBreakdownKB());
      showToast("Settings saved successfully!", "success");
    } catch (err) {
      console.error("Failed to save settings", err);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // ---- unsaved-changes guard ----
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ---- Ctrl/Cmd+S to save ----
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && !saving) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, saving, settings]);

  const handleDiscard = () => {
    setSettings(lastSaved);
    showToast("Changes discarded", "info");
  };

  const handleResetDefaults = () => {
    if (!window.confirm("Reset all settings to their defaults?")) return;
    setPreResetSnapshot(settings);
    setSettings({ ...DEFAULT_SETTINGS, language: settings.language });
    showToast("Settings reset to defaults — click Save to apply", "info");
  };

  const handleUndoReset = () => {
    if (!preResetSnapshot) return;
    setSettings(preResetSnapshot);
    setPreResetSnapshot(null);
    showToast("Reset undone", "success");
  };

  // ---- profile: avatar upload ----
  const handleAvatarPick = () => avatarInputRef.current?.click();
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be smaller than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileField("avatar", reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleRemoveAvatar = () => setProfileField("avatar", null);

  // ---- security tab actions ----
  const passwordStrength = getPasswordStrength(passwordForm.next);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      showToast("Fill in all password fields", "error");
      return;
    }
    if (passwordForm.next.length < 8) {
      showToast("New password must be at least 8 characters", "error");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showToast("New passwords do not match", "error");
      return;
    }
    // No backend endpoint is wired in these files yet — this validates the
    // form end-to-end and is ready to call something like
    // authAPI.changePassword(passwordForm) once that exists.
    showToast("Password updated", "success");
    setPasswordForm({ current: "", next: "", confirm: "" });
    setActiveSecurityPanel(null);
  };

  const handleSignOutSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast("Session signed out", "success");
  };

  const handleSignOutAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    showToast("Signed out of all other sessions", "success");
  };

  const openTwoFactorSetup = () => {
    setTwoFASecret(generateSecret());
    setTwoFACode("");
    setTwoFAStep(1);
    setTwoFAModalOpen(true);
  };

  const handleTwoFactorVerify = () => {
    if (!/^\d{6}$/.test(twoFACode)) {
      showToast("Enter the 6-digit code from your authenticator app", "error");
      return;
    }
    const codes = generateBackupCodes();
    setPendingBackupCodes(codes);
    setTwoFAStep(3);
  };

  const finishTwoFactorSetup = () => {
    setField("twoFactorEnabled", true);
    setField("backupCodes", pendingBackupCodes);
    setTwoFAModalOpen(false);
    showToast("Two-factor authentication enabled", "success");
  };

  const handleDisableTwoFactor = () => {
    if (!window.confirm("Turn off two-factor authentication?")) return;
    setField("twoFactorEnabled", false);
    setField("backupCodes", []);
    showToast("Two-factor authentication disabled", "info");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
    showToast("Account deletion requested", "warning");
  };

  // ---- data tab actions ----
  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "amesob-settings-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Settings exported", "success");
  };

  const handleImportClick = () => importInputRef.current?.click();
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
        });
        showToast("Settings imported — click Save to apply", "success");
      } catch {
        showToast("That file isn't valid settings JSON", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearCache = () => {
    if (!window.confirm("Clear cached data? Your saved settings are kept."))
      return;
    Object.keys(localStorage).forEach((key) => {
      if (key !== STORAGE_KEY) localStorage.removeItem(key);
    });
    setStorageStats(getStorageBreakdownKB());
    showToast("Cache cleared", "success");
  };

  // ---------------------------------------------------------------------
  // Tab content
  // ---------------------------------------------------------------------

  const renderProfile = () => (
    <Panel id="profile">
      <SectionHeader
        icon={<FiUser size={18} />}
        title="Profile"
        description="This information is shown to your teammates."
      />

      <div className="s-avatar-block">
        <div
          className="s-avatar"
          style={{
            background: settings.profile.avatar
              ? "transparent"
              : `linear-gradient(135deg, var(--s-accent), var(--s-accent) 60%, var(--s-gold))`,
          }}
        >
          {settings.profile.avatar ? (
            <img src={settings.profile.avatar} alt="Your avatar" />
          ) : (
            initials(settings.profile.name)
          )}
        </div>
        <div className="s-avatar-actions">
          <button className="s-btn s-btn-quiet" onClick={handleAvatarPick}>
            <FiCamera size={14} /> Upload photo
          </button>
          {settings.profile.avatar && (
            <button className="s-btn s-btn-text" onClick={handleRemoveAvatar}>
              Remove
            </button>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
          <div className="s-field-hint">JPG or PNG, up to 2MB.</div>
        </div>
      </div>

      <div className="s-field-grid">
        <TextField
          label="Full Name"
          value={settings.profile.name}
          onChange={(e) => setProfileField("name", e.target.value)}
          placeholder="e.g., Gezagn Bekele"
        />
        <TextField
          label="Job Title"
          value={settings.profile.jobTitle}
          onChange={(e) => setProfileField("jobTitle", e.target.value)}
          placeholder="e.g., Service Desk Lead"
        />
        <TextField
          label="Email"
          type="email"
          value={settings.profile.email}
          onChange={(e) => setProfileField("email", e.target.value)}
          placeholder="you@amesob.gov.et"
        />
        <TextField
          label="Phone"
          type="tel"
          value={settings.profile.phone}
          onChange={(e) => setProfileField("phone", e.target.value)}
          placeholder="+251 9xx xxx xxx"
        />
      </div>

      <div className="s-field">
        <label className="s-field-label">Department</label>
        <SelectField
          value={settings.profile.department}
          onChange={(e) => setProfileField("department", e.target.value)}
          options={[
            { id: "", label: "Select a department" },
            ...DEPARTMENTS.map((d) => ({ id: d, label: d })),
          ]}
          ariaLabel="Department"
        />
      </div>

      <div className="s-field">
        <div className="s-field-label-row">
          <label className="s-field-label">Bio</label>
          <span className="s-field-hint">
            {settings.profile.bio.length}/200
          </span>
        </div>
        <textarea
          className="s-textarea"
          value={settings.profile.bio}
          maxLength={200}
          onChange={(e) => setProfileField("bio", e.target.value)}
          placeholder="A short line about your role"
          rows={3}
        />
      </div>

      <Row
        icon={<FiUser size={18} />}
        label="Show profile to teammates"
        description="Other staff can see your name, title, and department"
        last
      >
        <Toggle
          checked={settings.profile.profileVisible}
          onChange={() =>
            setProfileField("profileVisible", !settings.profile.profileVisible)
          }
          label="Show profile to teammates"
        />
      </Row>
    </Panel>
  );

  const renderLanguage = () => (
    <Panel id="language">
      <SectionHeader
        icon={<FiGlobe size={18} />}
        title="Language & Region"
        description="Choose the language and formats used across the dashboard."
      />

      <div className="s-lang-grid">
        {LANGUAGES.map((lang) => {
          const isActive = settings.language === lang.code;
          return (
            <button
              key={lang.code}
              className={`s-lang-btn${isActive ? " is-active" : ""}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          );
        })}
      </div>

      <Row
        icon={<FiClock size={18} />}
        label="Time zone"
        description="Used for timestamps across the dashboard"
      >
        <SelectField
          value={settings.timezone}
          onChange={(e) => setField("timezone", e.target.value)}
          options={TIMEZONES}
          ariaLabel="Time zone"
        />
      </Row>
      <Row
        icon={<FiActivity size={18} />}
        label="Date format"
        description="How dates are displayed"
      >
        <SelectField
          value={settings.dateFormat}
          onChange={(e) => setField("dateFormat", e.target.value)}
          options={DATE_FORMATS}
          ariaLabel="Date format"
        />
      </Row>
      <Row
        icon={<FiGlobe size={18} />}
        label="First day of week"
        description="Used in calendars and schedules"
        last
      >
        <SegmentedControl
          options={[
            { id: "mon", label: "Monday" },
            { id: "sun", label: "Sunday" },
          ]}
          value={settings.firstDayOfWeek}
          onChange={(v) => setField("firstDayOfWeek", v)}
        />
      </Row>
    </Panel>
  );

  const renderNotifications = () => (
    <Panel id="notifications">
      <SectionHeader
        icon={<FiBell size={18} />}
        title="Notifications"
        description="Choose how and when you want to hear about updates."
      />
      <Row
        icon={<FiBell size={18} />}
        label="Push Notifications"
        description="In-app notifications about important updates"
      >
        <Toggle
          checked={settings.notifications}
          onChange={() => handleToggle("notifications")}
          label="Push notifications"
        />
      </Row>
      <Row
        icon={<FiMail size={18} />}
        label="Email Notifications"
        description="Get updates via email"
      >
        <Toggle
          checked={settings.emailNotifications}
          onChange={() => handleToggle("emailNotifications")}
          label="Email notifications"
        />
      </Row>
      <Row
        icon={<FiMessageSquare size={18} />}
        label="SMS Notifications"
        description="Get critical alerts by text message"
        last
      >
        <Toggle
          checked={settings.smsNotifications}
          onChange={() => handleToggle("smsNotifications")}
          label="SMS notifications"
        />
      </Row>

      <div className="s-subheading">Notify me about</div>
      <Row
        icon={<FiAlertTriangle size={18} />}
        label="System Alerts"
        description="Downtime, maintenance, and security notices"
      >
        <Toggle
          checked={settings.notifySystemAlerts}
          onChange={() => handleToggle("notifySystemAlerts")}
          label="System alerts"
        />
      </Row>
      <Row
        icon={<FiActivity size={18} />}
        label="Service Requests"
        description="New or updated citizen service requests"
      >
        <Toggle
          checked={settings.notifyServiceRequests}
          onChange={() => handleToggle("notifyServiceRequests")}
          label="Service requests"
        />
      </Row>
      <Row
        icon={<FiUser size={18} />}
        label="Team Updates"
        description="Changes to teams, leaders, and members"
        last
      >
        <Toggle
          checked={settings.notifyTeamUpdates}
          onChange={() => handleToggle("notifyTeamUpdates")}
          label="Team updates"
        />
      </Row>

      <div className="s-subheading">Delivery</div>
      <Row
        icon={<FiClock size={18} />}
        label="Digest frequency"
        description="How often batched notifications are sent"
      >
        <SelectField
          value={settings.digestFrequency}
          onChange={(e) => setField("digestFrequency", e.target.value)}
          options={DIGEST_OPTIONS}
          ariaLabel="Digest frequency"
        />
      </Row>
      <Row
        icon={<FiVolume2 size={18} />}
        label="Notification sound"
        description="Plays when a push notification arrives"
      >
        <SelectField
          value={settings.notificationSound}
          onChange={(e) => setField("notificationSound", e.target.value)}
          options={SOUND_OPTIONS}
          ariaLabel="Notification sound"
        />
      </Row>
      <Row
        icon={<FiMoon size={18} />}
        label="Quiet hours"
        description="Pause non-urgent alerts during set hours"
      >
        <Toggle
          checked={settings.quietHoursEnabled}
          onChange={() => handleToggle("quietHoursEnabled")}
          label="Quiet hours"
        />
      </Row>
      {settings.quietHoursEnabled && (
        <Row
          icon={<FiClock size={18} />}
          label="Quiet hours window"
          description="Alerts are held and delivered after this window"
          last
        >
          <div className="s-time-range">
            <input
              type="time"
              className="s-input s-input-time"
              value={settings.quietStart}
              onChange={(e) => setField("quietStart", e.target.value)}
              aria-label="Quiet hours start"
            />
            <span>to</span>
            <input
              type="time"
              className="s-input s-input-time"
              value={settings.quietEnd}
              onChange={(e) => setField("quietEnd", e.target.value)}
              aria-label="Quiet hours end"
            />
          </div>
        </Row>
      )}
    </Panel>
  );

  const renderAppearance = () => (
    <>
      <Panel id="appearance">
        <SectionHeader
          icon={isDark ? <FiMoon size={18} /> : <FiSun size={18} />}
          title="Appearance"
          description="Changes preview live on this page."
        />

        <Row
          icon={isDark ? <FiMoon size={18} /> : <FiSun size={18} />}
          label="Theme"
          description="Match your system, or pick one"
        >
          <SegmentedControl
            options={[
              { id: "light", label: "Light", icon: <FiSun size={14} /> },
              { id: "dark", label: "Dark", icon: <FiMoon size={14} /> },
              { id: "system", label: "System", icon: <FiMonitor size={14} /> },
            ]}
            value={settings.themeMode}
            onChange={(v) => setField("themeMode", v)}
          />
        </Row>

        <Row
          icon={<FiLayers size={18} />}
          label="Compact Density"
          description="Tighter spacing, more on screen"
        >
          <Toggle
            checked={settings.compactDensity}
            onChange={() => handleToggle("compactDensity")}
            label="Compact density"
          />
        </Row>

        <Row
          icon={<FiEye size={18} />}
          label="Reduce motion"
          description="Minimize animations and transitions"
        >
          <Toggle
            checked={settings.reduceMotion}
            onChange={() => handleToggle("reduceMotion")}
            label="Reduce motion"
          />
        </Row>

        <Row
          icon={<FiDroplet size={18} />}
          label="High contrast"
          description="Sharper borders and stronger contrast"
          last
        >
          <Toggle
            checked={settings.highContrast}
            onChange={() => handleToggle("highContrast")}
            label="High contrast"
          />
        </Row>

        <div className="s-subheading">Text</div>
        <Row
          icon={<FiType size={18} />}
          label="Text size"
          description="Scales the settings page content"
        >
          <SegmentedControl
            options={FONT_SIZES.map((f) => ({ id: f.id, label: f.label }))}
            value={settings.fontSize}
            onChange={(v) => setField("fontSize", v)}
          />
        </Row>
        <Row
          icon={<FiType size={18} />}
          label="Font family"
          description="Applies to this settings page"
          last
        >
          <SelectField
            value={settings.fontFamily}
            onChange={(e) => setField("fontFamily", e.target.value)}
            options={FONT_FAMILIES}
            ariaLabel="Font family"
          />
        </Row>

        <div className="s-subheading">Accent color</div>
        <div className="s-swatch-row">
          {ACCENT_OPTIONS.map((opt) => {
            const isActive =
              (settings.accentColor || null) ===
              (opt.id === "primary" ? null : opt.id);
            const swatch = opt.value || C.primary;
            return (
              <button
                key={opt.id}
                title={opt.label}
                className={`s-swatch${isActive ? " is-active" : ""}`}
                style={{ background: swatch }}
                onClick={() =>
                  setField("accentColor", opt.id === "primary" ? null : opt.id)
                }
                aria-label={opt.label}
                aria-pressed={isActive}
              />
            );
          })}
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          icon={<FiSettings size={18} />}
          title="General Preferences"
        />
        <Row
          icon={<FiVolume2 size={18} />}
          label="Sound Effects"
          description="Play sounds for in-app interactions"
          last
        >
          <Toggle
            checked={settings.soundEffects}
            onChange={() => handleToggle("soundEffects")}
            label="Sound effects"
          />
        </Row>
      </Panel>
    </>
  );

  const renderSecurity = () => (
    <>
      <Panel id="security">
        <SectionHeader icon={<FiLock size={18} />} title="Privacy & Security" />

        <Row
          icon={<FiShield size={18} />}
          label="Two-Factor Authentication"
          description={
            settings.twoFactorEnabled
              ? `Enabled — ${settings.backupCodes.length} backup codes remaining`
              : "Require a code in addition to your password"
          }
        >
          {settings.twoFactorEnabled ? (
            <button
              className="s-btn s-btn-quiet"
              onClick={handleDisableTwoFactor}
            >
              Turn off
            </button>
          ) : (
            <button
              className="s-btn s-btn-primary"
              onClick={openTwoFactorSetup}
            >
              Set up
            </button>
          )}
        </Row>
        <Row
          icon={<FiAlertTriangle size={18} />}
          label="Login Alerts"
          description="Email me when there's a new sign-in"
          last
        >
          <Toggle
            checked={settings.loginAlerts}
            onChange={() => handleToggle("loginAlerts")}
            label="Login alerts"
          />
        </Row>

        <div className="s-quick-grid">
          <button
            className={`s-quick-item${activeSecurityPanel === "password" ? " is-active" : ""}`}
            onClick={() =>
              setActiveSecurityPanel((p) =>
                p === "password" ? null : "password",
              )
            }
          >
            <FiKey size={18} />
            <div>
              <div className="s-quick-title">Change Password</div>
              <div className="s-quick-desc">Update your account password</div>
            </div>
            <FiChevronRight className="s-quick-chevron" />
          </button>
          <button
            className={`s-quick-item${activeSecurityPanel === "sessions" ? " is-active" : ""}`}
            onClick={() =>
              setActiveSecurityPanel((p) =>
                p === "sessions" ? null : "sessions",
              )
            }
          >
            <FiClock size={18} />
            <div>
              <div className="s-quick-title">Active Sessions</div>
              <div className="s-quick-desc">
                {sessions.length} device{sessions.length === 1 ? "" : "s"}{" "}
                signed in
              </div>
            </div>
            <FiChevronRight className="s-quick-chevron" />
          </button>
          <button
            className="s-quick-item s-quick-danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            <FiTrash2 size={18} />
            <div>
              <div className="s-quick-title">Delete Account</div>
              <div className="s-quick-desc">
                Permanently delete your account
              </div>
            </div>
            <FiChevronRight className="s-quick-chevron" />
          </button>
        </div>

        {activeSecurityPanel === "password" && (
          <form onSubmit={handlePasswordSubmit} className="s-expand">
            {[
              { key: "current", label: "Current Password" },
              { key: "next", label: "New Password" },
              { key: "confirm", label: "Confirm New Password" },
            ].map(({ key, label }) => (
              <div key={key} className="s-field">
                <label className="s-field-label">{label}</label>
                <div className="s-input-icon-wrap">
                  <input
                    type={showPw[key] ? "text" : "password"}
                    className="s-input"
                    value={passwordForm[key]}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="s-input-icon-btn"
                    onClick={() =>
                      setShowPw((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    aria-label={showPw[key] ? "Hide password" : "Show password"}
                  >
                    {showPw[key] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {key === "next" && passwordForm.next && (
                  <div className="s-strength">
                    <div className="s-strength-bar">
                      <div
                        className="s-strength-fill"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                        data-level={passwordStrength.score}
                      />
                    </div>
                    <span>{passwordStrength.label}</span>
                  </div>
                )}
              </div>
            ))}
            <div className="s-form-actions">
              <button
                type="button"
                className="s-btn s-btn-quiet"
                onClick={() => {
                  setActiveSecurityPanel(null);
                  setPasswordForm({ current: "", next: "", confirm: "" });
                }}
              >
                Cancel
              </button>
              <button type="submit" className="s-btn s-btn-primary">
                Update Password
              </button>
            </div>
          </form>
        )}

        {activeSecurityPanel === "sessions" && (
          <div className="s-expand">
            <div className="s-session-list">
              {sessions.map((s) => (
                <div key={s.id} className="s-session">
                  <span className="s-row-icon">{s.icon}</span>
                  <div className="s-session-main">
                    <div className="s-row-label">
                      {s.device}{" "}
                      {s.current && (
                        <span className="s-badge">This device</span>
                      )}
                    </div>
                    <div className="s-row-desc">
                      {s.location} • {s.lastActive}
                    </div>
                  </div>
                  {!s.current && (
                    <button
                      className="s-btn s-btn-danger-outline"
                      onClick={() => handleSignOutSession(s.id)}
                    >
                      <FiLogOut size={13} /> Sign out
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sessions.length > 1 && (
              <button
                className="s-btn s-btn-text s-danger-text"
                onClick={handleSignOutAllOtherSessions}
              >
                Sign out of all other sessions
              </button>
            )}
          </div>
        )}
      </Panel>

      {settings.twoFactorEnabled && settings.backupCodes.length > 0 && (
        <Panel>
          <SectionHeader
            icon={<FiKey size={18} />}
            title="Backup Codes"
            description="Each code can be used once if you lose access to your authenticator."
            action={
              <button
                className="s-btn s-btn-quiet"
                onClick={() =>
                  copyToClipboard(
                    settings.backupCodes.join("\n"),
                    showToast,
                    "Backup codes copied",
                  )
                }
              >
                <FiCopy size={14} /> Copy all
              </button>
            }
          />
          <div className="s-code-grid">
            {settings.backupCodes.map((code) => (
              <code key={code} className="s-code-chip">
                {code}
              </code>
            ))}
          </div>
        </Panel>
      )}
    </>
  );

  const renderActivity = () => {
    const filtered =
      activityFilter === "all"
        ? ACTIVITY_LOG
        : ACTIVITY_LOG.filter((a) => a.type === activityFilter);
    return (
      <Panel id="activity">
        <SectionHeader
          icon={<FiActivity size={18} />}
          title="Activity Log"
          description="A record of recent actions on your account."
          action={
            <button
              className="s-btn s-btn-quiet"
              onClick={() => {
                const text = ACTIVITY_LOG.map(
                  (a) => `${a.time}\t${a.message}`,
                ).join("\n");
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "activity-log.txt";
                link.click();
                URL.revokeObjectURL(url);
                showToast("Activity log exported", "success");
              }}
            >
              <FiDownload size={14} /> Export
            </button>
          }
        />
        <div className="s-segmented s-segmented-wrap">
          {[
            { id: "all", label: "All" },
            { id: "security", label: "Security" },
            { id: "profile", label: "Profile" },
            { id: "settings", label: "Settings" },
          ].map((f) => (
            <button
              key={f.id}
              className={`s-segmented-btn${activityFilter === f.id ? " is-active" : ""}`}
              onClick={() => setActivityFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ul className="s-timeline">
          {filtered.map((a) => (
            <li key={a.id} className="s-timeline-item">
              <span className={`s-timeline-icon s-timeline-${a.type}`}>
                {ACTIVITY_ICONS[a.type]}
              </span>
              <div>
                <div className="s-row-label">{a.message}</div>
                <div className="s-row-desc">{a.time}</div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <div className="s-empty">No activity in this category yet.</div>
          )}
        </ul>
      </Panel>
    );
  };

  const renderData = () => (
    <Panel id="data">
      <SectionHeader icon={<FiHardDrive size={18} />} title="Data & Storage" />
      <Row
        icon={<FiRadio size={18} />}
        label="Data Saver"
        description="Reduce data usage on slower connections"
      >
        <Toggle
          checked={settings.dataSaver}
          onChange={() => handleToggle("dataSaver")}
          label="Data saver"
        />
      </Row>
      <Row
        icon={<FiSave size={18} />}
        label="Auto Save"
        description="Automatically save your work"
        last
      >
        <Toggle
          checked={settings.autoSave}
          onChange={() => handleToggle("autoSave")}
          label="Auto save"
        />
      </Row>

      <div className="s-storage-block">
        <div className="s-storage-head">
          <span>Local storage used</span>
          <span>{storageUsageKB.toFixed(2)} KB</span>
        </div>
        <div className="s-storage-bar">
          <div
            className="s-storage-fill"
            style={{ width: `${Math.min(100, (storageUsageKB / 512) * 100)}%` }}
          />
        </div>
        {Object.keys(storageBreakdown).length > 0 && (
          <div className="s-storage-breakdown">
            {Object.entries(storageBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([key, size]) => (
                <div key={key} className="s-storage-row">
                  <span>{key}</span>
                  <span>{(size / 1024).toFixed(2)} KB</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="s-btn-row">
        <button className="s-btn s-btn-quiet" onClick={handleExportData}>
          <FiDownload size={15} /> Export My Settings
        </button>
        <button className="s-btn s-btn-quiet" onClick={handleImportClick}>
          <FiUpload size={15} /> Import Settings
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleImportFile}
        />
        <button className="s-btn s-btn-quiet" onClick={handleClearCache}>
          <FiRefreshCw size={15} /> Clear Cache
        </button>
      </div>
    </Panel>
  );

  const renderAbout = () => (
    <Panel id="about">
      <SectionHeader icon={<FiInfo size={18} />} title="About" />
      <div className="s-about-list">
        <div className="s-about-row">
          <span>Application</span>
          <span>A-MESOB Digital Service Management</span>
        </div>
        <div className="s-about-row">
          <span>Version</span>
          <span>1.0.0</span>
        </div>
      </div>

      <div className="s-btn-row s-btn-row-top">
        <button
          className="s-btn s-btn-quiet"
          onClick={() => showToast("You're on the latest version", "success")}
        >
          <FiRefreshCw size={15} /> Check for Updates
        </button>
        <button
          className="s-btn s-btn-quiet"
          onClick={() => showToast("Support request sent", "info")}
        >
          <FiHelpCircle size={15} /> Contact Support
        </button>
      </div>

      <div className="s-note">
        <FiCheckCircle size={18} />
        <span>Your preferences are saved locally on this device</span>
      </div>

      <div className="s-reset-row">
        <button
          className="s-btn s-btn-text s-danger-text"
          onClick={handleResetDefaults}
        >
          <FiRotateCcw size={13} /> Reset all settings to defaults
        </button>
        {preResetSnapshot && (
          <button className="s-btn s-btn-text" onClick={handleUndoReset}>
            Undo
          </button>
        )}
      </div>
    </Panel>
  );

  const tabContent = {
    profile: renderProfile,
    language: renderLanguage,
    notifications: renderNotifications,
    appearance: renderAppearance,
    security: renderSecurity,
    activity: renderActivity,
    data: renderData,
    about: renderAbout,
  }[activeTab]();

  const q = searchQuery.trim().toLowerCase();
  const visibleTabs = TABS.filter(
    (t) => !q || t.label.toLowerCase().includes(q) || t.keywords.includes(q),
  );

  // ---------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------

  return (
    <div
      className={`settings-page${settings.highContrast ? " s-high-contrast" : ""}`}
      style={cssVars}
      data-theme={isDark ? "dark" : "light"}
    >
      <div className="settings-header">
        <div>
          <h1 className="s-title">
            <FiSettings size={22} />
            Settings
          </h1>
          <p className="s-subtitle">Customize your application preferences</p>
        </div>
        <div className="s-header-actions">
          <div className="s-search">
            <FiSearch size={14} />
            <input
              placeholder="Search settings…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isDirty && (
            <>
              <span className="s-unsaved-pill">Unsaved changes</span>
              <button className="s-btn s-btn-quiet" onClick={handleDiscard}>
                Discard
              </button>
            </>
          )}
          <button
            className="settings-save-btn s-btn s-btn-primary"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            <FiSave size={16} />
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="s-body" style={{ fontSize: `${fontScale * 100}%` }}>
        <div className="s-layout">
          <nav className="s-nav">
            {visibleTabs.map((tabItem) => {
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  className={`s-nav-btn${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveTab(tabItem.id)}
                >
                  <span className="s-nav-icon">{tabItem.icon}</span>
                  {tabItem.label}
                </button>
              );
            })}
            {visibleTabs.length === 0 && (
              <div className="s-empty s-empty-nav">No matches</div>
            )}
          </nav>

          <div className="s-content">{tabContent}</div>
        </div>
      </div>

      {twoFAModalOpen && (
        <Modal
          title="Set up two-factor authentication"
          onClose={() => setTwoFAModalOpen(false)}
        >
          {twoFAStep === 1 && (
            <>
              <p className="s-modal-text">
                Scan this key with your authenticator app (Google Authenticator,
                Authy, or similar), or enter it manually.
              </p>
              <div className="s-secret-box">
                <code>{twoFASecret}</code>
                <button
                  className="s-icon-btn"
                  onClick={() =>
                    copyToClipboard(twoFASecret, showToast, "Secret key copied")
                  }
                >
                  <FiCopy size={15} />
                </button>
              </div>
              <div className="s-modal-footer-inline">
                <button
                  className="s-btn s-btn-primary"
                  onClick={() => setTwoFAStep(2)}
                >
                  I've added it
                </button>
              </div>
            </>
          )}
          {twoFAStep === 2 && (
            <>
              <p className="s-modal-text">
                Enter the 6-digit code shown in your authenticator app.
              </p>
              <input
                className="s-input s-code-input"
                value={twoFACode}
                onChange={(e) =>
                  setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                inputMode="numeric"
                autoFocus
              />
              <div className="s-modal-footer-inline">
                <button
                  className="s-btn s-btn-quiet"
                  onClick={() => setTwoFAStep(1)}
                >
                  Back
                </button>
                <button
                  className="s-btn s-btn-primary"
                  onClick={handleTwoFactorVerify}
                >
                  Verify
                </button>
              </div>
            </>
          )}
          {twoFAStep === 3 && (
            <>
              <p className="s-modal-text">
                Save these backup codes somewhere safe. Each one can be used
                once if you lose your device.
              </p>
              <div className="s-code-grid">
                {pendingBackupCodes.map((code) => (
                  <code key={code} className="s-code-chip">
                    {code}
                  </code>
                ))}
              </div>
              <div className="s-modal-footer-inline">
                <button
                  className="s-btn s-btn-quiet"
                  onClick={() =>
                    copyToClipboard(
                      pendingBackupCodes.join("\n"),
                      showToast,
                      "Backup codes copied",
                    )
                  }
                >
                  <FiCopy size={14} /> Copy codes
                </button>
                <button
                  className="s-btn s-btn-primary"
                  onClick={finishTwoFactorSetup}
                >
                  <FiCheck size={14} /> Done
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {deleteModalOpen && (
        <Modal
          title="Delete account"
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteConfirmText("");
          }}
        >
          <p className="s-modal-text">
            This permanently deletes your account and all associated data. This
            action cannot be undone. Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            className="s-input"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE"
            autoFocus
          />
          <div className="s-modal-footer-inline">
            <button
              className="s-btn s-btn-quiet"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </button>
            <button
              className="s-btn s-btn-danger"
              disabled={deleteConfirmText !== "DELETE"}
              onClick={handleDeleteAccount}
            >
              Delete my account
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
