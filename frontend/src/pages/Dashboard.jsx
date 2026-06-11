import { C, F, card } from "../styles/theme";
import StatCard from "../components/ui/StatCard";
import { CRITERIA } from "../constants/criteria";
import { SAMPLE_DATA } from "../constants/sampleData";
import { useAuth } from "../context/AuthContext";

export default function Dashboard({ t }) {
  const td = t.dashboard;
  const { user } = useAuth(); // Get user from auth context

  const total = SAMPLE_DATA.reduce((a, r) => a + r.total, 0);
  const males = SAMPLE_DATA.reduce((a, r) => a + r.male, 0);
  const females = SAMPLE_DATA.reduce((a, r) => a + r.female, 0);
  const depts = SAMPLE_DATA.reduce((acc, r) => {
    acc[r.dept] = (acc[r.dept] || 0) + r.total;
    return acc;
  }, {});
  const maxD = Math.max(...Object.values(depts));

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅 Good morning";
    if (hour < 18) return "☀️ Good afternoon";
    return "🌙 Good evening";
  };

  // Get role badge styling
  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return { bg: "#dc2626", color: "#fff", label: "Admin", icon: "👑" };
      case "leader":
        return {
          bg: "#1a6b4a",
          color: "#fff",
          label: "Team Leader",
          icon: "⭐",
        };
      default:
        return { bg: "#e8f5ee", color: "#1a6b4a", label: "Member", icon: "👤" };
    }
  };

  const roleBadge = getRoleBadge(user?.role);
  const greeting = getGreeting();
  const userName = user?.name?.split(" ")[0] || "User"; // Get first name only

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{ width: "100%", padding: "20px" }}>
      {/* Welcome Section - Personalized */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary}08, ${C.light}08)`,
          borderRadius: 16,
          padding: "clamp(16px, 4vw, 24px)",
          marginBottom: 24,
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {/* User Avatar */}
            <div
              style={{
                width: "clamp(50px, 10vw, 64px)",
                height: "clamp(50px, 10vw, 64px)",
                background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(20px, 5vw, 28px)",
                fontWeight: 900,
                color: "#fff",
                boxShadow: `0 4px 12px ${C.primary}44`,
              }}
            >
              {getUserInitials()}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <h2
                  style={{
                    fontSize: "clamp(18px, 5vw, 24px)",
                    fontWeight: 800,
                    color: C.dark,
                    fontFamily: F.serif,
                    margin: 0,
                  }}
                >
                  {greeting}, {userName}!
                </h2>
                <span
                  style={{
                    background: roleBadge.bg,
                    color: roleBadge.color,
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "clamp(10px, 3vw, 12px)",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{roleBadge.icon}</span>
                  {roleBadge.label}
                </span>
              </div>
              <p
                style={{
                  color: C.muted,
                  fontSize: "clamp(11px, 3vw, 13px)",
                  marginTop: 6,
                  fontFamily: F.sans,
                }}
              >
                {user?.email} • Last login: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Year Badge */}
          <span
            style={{
              background: C.primary,
              color: "#fff",
              padding: "3px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {t.year}
          </span>
        </div>
      </div>

      {/* Stat Cards - Fully Responsive to container width */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label={td.todayServices}
          value={total}
          icon="◈"
          color={C.primary}
        />
        <StatCard label={td.male} value={males} icon="◉" color={C.blue} />
        <StatCard label={td.female} value={females} icon="◉" color={C.purple} />
        <StatCard
          label={td.departments}
          value={Object.keys(depts).length}
          icon="⬢"
          color={C.orange}
        />
      </div>

      {/* Two Column Section - Fully Responsive */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        {/* Department Report */}
        <div style={card}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(13px, 4vw, 15px)",
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {td.deptReport}
          </h3>
          {Object.entries(depts).map(([dept, val]) => (
            <div key={dept} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(11px, 3.5vw, 12px)",
                    color: "#444",
                    fontFamily: F.sans,
                  }}
                >
                  {dept}
                </span>
                <span
                  style={{
                    fontSize: "clamp(11px, 3.5vw, 12px)",
                    fontWeight: 700,
                    color: C.dark,
                  }}
                >
                  {val}
                </span>
              </div>
              <div
                style={{
                  background: C.bg,
                  height: 8,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(val / maxD) * 100}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: `linear-gradient(90deg,${C.primary},${C.light})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Forum Agendas */}
        <div style={card}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(13px, 4vw, 15px)",
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {td.forumAgendas}
          </h3>
          {t.agendas.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  background: C.primary,
                  color: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(10px, 3vw, 11px)",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: "clamp(11px, 3.5vw, 12px)",
                  color: "#333",
                  fontFamily: F.sans,
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {a}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Criteria Overview - Fully Responsive */}
      <div style={card}>
        <h3
          style={{
            margin: "0 0 20px",
            fontSize: "clamp(13px, 4vw, 15px)",
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          {td.criteriaOverview}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
            gap: 12,
          }}
        >
          {CRITERIA.map((c) => (
            <div
              key={c.id}
              style={{
                background: C.cardBg,
                borderRadius: 10,
                padding: "14px 10px",
                textAlign: "center",
                borderTop: `4px solid ${c.color}`,
              }}
            >
              <div
                style={{
                  fontSize: "clamp(18px, 5vw, 26px)",
                  fontWeight: 900,
                  color: c.color,
                  marginBottom: 6,
                }}
              >
                {c.weight}%
              </div>
              <div
                style={{
                  fontSize: "clamp(10px, 3.5vw, 11px)",
                  fontWeight: 700,
                  color: "#222",
                  fontFamily: F.sans,
                  marginBottom: 4,
                  lineHeight: 1.3,
                }}
              >
                {t.criteria[c.key]}
              </div>
              <div style={{ fontSize: "9px", color: "#999", marginBottom: 8 }}>
                {c.titleEn}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: C.primary,
                  background: C.bg,
                  borderRadius: 20,
                  padding: "2px 8px",
                  display: "inline-block",
                }}
              >
                {c.items.length} {td.subCriteria}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
