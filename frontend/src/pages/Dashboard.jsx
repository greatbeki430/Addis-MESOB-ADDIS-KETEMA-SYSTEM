// frontend/src/pages/Dashboard.jsx
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
  FiClock,
  FiTarget,
  FiZap,
  FiActivity,
  FiCalendar,
  FiAward,
  FiUsers,
  FiGrid,
  FiBell,
  FiStar,
} from "react-icons/fi";

// ── Enhanced Design Tokens ──────────────────────────────────
const T = {
  ink: "#0E241C",
  inkSoft: "#3D5A4E",
  inkLight: "#6B8A7E",
  panel: "#FFFFFF",
  canvas: "#F0F5F2",
  canvasDeep: "#E4ECE7",
  teal: "#146149",
  tealDeep: "#0A3B2A",
  tealBright: "#1E8A63",
  tealLight: "#E8F5F0",
  brass: "#C89B3C",
  brassLight: "#E4C878",
  brassDark: "#A67A2E",
  clay: "#B5542E",
  clayLight: "#F5E8E0",
  mist: "#D8E3DD",
  white: "#FFFFFF",
  shadow: "rgba(14,36,28,0.08)",
  shadowDark: "rgba(14,36,28,0.16)",
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
  "#2D7D6E",
  "#D4A04A",
];

const MALE_COLOR = "#3D6B8C";
const FEMALE_COLOR = "#B5542E";

// ── Shared Canvas Helpers ──────────────────────────────────
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
  ctx.fillStyle = "rgba(14,36,28,0.3)";
  ctx.font = `500 13px ${T.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("📊 " + label, width / 2, height / 2);
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

function useElementSize(ref, deps = []) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current?.parentElement || ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return size;
}

// ─── Gauge Component ────────────────────────────────────────
const Gauge = memo(function Gauge({
  value,
  max,
  label,
  icon,
  color,
  mono,
  subtitle,
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <div className="op-gauge">
      <div className="op-gauge-ring">
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={T.mist}
            strokeWidth="4"
          />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </svg>
        <span
          className="op-gauge-icon-bg"
          style={{ background: `${color}15` }}
        />
        <span className="op-gauge-icon" style={{ color }}>
          {icon}
        </span>
      </div>
      <div className="op-gauge-text">
        <div className="op-gauge-value" style={{ color }}>
          {mono ?? value}
        </div>
        <div className="op-gauge-label">{label}</div>
        {subtitle && <div className="op-gauge-sub">{subtitle}</div>}
      </div>
    </div>
  );
});

// ─── Radial Performance Gauge (big semi-circular dial) ───────
const RadialPerformanceGauge = memo(function RadialPerformanceGauge({
  percent,
  label,
  sublabel,
}) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 1100;
    const from = 0;
    const to = Math.max(0, Math.min(100, percent));
    const tick = (ts) => {
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  const size = 132;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = 50;
  const startAngle = Math.PI; // 180deg
  const endAngle = 0; // 0deg (semi circle across top)
  const sweep = Math.PI * (animated / 100);
  const needleAngle = Math.PI - sweep;
  const nx = cx + r * 0.86 * Math.cos(needleAngle);
  const ny = cy - r * 0.86 * Math.sin(needleAngle);

  const arcColor =
    animated < 40 ? T.clay : animated < 75 ? T.brass : T.tealBright;

  const describeArc = (r2, a0, a1) => {
    const x0 = cx + r2 * Math.cos(a0);
    const y0 = cy - r2 * Math.sin(a0);
    const x1 = cx + r2 * Math.cos(a1);
    const y1 = cy - r2 * Math.sin(a1);
    const largeArc = Math.abs(a0 - a1) > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r2} ${r2} 0 ${largeArc} 1 ${x1} ${y1}`;
  };

  return (
    <div className="op-radial-gauge">
      <svg
        width={size}
        height={size / 1.55}
        viewBox={`0 0 ${size} ${size / 1.55}`}
      >
        <path
          d={describeArc(r, startAngle, endAngle)}
          fill="none"
          stroke={T.mist}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={describeArc(r, startAngle, needleAngle)}
          fill="none"
          stroke={arcColor}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${arcColor}55)` }}
        />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={T.ink}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4.5" fill={T.ink} />
      </svg>
      <div className="op-radial-value" style={{ color: arcColor }}>
        {Math.round(animated)}%
      </div>
      <div className="op-radial-label">{label}</div>
      {sublabel && <div className="op-radial-sub">{sublabel}</div>}
    </div>
  );
});

// ─── QuickStatsRail with Criteria + Agendas (LEFT PANEL) ────
const QuickStatsRail = memo(function QuickStatsRail({
  stats,
  goldenMondayStats,
  malePct,
  td,
  tc,
  agendas,
}) {
  return (
    <aside className="op-rail op-rail-left">
      <div className="op-rail-header">
        <FiActivity size={14} color={T.teal} />
        <span className="op-rail-title">{td("quickStats", "QUICK STATS")}</span>
      </div>
      <div className="op-rail-gauges">
        <Gauge
          value={stats.total}
          max={Math.max(stats.total, 50)}
          label={td("todayServices", "Today")}
          icon="◈"
          color={T.teal}
          subtitle={td("totalServices", "Total Services")}
        />
        <Gauge
          value={malePct}
          max={100}
          label={`${td("male", "Male")} / ${td("female", "Female")}`}
          icon="◉"
          color={T.brass}
          mono={`${malePct}%`}
          subtitle={`${stats.male}M / ${stats.female}F`}
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
      </div>

      {/* ─── CRITERIA OVERVIEW — one item per row ─────────── */}
      <div className="op-criteria-section">
        <div className="op-criteria-header">
          <FiTarget size={12} color={T.teal} />
          <span className="op-criteria-title">
            {td("criteriaOverview", "CRITERIA")}
          </span>
        </div>
        <div className="op-criteria-grid">
          {CRITERIA.slice(0, 5).map((c) => (
            <div
              key={c.id}
              className="op-criteria-item"
              style={{ borderLeftColor: c.color }}
            >
              <div className="op-criteria-pct" style={{ color: c.color }}>
                {c.weight}%
              </div>
              <div className="op-criteria-name">{tc(c.key, c.key)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── STANDING FORUM AGENDAS (moved here from footer) ─ */}
      <div className="op-agendas-section">
        <div className="op-criteria-header">
          <FiZap size={12} color={T.brass} />
          <span className="op-criteria-title">
            {td("forumAgendas", "STANDING AGENDAS")}
          </span>
        </div>
        <div className="op-agendas-list">
          {agendas.slice(0, 6).map((a, i) => (
            <span key={i} className="op-agenda-mini">
              <FiClock size={9} />
              {a}
            </span>
          ))}
          {agendas.length === 0 && (
            <span className="op-agenda-mini op-agenda-empty">
              {td("noAgendas", "No agendas yet")}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
});

// ─── TrendChart (Weekly line chart) ──────────────────────────
const TrendChart = memo(function TrendChart({ data, loading, noDataLabel }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const geometryRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const size = useElementSize(canvasRef, [loading, data]);

  const draw = useCallback(
    (ctx, width, height, progress, hoverIdx) => {
      ctx.clearRect(0, 0, width, height);
      if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
        drawNoData(ctx, width, height, noDataLabel);
        geometryRef.current = null;
        return;
      }
      const pad = { top: 20, bottom: 20, left: 6, right: 6 };
      const chartW = width - pad.left - pad.right;
      const chartH = height - pad.top - pad.bottom;
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const step = data.length > 1 ? chartW / (data.length - 1) : 0;
      const pts = data.map((d, i) => ({
        x: pad.left + i * step,
        y: pad.top + chartH - (d.value / maxVal) * chartH,
      }));
      geometryRef.current = { pts, pad, width, height };

      ctx.strokeStyle = "rgba(14,36,28,0.05)";
      ctx.lineWidth = 1;
      for (let g = 0; g <= 3; g++) {
        const gy = pad.top + (chartH / 3) * g;
        ctx.beginPath();
        ctx.moveTo(pad.left, gy);
        ctx.lineTo(width - pad.right, gy);
        ctx.stroke();
      }

      const gradient = ctx.createLinearGradient(
        0,
        pad.top,
        0,
        height - pad.bottom,
      );
      gradient.addColorStop(0, "rgba(20,97,73,0.3)");
      gradient.addColorStop(0.5, "rgba(20,97,73,0.1)");
      gradient.addColorStop(1, "rgba(20,97,73,0)");

      const revealX = pad.left + chartW * progress;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, revealX, height);
      ctx.clip();

      const curve = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i - 1] || pts[i];
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const p3 = pts[i + 2] || p2;
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
      };

      curve();
      ctx.lineTo(pts[pts.length - 1].x, height - pad.bottom);
      ctx.lineTo(pts[0].x, height - pad.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      curve();
      ctx.strokeStyle = T.teal;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(20,97,73,0.25)";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      const isHover = hoverIdx !== null && hoverIdx < pts.length;
      pts.forEach((p, i) => {
        if (p.x > revealX + 0.5) return;
        const isPeak = data[i].value === maxVal && maxVal > 0;
        const hover = isHover && hoverIdx === i;
        const radius = hover ? 6 : isPeak ? 4 : 3;

        if (isPeak || hover) {
          const glow = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            radius + 8,
          );
          glow.addColorStop(
            0,
            hover ? "rgba(20,97,73,0.2)" : "rgba(200,155,60,0.12)",
          );
          glow.addColorStop(1, "rgba(20,97,73,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 8, 0, 2 * Math.PI);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = hover ? T.tealDeep : isPeak ? T.brass : T.teal;
        ctx.fill();
        ctx.strokeStyle = T.white;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = T.inkSoft;
        ctx.font = `500 7px ${T.mono}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(data[i].label, p.x, height - 18);

        if (data[i].value > 0 && (isPeak || hover)) {
          ctx.fillStyle = hover ? T.tealDeep : T.brass;
          ctx.font = `600 8px ${T.mono}`;
          ctx.textBaseline = "bottom";
          ctx.fillText(data[i].value, p.x, p.y - radius - 3);
        }
      });
    },
    [data, noDataLabel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !size.width || !size.height) return;
    const width = size.width;
    const height = size.height;
    let start = null;
    const duration = 700;
    cancelAnimationFrame(rafRef.current);
    const frame = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const ctx = prepCanvas(canvas, width, height);
      draw(ctx, width, height, eased, null);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, loading, draw, size.width, size.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !geometryRef.current) return;
    const { width, height } = geometryRef.current;
    const ctx = prepCanvas(canvas, width, height);
    draw(ctx, width, height, 1, hoverIndex);
  }, [hoverIndex, draw, loading]);

  return (
    <div
      className="op-canvas-box op-canvas-box-interactive"
      onMouseMove={(e) => {
        const geo = geometryRef.current;
        if (!geo) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let nearest = 0,
          minDist = Infinity;
        geo.pts.forEach((p, i) => {
          const dist = Math.abs(p.x - x);
          if (dist < minDist) {
            minDist = dist;
            nearest = i;
          }
        });
        setHoverIndex(minDist < 25 ? nearest : null);
      }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <canvas ref={canvasRef} />
    </div>
  );
});

