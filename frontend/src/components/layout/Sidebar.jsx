/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { C, F } from "../../styles/theme";
import { LANGUAGES } from "../../constants/translations";
import { teamAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { getFilteredNavItems } from "../../utils/roles";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  // eslint-disable-next-line no-unused-vars
  FiChevronUp,
  FiPlus,
  FiX,
  FiUsers,
  // eslint-disable-next-line no-unused-vars
  FiUser,
  FiUserPlus,
  FiHome,
  FiMessageSquare,
  FiStar,
  FiFileText,
  FiGrid,
  FiSettings,
  FiUsers as FiUsersIcon,
  FiBarChart2,
  FiGlobe,
  // eslint-disable-next-line no-unused-vars
  FiFlag,
  FiCheck,
  FiLoader,
  FiMenu,
} from "react-icons/fi";

// =============================================
// ANIMATED LOGO COMPONENT - Alternating "A" ↔ "አ"
// =============================================
const AnimatedLogo = ({ collapsed }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [showAmharic, setShowAmharic] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // ✅ Continuous rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // ✅ Pulse animation
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.05 : 1));
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

  // ✅ Alternating between "A" and "አ" with flip effect
  useEffect(() => {
    const flipInterval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setShowAmharic((prev) => !prev);
        setIsFlipping(false);
      }, 300);
    }, 2000);

    return () => clearInterval(flipInterval);
  }, []);

  // ✅ Colors defined inside component to avoid ESLint errors
  const goldColor = "#f5c518";
  const primaryColor = "#1a3aad";
  const mutedTextColor = "#7a8fc8";

  if (collapsed) {
    return (
      <div
        style={{
          width: 38,
          height: 38,
          minWidth: 38,
          background: `linear-gradient(135deg, ${primaryColor}, ${goldColor})`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 900,
          color: "#fff",
          fontFamily: F.serif,
          animation: "pulseGlow 2s ease-in-out infinite",
          transform: `scale(${scale})`,
          transition: "transform 0.5s ease",
          perspective: "1000px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            transform: isFlipping ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.3s ease",
            transformStyle: "preserve-3d",
          }}
        >
          {showAmharic ? "አ" : "A"}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: 42,
          height: 42,
          minWidth: 42,
          background: `linear-gradient(135deg, ${primaryColor}, ${goldColor})`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 900,
          color: "#fff",
          fontFamily: F.serif,
          transform: isHovered
            ? `rotate(${rotation}deg) scale(1.15)`
            : `rotate(0deg) scale(${scale})`,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          boxShadow: isHovered
            ? `0 0 40px ${goldColor}66`
            : `0 4px 15px ${primaryColor}44`,
          animation: "pulseGlow 3s ease-in-out infinite",
          perspective: "1000px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            transform: isFlipping ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.3s ease",
            transformStyle: "preserve-3d",
            fontSize: "clamp(18px, 4vw, 24px)",
            fontWeight: 900,
            fontFamily: "'Noto Serif Ethiopic', serif",
          }}
        >
          {showAmharic ? "አ" : "A"}
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: F.serif,
            background: `linear-gradient(90deg, ${goldColor}, ${C.light}, ${primaryColor})`,
            backgroundSize: isHovered ? "200% 100%" : "100% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transition: "all 0.5s ease",
            letterSpacing: isHovered ? "3px" : "0px",
            animation: isHovered ? "shimmer 2s linear infinite" : "none",
          }}
        >
          A-MESOB
        </div>
        <div
          style={{
            fontSize: 9,
            color: mutedTextColor,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            opacity: isHovered ? 1 : 0.7,
            transition: "opacity 0.3s ease",
          }}
        >
          One-Stop · አዲስ መሶብ
        </div>
      </div>
    </div>
  );
};

