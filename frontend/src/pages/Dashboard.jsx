// frontend/src/pages/Dashboard.jsx
// ════════════════════════════════════════════════════════════
// "Operations Panel" redesign — a civic command-center layout.
// Locked to the viewport on desktop (no page scroll); charts are
// custom canvas/SVG work tuned to a teal + brass institutional
// palette instead of generic card-stack styling.
//
// Refactor notes (this pass):
//  - Split into small, focused sub-components (Header, QuickStats
//    rail, TrendChart, DepartmentChart, DistributionDonut, Footer)
//    so each chart/section owns its own canvas ref + effect
//    instead of one monolithic component re-running every effect
//    on every state change.
//  - Gauge is now a top-level memoized component. Previously it was
//    declared *inside* Dashboard on every render, which meant React
//    treated it as a brand-new component type each render and
//    remounted the SVG circle — killing the CSS stroke-dashoffset
//    transition that was supposed to animate the ring.
//  - Canvas helpers (prepCanvas / drawNoData / roundRect) moved to
//    module scope — they don't touch component state, so recreating
//    them on every render served no purpose.
//  - Weekly/monthly bucketing used `Date#toISOString()` to build the
//    day/month key. toISOString() always converts to UTC, so for any
//    user east or west of UTC, dates close to midnight could bucket
//    into the wrong day (e.g. in UTC+3, 00:30 local rolls back to the
//    previous UTC day). Replaced with local-time formatting so "today"
//    always means the viewer's today.
//  - Department bar chart used a row-spacing formula
//    (`rowH + gap - gap / depts.length`) that doesn't evenly fill the
//    available height and can overlap rows for larger department
//    counts. Replaced with a straightforward evenly-spaced layout.
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
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
  FiAward,
  FiClock,
  FiTarget,
  FiZap,
  FiUsers,
  FiActivity,
} from "react-icons/fi";

// ── Instrument-panel design tokens ─────────────────────────────
// Extends the app's existing teal/gold brand rather than replacing
// it — deepened into a "control room" register: ink-teal ground,
// brass accent, misty sage neutrals, monospace for data readouts.
const T = {
  ink: "#0E241C",
  inkSoft: "#3D5A4E",
  panel: "#FFFFFF",
  canvas: "#EFF4F1",
  canvasDeep: "#E4ECE7",
  teal: "#146149",
  tealDeep: "#0A3B2A",
  tealBright: "#1E8A63",
  brass: "#C89B3C",
  brassLight: "#E4C878",
  clay: "#B5542E",
  mist: "#D8E3DD",
  white: "#FFFFFF",
  serif: "'Noto Serif Ethiopic', Georgia, serif",
  sans: "'Noto Sans Ethiopic', -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace",
};

const DONUT_COLORS = [
  "#146149",
  "#C89B3C",
  "#1E8A63",
  "#B5542E",
  "#3D6B8C",
  "#8B5A9E",
];

