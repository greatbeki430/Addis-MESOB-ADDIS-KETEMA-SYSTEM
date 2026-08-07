// frontend/src/pages/Dashboard.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { C, F, card } from "../styles/theme";
import StatCard from "../components/ui/StatCard";
import { CRITERIA } from "../constants/criteria";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { dailyReportAPI, goldenMondayAPI } from "../services/api";
import { AIDashboardWidget } from "../components/ai";
import { dashboardTranslations } from "../constants/dashboard";
import {
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiAward,
  FiClock,
  FiTarget,
  FiZap,
} from "react-icons/fi";

export default function Dashboard({ t: tProp }) {
  const languageContext = useLanguage();
  const t = tProp || languageContext.t;

  const td = useCallback(
    (key, fb = "") => {
      const lang = languageContext.lang || "en";
      const dashboardT =
        dashboardTranslations[lang] || dashboardTranslations.en;
      return dashboardT[key] || fb;
    },
    [languageContext.lang],
  );

  // Fallback to main translations for common strings
  const tc = (key, fb = "") => t?.(`criteria.${key}`) || fb;
  const tcm = (key, fb = "") => t?.(`common.${key}`) || fb;

  const { user } = useAuth();
  const canvasRefs = useRef({});

  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    departments: [],
    weeklyTrend: [],
    monthlyData: [],
    dailyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    male: 0,
    female: 0,
  });
  const [goldenMondayStats, setGoldenMondayStats] = useState({
    totalSessions: 0,
    totalPresenters: 0,
    totalAttendees: 0,
    avgRating: 0,
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

  // ─── Load Dashboard Data ──────────────────────────────────────
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load daily reports
        const response = await dailyReportAPI.getAll();
        const data = response.data || [];

        // Calculate totals
        const total = data.reduce((sum, r) => sum + (r.total || 0), 0);
        const male = data.reduce((sum, r) => sum + (r.male || 0), 0);
        const female = data.reduce((sum, r) => sum + (r.female || 0), 0);

        // Department breakdown
        const deptMap = {};
        const deptMaleMap = {};
        const deptFemaleMap = {};
        data.forEach((r) => {
          if (r.dept) {
            deptMap[r.dept] = (deptMap[r.dept] || 0) + (r.total || 0);
            deptMaleMap[r.dept] = (deptMaleMap[r.dept] || 0) + (r.male || 0);
            deptFemaleMap[r.dept] =
              (deptFemaleMap[r.dept] || 0) + (r.female || 0);
          }
        });

        const departments = Object.entries(deptMap).map(([name, value]) => ({
          name,
          value,
          male: deptMaleMap[name] || 0,
          female: deptFemaleMap[name] || 0,
        }));

        // Generate weekly trend (last 7 days)
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const dayTotal = data
            .filter((r) => r.date && r.date.startsWith(dateStr))
            .reduce((sum, r) => sum + (r.total || 0), 0);
          weeklyTrend.push({
            date: dateStr,
            label: d.toLocaleDateString("en-US", { weekday: "short" }),
            value: dayTotal,
          });
        }

        // Monthly data (last 12 months)
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthStr = d.toISOString().slice(0, 7);
          const monthTotal = data
            .filter((r) => r.date && r.date.startsWith(monthStr))
            .reduce((sum, r) => sum + (r.total || 0), 0);
          monthlyData.push({
            month: d.toLocaleDateString("en-US", { month: "short" }),
            value: monthTotal,
          });
        }

        setStats({
          total,
          male,
          female,
          departments,
          weeklyTrend,
          monthlyData,
          dailyData: data,
        });

        // Load Golden Monday stats
        try {
          const gmResponse = await goldenMondayAPI.getStats();
          if (gmResponse.data) {
            setGoldenMondayStats({
              totalSessions: gmResponse.data.totalSessions || 0,
              totalPresenters: gmResponse.data.totalPresenters || 0,
              totalAttendees: gmResponse.data.totalAttendees || 0,
              avgRating: gmResponse.data.averageRating || 0,
            });
          }
        } catch (gmError) {
          console.error("Failed to load Golden Monday stats:", gmError);
        }

        // Start animations
        const timer1 = animateNumber(0, total, setAnimatedStats, "total");
        const timer2 = animateNumber(0, male, setAnimatedStats, "male");
        const timer3 = animateNumber(0, female, setAnimatedStats, "female");

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

  // ─── Draw Charts ──────────────────────────────────────────────
  useEffect(() => {
    if (loading || stats.departments.length === 0) return;

    // ✅ Define all chart drawing functions inside the effect or use useCallback
    const drawBarChart = () => {
      const canvas = canvasRefs.current.barChart;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 400;
      const height = 200;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const depts = stats.departments.slice(0, 6);
      const maxVal = Math.max(...depts.map((d) => d.value), 1);
      const padding = { top: 20, bottom: 30, left: 10, right: 10 };
      const chartWidth = width - padding.left - padding.right;
      const barWidth = (chartWidth / depts.length) * 0.6;
      const gap = (chartWidth / depts.length) * 0.4;

      depts.forEach((dept, i) => {
        const x = padding.left + i * (barWidth + gap);
        const barHeight =
          (dept.value / maxVal) * (height - padding.top - padding.bottom);
        const y = height - padding.bottom - barHeight;

        const grad = ctx.createLinearGradient(x, y, x, height - padding.bottom);
        const hue = (i * 45 + 200) % 360;
        grad.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
        grad.addColorStop(1, `hsl(${hue}, 70%, 70%)`);

        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, height - padding.bottom);
        ctx.lineTo(x, height - padding.bottom);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = "#333";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(dept.value, x + barWidth / 2, y - 6);

        ctx.fillStyle = "#666";
        ctx.font = "9px sans-serif";
        const label =
          dept.name.length > 8 ? dept.name.slice(0, 8) + ".." : dept.name;
        ctx.fillText(label, x + barWidth / 2, height - 6);
      });
    };

    const drawPieChart = () => {
      const canvas = canvasRefs.current.pieChart;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const size = Math.min(rect.width || 300, 300);
      const radius = size / 2 - 30;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const total = stats.total || 1;

      const colors = [
        "#4A90D9",
        "#50C878",
        "#FFD700",
        "#FF6B6B",
        "#9B59B6",
        "#1ABC9C",
        "#E67E22",
        "#3498DB",
      ];

      let startAngle = -Math.PI / 2;

      stats.departments.slice(0, 6).forEach((dept, i) => {
        const sliceAngle = (dept.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        if (sliceAngle > 0.1) {
          const midAngle = startAngle + sliceAngle / 2;
          const labelR = radius * 0.65;
          const x = centerX + Math.cos(midAngle) * labelR;
          const y = centerY + Math.sin(midAngle) * labelR;
          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const percent = Math.round((dept.value / total) * 100);
          if (percent > 5) {
            ctx.fillText(percent + "%", x, y);
          }
        }

        startAngle = endAngle;
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.45, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.fill();

      ctx.fillStyle = "#333";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(total, centerX, centerY - 6);
      ctx.fillStyle = "#888";
      ctx.font = "9px sans-serif";
      ctx.fillText(td("total"), centerX, centerY + 14);
    };

    const drawTrendChart = () => {
      const canvas = canvasRefs.current.trendChart;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 400;
      const height = 180;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const data = stats.weeklyTrend;
      if (data.length < 2) return;

      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const padding = { top: 10, bottom: 20, left: 5, right: 5 };
      const chartHeight = height - padding.top - padding.bottom;
      const chartWidth = width - padding.left - padding.right;
      const step = chartWidth / (data.length - 1);

      ctx.beginPath();
      data.forEach((d, i) => {
        const x = padding.left + i * step;
        const y = padding.top + chartHeight - (d.value / maxVal) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(
        padding.left + (data.length - 1) * step,
        height - padding.bottom,
      );
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.closePath();

      const grad = ctx.createLinearGradient(
        0,
        padding.top,
        0,
        height - padding.bottom,
      );
      grad.addColorStop(0, "rgba(74, 144, 217, 0.4)");
      grad.addColorStop(0.5, "rgba(74, 144, 217, 0.2)");
      grad.addColorStop(1, "rgba(74, 144, 217, 0.05)");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      data.forEach((d, i) => {
        const x = padding.left + i * step;
        const y = padding.top + chartHeight - (d.value / maxVal) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#4A90D9";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      data.forEach((d, i) => {
        const x = padding.left + i * step;
        const y = padding.top + chartHeight - (d.value / maxVal) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#4A90D9";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#888";
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(d.label, x, height - 4);

        if (d.value > 0) {
          ctx.fillStyle = "#333";
          ctx.font = "8px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(d.value, x, y - 8);
        }
      });
    };

    const drawDepartmentChart = () => {
      const canvas = canvasRefs.current.deptChart;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 400;
      const height = 180;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const depts = stats.departments.slice(0, 8);
      if (depts.length === 0) return;

      const maxVal = Math.max(...depts.map((d) => d.value), 1);
      const padding = { top: 10, bottom: 25, left: 80, right: 10 };
      const chartWidth = width - padding.left - padding.right;
      const barHeight = Math.min(
        (height - padding.top - padding.bottom) / depts.length,
        30,
      );
      const gap = 4;

      depts.forEach((dept, i) => {
        const y = padding.top + i * (barHeight + gap);
        const barWidth = (dept.value / maxVal) * chartWidth;

        const grad = ctx.createLinearGradient(
          padding.left,
          y,
          padding.left + barWidth,
          y,
        );
        const hue = (i * 35 + 200) % 360;
        grad.addColorStop(0, `hsl(${hue}, 70%, 45%)`);
        grad.addColorStop(1, `hsl(${hue}, 70%, 65%)`);

        const radius = 3;
        ctx.beginPath();
        ctx.moveTo(padding.left + radius, y);
        ctx.lineTo(padding.left + barWidth - radius, y);
        ctx.quadraticCurveTo(
          padding.left + barWidth,
          y,
          padding.left + barWidth,
          y + radius,
        );
        ctx.lineTo(padding.left + barWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(
          padding.left + barWidth,
          y + barHeight,
          padding.left + barWidth - radius,
          y + barHeight,
        );
        ctx.lineTo(padding.left + radius, y + barHeight);
        ctx.quadraticCurveTo(
          padding.left,
          y + barHeight,
          padding.left,
          y + barHeight - radius,
        );
        ctx.lineTo(padding.left, y + radius);
        ctx.quadraticCurveTo(padding.left, y, padding.left + radius, y);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = "#333";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const label =
          dept.name.length > 15 ? dept.name.slice(0, 15) + ".." : dept.name;
        ctx.fillText(label, padding.left - 6, y + barHeight / 2);

        ctx.fillStyle = "#555";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          dept.value,
          padding.left + barWidth + 6,
          y + barHeight / 2,
        );
      });
    };

    // ✅ Call all chart functions
    drawBarChart();
    drawPieChart();
    drawTrendChart();
    drawDepartmentChart();
  }, [loading, stats, td]);

  // ─── Helper: Get greeting ────────────────────────────────────
  const getGreetingKey = () => {
    const h = new Date().getHours();
    if (h < 12) return "greetingMorning";
    if (h < 18) return "greetingAfternoon";
    return "greetingEvening";
  };

  const getGreeting = () => {
    const key = getGreetingKey();
    return td(
      key,
      key === "greetingMorning"
        ? "🌅 Good morning"
        : key === "greetingAfternoon"
          ? "☀️ Good afternoon"
          : "🌙 Good evening",
    );
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "superadmin":
        return {
          bg: C.dark,
          color: C.gold,
          label: td("roleSuperAdmin", "Super Admin"),
          icon: "👑",
        };
      case "admin":
        return {
          bg: C.primary,
          color: "#fff",
          label: td("roleAdmin", "Admin"),
          icon: "⚙️",
        };
      case "leader":
        return {
          bg: C.orange,
          color: "#fff",
          label: td("roleTeamLeader", "Team Leader"),
          icon: "⭐",
        };
      default:
        return {
          bg: C.border,
          color: C.dark,
          label: td("roleEmployee", "Employee"),
          icon: "👤",
        };
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

  const aiStats = {
    totalUsers: 1,
    activeTeams: stats.departments.length,
    totalServicesLogged: stats.total,
    evaluationsCompleted: 0,
    topDepartment: stats.departments[0]?.name || "N/A",
    period: "this week",
  };

  const getLastLogin = () => {
    try {
      return new Date().toLocaleDateString();
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div style={{ width: "100%", padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <p style={{ color: C.muted }}>
          {tcm("loading", "Loading dashboard...")}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "clamp(12px, 3vw, 20px)",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* ─── WELCOME SECTION ───────────────────────────────────── */}
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
                  {td("welcomeMessage", "{greeting}, {userName}!")
                    .replace("{greeting}", greeting)
                    .replace("{userName}", userName)}
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
                {user?.email} •{" "}
                {td("lastLogin", "Last login: {date}").replace(
                  "{date}",
                  getLastLogin(),
                )}
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

      {/* ─── AI WIDGET ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <AIDashboardWidget stats={aiStats} refreshInterval={120000} />
      </div>

      {/* ─── STAT CARDS ──────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
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
        <StatCard
          label={td("totalPresented", "Presentations")}
          value={goldenMondayStats.totalPresenters}
          icon="🎤"
          color="#8B5CF6"
          loading={loading}
        />
        <StatCard
          label={td("avgRating", "Avg Rating")}
          value={goldenMondayStats.avgRating || 0}
          icon="⭐"
          color="#F59E0B"
          loading={loading}
        />
      </div>

      {/* ─── CHARTS SECTION ────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        {/* Trend Chart */}
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontSize: "clamp(13px, 3vw, 15px)",
                fontWeight: 700,
                color: C.dark,
                margin: 0,
              }}
            >
              <FiTrendingUp size={16} style={{ marginRight: 8 }} />
              {td("weeklyTrend", "Weekly Trend")}
            </h3>
            <span style={{ fontSize: 10, color: C.muted }}>
              {td("last7Days", "Last 7 days")}
            </span>
          </div>
          <div style={{ width: "100%", height: 180 }}>
            <canvas ref={(el) => (canvasRefs.current.trendChart = el)} />
          </div>
        </div>

        {/* Department Distribution */}
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontSize: "clamp(13px, 3vw, 15px)",
                fontWeight: 700,
                color: C.dark,
                margin: 0,
              }}
            >
              <FiBarChart2 size={16} style={{ marginRight: 8 }} />
              {td("deptDistribution", "Department Distribution")}
            </h3>
            <span style={{ fontSize: 10, color: C.muted }}>
              {td("topDepts", "Top departments")}
            </span>
          </div>
          <div style={{ width: "100%", height: 180 }}>
            <canvas ref={(el) => (canvasRefs.current.deptChart = el)} />
          </div>
        </div>
      </div>

      {/* ─── SECOND ROW CHARTS ────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        {/* Bar Chart */}
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontSize: "clamp(13px, 3vw, 15px)",
                fontWeight: 700,
                color: C.dark,
                margin: 0,
              }}
            >
              <FiActivity size={16} style={{ marginRight: 8 }} />
              {td("deptPerformance", "Department Performance")}
            </h3>
            <span style={{ fontSize: 10, color: C.muted }}>
              {td("byValue", "By value")}
            </span>
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <canvas ref={(el) => (canvasRefs.current.barChart = el)} />
          </div>
        </div>

        {/* Pie Chart */}
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontSize: "clamp(13px, 3vw, 15px)",
                fontWeight: 700,
                color: C.dark,
                margin: 0,
              }}
            >
              <FiPieChart size={16} style={{ marginRight: 8 }} />
              {td("distribution", "Distribution")}
            </h3>
            <span style={{ fontSize: 10, color: C.muted }}>
              {td("byDept", "By department")}
            </span>
          </div>
          <div
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <canvas ref={(el) => (canvasRefs.current.pieChart = el)} />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
              justifyContent: "center",
            }}
          >
            {stats.departments.slice(0, 6).map((dept, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: [
                      "#4A90D9",
                      "#50C878",
                      "#FFD700",
                      "#FF6B6B",
                      "#9B59B6",
                      "#1ABC9C",
                    ][i % 6],
                  }}
                />
                <span style={{ fontSize: 9, color: "#555" }}>{dept.name}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.dark }}>
                  {dept.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM SECTION ────────────────────────────────────── */}
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
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(13px, 4vw, 15px)",
              fontWeight: 700,
              color: C.dark,
            }}
          >
            <FiTarget size={16} style={{ marginRight: 8 }} />
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
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(13px, 4vw, 15px)",
              fontWeight: 700,
              color: C.dark,
            }}
          >
            <FiZap size={16} style={{ marginRight: 8 }} />
            {td("forumAgendas", "Standing Forum Agendas")}
          </h3>
          {Array.isArray(agendas) && agendas.length > 0 ? (
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
            ))
          ) : (
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
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(13px, 4vw, 15px)",
              fontWeight: 700,
              color: C.dark,
            }}
          >
            <FiClock size={16} style={{ marginRight: 8 }} />
            {td("quickStats", "Quick Stats")}
          </h3>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div
              style={{
                background: C.bg,
                padding: 12,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>
                {stats.total}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>
                {td("totalServices", "Total Services")}
              </div>
            </div>
            <div
              style={{
                background: C.bg,
                padding: 12,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>
                {stats.departments.length}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>
                {td("totalDepts", "Departments")}
              </div>
            </div>
            <div
              style={{
                background: C.bg,
                padding: 12,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>
                {goldenMondayStats.totalSessions}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>
                {td("goldenSessions", "Golden Sessions")}
              </div>
            </div>
            <div
              style={{
                background: C.bg,
                padding: 12,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: "#8B5CF6" }}>
                {goldenMondayStats.totalPresenters}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>
                {td("presenters", "Presenters")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CRITERIA OVERVIEW ────────────────────────────────── */}
      <div style={card}>
        <h3
          style={{
            margin: "0 0 20px",
            fontSize: "clamp(13px, 4vw, 15px)",
            fontWeight: 700,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          <FiAward size={16} style={{ marginRight: 8 }} />
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

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 4px 12px ${C.primary}44; }
          50% { box-shadow: 0 4px 24px ${C.primary}66; }
        }
      `}</style>
    </div>
  );
}
