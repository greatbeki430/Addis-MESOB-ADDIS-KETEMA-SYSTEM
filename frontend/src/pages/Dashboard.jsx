import { useState, useEffect } from "react";
import { C, F, card } from "../styles/theme";
import StatCard from "../components/ui/StatCard";
import { CRITERIA } from "../constants/criteria";
import { useAuth } from "../hooks/useAuth";
import { dailyReportAPI } from "../services/api";
import { AIDashboardWidget } from "../components/ai";

export default function Dashboard({ t }) {
  const td = (key, fb = "") => t?.(`dashboard.${key}`) || fb;
  const tc = (key, fb = "") => t?.(`criteria.${key}`) || fb;
  const tcm = (key, fb = "") => t?.(`common.${key}`) || fb;

  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    departments: [],
  });
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    male: 0,
    female: 0,
  });

  const animateNumber = (start, end, setter, key) => {
    const duration = 1000,
      steps = 30,
      increment = (end - start) / steps;
    let current = start,
      step = 0;
    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = end;
        clearInterval(timer);
      }
      setter((prev) => ({ ...prev, [key]: Math.round(current) }));
    }, duration / steps);
    return timer;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dailyReportAPI.getAll();
        const data = response.data || [];
        const total = data.reduce((sum, r) => sum + (r.total || 0), 0);
        const male = data.reduce((sum, r) => sum + (r.male || 0), 0);
        const female = data.reduce((sum, r) => sum + (r.female || 0), 0);
        const deptMap = {};
        data.forEach((r) => {
          if (r.dept) deptMap[r.dept] = (deptMap[r.dept] || 0) + (r.total || 0);
        });
        const departments = Object.entries(deptMap).map(([name, value]) => ({
          name,
          value,
        }));
        setStats({ total, male, female, departments });

        // Start animations
        const timer1 = animateNumber(0, total, setAnimatedStats, "total");
        const timer2 = animateNumber(0, male, setAnimatedStats, "male");
        const timer3 = animateNumber(0, female, setAnimatedStats, "female");

        // Clean up timers on unmount or when data changes
        return () => {
          clearInterval(timer1);
          clearInterval(timer2);
          clearInterval(timer3);
        };
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "🌅 Good morning";
    if (h < 18) return "☀️ Good afternoon";
    return "🌙 Good evening";
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "superadmin":
        return { bg: C.dark, color: C.gold, label: "Super Admin", icon: "👑" };
      case "admin":
        return { bg: C.primary, color: "#fff", label: "Admin", icon: "⚙️" };
      case "leader":
        return {
          bg: C.orange,
          color: "#fff",
          label: "Team Leader",
          icon: "⭐",
        };
      default:
        return { bg: C.border, color: C.dark, label: "Employee", icon: "👤" };
    }
  };

  const roleBadge = getRoleBadge(user?.role);
  const greeting = getGreeting();
  const userName = user?.name?.split(" ")[0] || "User";

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const maxDeptValue =
    stats.departments.length > 0
      ? Math.max(...stats.departments.map((d) => d.value))
      : 1;

  const agendas = t?.("agendas") || [];

  // ✅ Prepare stats for AI widget
  const aiStats = {
    totalUsers: 1,
    activeTeams: stats.departments.length,
    totalServicesLogged: stats.total,
    evaluationsCompleted: 0,
    topDepartment: stats.departments[0]?.name || "N/A",
    period: "this week",
  };

  return (
    <div style={{ width: "100%", padding: "20px" }}>
      {/* Welcome Section */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary}08, ${C.light}08)`,
          borderRadius: 16,
          padding: "clamp(16px, 4vw, 24px)",
          marginBottom: 24,
          border: `1px solid ${C.border}`,
          animation: "fadeInUp 0.5s ease",
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
                animation: "pulseGlow 3s ease-in-out infinite",
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
            {t?.("year") || "2018 E.C."}
          </span>
        </div>
      </div>

      {/* ✅ AI Dashboard Widget with auto-refresh */}
      {!loading && (
        <div style={{ marginBottom: 24 }}>
          <AIDashboardWidget
            stats={aiStats}
            refreshInterval={120000} // Refresh every 2 minutes
          />
        </div>
      )}

      {/* Stat Cards */}
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
          label={td("todayServices", "Today's Services")}
          value={animatedStats.total}
          icon="◈"
          color={C.primary}
          loading={loading}
        />
        <StatCard
          label={td("male", "Male")}
          value={animatedStats.male}
          icon="◉"
          color={C.light}
          loading={loading}
        />
        <StatCard
          label={td("female", "Female")}
          value={animatedStats.female}
          icon="◉"
          color={C.gold}
          loading={loading}
        />
        <StatCard
          label={td("departments", "Departments")}
          value={stats.departments.length}
          icon="⬢"
          color={C.orange}
          loading={loading}
        />
      </div>

      {/* Two Column */}
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
            {td("deptReport", "Daily Department Report")}
          </h3>
          {stats.departments.length === 0 ? (
            <p
              style={{
                color: C.muted,
                fontSize: 13,
                textAlign: "center",
                padding: 20,
              }}
            >
              {tcm("noData", "No data available")}
            </p>
          ) : (
            stats.departments.map(({ name, value }) => (
              <div key={name} style={{ marginBottom: 12 }}>
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
                    {name}
                  </span>
                  <span
                    style={{
                      fontSize: "clamp(11px, 3.5vw, 12px)",
                      fontWeight: 700,
                      color: C.dark,
                    }}
                  >
                    {value}
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
                      width: `${(value / maxDeptValue) * 100}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>
            ))
          )}
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
            {td("forumAgendas", "Standing Forum Agendas")}
          </h3>
          {Array.isArray(agendas) &&
            agendas.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  animation: `fadeInUp ${0.3 + i * 0.1}s ease`,
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

      {/* Criteria Overview */}
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
          {td("criteriaOverview", "Evaluation Criteria Overview")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
            gap: 12,
          }}
        >
          {CRITERIA.map((c, idx) => (
            <div
              key={c.id}
              style={{
                background: C.cardBg,
                borderRadius: 10,
                padding: "14px 10px",
                textAlign: "center",
                borderTop: `4px solid ${c.color}`,
                animation: `fadeInUp ${0.2 + idx * 0.1}s ease`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
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
                {tc(c.key, c.key)}
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
                {c.items.length} {td("subCriteria", "sub-criteria")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