// ════════════════════════════════════════════════════════════
// Shared canvas helpers (module scope — stateless, no reason to
// recreate these on every render)
// ════════════════════════════════════════════════════════════
function prepCanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function drawNoData(ctx, width, height, label) {
  ctx.fillStyle = "rgba(14,36,28,0.28)";
  ctx.font = `500 13px ${T.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width / 2, height / 2);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, h / 2, Math.max(w, 0.01) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Local-time (not UTC) date keys, so "today" and "this month" line up
// with the viewer's own calendar regardless of timezone offset.
function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function localMonthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ════════════════════════════════════════════════════════════
// Gauge — small radial-ring stat readout (SVG)
// ════════════════════════════════════════════════════════════
const Gauge = memo(function Gauge({ value, max, label, icon, color, mono }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div className="op-gauge">
      <div className="op-gauge-ring">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke={T.mist}
            strokeWidth="5"
          />
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </svg>
        <span className="op-gauge-icon" style={{ color }}>
          {icon}
        </span>
      </div>
      <div className="op-gauge-text">
        <div className="op-gauge-value">{mono ?? value}</div>
        <div className="op-gauge-label">{label}</div>
      </div>
    </div>
  );
});

// ════════════════════════════════════════════════════════════
// QuickStatsRail — left column of gauges
// ════════════════════════════════════════════════════════════
const QuickStatsRail = memo(function QuickStatsRail({
  stats,
  goldenMondayStats,
  malePct,
  td,
}) {
  return (
    <aside className="op-rail op-rail-left">
      <div className="op-rail-title">
        <FiActivity size={13} /> {td("quickStats", "QUICK STATS")}
      </div>
      <Gauge
        value={stats.total}
        max={Math.max(stats.total, 50)}
        label={td("todayServices", "Today")}
        icon="◈"
        color={T.teal}
      />
      <Gauge
        value={malePct}
        max={100}
        label={`${td("male", "Male")} / ${td("female", "Female")}`}
        icon="◉"
        color={T.brass}
        mono={`${malePct}%`}
      />
      <Gauge
        value={stats.departments.length}
        max={Math.max(stats.departments.length, 8)}
        label={td("departments", "Depts")}
        icon="⬢"
        color={T.clay}
      />
      <Gauge
        value={goldenMondayStats.totalPresenters}
        max={Math.max(goldenMondayStats.totalPresenters, 10)}
        label={td("presenters", "Presenters")}
        icon="🎤"
        color="#3D6B8C"
      />
      <Gauge
        value={goldenMondayStats.avgRating || 0}
        max={5}
        label={td("avgRating", "Rating")}
        icon="★"
        color="#8B5A9E"
        mono={(goldenMondayStats.avgRating || 0).toFixed(1)}
      />
    </aside>
  );
});

// ════════════════════════════════════════════════════════════
// TrendChart — 7-day smooth area/line chart
// ════════════════════════════════════════════════════════════
const TrendChart = memo(function TrendChart({ data, loading, noDataLabel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 200;
    const ctx = prepCanvas(canvas, width, height);

    if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
      drawNoData(ctx, width, height, noDataLabel);
      return;
    }

    const pad = { top: 18, bottom: 26, left: 8, right: 8 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const step = data.length > 1 ? chartW / (data.length - 1) : 0;
    const pts = data.map((d, i) => ({
      x: pad.left + i * step,
      y: pad.top + chartH - (d.value / maxVal) * chartH,
    }));

    // horizontal guide lines
    ctx.strokeStyle = "rgba(14,36,28,0.06)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const gy = pad.top + (chartH / 3) * g;
      ctx.beginPath();
      ctx.moveTo(pad.left, gy);
      ctx.lineTo(width - pad.right, gy);
      ctx.stroke();
    }

    // smooth path via quadratic midpoints
    const buildSmoothPath = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      const last = pts[pts.length - 1];
      ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);
    };

    buildSmoothPath();
    ctx.lineTo(pts[pts.length - 1].x, height - pad.bottom);
    ctx.lineTo(pts[0].x, height - pad.bottom);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
    grad.addColorStop(0, "rgba(20,97,73,0.30)");
    grad.addColorStop(1, "rgba(20,97,73,0.02)");
    ctx.fillStyle = grad;
    ctx.fill();

    buildSmoothPath();
    ctx.strokeStyle = T.teal;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    pts.forEach((p, i) => {
      const isPeak = data[i].value === maxVal && maxVal > 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isPeak ? 4.5 : 3, 0, 2 * Math.PI);
      ctx.fillStyle = isPeak ? T.brass : T.teal;
      ctx.fill();
      ctx.strokeStyle = T.white;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = T.inkSoft;
      ctx.font = `600 9px ${T.mono}`;
      ctx.textAlign = "center";
      ctx.fillText(data[i].label.toUpperCase(), p.x, height - 8);

      if (data[i].value > 0) {
        ctx.fillStyle = isPeak ? T.brass : T.ink;
        ctx.font = `700 9px ${T.mono}`;
        ctx.fillText(data[i].value, p.x, p.y - 10);
      }
    });
  }, [data, loading, noDataLabel]);

  return (
    <div className="op-canvas-box">
      <canvas ref={canvasRef} />
    </div>
  );
});

// ════════════════════════════════════════════════════════════
// DepartmentChart — horizontal animated bars
// ════════════════════════════════════════════════════════════
const DepartmentChart = memo(function DepartmentChart({
  departments,
  loading,
  noDataLabel,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 220;

    const depts = departments.slice(0, 6);
    if (depts.length === 0) {
      const ctx = prepCanvas(canvas, width, height);
      drawNoData(ctx, width, height, noDataLabel);
      return;
    }

    const maxVal = Math.max(...depts.map((d) => d.value), 1);
    const pad = { top: 6, bottom: 6, left: 4, right: 46 };
    const labelW = 84;
    const valueW = 44;
    const barMaxW = width - pad.left - pad.right - labelW - valueW;
    // Evenly-spaced rows: each row gets an equal slice of the
    // available height, with a fixed gap eaten out of the bar
    // thickness rather than a fractional gap formula that could
    // overlap rows.
    const rowH = Math.min((height - pad.top - pad.bottom) / depts.length, 40);
    const barThickness = Math.max(rowH - 12, 8);

    let raf;
    let start = null;
    const duration = 650;

    const frame = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const ctx = prepCanvas(canvas, width, height);
      depts.forEach((dept, i) => {
        const rowTop = pad.top + i * rowH;
        const barY = rowTop + (rowH - barThickness) / 2;
        const barX = pad.left + labelW;
        const barW = (dept.value / maxVal) * barMaxW * eased;

        ctx.fillStyle = T.inkSoft;
        ctx.font = `600 10px ${T.sans}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const label =
          dept.name.length > 16 ? dept.name.slice(0, 16) + "…" : dept.name;
        ctx.fillText(label, pad.left, rowTop + rowH / 2);

        ctx.fillStyle = T.canvasDeep;
        roundRect(ctx, barX, barY, barMaxW, barThickness, barThickness / 2);
        ctx.fill();

        const barColor = i === 0 ? T.brass : T.teal;
        const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        grad.addColorStop(0, i === 0 ? T.brassLight : T.tealBright);
        grad.addColorStop(1, barColor);
        ctx.fillStyle = grad;
        roundRect(
          ctx,
          barX,
          barY,
          Math.max(barW, barThickness),
          barThickness,
          barThickness / 2,
        );
        ctx.fill();

        ctx.fillStyle = T.ink;
        ctx.font = `700 11px ${T.mono}`;
        ctx.textAlign = "left";
        ctx.fillText(
          Math.round(dept.value * eased),
          barX + barMaxW + 10,
          rowTop + rowH / 2,
        );
      });

      if (progress < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [departments, loading, noDataLabel]);

  return (
    <div className="op-canvas-box">
      <canvas ref={canvasRef} />
    </div>
  );
});