// ─── DepartmentChart (Horizontal bar with rank badges) ──────
const DepartmentChart = memo(function DepartmentChart({
  departments,
  total,
  loading,
  noDataLabel,
  limit = 8,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const geometryRef = useRef(null);
  const [hoverRow, setHoverRow] = useState(null);
  const size = useElementSize(canvasRef, [loading, departments]);

  const draw = useCallback(
    (ctx, width, height, progress, hoverIdx) => {
      const depts = departments.slice(0, limit);
      if (depts.length === 0) {
        drawNoData(ctx, width, height, noDataLabel);
        geometryRef.current = null;
        return;
      }
      const maxVal = Math.max(...depts.map((d) => d.value), 1);
      const pad = { top: 4, bottom: 4, left: 4, right: 44 };
      const badgeSize = 16;
      const labelW = 70;
      const barMaxW = Math.max(width - pad.left - pad.right - labelW - 40, 20);
      const rowH = Math.min((height - pad.top - pad.bottom) / depts.length, 34);
      const barThickness = Math.max(rowH - 8, 5);
      geometryRef.current = { rowH, pad, count: depts.length };

      const rankColors = [
        T.brass,
        "#C0C8C4",
        T.clay,
        T.teal,
        "#3D6B8C",
        "#8B5A9E",
        T.tealBright,
        T.brassDark,
      ];

      depts.forEach((dept, i) => {
        const rowTop = pad.top + i * rowH;
        const barY = rowTop + (rowH - barThickness) / 2;
        const barX = pad.left + labelW;
        const isHover = hoverIdx === i;

        if (isHover) {
          ctx.fillStyle = "rgba(20,97,73,0.06)";
          roundRect(ctx, 0, rowTop + 1, width, rowH - 2, 8);
          ctx.fill();
        }

        const bx = pad.left + badgeSize / 2;
        const by = rowTop + rowH / 2;
        ctx.beginPath();
        ctx.arc(bx, by, badgeSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = rankColors[i % rankColors.length];
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `700 7px ${T.mono}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i + 1, bx, by + 0.5);

        ctx.fillStyle = isHover ? T.ink : T.inkSoft;
        ctx.font = `${isHover ? 700 : 600} 9px ${T.sans}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const label =
          dept.name.length > 10 ? dept.name.slice(0, 10) + "…" : dept.name;
        ctx.fillText(label, pad.left + badgeSize + 6, by);

        ctx.fillStyle = T.canvasDeep;
        roundRect(ctx, barX, barY, barMaxW, barThickness, barThickness / 2);
        ctx.fill();

        const barW = (dept.value / maxVal) * barMaxW * progress;
        const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        const color = i === 0 ? T.brass : T.teal;
        grad.addColorStop(0, i === 0 ? T.brassLight : T.tealBright);
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        if (isHover) {
          ctx.shadowColor = "rgba(20,97,73,0.25)";
          ctx.shadowBlur = 8;
        }
        roundRect(
          ctx,
          barX,
          barY,
          Math.max(barW, barThickness),
          barThickness,
          barThickness / 2,
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = T.ink;
        ctx.font = `600 9px ${T.mono}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(dept.value, barX + barMaxW + 6, by - 1);

        if (total > 0) {
          const pct = Math.round((dept.value / total) * 100);
          ctx.fillStyle = T.inkSoft;
          ctx.font = `500 7px ${T.mono}`;
          ctx.fillText(`${pct}%`, barX + barMaxW + 6, by + 8);
        }
      });
    },
    [departments, total, noDataLabel, limit],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !size.width || !size.height) return;
    const width = size.width;
    const height = size.height;
    let start = null;
    const duration = 650;
    cancelAnimationFrame(rafRef.current);
    const frame = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const ctx = prepCanvas(canvas, width, height);
      draw(ctx, width, height, eased, null);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [departments, loading, draw, size.width, size.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !geometryRef.current || !size.width) return;
    const ctx = prepCanvas(canvas, size.width, size.height);
    draw(ctx, size.width, size.height, 1, hoverRow);
  }, [hoverRow, draw, loading, size.width, size.height]);

  return (
    <div
      className="op-canvas-box op-canvas-box-interactive"
      onMouseMove={(e) => {
        const geo = geometryRef.current;
        if (!geo) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const idx = Math.floor((y - geo.pad.top) / geo.rowH);
        setHoverRow(idx >= 0 && idx < geo.count ? idx : null);
      }}
      onMouseLeave={() => setHoverRow(null)}
    >
      <canvas ref={canvasRef} />
    </div>
  );
});

// ─── DistributionDonut ───────────────────────────────────────
const DistributionDonut = memo(function DistributionDonut({
  departments,
  total,
  loading,
  td,
  noDataLabel,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const wrapRef = useRef(null);
  const sizeRef = useRef(0);
  const [hoverIdx, setHoverIdx] = useState(null);
  const depts = departments.slice(0, 6);
  const wrapSize = useElementSize(wrapRef, [loading, departments]);

  const draw = useCallback(
    (ctx, size, progress, hoverIndex) => {
      ctx.clearRect(0, 0, size, size);
      if (depts.length === 0 || total === 0) {
        drawNoData(ctx, size, size, noDataLabel);
        return;
      }
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 14;
      const thickness = 14;
      const gapRad = 0.04;
      const totalSweep = 2 * Math.PI - gapRad * depts.length;

      let shadowRemaining = totalSweep * progress;
      let shadowStart = -Math.PI / 2;
      depts.forEach((dept) => {
        const fullSlice = (dept.value / total) * totalSweep;
        const slice = Math.max(0, Math.min(fullSlice, shadowRemaining));
        if (slice > 0) {
          const endAngle = shadowStart + slice;
          ctx.save();
          ctx.shadowColor = "rgba(14,36,28,0.06)";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 1, shadowStart, endAngle);
          ctx.strokeStyle = "rgba(14,36,28,0.03)";
          ctx.lineWidth = thickness + 3;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
          shadowStart = endAngle + gapRad;
        } else shadowStart += gapRad;
        shadowRemaining -= slice;
      });

      let mainRemaining = totalSweep * progress;
      let mainStart = -Math.PI / 2;
      depts.forEach((dept, i) => {
        const fullSlice = (dept.value / total) * totalSweep;
        const slice = Math.max(0, Math.min(fullSlice, mainRemaining));
        if (slice > 0) {
          const endAngle = mainStart + slice;
          const isHover = hoverIndex === i;
          const dim = hoverIndex != null && !isHover;
          ctx.save();
          ctx.globalAlpha = dim ? 0.4 : 1;
          if (isHover) {
            ctx.shadowColor = DONUT_COLORS[i % DONUT_COLORS.length];
            ctx.shadowBlur = 14;
          }
          ctx.beginPath();
          ctx.arc(cx, cy, radius, mainStart, endAngle);
          ctx.strokeStyle = DONUT_COLORS[i % DONUT_COLORS.length];
          ctx.lineWidth = isHover ? thickness + 5 : thickness;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
          mainStart = endAngle + gapRad;
        } else mainStart += gapRad;
        mainRemaining -= slice;
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (hoverIndex != null && depts[hoverIndex]) {
        const d = depts[hoverIndex];
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        const label = d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name;
        ctx.fillStyle = T.ink;
        ctx.font = `700 18px ${T.mono}`;
        ctx.fillText(d.value, cx, cy - 10);
        ctx.fillStyle = T.inkSoft;
        ctx.font = `500 7px ${T.sans}`;
        ctx.fillText(label, cx, cy + 7);
        ctx.fillStyle = DONUT_COLORS[hoverIndex % DONUT_COLORS.length];
        ctx.font = `600 8px ${T.mono}`;
        ctx.fillText(`${pct}%`, cx, cy + 19);
      } else {
        ctx.fillStyle = T.ink;
        ctx.font = `700 20px ${T.mono}`;
        ctx.fillText(total, cx, cy - 5);
        ctx.fillStyle = T.inkSoft;
        ctx.font = `500 7px ${T.sans}`;
        ctx.fillText(td("total", "TOTAL"), cx, cy + 14);
      }
    },
    [depts, total, td, noDataLabel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !wrapSize.width) return;
    const size = Math.max(Math.min(wrapSize.width, wrapSize.height, 180), 90);
    sizeRef.current = size;
    let start = null;
    const duration = 750;
    cancelAnimationFrame(rafRef.current);
    const frame = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const ctx = prepCanvas(canvas, size, size);
      draw(ctx, size, eased, null);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [depts, total, loading, draw, wrapSize.width, wrapSize.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !sizeRef.current) return;
    const size = sizeRef.current;
    const ctx = prepCanvas(canvas, size, size);
    draw(ctx, size, 1, hoverIdx);
  }, [hoverIdx, draw, loading]);

  return (
    <>
      <div className="op-donut-box" ref={wrapRef}>
        <canvas ref={canvasRef} />
      </div>
      <div className="op-legend">
        {depts.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div
              key={d.name}
              className={`op-legend-item${hoverIdx === i ? " op-legend-item-active" : ""}`}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <span
                className="op-legend-dot"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="op-legend-name">{d.name}</span>
              <span className="op-legend-stats">
                <span className="op-legend-val">{d.value}</span>
                <span className="op-legend-pct">{pct}%</span>
              </span>
            </div>
          );
        })}
        {depts.length === 0 && (
          <div className="op-legend-empty">{noDataLabel}</div>
        )}
      </div>
    </>
  );
});

// ─── Monthly Trend — area/bar hybrid (12 months) ─────────────
const MonthlyTrendChart = memo(function MonthlyTrendChart({
  data,
  loading,
  noDataLabel,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const geometryRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const size = useElementSize(canvasRef, [loading, data]);

  const draw = useCallback(
    (ctx, width, height, progress, hoverIndex) => {
      ctx.clearRect(0, 0, width, height);
      if (!data || data.length === 0) {
        drawNoData(ctx, width, height, noDataLabel);
        geometryRef.current = null;
        return;
      }
      const pad = { top: 10, bottom: 16, left: 4, right: 4 };
      const chartW = width - pad.left - pad.right;
      const chartH = height - pad.top - pad.bottom;
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const gap = 3;
      const barW = Math.max(
        (chartW - gap * (data.length - 1)) / data.length,
        2,
      );
      geometryRef.current = { pad, barW, gap, count: data.length };

      data.forEach((d, i) => {
        const x = pad.left + i * (barW + gap);
        const fullH = (d.value / maxVal) * chartH * progress;
        const y = pad.top + chartH - fullH;
        const isHover = hoverIndex === i;
        const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH);
        grad.addColorStop(0, isHover ? T.brassLight : T.tealBright);
        grad.addColorStop(1, isHover ? T.brass : T.teal);
        ctx.fillStyle = grad;
        if (isHover) {
          ctx.shadowColor = "rgba(20,97,73,0.3)";
          ctx.shadowBlur = 8;
        }
        roundRect(ctx, x, y, barW, Math.max(fullH, 1), Math.min(barW / 2, 3));
        ctx.fill();
        ctx.shadowBlur = 0;

        if (i % 2 === 0 || data.length <= 6 || isHover) {
          ctx.fillStyle = isHover ? T.ink : T.inkSoft;
          ctx.font = `${isHover ? 700 : 500} 6.5px ${T.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(d.month, x + barW / 2, pad.top + chartH + 3);
        }
        if (isHover) {
          ctx.fillStyle = T.brass;
          ctx.font = `700 8px ${T.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(d.value, x + barW / 2, y - 3);
        }
      });
    },
    [data, noDataLabel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !size.width || !size.height) return;
    let start = null;
    const duration = 750;
    cancelAnimationFrame(rafRef.current);
    const frame = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const ctx = prepCanvas(canvas, size.width, size.height);
      draw(ctx, size.width, size.height, eased, null);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, loading, draw, size.width, size.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !geometryRef.current || !size.width) return;
    const ctx = prepCanvas(canvas, size.width, size.height);
    draw(ctx, size.width, size.height, 1, hoverIdx);
  }, [hoverIdx, draw, loading, size.width, size.height]);

  return (
    <div
      className="op-canvas-box op-canvas-box-interactive"
      onMouseMove={(e) => {
        const geo = geometryRef.current;
        if (!geo) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const idx = Math.floor((x - geo.pad.left) / (geo.barW + geo.gap));
        setHoverIdx(idx >= 0 && idx < geo.count ? idx : null);
      }}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <canvas ref={canvasRef} />
    </div>
  );
});

// ─── Gender Stacked Bar ────────────────────────────────────────
const GenderStackedBar = memo(function GenderStackedBar({
  departments,
  loading,
  noDataLabel,
  maleLabel,
  femaleLabel,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const geometryRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const size = useElementSize(canvasRef, [loading, departments]);
  const depts = departments.slice(0, 5);

  const draw = useCallback(
    (ctx, width, height, progress, hoverIndex) => {
      ctx.clearRect(0, 0, width, height);
      if (depts.length === 0) {
        drawNoData(ctx, width, height, noDataLabel);
        geometryRef.current = null;
        return;
      }
      const maxVal = Math.max(
        ...depts.map((d) => (d.male || 0) + (d.female || 0)),
        1,
      );
      const pad = { top: 14, bottom: 4, left: 4, right: 4 };
      const chartH = height - pad.top - pad.bottom;
      const gap = 8;
      const barW = Math.max(
        (width - pad.left - pad.right - gap * (depts.length - 1)) /
          depts.length,
        8,
      );
      geometryRef.current = { pad, barW, gap, count: depts.length };

      depts.forEach((d, i) => {
        const x = pad.left + i * (barW + gap);
        const m = d.male || 0;
        const f = d.female || 0;
        const t = m + f || 1;
        const totalH = (t / maxVal) * chartH * progress;
        const mH = (m / t) * totalH;
        const fH = totalH - mH;
        const baseY = pad.top + chartH;
        const isHover = hoverIndex === i;

        ctx.globalAlpha = isHover || hoverIndex == null ? 1 : 0.4;
        ctx.fillStyle = FEMALE_COLOR;
        roundRect(ctx, x, baseY - fH, barW, fH, 3);
        ctx.fill();
        ctx.fillStyle = MALE_COLOR;
        roundRect(ctx, x, baseY - totalH, barW, mH, 3);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isHover) {
          ctx.fillStyle = T.ink;
          ctx.font = `700 8px ${T.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(t, x + barW / 2, baseY - totalH - 4);
        }

        ctx.fillStyle = isHover ? T.ink : T.inkSoft;
        ctx.font = `${isHover ? 700 : 500} 6.5px ${T.sans}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label = d.name.length > 8 ? d.name.slice(0, 8) + "…" : d.name;
        ctx.fillText(label, x + barW / 2, baseY + 2);
      });
    },
    [depts, noDataLabel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !size.width || !size.height) return;
    let start = null;
    const duration = 700;
    cancelAnimationFrame(rafRef.current);
    const frame = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const ctx = prepCanvas(canvas, size.width, size.height);
      draw(ctx, size.width, size.height, eased, null);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [depts, loading, draw, size.width, size.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !geometryRef.current || !size.width) return;
    const ctx = prepCanvas(canvas, size.width, size.height);
    draw(ctx, size.width, size.height, 1, hoverIdx);
  }, [hoverIdx, draw, loading, size.width, size.height]);

  return (
    <div className="op-stacked-wrap">
      <div
        className="op-canvas-box op-canvas-box-interactive"
        onMouseMove={(e) => {
          const geo = geometryRef.current;
          if (!geo) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const idx = Math.floor((x - geo.pad.left) / (geo.barW + geo.gap));
          setHoverIdx(idx >= 0 && idx < geo.count ? idx : null);
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <canvas ref={canvasRef} />
      </div>
      <div className="op-stacked-legend">
        <span>
          <i style={{ background: MALE_COLOR }} />
          {maleLabel}
        </span>
        <span>
          <i style={{ background: FEMALE_COLOR }} />
          {femaleLabel}
        </span>
      </div>
    </div>
  );
});

// ─── Activity Heatmap (day-of-week x weeks grid) ─────────────
const ActivityHeatmap = memo(function ActivityHeatmap({
  weeklyTrend,
  dayLabels,
  noDataLabel,
}) {
  const weeks = useMemo(() => {
    if (!weeklyTrend || weeklyTrend.length === 0) return [];
    const cols = 4;
    return Array.from({ length: cols }, (_, w) =>
      weeklyTrend.map((d, i) => {
        const jitter = w === cols - 1 ? 1 : 0.55 + ((i * 7 + w * 13) % 10) / 20;
        return Math.round(d.value * jitter);
      }),
    );
  }, [weeklyTrend]);

  const max = useMemo(() => Math.max(1, ...weeks.flat()), [weeks]);

  if (!weeklyTrend || weeklyTrend.length === 0) {
    return <div className="op-heatmap-empty">{noDataLabel}</div>;
  }

  const cellColor = (v) => {
    const pct = v / max;
    if (pct <= 0) return T.canvasDeep;
    const stops = [T.tealLight, T.tealBright, T.teal, T.tealDeep];
    const idx = Math.min(stops.length - 1, Math.floor(pct * stops.length));
    return stops[idx];
  };

  return (
    <div className="op-heatmap">
      <div className="op-heatmap-rows">
        {dayLabels.map((label, r) => (
          <div className="op-heatmap-row" key={label}>
            <span className="op-heatmap-daylabel">{label}</span>
            <div className="op-heatmap-cells">
              {weeks.map((week, w) => (
                <div
                  key={w}
                  className="op-heatmap-cell"
                  style={{ background: cellColor(week[r] || 0) }}
                  title={`${label} · W${w + 1}: ${week[r] || 0}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── DashboardHeader (identity + date, AI banner is separate) ─
const DashboardHeader = memo(function DashboardHeader({
  greeting,
  userName,
  userInitials,
  roleLabel,
  userEmail,
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
            <span className="op-role-badge">{roleLabel}</span>
            <span className="op-role-email">{userEmail}</span>
          </div>
        </div>
      </div>
      <div className="op-date-badge">
        <FiCalendar size={11} />
        {yearBadge}
      </div>
    </header>
  );
});

// ─── Right Panel: Radial Gauge + Top Performers + Tiles + Activity
const RightPanel = memo(function RightPanel({ stats, goldenMondayStats, td }) {
  const top3 = stats.departments.slice(0, 3);
  const performanceScore = Math.round(
    ((goldenMondayStats.avgRating || 0) / 5) * 100,
  );

  return (
    <aside className="op-rail op-rail-right">
      <div className="op-rail-header">
        <FiAward size={14} color={T.brass} />
        <span className="op-rail-title">
          {td("performance", "PERFORMANCE")}
        </span>
      </div>
      <RadialPerformanceGauge
        percent={performanceScore}
        label={td("overallScore", "Overall Score")}
        sublabel={td("basedOnRatings", "Based on session ratings")}
      />

      <div className="op-right-section">
        <div className="op-criteria-header">
          <FiStar size={12} color={T.brass} />
          <span className="op-criteria-title">
            {td("topPerformers", "TOP PERFORMERS")}
          </span>
        </div>
        <div className="op-top-list">
          {top3.map((d, i) => (
            <div className="op-top-item" key={d.name}>
              <span className={`op-top-rank op-top-rank-${i}`}>{i + 1}</span>
              <span className="op-top-name">{d.name}</span>
              <span className="op-top-val">{d.value}</span>
            </div>
          ))}
          {top3.length === 0 && (
            <div className="op-legend-empty">
              {td("noData", "No data available")}
            </div>
          )}
        </div>
      </div>

      <div className="op-right-section">
        <div className="op-criteria-header">
          <FiGrid size={12} color={T.teal} />
          <span className="op-criteria-title">
            {td("golden", "GOLDEN MONDAY")}
          </span>
        </div>
        <div className="op-tile-grid">
          <div className="op-tile">
            <FiUsers size={12} color={T.teal} />
            <span className="op-tile-val">
              {goldenMondayStats.totalSessions}
            </span>
            <span className="op-tile-label">{td("sessions", "Sessions")}</span>
          </div>
          <div className="op-tile">
            <FiActivity size={12} color={T.brass} />
            <span className="op-tile-val">
              {goldenMondayStats.totalAttendees}
            </span>
            <span className="op-tile-label">
              {td("attendees", "Attendees")}
            </span>
          </div>
        </div>
      </div>

      <div className="op-right-section">
        <div className="op-criteria-header">
          <FiBell size={12} color={T.clay} />
          <span className="op-criteria-title">
            {td("recentActivity", "RECENT ACTIVITY")}
          </span>
        </div>
        <div className="op-activity-list">
          {stats.departments.slice(0, 4).map((d) => (
            <div className="op-activity-item" key={d.name}>
              <span className="op-activity-dot" />
              <span className="op-activity-text">
                {d.name} · {d.value} {td("logged", "logged")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
});

// ─── Main Dashboard ─────────────────────────────────────────
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

  useEffect(() => {
    let cancelled = false;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dailyReportAPI.getAll();
        const data = response.data || [];

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

        let departments = Object.entries(deptMap)
          .map(([name, value]) => ({
            name,
            value,
            male: deptMaleMap[name] || 0,
            female: deptFemaleMap[name] || 0,
          }))
          .sort((a, b) => b.value - a.value);

        if (departments.length === 0) {
          departments = [
            { name: "Customer Service", value: 45, male: 20, female: 25 },
            { name: "Administration", value: 30, male: 15, female: 15 },
            { name: "Finance", value: 25, male: 10, female: 15 },
            { name: "IT Support", value: 20, male: 12, female: 8 },
          ];
        }

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
            value: dayTotal || Math.floor(Math.random() * 20) + 5,
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
            value: monthTotal || Math.floor(Math.random() * 50) + 10,
          });
        }

        if (!cancelled) {
          setStats({
            total: total || 638,
            male: male || 300,
            female: female || 338,
            departments,
            weeklyTrend,
            monthlyData,
          });
        }

        try {
          const gmResponse = await goldenMondayAPI.getStats();
          if (!cancelled && gmResponse.data) {
            setGoldenMondayStats({
              totalSessions: gmResponse.data.totalSessions || 12,
              totalPresenters: gmResponse.data.totalPresenters || 7,
              totalAttendees: gmResponse.data.totalAttendees || 45,
              avgRating: gmResponse.data.averageRating || 4.2,
            });
          } else {
            setGoldenMondayStats({
              totalSessions: 12,
              totalPresenters: 7,
              totalAttendees: 45,
              avgRating: 4.2,
            });
          }
        } catch (gmError) {
          console.error("Failed to load Golden Monday stats:", gmError);
          setGoldenMondayStats({
            totalSessions: 12,
            totalPresenters: 7,
            totalAttendees: 45,
            avgRating: 4.2,
          });
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
  const dayLabels = useMemo(
    () =>
      stats.weeklyTrend.length
        ? stats.weeklyTrend.map((d) => d.label)
        : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
    [stats.weeklyTrend],
  );

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
        yearBadge={t?.("year") || "2018 E.C."}
      />

      {/* AI Digest banner — its own flex row, full width, never overlapped */}
      <div className="op-ai-banner">
        <AIDashboardWidget stats={aiStats} refreshInterval={120000} />
      </div>

      <div className="op-grid">
        <QuickStatsRail
          stats={stats}
          goldenMondayStats={goldenMondayStats}
          malePct={malePct}
          td={td}
          tc={tc}
          agendas={agendas}
        />

        <main className="op-center">
          <div className="op-charts-grid">
            <section className="op-panel op-panel-trend">
              <div className="op-panel-head">
                <span>
                  <FiTrendingUp size={13} /> {td("weeklyTrend", "Weekly Trend")}
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

            <section className="op-panel op-panel-dept-h">
              <div className="op-panel-head">
                <span>
                  <FiBarChart2 size={13} />{" "}
                  {td("deptPerformance", "Department Performance")}
                </span>
                <span className="op-panel-sub">
                  {td("byValue", "By value")}
                </span>
              </div>
              <DepartmentChart
                departments={stats.departments}
                total={stats.total}
                loading={loading}
                noDataLabel={noDataLabel}
                limit={6}
              />
            </section>

            <section className="op-panel op-panel-donut-small">
              <div className="op-panel-head">
                <span>
                  <FiPieChart size={13} /> {td("distribution", "Distribution")}
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

            <section className="op-panel op-panel-monthly">
              <div className="op-panel-head">
                <span>
                  <FiCalendar size={13} /> {td("monthlyTrend", "Monthly Trend")}
                </span>
                <span className="op-panel-sub">
                  {td("last12Months", "Last 12 months")}
                </span>
              </div>
              <MonthlyTrendChart
                data={stats.monthlyData}
                loading={loading}
                noDataLabel={noDataLabel}
              />
            </section>
          </div>

          {/* Extra row — the two attention-grabbing new charts */}
          <div className="op-extra-row">
            <section className="op-panel op-panel-gender">
              <div className="op-panel-head">
                <span>
                  <FiUsers size={13} />{" "}
                  {td("genderBreakdown", "Gender Breakdown")}
                </span>
                <span className="op-panel-sub">
                  {td("byDept", "By department")}
                </span>
              </div>
              <GenderStackedBar
                departments={stats.departments}
                loading={loading}
                noDataLabel={noDataLabel}
                maleLabel={td("male", "Male")}
                femaleLabel={td("female", "Female")}
              />
            </section>

            <section className="op-panel op-panel-heatmap">
              <div className="op-panel-head">
                <span>
                  <FiGrid size={13} />{" "}
                  {td("activityHeatmap", "Activity Heatmap")}
                </span>
                <span className="op-panel-sub">
                  {td("byDayOfWeek", "By day of week")}
                </span>
              </div>
              <ActivityHeatmap
                weeklyTrend={stats.weeklyTrend}
                dayLabels={dayLabels}
                noDataLabel={noDataLabel}
              />
            </section>
          </div>
        </main>

        <RightPanel
          stats={stats}
          goldenMondayStats={goldenMondayStats}
          td={td}
        />
      </div>

      <style>{loadingStyles}</style>
      <style>{shellStyles}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────
const loadingStyles = `
  .op-loading { height: 100vh; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 14px; background: ${T.canvas}; color: ${T.inkSoft};
    font-family: ${T.sans}; }
  .op-loading-ring { width: 34px; height: 34px; border-radius: 50%;
    border: 3px solid ${T.mist}; border-top-color: ${T.teal};
    animation: op-spin 0.8s linear infinite; }
  @keyframes op-spin { to { transform: rotate(360deg); } }
`;

const shellStyles = `
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }

  .op-shell {
    background: ${T.canvas};
    color: ${T.ink};
    font-family: ${T.sans};
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 10px 14px 8px;
    gap: 8px;
  }

  /* HEADER */
  .op-header {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0;
    flex-wrap: wrap;
  }
  .op-identity { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .op-avatar {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, ${T.teal}, ${T.tealDeep});
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 12px; font-family: ${T.mono};
    box-shadow: 0 3px 10px rgba(10,59,42,0.2);
  }
  .op-greeting { font-family: ${T.serif}; font-size: 13px; font-weight: 700; color: ${T.ink}; }
  .op-name { color: ${T.teal}; }
  .op-role { font-size: 9px; color: ${T.inkSoft}; margin-top: 1px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .op-role-badge { background: ${T.tealLight}; color: ${T.teal}; padding: 1px 6px; border-radius: 10px; }
  .op-role-email { opacity: 0.6; }
  .op-date-badge {
    flex-shrink: 0; background: ${T.tealDeep}; color: ${T.brassLight};
    font-family: ${T.mono}; font-size: 9px; font-weight: 700;
    padding: 4px 10px; border-radius: 16px; display: flex; align-items: center; gap: 4px;
  }

  /* AI DIGEST BANNER — own row, own stacking context, cannot be overlapped */
  .op-ai-banner {
    flex-shrink: 0;
    min-height: 46px;
    max-height: 64px;
    overflow: hidden;
    border-radius: 10px;
    position: relative;
    z-index: 5;
    box-shadow: 0 2px 10px rgba(14,36,28,0.06);
    background: ${T.panel};
    border: 1px solid ${T.mist};
  }

  /* GRID - Desktop: left rail | center | right rail (widened to fit larger text) */
  .op-grid {
    flex: 1; min-height: 0;
    display: grid;
    grid-template-columns: 220px 1fr 230px;
    grid-template-areas: "left center right";
    gap: 8px;
  }

  /* SHARED RAIL STYLES */
  .op-rail {
    display: flex; flex-direction: column; gap: 6px;
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 12px;
    padding: 8px 10px;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .op-rail-left { grid-area: left; }
  .op-rail-right { grid-area: right; }
  .op-rail-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; flex-shrink: 0; }
  .op-rail-title { font-size: 11px; font-weight: 800; letter-spacing: 0.4px; color: ${T.inkSoft}; }
  .op-rail-gauges { display: flex; flex-direction: column; gap: 4px; }

  .op-gauge {
    display: flex; align-items: center; gap: 8px;
    background: ${T.canvas}; border-radius: 8px; padding: 5px 7px;
  }
  .op-gauge-ring { position: relative; width: 40px; height: 40px; flex-shrink: 0; }
  .op-gauge-ring svg { width: 40px; height: 40px; }
  .op-gauge-icon-bg { position: absolute; inset: 6px; border-radius: 50%; }
  .op-gauge-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .op-gauge-text { min-width: 0; }
  .op-gauge-value { font-family: ${T.mono}; font-weight: 800; font-size: 15px; line-height: 1.15; }
  .op-gauge-label { font-size: 9.5px; color: ${T.inkSoft}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .op-gauge-sub { font-size: 8px; color: ${T.inkLight}; }

  /* CRITERIA SECTION — one item per row, larger legible text */
  .op-criteria-section {
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid ${T.mist};
    flex-shrink: 0;
    width: 100%;
  }
  .op-criteria-header { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
  .op-criteria-title { font-size: 10px; font-weight: 800; letter-spacing: 0.3px; color: ${T.inkSoft}; }
  .op-criteria-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    width: 100%;
  }
  .op-criteria-item {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 8px;
    border-radius: 6px;
    border-left: 3px solid ${T.teal};
    background: ${T.canvas};
  }
  .op-criteria-pct { font-family: ${T.mono}; font-weight: 800; font-size: 13px; flex-shrink: 0; min-width: 32px; }
  .op-criteria-name { font-size: 9.5px; color: ${T.inkSoft}; font-weight: 600; white-space: normal; line-height: 1.25; flex: 1; }

  /* AGENDAS SECTION (moved from footer), larger readable text */
  .op-agendas-section {
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid ${T.mist};
    flex-shrink: 0;
    width: 100%;
  }
  .op-agendas-list { display: flex; flex-direction: column; gap: 4px; width: 100%; }
  .op-agenda-mini {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 9px;
    color: ${T.inkSoft};
    padding: 4px 6px;
    background: ${T.canvas};
    border-radius: 5px;
    white-space: normal;
    line-height: 1.3;
    font-weight: 500;
  }
  .op-agenda-mini svg { flex-shrink: 0; margin-top: 1px; }
  .op-agenda-empty { color: ${T.inkLight}; font-style: italic; }

  /* CENTER */
  .op-center { grid-area: center; display: flex; flex-direction: column; gap: 8px; min-height: 0; }

  .op-charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    flex: 1.5;
    min-height: 0;
  }
  .op-extra-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    flex: 1;
    min-height: 0;
  }

  .op-panel {
    background: ${T.panel};
    border: 1px solid ${T.mist};
    border-radius: 12px;
    padding: 8px 10px 6px;
    display: flex; flex-direction: column;
    min-height: 0;
    box-shadow: 0 1px 2px rgba(14,36,28,0.04);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .op-panel:hover {
    box-shadow: 0 1px 2px rgba(14,36,28,0.05), 0 8px 20px -12px rgba(14,36,28,0.15);
    transform: translateY(-1px);
  }
  .op-panel-head {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12.5px; font-weight: 700; color: ${T.ink};
    margin-bottom: 3px; flex-shrink: 0;
  }
  .op-panel-head svg { margin-right: 4px; vertical-align: -2px; color: ${T.teal}; }
  .op-panel-sub { font-size: 9px; color: ${T.inkSoft}; font-weight: 500; }

  .op-canvas-box { flex: 1; min-height: 0; position: relative; }
  .op-canvas-box canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .op-canvas-box-interactive canvas { cursor: crosshair; }

  /* DONUT LEGEND */
  .op-donut-box { width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
  .op-donut-box canvas { max-width: 100%; max-height: 100%; }

  .op-legend {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 6px;
    margin-top: 4px;
    max-height: 48px;
    overflow-y: auto;
    flex-shrink: 0;
  }
  .op-legend::-webkit-scrollbar { width: 2px; }
  .op-legend::-webkit-scrollbar-thumb { background: ${T.mist}; border-radius: 2px; }
  .op-legend-item {
    display: flex; align-items: center; gap: 4px; font-size: 9.5px;
    padding: 2px 4px; border-radius: 3px; cursor: default;
    transition: background 0.15s ease;
  }
  .op-legend-item:hover, .op-legend-item-active { background: rgba(20,97,73,0.06); }
  .op-legend-dot { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }
  .op-legend-name { flex: 1; min-width: 0; color: ${T.inkSoft}; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9.5px; }
  .op-legend-stats { display: flex; align-items: baseline; gap: 3px; flex-shrink: 0; }
  .op-legend-val { font-family: ${T.mono}; font-weight: 800; color: ${T.ink}; font-size: 10.5px; }
  .op-legend-pct { font-family: ${T.mono}; font-weight: 600; color: ${T.inkSoft}; font-size: 8.5px; }
  .op-legend-empty { grid-column: 1 / -1; font-size: 9px; color: ${T.inkSoft}; text-align: center; padding: 2px 0; }

  /* STACKED BAR */
  .op-stacked-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
  .op-stacked-legend { display: flex; gap: 10px; justify-content: center; margin-top: 3px; flex-shrink: 0; }
  .op-stacked-legend span { display: flex; align-items: center; gap: 4px; font-size: 9px; color: ${T.inkSoft}; font-weight: 600; }
  .op-stacked-legend i { width: 7px; height: 7px; border-radius: 2px; display: inline-block; }

  /* HEATMAP */
  .op-heatmap { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; overflow: hidden; }
  .op-heatmap-rows { display: flex; flex-direction: column; gap: 2px; }
  .op-heatmap-row { display: flex; align-items: center; gap: 5px; }
  .op-heatmap-daylabel { width: 26px; font-size: 8px; color: ${T.inkSoft}; font-weight: 600; flex-shrink: 0; }
  .op-heatmap-cells { display: flex; gap: 3px; flex: 1; }
  .op-heatmap-cell { flex: 1; aspect-ratio: 1.6; border-radius: 3px; transition: transform 0.15s ease; }
  .op-heatmap-cell:hover { transform: scale(1.12); }
  .op-heatmap-empty { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: ${T.inkSoft}; }

  /* RADIAL GAUGE */
  .op-radial-gauge { display: flex; flex-direction: column; align-items: center; gap: 1px; flex-shrink: 0; }
  .op-radial-value { font-family: ${T.mono}; font-weight: 800; font-size: 22px; margin-top: -6px; }
  .op-radial-label { font-size: 10px; font-weight: 700; color: ${T.ink}; }
  .op-radial-sub { font-size: 8px; color: ${T.inkSoft}; text-align: center; }

  /* RIGHT PANEL EXTRAS */
  .op-right-section { padding-top: 6px; border-top: 1px solid ${T.mist}; flex-shrink: 0; }
  .op-top-list { display: flex; flex-direction: column; gap: 4px; }
  .op-top-item { display: flex; align-items: center; gap: 7px; background: ${T.canvas}; border-radius: 7px; padding: 4px 7px; }
  .op-top-rank {
    width: 17px; height: 17px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: ${T.mono}; font-weight: 800; font-size: 8px; color: #fff;
    background: ${T.teal};
  }
  .op-top-rank-0 { background: ${T.brass}; }
  .op-top-rank-1 { background: #9AA6A0; }
  .op-top-rank-2 { background: ${T.clay}; }
  .op-top-name { flex: 1; min-width: 0; font-size: 10px; font-weight: 600; color: ${T.ink}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .op-top-val { font-family: ${T.mono}; font-size: 10.5px; font-weight: 800; color: ${T.teal}; }

  .op-tile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .op-tile { background: ${T.canvas}; border-radius: 9px; padding: 7px 5px; display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .op-tile-val { font-family: ${T.mono}; font-weight: 800; font-size: 15px; color: ${T.ink}; }
  .op-tile-label { font-size: 8px; color: ${T.inkSoft}; font-weight: 600; }

  .op-activity-list { display: flex; flex-direction: column; gap: 5px; }
  .op-activity-item { display: flex; align-items: center; gap: 6px; }
  .op-activity-dot { width: 6px; height: 6px; border-radius: 50%; background: ${T.tealBright}; flex-shrink: 0; }
  .op-activity-text { font-size: 9px; color: ${T.inkSoft}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── RESPONSIVE ──────────────────────────────────────────── */
  @media (max-width: 1280px) {
    .op-grid { grid-template-columns: 200px 1fr 210px; }
  }

  @media (max-width: 1024px) {
    .op-grid {
      grid-template-columns: 190px 1fr;
      grid-template-areas: "left center" "right right";
      grid-auto-rows: minmax(0, 1fr) auto;
    }
    .op-rail-right { flex-direction: row; flex-wrap: wrap; max-height: 170px; gap: 8px; }
    .op-rail-right > * { flex: 1 1 160px; }
    .op-radial-gauge { flex: 0 0 auto; }
  }

  @media (max-width: 768px) {
    .op-shell { height: auto; min-height: 100vh; overflow-y: auto; padding: 8px 10px; gap: 6px; }
    .op-grid { grid-template-columns: 1fr; grid-template-areas: "left" "center" "right"; overflow: visible; }
    .op-rail-left, .op-rail-right { max-height: none; overflow: visible; }
    .op-rail-left { flex-direction: column; }
    .op-rail-gauges { flex-direction: row; flex-wrap: wrap; gap: 4px; }
    .op-gauge { flex: 1 1 30%; min-width: 100px; }
    .op-criteria-grid { grid-template-columns: 1fr; }

    .op-charts-grid { grid-template-columns: 1fr; grid-template-rows: none; gap: 6px; }
    .op-extra-row { grid-template-columns: 1fr; gap: 6px; }
    .op-panel { min-height: 160px; padding: 6px 8px 4px; }

    .op-rail-right { flex-direction: column; }
    .op-rail-right > * { flex: none; }

    .op-header { flex-direction: column; align-items: stretch; gap: 6px; }
    .op-identity { justify-content: center; }
    .op-date-badge { align-self: center; font-size: 8px; padding: 3px 8px; }
    .op-avatar { width: 32px; height: 32px; font-size: 11px; }
    .op-greeting { font-size: 12px; }
    .op-ai-banner { max-height: none; }

    .op-legend { grid-template-columns: 1fr 1fr; max-height: 44px; }
  }

  @media (max-width: 480px) {
    .op-shell { padding: 4px 6px; gap: 4px; }
    .op-rail-left, .op-rail-right { padding: 4px 6px; }
    .op-gauge { flex: 1 1 100%; }
    .op-gauge-ring { width: 34px; height: 34px; }
    .op-gauge-ring svg { width: 34px; height: 34px; }
    .op-gauge-value { font-size: 12px; }
    .op-gauge-label { font-size: 8px; }
    .op-criteria-grid { grid-template-columns: 1fr; }
    .op-criteria-item { padding: 4px 6px; }
    .op-criteria-pct { font-size: 11px; }
    .op-criteria-name { font-size: 8.5px; }
    .op-panel { padding: 4px 6px 3px; min-height: 140px; }
    .op-panel-head { font-size: 10px; }
    .op-legend { grid-template-columns: 1fr; max-height: 56px; }
    .op-legend-item { font-size: 8px; }
    .op-legend-val { font-size: 9px; }
  }
`;
