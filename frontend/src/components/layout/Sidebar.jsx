/* eslint-disable react-hooks/set-state-in-effect */
// ════════════════════════════════════════════════════════════
// components/layout/Sidebar
// ════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { C, F } from "../../styles/theme";
import { LANGUAGES } from "../../constants/translations";
import { ArrowDown01Icon } from "hugeicons-react";

const NAV = [
  { id: "dashboard", icon: "⬢" },
  { id: "forum", icon: "◈" },
  { id: "evaluation", icon: "◉" },
  { id: "report", icon: "◫" },
  { id: "services", icon: "◧" },
];

export default function Sidebar({
  tab,
  setTab,
  lang,
  setLang,
  t,
  collapsed,
  setCollapsed,
  selectedTeam,
  setSelectedTeam,
}) {
  const [forumExpanded, setForumExpanded] = useState(false);
  const [teams, setTeams] = useState([]);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Load teams from localStorage
  useEffect(() => {
    const savedTeams = localStorage.getItem("forumTeams");
    if (savedTeams) {
      setTeams(JSON.parse(savedTeams));
    } else {
      // Sample teams
      setTeams([
        {
          id: 1,
          name: "Customer Service Team",
          description: "Frontline customer support",
          leader: "Selam Tesfaye",
          members: ["Abebe", "Bekele", "Chaltu"],
          lastReport: "2024-03-15",
          reports: [],
        },
        {
          id: 2,
          name: "Technical Support Team",
          description: "IT and technical assistance",
          leader: "Dawit Mekonnen",
          members: ["Eden", "Fikru", "Genet"],
          lastReport: "2024-03-10",
          reports: [],
        },
        {
          id: 3,
          name: "Administration Team",
          description: "Office administration",
          leader: "Helen Assefa",
          members: ["Lemma", "Meron", "Nati"],
          lastReport: "2024-03-12",
          reports: [],
        },
      ]);
    }
  }, []);

  // Save teams to localStorage
  useEffect(() => {
    if (teams.length > 0) {
      localStorage.setItem("forumTeams", JSON.stringify(teams));
    }
  }, [teams]);

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setTab("forum");
  };

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      const newTeam = {
        id: Date.now(),
        name: newTeamName,
        description: "",
        leader: "",
        members: [],
        lastReport: "No reports yet",
        reports: [],
      };
      setTeams([...teams, newTeam]);
      setNewTeamName("");
      setShowAddTeamModal(false);
    }
  };

  return (
    <aside
      style={{
        width: collapsed ? 56 : window.innerWidth >= 768 ? 200 : 160, // ← Desktop: 200px, Mobile: 160px
        minHeight: "100vh",
        background: C.dark,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        borderRight: `2px solid ${C.primary}`,
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: "#162c1e",
          border: "none",
          color: "#4a7a5a",
          padding: "12px 0",
          cursor: "pointer",
          fontSize: 14,
          borderBottom: "1px solid #1a3a26",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a26")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#162c1e")}
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "16px 0" : "14px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
          borderBottom: "1px solid #1a3a26",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            minWidth: 32,
            background: `linear-gradient(135deg,${C.primary},${C.light})`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 900,
            color: "#fff",
            fontFamily: F.serif,
          }}
        >
          አ
        </div>
        {!collapsed && (
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: C.light,
                fontFamily: F.serif,
              }}
            >
              {t.appName}
            </div>
            <div style={{ fontSize: 8, color: "#6aaa88", letterSpacing: 0.3 }}>
              One-Stop
            </div>
          </div>
        )}
      </div>

      {/* Nav label */}
      {!collapsed && (
        <div
          style={{
            padding: "10px 12px 4px",
            fontSize: 9,
            color: "#4a7a5a",
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {t.sidebar.main}
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "4px 0" }}>
        {NAV.map((n) => {
          const active = tab === n.id && !(n.id === "forum" && selectedTeam);
          const isForum = n.id === "forum";

          return (
            <div key={n.id}>
              <button
                onClick={() => {
                  if (isForum) {
                    setForumExpanded(!forumExpanded);
                    setSelectedTeam(null);
                    setTab("forum");
                  } else {
                    setTab(n.id);
                    setSelectedTeam(null);
                    setForumExpanded(false);
                  }
                }}
                title={t.nav[n.id]}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? "center" : "space-between",
                  padding: collapsed ? "10px 0" : "8px 12px",
                  background: active ? "#1a6b4a22" : "none",
                  border: "none",
                  borderLeft: active
                    ? `3px solid ${C.light}`
                    : "3px solid transparent",
                  color: active ? C.light : "#7a9a88",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  fontFamily: F.sans,
                  transition: "all .18s",
                  marginBottom: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 10,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{n.icon}</span>
                  {!collapsed && <span>{t.nav[n.id]}</span>}
                </div>
                {isForum && !collapsed && (
                  <ArrowDown01Icon
                    size={12}
                    style={{
                      transform: forumExpanded
                        ? "rotate(0deg)"
                        : "rotate(-90deg)",
                      transition: "transform 0.2s ease",
                      color: "#4a7a5a",
                    }}
                  />
                )}
              </button>

              {/* Team list under Forum */}
              {isForum && forumExpanded && !collapsed && (
                <div style={{ paddingLeft: 28, marginTop: 4, marginBottom: 8 }}>
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleTeamClick(team)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "6px 8px",
                        margin: "2px 0",
                        background:
                          selectedTeam?.id === team.id ? "#1a6b4a22" : "none",
                        border: "none",
                        borderRadius: 4,
                        color:
                          selectedTeam?.id === team.id ? C.light : "#7a9a88",
                        cursor: "pointer",
                        fontSize: 10,
                        fontFamily: F.sans,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#1a6b4a22";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTeam?.id !== team.id) {
                          e.currentTarget.style.background = "none";
                        }
                      }}
                    >
                      {team.name.length > 12
                        ? team.name.substring(0, 10) + "..."
                        : team.name}
                    </button>
                  ))}

                  {/* Add Team button */}
                  <button
                    onClick={() => setShowAddTeamModal(true)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 8px",
                      marginTop: 4,
                      background: "none",
                      border: "none",
                      borderRadius: 4,
                      color: "#4a7a5a",
                      cursor: "pointer",
                      fontSize: 10,
                      fontFamily: F.sans,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#1a3a26";
                      e.currentTarget.style.color = C.light;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "#4a7a5a";
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: "bold" }}>+</span>{" "}
                    Add Team
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div
        style={{
          borderTop: "1px solid #1a3a26",
          padding: collapsed ? "10px 0" : "12px 12px",
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: 9,
              color: "#4a7a5a",
              fontWeight: 700,
              letterSpacing: 0.5,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {t.sidebar.language}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            gap: 4,
            alignItems: collapsed ? "center" : "center",
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
                background: lang === l.code ? C.primary : "transparent",
                color: lang === l.code ? "#fff" : "#5a8a6a",
                border: `1px solid ${lang === l.code ? C.primary : "#2a5a3a"}`,
                borderRadius: 4,
                padding: collapsed ? "4px 6px" : "3px 8px",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: F.sans,
                width: collapsed ? "auto" : "auto",
              }}
            >
              {l.flag}
            </button>
          ))}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddTeamModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              padding: 20,
              width: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16, color: C.dark }}>Add New Team</h3>
            <input
              type="text"
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                marginBottom: 16,
              }}
              onKeyPress={(e) => e.key === "Enter" && handleAddTeam()}
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowAddTeamModal(false)}
                style={{
                  padding: "6px 12px",
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeam}
                style={{
                  padding: "6px 12px",
                  background: C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Add Team
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