// =============================================
// SIDEBAR COMPONENT
// =============================================
export default function Sidebar({
  lang,
  setLang,
  t,
  collapsed,
  setCollapsed,
  selectedTeam,
  setSelectedTeam,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [forumExpanded, setForumExpanded] = useState(false);
  const [teams, setTeams] = useState([]);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDepartment, setNewTeamDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, isAdminOrSuperAdmin, isLeader, isEmployee } = useAuth();
  const filteredNavItems = getFilteredNavItems(user?.role || "employee");

  // ✅ t is a function — call it with dot-path strings
  const safeT = (path, fallback = "") => {
    try {
      return t?.(path) || fallback;
    } catch {
      return fallback;
    }
  };

  // ✅ Define colors here
  const DARK_BG = "#0d1a5e";
  const BORDER_COLOR = "#1a3aad";
  const ACTIVE_BG = "#1a3aad33";
  const ACTIVE_TEXT = "#f5c518";
  const MUTED_TEXT = "#7a8fc8";
  const SECTION_BG = "#0f2070";
  const HOVER_BG = "#1a3aad22";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getAll();
      if (response.data && Array.isArray(response.data)) {
        let formattedTeams = response.data.map((team) => ({
          id: team._id,
          name: team.name,
          description: team.department || "",
          leader: team.leader?.name || "Not assigned",
          members: team.members || [],
          lastReport: team.updatedAt
            ? new Date(team.updatedAt).toLocaleDateString()
            : "No reports yet",
          reports: [],
          department: team.department,
        }));
        if ((isEmployee || isLeader) && user) {
          const userTeam = formattedTeams.find(
            (team) =>
              team.members?.includes(user.name) ||
              team.members?.includes(user._id) ||
              team.leader === user.name ||
              team.leader === user._id,
          );
          formattedTeams = userTeam ? [userTeam] : [];
        }
        setTeams(formattedTeams);
      }
    } catch (error) {
      console.error("❌ Failed to load teams:", error);
      const savedTeams = localStorage.getItem("forumTeams");
      if (savedTeams) {
        let parsedTeams = JSON.parse(savedTeams);
        if ((isEmployee || isLeader) && user) {
          const userTeam = parsedTeams.find(
            (team) =>
              team.members?.includes(user.name) ||
              team.members?.includes(user._id) ||
              team.leader === user.name ||
              team.leader === user._id,
          );
          parsedTeams = userTeam ? [userTeam] : [];
        }
        setTeams(parsedTeams);
      }
    } finally {
      setLoading(false);
    }
  }, [isEmployee, isLeader, user]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // ✅ Handle team click - navigate to forum with team context
  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    navigate("/forum");
  };

  // ✅ Handle navigation - uses React Router
  const handleNavClick = (tabId) => {
    setSelectedTeam(null);
    setForumExpanded(false);
    navigate(`/${tabId}`);
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      alert("Please enter a team name");
      return;
    }
    try {
      setLoading(true);
      const response = await teamAPI.create({
        name: newTeamName,
        department: newTeamDepartment,
      });
      setTeams((prev) => [
        ...prev,
        {
          id: response.data._id,
          name: response.data.name,
          description: response.data.department || "",
          leader: user?.name || "Current User",
          members: [],
          lastReport: "No reports yet",
          reports: [],
          department: response.data.department,
        },
      ]);
      setNewTeamName("");
      setNewTeamDepartment("");
      setShowAddTeamModal(false);
      setForumExpanded(true);
      await loadTeams();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to create team. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Nav item icon mapping
  // const getNavIcon = (id) => {
  //   const icons = {
  //     dashboard: <FiHome size={20} />,
  //     forum: <FiMessageSquare size={20} />,
  //     evaluation: <FiStar size={20} />,
  //     report: <FiFileText size={20} />,
  //     services: <FiGrid size={20} />,
  //     "admin/services": <FiSettings size={20} />,
  //     users: <FiUsersIcon size={20} />,
  //     teams: <FiUsers size={20} />,
  //     analytics: <FiBarChart2 size={20} />,
  //   };
  //   return icons[id] || <FiMenu size={20} />;
  // };
  const getNavIcon = (id) => {
    const icons = {
      dashboard: <FiHome size={20} />,
      forum: <FiMessageSquare size={20} />,
      evaluation: <FiStar size={20} />,
      report: <FiFileText size={20} />,
      services: <FiGrid size={20} />,
      "admin/services": <FiSettings size={20} />,
      users: <FiUsersIcon size={20} />,
      teams: <FiUsers size={20} />,
      analytics: <FiBarChart2 size={20} />,
      documents: <FiFileText size={20} />,
    };
    return icons[id] || <FiMenu size={20} />;
  };

  const sidebarWidth = collapsed ? 64 : isMobile ? 200 : 260;

  return (
    <aside
      style={{
        width: sidebarWidth,
        minHeight: "100vh",
        background: DARK_BG,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        borderRight: `2px solid ${BORDER_COLOR}`,
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(26,58,173,0.3); }
          50% { box-shadow: 0 0 40px rgba(245,197,24,0.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes flip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); }
          100% { transform: rotateY(180deg); }
        }
      `}</style>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: SECTION_BG,
          border: "none",
          color: MUTED_TEXT,
          padding: "14px 0",
          cursor: "pointer",
          fontSize: 16,
          borderBottom: `1px solid ${BORDER_COLOR}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3aad44")}
        onMouseLeave={(e) => (e.currentTarget.style.background = SECTION_BG)}
      >
        {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
      </button>

      {/* Animated Logo */}
      <div
        style={{
          padding: collapsed ? "18px 0" : "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: `1px solid ${BORDER_COLOR}33`,
        }}
      >
        <AnimatedLogo collapsed={collapsed} />
      </div>

      {/* Nav Label */}
      {!collapsed && (
        <div
          style={{
            padding: "12px 16px 6px",
            fontSize: 10,
            color: MUTED_TEXT,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {safeT("sidebar.main", "Main Menu")}
        </div>
      )}

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "6px 0" }}>
        {filteredNavItems.map((n) => {
          const isActive = location.pathname === `/${n.id}`;
          const isForum = n.id === "forum";
          const navLabel = safeT(`nav.${n.id}`, n.id);

          return (
            <div key={n.id}>
              <button
                onClick={() => {
                  if (isForum) {
                    setForumExpanded(!forumExpanded);
                    setSelectedTeam(null);
                    navigate("/forum");
                  } else {
                    handleNavClick(n.id);
                  }
                }}
                title={navLabel}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 12,
                  justifyContent: collapsed ? "center" : "space-between",
                  padding: collapsed
                    ? "12px 0"
                    : isMobile
                      ? "10px 16px"
                      : "11px 16px",
                  background: isActive ? ACTIVE_BG : "none",
                  border: "none",
                  borderLeft: isActive
                    ? `4px solid ${ACTIVE_TEXT}`
                    : "4px solid transparent",
                  color: isActive ? ACTIVE_TEXT : MUTED_TEXT,
                  cursor: "pointer",
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: F.sans,
                  transition: "all .18s",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = HOVER_BG;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 12,
                  }}
                >
                  <span style={{ fontSize: isMobile ? 18 : 20 }}>
                    {getNavIcon(n.id)}
                  </span>
                  {!collapsed && <span>{navLabel}</span>}
                </div>
                {isForum && !collapsed && (
                  <FiChevronDown
                    size={14}
                    style={{
                      transform: forumExpanded
                        ? "rotate(0deg)"
                        : "rotate(-90deg)",
                      transition: "transform 0.2s ease",
                      color: MUTED_TEXT,
                    }}
                  />
                )}
              </button>

              {/* Forum team list */}
              {isForum && forumExpanded && !collapsed && (
                <div
                  style={{
                    paddingLeft: 20,
                    paddingRight: 8,
                    marginTop: 4,
                    marginBottom: 8,
                    borderLeft: `2px solid ${BORDER_COLOR}33`,
                    marginLeft: 20,
                  }}
                >
                  {loading && (
                    <div
                      style={{
                        padding: "8px 12px",
                        color: MUTED_TEXT,
                        fontSize: 12,
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <FiLoader
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Loading...
                    </div>
                  )}
                  {!loading && teams.length === 0 && (
                    <div
                      style={{
                        padding: "8px 12px",
                        color: MUTED_TEXT,
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {isEmployee || isLeader
                        ? "You are not assigned to any team"
                        : "No teams yet"}
                    </div>
                  )}
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleTeamClick(team)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: isMobile ? "7px 10px" : "8px 12px",
                        margin: "3px 0",
                        background:
                          selectedTeam?.id === team.id ? ACTIVE_BG : "none",
                        border: "none",
                        borderRadius: 6,
                        borderLeft:
                          selectedTeam?.id === team.id
                            ? `3px solid ${ACTIVE_TEXT}`
                            : "3px solid transparent",
                        color:
                          selectedTeam?.id === team.id
                            ? ACTIVE_TEXT
                            : MUTED_TEXT,
                        cursor: "pointer",
                        fontSize: isMobile ? 12 : 13,
                        fontFamily: F.sans,
                        fontWeight: selectedTeam?.id === team.id ? 600 : 400,
                        transition: "all 0.15s",
                        lineHeight: 1.4,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = HOVER_BG;
                        e.currentTarget.style.color = ACTIVE_TEXT;
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTeam?.id !== team.id) {
                          e.currentTarget.style.background = "none";
                          e.currentTarget.style.color = MUTED_TEXT;
                        }
                      }}
                    >
                      <FiUsers size={12} />
                      {team.name.length > 18
                        ? team.name.substring(0, 16) + "…"
                        : team.name}
                      {(isEmployee || isLeader) &&
                        team.members?.includes(user?.name) && (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 8,
                              background: "#f5c518",
                              color: "#0d1a5e",
                              padding: "1px 6px",
                              borderRadius: 10,
                              fontWeight: 700,
                            }}
                          >
                            Your Team
                          </span>
                        )}
                    </button>
                  ))}
                  {isAdminOrSuperAdmin && (
                    <button
                      onClick={() => setShowAddTeamModal(true)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: isMobile ? "7px 10px" : "8px 12px",
                        marginTop: 6,
                        background: "none",
                        border: `1px dashed ${BORDER_COLOR}66`,
                        borderRadius: 6,
                        color: MUTED_TEXT,
                        cursor: "pointer",
                        fontSize: isMobile ? 12 : 13,
                        fontFamily: F.sans,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = HOVER_BG;
                        e.currentTarget.style.color = "#f5c518";
                        e.currentTarget.style.borderColor = "#f5c518";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = MUTED_TEXT;
                        e.currentTarget.style.borderColor = `${BORDER_COLOR}66`;
                      }}
                    >
                      <FiPlus size={14} style={{ fontWeight: "bold" }} />
                      Add Team
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div
        style={{
          borderTop: `1px solid ${BORDER_COLOR}33`,
          padding: collapsed ? "12px 0" : "14px 16px",
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: 10,
              color: MUTED_TEXT,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 10,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiGlobe size={12} />
            {safeT("sidebar.language", "Language")}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            gap: 6,
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            flexWrap: "wrap",
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              title={l.label}
              style={{
                background: lang === l.code ? "#f5c518" : "transparent",
                color: lang === l.code ? "#0d1a5e" : MUTED_TEXT,
                border: `1px solid ${lang === l.code ? "#f5c518" : `${BORDER_COLOR}55`}`,
                borderRadius: 5,
                padding: collapsed ? "5px 7px" : "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: F.sans,
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {l.flag}
              {!collapsed && l.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13,26,94,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowAddTeamModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 340,
              boxSizing: "border-box",
              border: `2px solid #f5c518`,
              boxShadow: "0 20px 60px rgba(13,26,94,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                marginBottom: 16,
                color: "#0d1a5e",
                fontSize: 18,
                fontFamily: F.sans,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FiUserPlus size={20} color={C.primary} />
              Add New Team
            </h3>
            <input
              type="text"
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 14,
                boxSizing: "border-box",
                fontFamily: F.sans,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border;
              }}
              onKeyPress={(e) => e.key === "Enter" && handleAddTeam()}
            />
            <input
              type="text"
              placeholder="Department (Optional)"
              value={newTeamDepartment}
              onChange={(e) => setNewTeamDepartment(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 14,
                boxSizing: "border-box",
                fontFamily: F.sans,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border;
              }}
              onKeyPress={(e) => e.key === "Enter" && handleAddTeam()}
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowAddTeamModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: F.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                }}
              >
                <FiX size={16} />
                Cancel
              </button>
              <button
                onClick={handleAddTeam}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  background: `linear-gradient(135deg, ${C.primary}, #f5c518)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                  fontFamily: F.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(26,58,173,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {loading ? (
                  <>
                    <FiLoader
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <FiCheck size={16} />
                    Add Team
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  );
}
