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
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
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

  const userProfilePhoto = getUserProfilePhoto();
  const canAddUsers = isAdmin || isSuperAdmin;

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
        gap: "clamp(6px, 2vw, 12px)",
        flexWrap: "nowrap", // ✅ PREVENT WRAPPING
        overflow: "hidden", // ✅ PREVENT OVERFLOW
      }}
    >
      {/* LEFT SECTION - Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(4px, 1.5vw, 10px)",
          flexShrink: 0, // ✅ DON'T SHRINK
          minWidth: 0,
          overflow: "hidden", // ✅ PREVENT OVERFLOW
        }}
      >
        <span
          style={{
            fontSize: "clamp(14px, 3vw, 18px)",
            color: C.primary,
            flexShrink: 0,
            animation: "pulseGlow 3s ease-in-out infinite",
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
            fontSize: "clamp(9px, 2.5vw, 11px)",
            fontFamily: F.sans,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            whiteSpace: "nowrap", // ✅ PREVENT WRAPPING
          }}
        >
          {safeAppName}
        </span>

        <span
          style={{
            color: C.gold,
            fontSize: "clamp(8px, 2vw, 12px)",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <FiChevronRight size={12} />
        </span>

        <span
          style={{
            fontWeight: 700,
            fontSize: "clamp(10px, 3vw, 13px)",
            color: C.dark,
            fontFamily: F.sans,
            whiteSpace: "nowrap", // ✅ PREVENT WRAPPING
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "min(150px, 30vw)",
            background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            flexShrink: 1,
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
          gap: "clamp(4px, 1.5vw, 12px)",
          flexShrink: 0, // ✅ DON'T SHRINK
          flexWrap: "nowrap", // ✅ PREVENT WRAPPING
          overflow: "hidden", // ✅ PREVENT OVERFLOW
        }}
      >
        {/* Date - Hidden on small screens */}
        <span
          className="header-date"
          style={{
            fontSize: "clamp(8px, 2vw, 10px)",
            color: C.muted,
            fontFamily: F.sans,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
          <FiCalendar size={10} />
          {dateStr}
        </span>

        {/* Language Buttons - Compact */}
        <div
          style={{
            display: "flex",
            gap: "clamp(2px, 1vw, 4px)",
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
                borderRadius: 4,
                padding: "clamp(2px, 1vw, 4px) clamp(3px, 1.5vw, 6px)",
                fontSize: "clamp(8px, 2vw, 10px)",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: F.sans,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                minWidth: "clamp(20px, 5vw, 28px)",
                transform: lang === l.code ? "scale(1.05)" : "scale(1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
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
              <FiGlobe size={8} />
              {l.flag}
            </button>
          ))}
        </div>

        {/* Logout Button - Icon only on small screens */}
        <button
          onClick={logout}
          className="header-logout-btn"
          style={{
            background: isLogoutHovered ? "#dc2626" : "transparent",
            border: `1px solid ${isLogoutHovered ? "#dc2626" : C.border}`,
            borderRadius: 4,
            padding: "clamp(2px, 1vw, 4px) clamp(4px, 1.5vw, 10px)",
            minWidth: "clamp(32px, 8vw, 70px)",
            fontSize: "clamp(9px, 2vw, 11px)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            color: isLogoutHovered ? "#fff" : C.muted,
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            height: "clamp(26px, 4vh, 34px)",
            flexShrink: 0,
          }}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
        >
          <FiLogOut size={12} style={{ flexShrink: 0 }} />
          <span
            className="logout-text"
            style={{
              display: "inline-block",
              minWidth: "clamp(20px, 4vw, 40px)",
              textAlign: "center",
              fontSize: "clamp(8px, 1.8vw, 11px)",
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
              gap: 4,
              cursor: "pointer",
              padding: "2px 4px 2px 2px",
              borderRadius: 20,
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
                  width: "clamp(24px, 5vw, 32px)",
                  height: "clamp(24px, 5vw, 32px)",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${C.primary}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "clamp(24px, 5vw, 32px)",
                  height: "clamp(24px, 5vw, 32px)",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(10px, 2.5vw, 14px)",
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
              size={12}
              style={{
                color: C.muted,
                transition: "transform 0.3s ease",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </div>

          {/* Dropdown Menu - Same as before */}
          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: 220,
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
                  padding: "14px 16px 10px",
                  borderBottom: `1px solid ${C.border}`,
                  background: C.bg,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {userProfilePhoto ? (
                    <img
                      src={userProfilePhoto}
                      alt={user?.name || "User"}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${C.primary}`,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
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
                        fontSize: 13,
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
                        gap: 4,
                        color: getRoleColor(),
                        fontSize: 11,
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
                    fontSize: 10,
                    color: C.muted,
                    marginTop: 4,
                    paddingTop: 4,
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
                    padding: "6px 16px",
                    fontSize: 10,
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
                    gap: 8,
                    padding: "6px 16px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
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
                  <FiUser size={14} style={{ color: C.muted }} />
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
                    gap: 8,
                    padding: "6px 16px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
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
                  <FiSettings size={14} style={{ color: C.muted }} />
                  Settings
                </button>

                {canAddUsers && (
                  <>
                    <div
                      style={{
                        padding: "6px 16px 2px",
                        fontSize: 10,
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
                        gap: 8,
                        padding: "6px 16px",
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 12,
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
                      <FiUserPlus size={14} style={{ color: C.primary }} />
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
                        gap: 8,
                        padding: "6px 16px",
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 12,
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
                      <FiUsers size={14} style={{ color: C.muted }} />
                      User Management
                    </button>
                  </>
                )}
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: C.border,
                  margin: "2px 16px",
                }}
              />

              {/* Logout */}
              <div style={{ padding: "4px 16px 8px" }}>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    width: "100%",
                    border: "none",
                    borderRadius: 6,
                    background: "#fee2e2",
                    cursor: "pointer",
                    fontSize: 12,
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
                  <FiLogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* ✅ RESPONSIVE BREAKPOINTS - Keep everything on one line */
        
        /* Extra Small Screens - Hide text, show only icons */
        @media (max-width: 480px) {
          .header-date {
            display: none !important;
          }
          .header-appname {
            display: none !important;
          }
          .logout-text {
            display: none !important;
          }
          .header-lang-btn span {
            display: none !important;
          }
          .header-lang-btn {
            min-width: 20px !important;
            padding: 2px 4px !important;
          }
          .header-logout-btn {
            min-width: 28px !important;
            padding: 4px 6px !important;
          }
        }

        /* Small Screens - Show only essential */
        @media (min-width: 481px) and (max-width: 640px) {
          .header-date {
            display: none !important;
          }
          .header-appname {
            display: none !important;
          }
          .logout-text {
            display: none !important;
          }
          .header-lang-btn span {
            display: none !important;
          }
          .header-lang-btn {
            min-width: 24px !important;
            padding: 2px 5px !important;
          }
        }

        /* Medium Screens - Show language flags but hide text */
        @media (min-width: 641px) and (max-width: 768px) {
          .header-date {
            display: none !important;
          }
          .header-appname {
            display: none !important;
          }
          .header-lang-btn span {
            display: none !important;
          }
          .header-lang-btn {
            min-width: 28px !important;
          }
        }

        /* Large Screens - Show everything */
        @media (min-width: 769px) {
          .header-date {
            display: inline-flex !important;
          }
          .header-appname {
            display: inline-flex !important;
          }
          .logout-text {
            display: inline-block !important;
          }
          .header-lang-btn span {
            display: inline !important;
          }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(26,58,173,0.3); }
          50% { box-shadow: 0 0 40px rgba(245,197,24,0.3); }
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