// ════════════════════════════════════════════════════════════
// DistributionDonut — rounded-cap ring segments + legend
// ════════════════════════════════════════════════════════════
const DistributionDonut = memo(function DistributionDonut({
  departments,
  total,
  loading,
  td,
  noDataLabel,
}) {
  const canvasRef = useRef(null);
  const depts = departments.slice(0, 6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width || 200, rect.height || 200, 210);
    const ctx = prepCanvas(canvas, size, size);

    if (depts.length === 0 || total === 0) {
      drawNoData(ctx, size, size, noDataLabel);
      return;
    }

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 14;
    const thickness = 16;
    let startAngle = -Math.PI / 2;
    const gapRad = 0.035;

    depts.forEach((dept, i) => {
      const sliceAngle =
        (dept.value / total) * (2 * Math.PI - gapRad * depts.length);
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = DONUT_COLORS[i % DONUT_COLORS.length];
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.stroke();
      startAngle = endAngle + gapRad;
    });

    ctx.fillStyle = T.ink;
    ctx.font = `700 22px ${T.mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy - 8);
    ctx.fillStyle = T.inkSoft;
    ctx.font = `600 9px ${T.sans}`;
    ctx.fillText(td("total", "TOTAL").toUpperCase(), cx, cy + 12);
  }, [depts, total, loading, td, noDataLabel]);

  return (
    <>
      <div className="op-donut-box">
        <canvas ref={canvasRef} />
      </div>
      <div className="op-legend">
        {depts.map((d, i) => (
          <div key={d.name} className="op-legend-item">
            <span
              className="op-legend-dot"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="op-legend-name">{d.name}</span>
            <span className="op-legend-val">{d.value}</span>
          </div>
        ))}
        {depts.length === 0 && (
          <div className="op-legend-empty">{noDataLabel}</div>
        )}
      </div>
    </>
  );
});

// ════════════════════════════════════════════════════════════
// DashboardHeader
// ════════════════════════════════════════════════════════════
const DashboardHeader = memo(function DashboardHeader({
  greeting,
  userName,
  userInitials,
  roleLabel,
  userEmail,
  aiStats,
  yearBadge,
}) {
  return (
    <header className="op-header">
      <div className="op-identity">
        <div className="op-avatar">{userInitials}</div>
        <div>
          <div className="op-greeting">
            {greeting}, <span className="op-name">{userName}</span>
          </div>
          <div className="op-role">
            {roleLabel} · {userEmail}
          </div>
        </div>
      </div>
      <div className="op-ai-ticker">
        <AIDashboardWidget stats={aiStats} refreshInterval={120000} />
      </div>
      <div className="op-date-badge">{yearBadge}</div>
    </header>
  );
});

// ════════════════════════════════════════════════════════════
// FooterStrip — criteria filmstrip + agenda chips
// ════════════════════════════════════════════════════════════
const FooterStrip = memo(function FooterStrip({ tc, td, agendas }) {
  return (
    <footer className="op-footer">
      <div className="op-filmstrip">
        <div className="op-filmstrip-title">
          <FiTarget size={12} /> {td("criteriaOverview", "Criteria")}
        </div>
        <div className="op-filmstrip-track">
          {CRITERIA.map((c) => (
            <div
              key={c.id}
              className="op-film-card"
              style={{ borderTopColor: c.color }}
            >
              <div className="op-film-pct" style={{ color: c.color }}>
                {c.weight}%
              </div>
              <div className="op-film-name">{tc(c.key, c.key)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="op-agenda">
        <div className="op-filmstrip-title">
          <FiZap size={12} /> {td("forumAgendas", "Agendas")}
        </div>
        <div className="op-agenda-track">
          {agendas.map((a, i) => (
            <span key={i} className="op-agenda-chip">
              <FiClock size={10} /> {a}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
});

// ════════════════════════════════════════════════════════════
// Dashboard — composes the sections above, owns data fetching
// ════════════════════════════════════════════════════════════
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

  const tc = useCallback((key, fb = "") => t?.(`criteria.${key}`) || fb, [t]);
  const tcm = useCallback((key, fb = "") => t?.(`common.${key}`) || fb, [t]);

  const { user } = useAuth();

  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    departments: [],
    weeklyTrend: [],
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [goldenMondayStats, setGoldenMondayStats] = useState({
    totalSessions: 0,
    totalPresenters: 0,
    totalAttendees: 0,
    avgRating: 0,
  });

  // ─── Load Dashboard Data ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dailyReportAPI.getAll();
        const data = response.data || [];

        // Fields live inside each report's entries[], not flat on the
        // report — grandTotal is the day total when present.
        const getReportTotal = (r) => {
          const entries = Array.isArray(r.entries) ? r.entries : [];
          return typeof r.grandTotal === "number"
            ? r.grandTotal
            : entries.reduce((sum, e) => sum + (e.total || 0), 0);
        };
        const getReportMale = (r) =>
          (Array.isArray(r.entries) ? r.entries : []).reduce(
            (sum, e) => sum + (e.male || 0),
            0,
          );
        const getReportFemale = (r) =>
          (Array.isArray(r.entries) ? r.entries : []).reduce(
            (sum, e) => sum + (e.female || 0),
            0,
          );

        const total = data.reduce((sum, r) => sum + getReportTotal(r), 0);
        const male = data.reduce((sum, r) => sum + getReportMale(r), 0);
        const female = data.reduce((sum, r) => sum + getReportFemale(r), 0);

        const deptMap = {};
        const deptMaleMap = {};
        const deptFemaleMap = {};
        data.forEach((r) => {
          const entries = Array.isArray(r.entries) ? r.entries : [];
          entries.forEach((e) => {
            if (!e.dept) return;
            deptMap[e.dept] = (deptMap[e.dept] || 0) + (e.total || 0);
            deptMaleMap[e.dept] = (deptMaleMap[e.dept] || 0) + (e.male || 0);
            deptFemaleMap[e.dept] =
              (deptFemaleMap[e.dept] || 0) + (e.female || 0);
          });
        });

        const departments = Object.entries(deptMap)
          .map(([name, value]) => ({
            name,
            value,
            male: deptMaleMap[name] || 0,
            female: deptFemaleMap[name] || 0,
          }))
          .sort((a, b) => b.value - a.value);

        // Bucket by *local* date, not UTC, so "today" always matches
        // the viewer's own calendar day regardless of timezone offset.
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = localDateKey(d);
          const dayTotal = data
            .filter((r) => r.date && r.date.startsWith(dateStr))
            .reduce((sum, r) => sum + getReportTotal(r), 0);
          weeklyTrend.push({
            date: dateStr,
            label: d.toLocaleDateString("en-US", { weekday: "short" }),
            value: dayTotal,
          });
        }

        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthStr = localMonthKey(d);
          const monthTotal = data
            .filter((r) => r.date && r.date.startsWith(monthStr))
            .reduce((sum, r) => sum + getReportTotal(r), 0);
          monthlyData.push({
            month: d.toLocaleDateString("en-US", { month: "short" }),
            value: monthTotal,
          });
        }

        if (!cancelled) {
          setStats({
            total,
            male,
            female,
            departments,
            weeklyTrend,
            monthlyData,
          });
        }

        try {
          const gmResponse = await goldenMondayAPI.getStats();
          if (!cancelled && gmResponse.data) {
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
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Helpers ────────────────────────────────────────────────
  const getGreetingKey = () => {
    const h = new Date().getHours();
    if (h < 12) return "greetingMorning";
    if (h < 18) return "greetingAfternoon";
    return "greetingEvening";
  };
  const greetingKey = getGreetingKey();
  const greeting = td(
    greetingKey,
    greetingKey === "greetingMorning"
      ? "Good morning"
      : greetingKey === "greetingAfternoon"
        ? "Good afternoon"
        : "Good evening",
  );
  const fullName = user?.name;
  const userName = fullName?.split(" ")[0] || "User";
  const userInitials = useMemo(() => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [fullName]);
  const roleLabel = useMemo(() => {
    switch (user?.role) {
      case "superadmin":
        return td("roleSuperAdmin", "Super Admin");
      case "admin":
        return td("roleAdmin", "Admin");
      case "leader":
        return td("roleTeamLeader", "Team Leader");
      default:
        return td("roleEmployee", "Employee");
    }
  }, [user?.role, td]);

  const genderTotal = stats.male + stats.female || 1;
  const malePct = Math.round((stats.male / genderTotal) * 100);
  const noDataLabel = td("noData", "No data available");

  const aiStats = useMemo(
    () => ({
      totalUsers: 1,
      activeTeams: stats.departments.length,
      totalServicesLogged: stats.total,
      evaluationsCompleted: 0,
      topDepartment: stats.departments[0]?.name || "N/A",
      period: "this week",
    }),
    [stats.departments, stats.total],
  );

  const agendas = t?.("agendas") || [];

  if (loading) {
    return (
      <div className="op-loading">
        <div className="op-loading-ring" />
        <p>{tcm("loading", "Loading dashboard...")}</p>
        <style>{loadingStyles}</style>
      </div>
    );
  }

  return (
    <div className="op-shell">
      <DashboardHeader
        greeting={greeting}
        userName={userName}
        userInitials={userInitials}
        roleLabel={roleLabel}
        userEmail={user?.email}
        aiStats={aiStats}
        yearBadge={t?.("year") || "2018 E.C."}
      />

      {/* ── MAIN GRID ── */}
      <div className="op-grid">
        <QuickStatsRail
          stats={stats}
          goldenMondayStats={goldenMondayStats}
          malePct={malePct}
          td={td}
        />

        {/* CENTER: charts */}
        <main className="op-center">
          <section className="op-panel op-panel-trend">
            <div className="op-panel-head">
              <span>
                <FiTrendingUp size={14} /> {td("weeklyTrend", "Weekly Trend")}
              </span>
              <span className="op-panel-sub">
                {td("last7Days", "Last 7 days")}
              </span>
            </div>
            <TrendChart
              data={stats.weeklyTrend}
              loading={loading}
              noDataLabel={noDataLabel}
            />
          </section>

          <section className="op-panel op-panel-dept">
            <div className="op-panel-head">
              <span>
                <FiBarChart2 size={14} />{" "}
                {td("deptPerformance", "Department Performance")}
              </span>
              <span className="op-panel-sub">{td("byValue", "By value")}</span>
            </div>
            <DepartmentChart
              departments={stats.departments}
              loading={loading}
              noDataLabel={noDataLabel}
            />
          </section>
        </main>

        {/* RIGHT: donut + tiles */}
        <aside className="op-rail op-rail-right">
          <section className="op-panel op-panel-donut">
            <div className="op-panel-head">
              <span>
                <FiPieChart size={14} /> {td("distribution", "Distribution")}
              </span>
            </div>
            <DistributionDonut
              departments={stats.departments}
              total={stats.total}
              loading={loading}
              td={td}
              noDataLabel={noDataLabel}
            />
          </section>

          <section className="op-tiles">
            <div className="op-tile">
              <FiUsers size={15} color={T.teal} />
              <div className="op-tile-val">
                {goldenMondayStats.totalSessions}
              </div>
              <div className="op-tile-label">
                {td("goldenSessions", "Sessions")}
              </div>
            </div>
            <div className="op-tile">
              <FiAward size={15} color={T.brass} />
              <div className="op-tile-val">{stats.departments.length}</div>
              <div className="op-tile-label">
                {td("totalDepts", "Departments")}
              </div>
            </div>
          </section>
        </aside>
      </div>

      <FooterStrip tc={tc} td={td} agendas={agendas} />

      <style>{shellStyles}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════
const loadingStyles = `
  .op-loading {
    height: 100vh; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 14px; background: ${T.canvas}; color: ${T.inkSoft};
    font-family: ${T.sans};
  }
  .op-loading-ring {
    width: 34px; height: 34px; border-radius: 50%;
    border: 3px solid ${T.mist}; border-top-color: ${T.teal};
    animation: op-spin 0.8s linear infinite;
  }
  @keyframes op-spin { to { transform: rotate(360deg); } }
`;

const shellStyles = `
  * { box-sizing: border-box; }
  .op-shell {
    background: ${T.canvas};
    color: ${T.ink};
    font-family: ${T.sans};
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 14px 18px 10px;
    gap: 10px;
    overflow: hidden;
  }

  /* HEADER */
  .op-header {
    display: flex; align-items: center; gap: 16px; flex-shrink: 0;
  }
  .op-identity { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .op-avatar {
    width: 40px; height: 40px; border-radius: 10px;
    background: linear-gradient(135deg, ${T.teal}, ${T.tealDeep});
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 14px; font-family: ${T.mono};
    box-shadow: 0 3px 10px rgba(10,59,42,0.25);
  }
  .op-greeting { font-family: ${T.serif}; font-size: 15px; font-weight: 700; color: ${T.ink}; }
  .op-name { color: ${T.teal}; }
  .op-role { font-size: 10.5px; color: ${T.inkSoft}; margin-top: 1px; }
  .op-ai-ticker { flex: 1; min-width: 0; max-height: 40px; overflow: hidden; border-radius: 10px; }
  .op-date-badge {
    flex-shrink: 0; background: ${T.tealDeep}; color: ${T.brassLight};
    font-family: ${T.mono}; font-size: 11px; font-weight: 700;
    padding: 6px 14px; border-radius: 20px; letter-spacing: 0.5px;
  }

  /* GRID */
  .op-grid {
    flex: 1; min-height: 0;
    display: grid;
    grid-template-columns: 190px 1fr 220px;
    gap: 10px;
  }

  .op-panel {
    background: ${T.panel};
    border: 1px solid ${T.mist};
    border-radius: 14px;
    padding: 10px 14px 8px;
    display: flex; flex-direction: column;
    min-height: 0;
  }
  .op-panel-head {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11.5px; font-weight: 700; color: ${T.ink};
    margin-bottom: 4px; flex-shrink: 0;
  }
  .op-panel-head svg { margin-right: 5px; vertical-align: -2px; color: ${T.teal}; }
  .op-panel-sub { font-size: 9.5px; color: ${T.inkSoft}; font-weight: 500; }
  .op-canvas-box { flex: 1; min-height: 0; position: relative; }
  .op-canvas-box canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

  /* LEFT RAIL — gauges */
  .op-rail-left {
    display: flex; flex-direction: column; gap: 6px;
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 14px;
    padding: 10px; overflow-y: auto;
  }
  .op-rail-title {
    font-size: 9.5px; font-weight: 800; letter-spacing: 0.6px;
    color: ${T.inkSoft}; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;
  }
  .op-gauge {
    display: flex; align-items: center; gap: 8px;
    background: ${T.canvas}; border-radius: 10px; padding: 6px 8px;
  }
  .op-gauge-ring { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
  .op-gauge-ring svg { width: 44px; height: 44px; }
  .op-gauge-icon {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 13px;
  }
  .op-gauge-text { min-width: 0; }
  .op-gauge-value { font-family: ${T.mono}; font-weight: 800; font-size: 15px; line-height: 1.1; }
  .op-gauge-label { font-size: 9px; color: ${T.inkSoft}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* CENTER */
  .op-center { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .op-panel-trend { flex: 1.05; }
  .op-panel-dept { flex: 1; }

  /* RIGHT RAIL */
  .op-rail-right { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .op-panel-donut { flex: 1.3; align-items: center; }
  .op-donut-box { width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
  .op-donut-box canvas { max-width: 100%; max-height: 100%; }
  .op-legend { width: 100%; display: flex; flex-direction: column; gap: 3px; margin-top: 4px; max-height: 84px; overflow-y: auto; }
  .op-legend-item { display: flex; align-items: center; gap: 6px; font-size: 10px; }
  .op-legend-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
  .op-legend-name { flex: 1; color: ${T.inkSoft}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .op-legend-val { font-family: ${T.mono}; font-weight: 700; color: ${T.ink}; }
  .op-legend-empty { font-size: 10px; color: ${T.inkSoft}; text-align: center; padding: 8px 0; }

  .op-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex-shrink: 0; }
  .op-tile {
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 12px;
    padding: 10px; text-align: center;
  }
  .op-tile-val { font-family: ${T.mono}; font-size: 18px; font-weight: 800; color: ${T.ink}; margin-top: 4px; }
  .op-tile-label { font-size: 9px; color: ${T.inkSoft}; font-weight: 600; margin-top: 1px; }

  /* FOOTER */
  .op-footer {
    flex-shrink: 0; display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px;
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 14px;
    padding: 8px 12px; height: 74px;
  }
  .op-filmstrip, .op-agenda { display: flex; flex-direction: column; min-width: 0; }
  .op-filmstrip-title {
    font-size: 9px; font-weight: 800; letter-spacing: 0.5px; color: ${T.inkSoft};
    display: flex; align-items: center; gap: 4px; margin-bottom: 4px;
  }
  .op-filmstrip-track { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
  .op-film-card {
    flex-shrink: 0; width: 92px; background: ${T.canvas}; border-radius: 8px;
    border-top: 3px solid ${T.teal}; padding: 5px 7px;
  }
  .op-film-pct { font-family: ${T.mono}; font-weight: 800; font-size: 13px; }
  .op-film-name { font-size: 8.5px; color: ${T.inkSoft}; line-height: 1.2; margin-top: 1px; }
  .op-agenda-track { display: flex; flex-wrap: wrap; gap: 4px; overflow-y: auto; align-content: flex-start; }
  .op-agenda-chip {
    display: inline-flex; align-items: center; gap: 4px;
    background: ${T.canvas}; color: ${T.inkSoft}; font-size: 9.5px; font-weight: 500;
    padding: 3px 8px; border-radius: 20px; white-space: nowrap;
  }

  /* RESPONSIVE — below this width the instrument-panel lock
     gives way to a normal scrollable stack; a fixed-height grid
     doesn't work on small screens. */
  @media (max-width: 980px) {
    .op-shell { height: auto; min-height: 100vh; overflow: visible; }
    .op-grid { grid-template-columns: 1fr; }
    .op-rail-left { flex-direction: row; flex-wrap: wrap; }
    .op-gauge { flex: 1 1 45%; }
    .op-footer { grid-template-columns: 1fr; height: auto; }
    .op-ai-ticker { display: none; }
  }
`;
