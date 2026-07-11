// frontend/src/components/layout/Header.jsx
import { C, F } from "../../styles/theme";
import { LANGUAGES } from "../../constants/translations";
import { useAuth } from "../../hooks/useAuth";
import { useState, useMemo, useRef, useEffect } from "react";
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
} from "react-icons/fi";

export default function Header({ tab, t, lang, setLang }) {
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

  // ✅ DISPLAY NAME MAPPING - Fixes the breadcrumb capitalization issue
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
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Use useMemo to prevent date from recalculating on every render
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

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user role
  const getUserRole = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdmin) return "Admin";
    if (isLeader) return "Team Leader";
    if (isEmployee) return "Employee";
    return "User";
  };

  // Get role icon
  const getRoleIcon = () => {
    if (isSuperAdmin) return <FiShield size={14} />;
    if (isAdmin) return <FiSettings size={14} />;
    if (isLeader) return <FiAward size={14} />;
    return <FiUserCheck size={14} />;
  };

  // Get role color
  const getRoleColor = () => {
    if (isSuperAdmin) return "#8b5cf6";
    if (isAdmin) return "#3b82f6";
    if (isLeader) return "#f59e0b";
    return "#10b981";
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header
      style={{
        height: "auto",
        minHeight: "clamp(48px, 8vh, 56px)",
        background: C.white,
        borderBottom: `2px solid rgba(26, 58, 173, 0.13)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px clamp(12px, 4vw, 24px)",
        boxShadow: "0 2px 12px rgba(26,58,173,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        gap: "clamp(8px, 3vw, 16px)",
        flexWrap: "wrap",
      }}
    >
      {/* LEFT SECTION - Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(6px, 2vw, 12px)",
          flexWrap: "wrap",
          flex: "1 1 auto",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "clamp(16px, 4vw, 20px)",
            color: C.primary,
            flexShrink: 0,
            animation: "pulseGlow 3s ease-in-out infinite",
            display: "flex",
            alignItems: "center",
          }}
        >
          {icons[tab] || <FiGrid size={18} />}
        </span>

        <span
          className="header-appname"
          style={{
            color: C.muted,
            fontSize: "clamp(10px, 3vw, 12px)",
            fontFamily: F.sans,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {safeAppName}
        </span>

        <span
          style={{
            color: C.gold,
            fontSize: "clamp(10px, 3vw, 14px)",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
          }}
        >
          <FiChevronRight size={14} />
        </span>

        <span
          style={{
            fontWeight: 700,
            fontSize: "clamp(11px, 3.5vw, 13px)",
            color: C.dark,
            fontFamily: F.sans,
            whiteSpace: "normal",
            wordBreak: "break-word",
            maxWidth: "min(200px, 40vw)",
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
          gap: "clamp(6px, 2vw, 14px)",
          flexShrink: 0,
          flexWrap: "nowrap",
        }}
      >
        {/* Date */}
        <span
          className="header-date"
          style={{
            fontSize: "clamp(9px, 2.5vw, 11px)",
            color: C.muted,
            fontFamily: F.sans,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiCalendar size={12} />
          {dateStr}
        </span>

        {/* Language Buttons */}
        <div
          style={{
            display: "flex",
            gap: "clamp(2px, 1.5vw, 6px)",
            flexShrink: 0,
          }}
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
                borderRadius: 5,
                padding: "clamp(2px, 1.5vw, 4px) clamp(4px, 2vw, 8px)",
                fontSize: "clamp(9px, 2.5vw, 11px)",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: F.sans,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                minWidth: "clamp(24px, 6vw, 32px)",
                transform: lang === l.code ? "scale(1.05)" : "scale(1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
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
              <FiGlobe size={10} />
              {l.flag}
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="header-logout-btn"
          style={{
            background: isLogoutHovered ? "#dc2626" : "transparent",
            border: `1px solid ${isLogoutHovered ? "#dc2626" : C.border}`,
            borderRadius: 5,
            padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 2vw, 14px)",
            minWidth: "clamp(70px, 10vw, 90px)",
            fontSize: "clamp(10px, 2.5vw, 12px)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: isLogoutHovered ? "#fff" : C.muted,
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            height: "clamp(30px, 4vh, 36px)",
          }}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
        >
          <FiLogOut size={14} style={{ flexShrink: 0 }} />
          <span
            style={{
              display: "inline-block",
              minWidth: "clamp(38px, 5vw, 50px)",
              textAlign: "center",
            }}
          >
            {safeAuth.logout || "Logout"}
          </span>
        </button>

        {/* User Avatar with Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <div
            className="header-avatar"
            onClick={toggleDropdown}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "2px 8px 2px 4px",
              borderRadius: 24,
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
            <div
              style={{
                width: "clamp(28px, 6vw, 36px)",
                height: "clamp(28px, 6vw, 36px)",
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(12px, 3vw, 16px)",
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
            <FiChevronDown
              size={14}
              style={{
                color: C.muted,
                transition: "transform 0.3s ease",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: 240,
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
                  padding: "16px 16px 12px",
                  borderBottom: `1px solid ${C.border}`,
                  background: C.bg,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      color: "#fff",
                      fontWeight: 900,
                      fontFamily: F.serif,
                      flexShrink: 0,
                    }}
                  >
                    {getUserInitials()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: C.dark,
                        fontSize: 14,
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
                        gap: 6,
                        color: getRoleColor(),
                        fontSize: 12,
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
                    fontSize: 11,
                    color: C.muted,
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: `1px solid ${C.border}44`,
                  }}
                >
                  {user?.email || "No email"}
                </div>
              </div>

              {/* Menu Items */}
              <div style={{ padding: "6px 0" }}>
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
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
                    // Navigate to profile or settings
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
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
                  <FiUser size={16} style={{ color: C.muted }} />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // Navigate to settings
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
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
                  <FiSettings size={16} style={{ color: C.muted }} />
                  Settings
                </button>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: C.border,
                  margin: "4px 16px",
                }}
              />

              {/* Logout */}
              <div style={{ padding: "6px 16px 10px" }}>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    width: "100%",
                    border: "none",
                    borderRadius: 8,
                    background: "#fee2e2",
                    cursor: "pointer",
                    fontSize: 13,
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
                  <FiLogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 500px) {
          .header-lang-btn {
            display: none !important;
          }
          .header-logout-btn span {
            display: none !important;
          }
          .header-logout-btn {
            min-width: unset !important;
            padding: 6px 10px !important;
          }
          .header-date {
            display: none !important;
          }
          .header-appname {
            display: none !important;
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
      `}</style>
    </header>
  );
}
