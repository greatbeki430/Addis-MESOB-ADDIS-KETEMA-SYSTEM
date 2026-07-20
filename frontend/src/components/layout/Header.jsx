// frontend/src/components/layout/Header.jsx
import { C, F } from "../../styles/theme";
import { LANGUAGES } from "../../constants/translations";
import { useAuth } from "../../hooks/useAuth";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiMessageSquare,
  FiStar,
  FiFileText,
  FiGrid,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiCalendar,
  FiChevronRight,
  FiUser,
  FiGlobe,
  FiChevronDown,
  FiSettings,
  FiShield,
  FiUserCheck,
  FiAward,
  FiUserPlus,
  FiCheck,
  FiChevronUp,
} from "react-icons/fi";

export default function Header({ tab, t, lang, setLang, onAddUserClick }) {
  const navigate = useNavigate();

  const icons = {
    dashboard: <FiHome size={18} />,
    forum: <FiMessageSquare size={18} />,
    evaluation: <FiStar size={18} />,
    report: <FiFileText size={18} />,
    services: <FiGrid size={18} />,
    users: <FiUsers size={18} />,
    teams: <FiUsers size={18} />,
    analytics: <FiBarChart2 size={18} />,
    "golden-monday": <FiCalendar size={18} />,
    employees: <FiUsers size={18} />,
  };

  const displayNames = {
    dashboard: "Dashboard",
    forum: "Peer Forum",
    evaluation: "Evaluation",
    report: "Daily Report",
    services: "Services",
    analytics: "Analytics",
    users: "User Management",
    teams: "Team Management",
    "admin/services": "Service Manager",
    documents: "Document Vault",
    "golden-monday": "Golden Monday",
    employees: "Employee Management",
  };

  const { logout, user, isAdmin, isSuperAdmin, isLeader, isEmployee } =
    useAuth();
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target)
      ) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-GB", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const safeT = t || {};
  const safeNav = safeT.nav || {};
  const safeAuth = safeT.auth || {};
  const safeAppName = safeT.appName || "A-MESOB";

  const tabLabel = safeNav[tab] || displayNames[tab] || tab;

  const getUserProfilePhoto = () => {
    return user?.profilePhotoUrl || null;
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRole = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdmin) return "Admin";
    if (isLeader) return "Team Leader";
    if (isEmployee) return "Employee";
    return "User";
  };

  const getRoleIcon = () => {
    if (isSuperAdmin) return <FiShield size={14} />;
    if (isAdmin) return <FiSettings size={14} />;
    if (isLeader) return <FiAward size={14} />;
    return <FiUserCheck size={14} />;
  };

  const getRoleColor = () => {
    if (isSuperAdmin) return "#8b5cf6";
    if (isAdmin) return "#3b82f6";
    if (isLeader) return "#f59e0b";
    return "#10b981";
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleLangDropdown = () => {
    setIsLangDropdownOpen(!isLangDropdownOpen);
  };

  const handleLangSelect = (code) => {
    setLang(code);
    setIsLangDropdownOpen(false);
  };

  const userProfilePhoto = getUserProfilePhoto();
  const canAddUsers = isAdmin || isSuperAdmin;

  // Get current language label
  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header
      style={{
        height: "auto",
        minHeight: "clamp(44px, 7vh, 52px)",
        background: C.white,
        borderBottom: `2px solid rgba(26, 58, 173, 0.13)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px clamp(8px, 2vw, 20px)",
        boxShadow: "0 2px 12px rgba(26,58,173,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        gap: "clamp(4px, 1.5vw, 12px)",
        flexWrap: "nowrap",
        overflow: "visible",
      }}
    >
      {/* LEFT SECTION - Breadcrumb - Shrinks on mobile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(3px, 1vw, 10px)",
          flex: "1 1 auto",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: "clamp(14px, 2.5vw, 18px)",
            color: C.primary,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          {icons[tab] || <FiGrid size={16} />}
        </span>

        <span
          className="header-appname"
          style={{
            color: C.muted,
            fontSize: "clamp(8px, 2vw, 11px)",
            fontFamily: F.sans,
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {safeAppName}
        </span>

        <span
          style={{
            color: C.gold,
            fontSize: "clamp(6px, 1.5vw, 12px)",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <FiChevronRight size={10} />
        </span>

        <span
          style={{
            fontWeight: 700,
            fontSize: "clamp(9px, 2.5vw, 13px)",
            color: C.dark,
            fontFamily: F.sans,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: "1 1 auto",
            minWidth: 0,
            background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {tabLabel}
        </span>
      </div>

      {/* RIGHT SECTION */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(3px, 1vw, 12px)",
          flexShrink: 0,
          flexWrap: "nowrap",
        }}
      >
        {/* Date - Hidden on small screens */}
        <span
          className="header-date"
          style={{
            fontSize: "clamp(7px, 1.5vw, 10px)",
            color: C.muted,
            fontFamily: F.sans,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <FiCalendar size={9} />
          {dateStr}
        </span>

        {/* Language Selector - Beautiful Dropdown on mobile, buttons on desktop */}
        <div
          ref={langDropdownRef}
          style={{ position: "relative", flexShrink: 0 }}
        >
          {/* Desktop: Show all language buttons */}
          <div
            className="lang-desktop"
            style={{ display: "flex", gap: "clamp(1px, 0.8vw, 4px)" }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className="header-lang-btn"
                onClick={() => setLang(l.code)}
                title={l.label}
                style={{
                  background: lang === l.code ? C.primary : "#f0f3ff",
                  color: lang === l.code ? C.gold : C.primary,
                  border: `1px solid ${lang === l.code ? C.primary : C.border}`,
                  borderRadius: 4,
                  padding: "clamp(1px, 0.8vw, 3px) clamp(3px, 1vw, 6px)",
                  fontSize: "clamp(7px, 1.5vw, 10px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: F.sans,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  minWidth: "clamp(18px, 4vw, 28px)",
                  transform: lang === l.code ? "scale(1.05)" : "scale(1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (lang !== l.code) {
                    e.currentTarget.style.background = C.primary + "22";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (lang !== l.code) {
                    e.currentTarget.style.background = "#f0f3ff";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                <FiGlobe size={7} />
                <span style={{ fontSize: "clamp(6px, 1.2vw, 9px)" }}>
                  {l.flag}
                </span>
              </button>
            ))}
          </div>

          {/* Mobile: Beautiful Language dropdown button */}
          <button
            className="lang-mobile"
            onClick={toggleLangDropdown}
            style={{
              background: isLangDropdownOpen
                ? `linear-gradient(135deg, ${C.primary}, #1a3aad)`
                : "#f0f3ff",
              color: isLangDropdownOpen ? C.gold : C.primary,
              border: `1px solid ${isLangDropdownOpen ? C.primary : C.border}`,
              borderRadius: 8,
              padding: "clamp(4px, 1.2vw, 6px) clamp(10px, 2.5vw, 16px)",
              fontSize: "clamp(11px, 2.5vw, 13px)",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flexShrink: 0,
              minHeight: "clamp(32px, 4.5vh, 38px)",
              boxShadow: isLangDropdownOpen
                ? `0 4px 20px ${C.primary}44`
                : "0 2px 8px rgba(0,0,0,0.06)",
              transform: isLangDropdownOpen ? "scale(1.02)" : "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (!isLangDropdownOpen) {
                e.currentTarget.style.background = C.primary + "22";
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}33`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLangDropdownOpen) {
                e.currentTarget.style.background = "#f0f3ff";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              }
            }}
          >
            <FiGlobe size={16} />
            <span
              style={{
                fontSize: "clamp(14px, 3vw, 18px)",
                lineHeight: 1,
              }}
            >
              {currentLang.flag}
            </span>
            <span
              style={{
                fontSize: "clamp(10px, 2vw, 12px)",
                fontWeight: 600,
                opacity: 0.8,
              }}
            >
              {currentLang.label}
            </span>
            {isLangDropdownOpen ? (
              <FiChevronUp size={14} />
            ) : (
              <FiChevronDown size={14} />
            )}
          </button>

          {/* Mobile: Beautiful Language Dropdown Menu */}
          {isLangDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: 180,
                background: C.white,
                borderRadius: 12,
                boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                animation: "slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: 101,
                padding: "6px",
              }}
            >
              <div
                style={{
                  padding: "6px 12px 4px",
                  fontSize: 10,
                  color: C.muted,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  borderBottom: `1px solid ${C.border}44`,
                }}
              >
                Select Language
              </div>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLangSelect(l.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    width: "100%",
                    border: "none",
                    borderRadius: 8,
                    background:
                      lang === l.code
                        ? `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`
                        : "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: lang === l.code ? 600 : 400,
                    color: lang === l.code ? C.primary : C.dark,
                    transition: "all 0.2s ease",
                    fontFamily: F.sans,
                    margin: "2px 0",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      lang === l.code
                        ? `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`
                        : C.bg;
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      lang === l.code
                        ? `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`
                        : "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      width: 28,
                      textAlign: "center",
                    }}
                  >
                    {l.flag}
                  </span>
                  <span style={{ flex: 1 }}>{l.label}</span>
                  {lang === l.code && (
                    <span
                      style={{
                        background: C.primary,
                        color: "#fff",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                      }}
                    >
                      <FiCheck size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="header-logout-btn"
          style={{
            background: isLogoutHovered ? "#dc2626" : "transparent",
            border: `1px solid ${isLogoutHovered ? "#dc2626" : C.border}`,
            borderRadius: 4,
            padding: "clamp(2px, 0.8vw, 4px) clamp(4px, 1vw, 10px)",
            minWidth: "clamp(28px, 6vw, 60px)",
            fontSize: "clamp(8px, 1.5vw, 11px)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            color: isLogoutHovered ? "#fff" : C.muted,
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            height: "clamp(24px, 3.5vh, 32px)",
            flexShrink: 0,
          }}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
        >
          <FiLogOut size={11} style={{ flexShrink: 0 }} />
          <span
            className="logout-text"
            style={{
              display: "inline-block",
              minWidth: "clamp(18px, 3vw, 35px)",
              textAlign: "center",
              fontSize: "clamp(7px, 1.5vw, 10px)",
            }}
          >
            {safeAuth.logout || "Logout"}
          </span>
        </button>

        {/* User Avatar with Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
          <div
            className="header-avatar"
            onClick={toggleDropdown}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              cursor: "pointer",
              padding: "1px 3px 1px 1px",
              borderRadius: 18,
              border: isDropdownOpen
                ? `2px solid ${C.primary}`
                : "2px solid transparent",
              transition: "all 0.3s ease",
              background: isDropdownOpen ? `${C.primary}11` : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.borderColor = C.primary + "44";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
          >
            {userProfilePhoto ? (
              <img
                src={userProfilePhoto}
                alt={user?.name || "User"}
                style={{
                  width: "clamp(22px, 4vw, 30px)",
                  height: "clamp(22px, 4vw, 30px)",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${C.primary}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "clamp(22px, 4vw, 30px)",
                  height: "clamp(22px, 4vw, 30px)",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(9px, 2vw, 13px)",
                  color: "#fff",
                  fontWeight: 900,
                  fontFamily: F.serif,
                  boxShadow: `0 2px 8px rgba(26,58,173,0.35)`,
                  flexShrink: 0,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                title={user?.name || "User"}
              >
                {getUserInitials()}
              </div>
            )}
            <FiChevronDown
              size={10}
              style={{
                color: C.muted,
                transition: "transform 0.3s ease",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </div>

          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                minWidth: 200,
                background: C.white,
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                animation: "fadeInUp 0.2s ease",
                zIndex: 100,
              }}
            >
              {/* User Info */}
              <div
                style={{
                  padding: "12px 14px 8px",
                  borderBottom: `1px solid ${C.border}`,
                  background: C.bg,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {userProfilePhoto ? (
                    <img
                      src={userProfilePhoto}
                      alt={user?.name || "User"}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${C.primary}`,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        color: "#fff",
                        fontWeight: 900,
                        fontFamily: F.serif,
                        flexShrink: 0,
                      }}
                    >
                      {getUserInitials()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: C.dark,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user?.name || "User"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        color: getRoleColor(),
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {getRoleIcon()}
                      {getUserRole()}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: C.muted,
                    marginTop: 3,
                    paddingTop: 3,
                    borderTop: `1px solid ${C.border}44`,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.email || "No email"}
                </div>
              </div>

              {/* Menu Items */}
              <div style={{ padding: "4px 0" }}>
                <div
                  style={{
                    padding: "4px 14px",
                    fontSize: 9,
                    color: C.muted,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Account
                </div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 14px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 11,
                    color: C.dark,
                    transition: "background 0.2s ease",
                    fontFamily: F.sans,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <FiUser size={12} style={{ color: C.muted }} />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/settings");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 14px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 11,
                    color: C.dark,
                    transition: "background 0.2s ease",
                    fontFamily: F.sans,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <FiSettings size={12} style={{ color: C.muted }} />
                  Settings
                </button>

                {canAddUsers && (
                  <>
                    <div
                      style={{
                        padding: "4px 14px 2px",
                        fontSize: 9,
                        color: C.muted,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderTop: `1px solid ${C.border}44`,
                        marginTop: 2,
                      }}
                    >
                      Admin
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onAddUserClick) {
                          onAddUserClick();
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 14px",
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 11,
                        color: C.primary,
                        transition: "background 0.2s ease",
                        fontFamily: F.sans,
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = C.primary + "11";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiUserPlus size={12} style={{ color: C.primary }} />
                      Add New User
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/users");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 14px",
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 11,
                        color: C.dark,
                        transition: "background 0.2s ease",
                        fontFamily: F.sans,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = C.bg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiUsers size={12} style={{ color: C.muted }} />
                      User Management
                    </button>
                  </>
                )}
              </div>

              <div
                style={{
                  height: 1,
                  background: C.border,
                  margin: "2px 14px",
                }}
              />

              <div style={{ padding: "4px 14px 8px" }}>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    width: "100%",
                    border: "none",
                    borderRadius: 6,
                    background: "#fee2e2",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#dc2626",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    fontFamily: F.sans,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fecaca";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fee2e2";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiLogOut size={12} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Desktop: Show all language buttons */
        @media (min-width: 769px) {
          .lang-mobile {
            display: none !important;
          }
          .lang-desktop {
            display: flex !important;
          }
          .header-date { display: inline-flex !important; }
          .header-appname { display: inline-flex !important; }
          .logout-text { display: inline-block !important; }
          .header-lang-btn span { display: inline !important; }
        }

        /* Tablet: Show language dropdown */
        @media (min-width: 641px) and (max-width: 768px) {
          .lang-mobile {
            display: flex !important;
          }
          .lang-desktop {
            display: none !important;
          }
          .header-date { display: none !important; }
          .header-appname { display: none !important; }
          .logout-text { display: inline-block !important; }
        }

        /* Mobile: Show language dropdown */
        @media (max-width: 640px) {
          .lang-mobile {
            display: flex !important;
          }
          .lang-desktop {
            display: none !important;
          }
          .header-date { display: none !important; }
          .header-appname { display: none !important; }
          .logout-text { display: none !important; }
          .header-logout-btn { min-width: 24px !important; padding: 2px 4px !important; }
        }

        /* Extra small: Even more compact */
        @media (max-width: 480px) {
          .header-logout-btn { min-width: 20px !important; padding: 2px 3px !important; }
          .lang-mobile { padding: 2px 8px !important; font-size: 10px !important; min-height: 24px !important; gap: 4px !important; }
          .lang-mobile span { font-size: 12px !important; }
        }
      `}</style>
    </header>
  );
}
