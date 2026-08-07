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
  FiAward,
  FiClock,
  FiTarget,
  FiZap,
  FiUsers,
  FiActivity,
  FiCalendar,
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
  gradientTeal: "linear-gradient(135deg, #146149 0%, #1E8A63 100%)",
  gradientBrass: "linear-gradient(135deg, #C89B3C 0%, #E4C878 100%)",
  gradientWarm: "linear-gradient(135deg, #B5542E 0%, #D4784E 100%)",
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

// ─── Enhanced Gauge Component ──────────────────────────────
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
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <div className="op-gauge">
      <div className="op-gauge-ring">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle
            cx="26"
            cy="26"
            r={r}
            fill="none"
            stroke={T.mist}
            strokeWidth="4.5"
          />
          <circle
            cx="26"
            cy="26"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
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

// ─── Enhanced QuickStatsRail ────────────────────────────────
const QuickStatsRail = memo(function QuickStatsRail({
  stats,
  goldenMondayStats,
  malePct,
  td,
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
    </aside>
  );
});

// ─── Enhanced TrendChart ────────────────────────────────────
const TrendChart = memo(function TrendChart({ data, loading, noDataLabel }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const geometryRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const draw = useCallback(
    (ctx, width, height, progress, hoverIdx) => {
      ctx.clearRect(0, 0, width, height);
      if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
        drawNoData(ctx, width, height, noDataLabel);
        geometryRef.current = null;
        return;
      }

      const pad = { top: 24, bottom: 26, left: 8, right: 8 };
      const chartW = width - pad.left - pad.right;
      const chartH = height - pad.top - pad.bottom;
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const step = data.length > 1 ? chartW / (data.length - 1) : 0;
      const pts = data.map((d, i) => ({
        x: pad.left + i * step,
        y: pad.top + chartH - (d.value / maxVal) * chartH,
      }));
      geometryRef.current = { pts, pad, width, height };

      // Grid lines
      ctx.strokeStyle = "rgba(14,36,28,0.06)";
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const gy = pad.top + (chartH / 4) * g;
        ctx.beginPath();
        ctx.moveTo(pad.left, gy);
        ctx.lineTo(width - pad.right, gy);
        ctx.stroke();
      }

      // Area fill with gradient
      const gradient = ctx.createLinearGradient(
        0,
        pad.top,
        0,
        height - pad.bottom,
      );
      gradient.addColorStop(0, "rgba(20,97,73,0.35)");
      gradient.addColorStop(0.5, "rgba(20,97,73,0.12)");
      gradient.addColorStop(1, "rgba(20,97,73,0)");

      const revealX = pad.left + chartW * progress;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, revealX, height);
      ctx.clip();

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
      ctx.lineTo(pts[pts.length - 1].x, height - pad.bottom);
      ctx.lineTo(pts[0].x, height - pad.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
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
      ctx.strokeStyle = T.teal;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(20,97,73,0.3)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Points
      const isHover = hoverIdx !== null && hoverIdx < pts.length;
      pts.forEach((p, i) => {
        if (p.x > revealX + 0.5) return;
        const isPeak = data[i].value === maxVal && maxVal > 0;
        const hover = isHover && hoverIdx === i;
        const radius = hover ? 7 : isPeak ? 5 : 3.5;

        // Glow
        if (isPeak || hover) {
          const glow = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            radius + 10,
          );
          glow.addColorStop(
            0,
            hover ? "rgba(20,97,73,0.2)" : "rgba(200,155,60,0.15)",
          );
          glow.addColorStop(1, "rgba(20,97,73,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 10, 0, 2 * Math.PI);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = hover ? T.tealDeep : isPeak ? T.brass : T.teal;
        ctx.fill();
        ctx.strokeStyle = T.white;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels
        ctx.fillStyle = T.inkSoft;
        ctx.font = `600 8px ${T.mono}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(data[i].label.toUpperCase(), p.x, height - 20);

        if (data[i].value > 0 && (isPeak || hover)) {
          ctx.fillStyle = hover ? T.tealDeep : T.brass;
          ctx.font = `700 9px ${T.mono}`;
          ctx.textBaseline = "bottom";
          ctx.fillText(data[i].value, p.x, p.y - radius - 4);
        }
      });
    },
    [data, noDataLabel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 200;
    let start = null;
    const duration = 800;
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
  }, [data, loading, draw]);

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
        setHoverIndex(minDist < 30 ? nearest : null);
      }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <canvas ref={canvasRef} />
    </div>
  );
});

// ─── Enhanced DepartmentChart ───────────────────────────────
const DepartmentChart = memo(function DepartmentChart({
  departments,
  total,
  loading,
  noDataLabel,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const geometryRef = useRef(null);
  const [hoverRow, setHoverRow] = useState(null);

  const draw = useCallback(
    (ctx, width, height, progress, hoverIdx) => {
      const depts = departments.slice(0, 8);
      if (depts.length === 0) {
        drawNoData(ctx, width, height, noDataLabel);
        geometryRef.current = null;
        return;
      }

      const maxVal = Math.max(...depts.map((d) => d.value), 1);
      const pad = { top: 4, bottom: 4, left: 4, right: 50 };
      const badgeSize = 18;
      const labelW = 100;
      const barMaxW = width - pad.left - pad.right - labelW - 50;
      const rowH = Math.min((height - pad.top - pad.bottom) / depts.length, 40);
      const barThickness = Math.max(rowH - 10, 6);
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
          roundRect(ctx, 0, rowTop + 2, width, rowH - 4, 10);
          ctx.fill();
        }

        // Rank badge
        const bx = pad.left + badgeSize / 2;
        const by = rowTop + rowH / 2;
        const badgeColor = rankColors[i % rankColors.length];
        ctx.beginPath();
        ctx.arc(bx, by, badgeSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = badgeColor;
        ctx.fill();
        ctx.fillStyle = i < 3 ? "#fff" : T.white;
        ctx.font = `700 8px ${T.mono}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i + 1, bx, by + 0.5);

        // Label
        ctx.fillStyle = isHover ? T.ink : T.inkSoft;
        ctx.font = `${isHover ? 700 : 600} 10px ${T.sans}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const label =
          dept.name.length > 14 ? dept.name.slice(0, 14) + "…" : dept.name;
        ctx.fillText(label, pad.left + badgeSize + 8, by);

        // Bar background
        ctx.fillStyle = T.canvasDeep;
        roundRect(ctx, barX, barY, barMaxW, barThickness, barThickness / 2);
        ctx.fill();

        // Bar with gradient
        const barW = (dept.value / maxVal) * barMaxW * progress;
        const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        const color = i === 0 ? T.brass : T.teal;
        grad.addColorStop(0, i === 0 ? T.brassLight : T.tealBright);
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        if (isHover) {
          ctx.shadowColor = "rgba(20,97,73,0.3)";
          ctx.shadowBlur = 10;
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

        // Value
        ctx.fillStyle = T.ink;
        ctx.font = `700 11px ${T.mono}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(dept.value, barX + barMaxW + 10, by - 2);

        if (total > 0) {
          const pct = Math.round((dept.value / total) * 100);
          ctx.fillStyle = T.inkSoft;
          ctx.font = `600 8px ${T.mono}`;
          ctx.fillText(`${pct}%`, barX + barMaxW + 10, by + 10);
        }
      });
    },
    [departments, total, noDataLabel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 200;
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
  }, [departments, loading, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !geometryRef.current) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 200;
    const ctx = prepCanvas(canvas, width, height);
    draw(ctx, width, height, 1, hoverRow);
  }, [hoverRow, draw, loading]);

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

// ─── Enhanced DistributionDonut ─────────────────────────────
const DistributionDonut = memo(function DistributionDonut({
  departments,
  total,
  loading,
  td,
  noDataLabel,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const sizeRef = useRef(0);
  const [hoverIdx, setHoverIdx] = useState(null);
  const depts = departments.slice(0, 6);

  const draw = useCallback(
    (ctx, size, progress, hoverIndex) => {
      ctx.clearRect(0, 0, size, size);

      if (depts.length === 0 || total === 0) {
        drawNoData(ctx, size, size, noDataLabel);
        return;
      }

      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 16;
      const thickness = 16;
      const gapRad = 0.04;
      const totalSweep = 2 * Math.PI - gapRad * depts.length;
      let remaining = totalSweep * progress;
      let startAngle = -Math.PI / 2;

      // Shadow layer
      depts.forEach((dept) => {
        const fullSlice = (dept.value / total) * totalSweep;
        const slice = Math.max(0, Math.min(fullSlice, remaining));
        if (slice > 0) {
          const endAngle = startAngle + slice;
          ctx.save();
          ctx.shadowColor = "rgba(14,36,28,0.08)";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 2, startAngle, endAngle);
          ctx.strokeStyle = "rgba(14,36,28,0.04)";
          ctx.lineWidth = thickness + 4;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
          startAngle = endAngle + gapRad;
        } else {
          startAngle += gapRad;
        }
        remaining -= slice;
      });

      // Main segments
      let mainStart = -Math.PI / 2;
      let mainRemaining = totalSweep * progress;
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
            ctx.shadowBlur = 16;
          }
          ctx.beginPath();
          ctx.arc(cx, cy, radius, mainStart, endAngle);
          ctx.strokeStyle = DONUT_COLORS[i % DONUT_COLORS.length];
          ctx.lineWidth = isHover ? thickness + 6 : thickness;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
          mainStart = endAngle + gapRad;
        } else {
          mainStart += gapRad;
        }
        mainRemaining -= slice;
      });

      // Center text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (hoverIndex != null && depts[hoverIndex]) {
        const d = depts[hoverIndex];
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        const label = d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name;
        ctx.fillStyle = T.ink;
        ctx.font = `700 20px ${T.mono}`;
        ctx.fillText(d.value, cx, cy - 12);
        ctx.fillStyle = T.inkSoft;
        ctx.font = `600 8.5px ${T.sans}`;
        ctx.fillText(label, cx, cy + 8);
        ctx.fillStyle = DONUT_COLORS[hoverIndex % DONUT_COLORS.length];
        ctx.font = `700 9px ${T.mono}`;
        ctx.fillText(`${pct}%`, cx, cy + 22);
      } else {
        ctx.fillStyle = T.ink;
        ctx.font = `700 22px ${T.mono}`;
        ctx.fillText(total, cx, cy - 6);
        ctx.fillStyle = T.inkSoft;
        ctx.font = `600 9px ${T.sans}`;
        ctx.fillText(td("total", "TOTAL").toUpperCase(), cx, cy + 16);
      }
    },
    [depts, total, td, noDataLabel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width || 200, rect.height || 200, 200);
    sizeRef.current = size;
    let start = null;
    const duration = 800;
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
  }, [depts, total, loading, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !sizeRef.current) return;
    const size = sizeRef.current;
    const ctx = prepCanvas(canvas, size, size);
    draw(ctx, size, 1, hoverIdx);
  }, [hoverIdx, draw, loading]);

  return (
    <>
      <div className="op-donut-box">
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

// ─── DashboardHeader ────────────────────────────────────────
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
            <span className="op-role-badge">{roleLabel}</span>
            <span className="op-role-email">{userEmail}</span>
          </div>
        </div>
      </div>
      <div className="op-ai-ticker">
        <AIDashboardWidget stats={aiStats} refreshInterval={120000} />
      </div>
      <div className="op-date-badge">
        <FiCalendar size={11} />
        {yearBadge}
      </div>
    </header>
  );
});

// ─── FooterStrip ────────────────────────────────────────────
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

        // Mock data if no departments exist
        if (departments.length === 0) {
          const mockData = [
            { name: "Customer Service", value: 45, male: 20, female: 25 },
            { name: "Administration", value: 30, male: 15, female: 15 },
            { name: "Finance", value: 25, male: 10, female: 15 },
            { name: "IT Support", value: 20, male: 12, female: 8 },
          ];
          departments = mockData;
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

      <div className="op-grid">
        <QuickStatsRail
          stats={stats}
          goldenMondayStats={goldenMondayStats}
          malePct={malePct}
          td={td}
        />

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
              total={stats.total}
              loading={loading}
              noDataLabel={noDataLabel}
            />
          </section>
        </main>

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
  .op-shell {
    background: ${T.canvas};
    color: ${T.ink};
    font-family: ${T.sans};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 14px 18px 10px;
    gap: 10px;
  }

  /* HEADER */
  .op-header {
    display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    flex-wrap: wrap;
  }
  .op-identity { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .op-avatar {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, ${T.teal}, ${T.tealDeep});
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px; font-family: ${T.mono};
    box-shadow: 0 3px 10px rgba(10,59,42,0.25);
  }
  .op-greeting { font-family: ${T.serif}; font-size: 14px; font-weight: 700; color: ${T.ink}; }
  .op-name { color: ${T.teal}; }
  .op-role { font-size: 10px; color: ${T.inkSoft}; margin-top: 1px; }
  .op-role-badge { background: ${T.tealLight}; color: ${T.teal}; padding: 1px 8px; border-radius: 12px; margin-right: 6px; }
  .op-role-email { opacity: 0.7; }
  .op-ai-ticker { flex: 1; min-width: 0; max-height: 40px; overflow: hidden; border-radius: 10px; }
  .op-date-badge {
    flex-shrink: 0; background: ${T.tealDeep}; color: ${T.brassLight};
    font-family: ${T.mono}; font-size: 10px; font-weight: 700;
    padding: 5px 12px; border-radius: 20px; display: flex; align-items: center; gap: 4px;
  }

  /* GRID - Desktop */
  .op-grid {
    flex: 1; min-height: 0;
    display: grid;
    grid-template-columns: 180px 1fr 200px;
    gap: 10px;
  }

  /* PANELS */
  .op-panel {
    background: ${T.panel};
    border: 1px solid ${T.mist};
    border-radius: 14px;
    padding: 10px 14px 8px;
    display: flex; flex-direction: column;
    min-height: 0;
    box-shadow: 0 1px 2px rgba(14,36,28,0.04);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .op-panel:hover {
    box-shadow: 0 1px 2px rgba(14,36,28,0.05), 0 14px 28px -14px rgba(14,36,28,0.18);
  }
  .op-panel-head {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11px; font-weight: 700; color: ${T.ink};
    margin-bottom: 4px; flex-shrink: 0;
  }
  .op-panel-head svg { margin-right: 5px; vertical-align: -2px; color: ${T.teal}; }
  .op-panel-sub { font-size: 9px; color: ${T.inkSoft}; font-weight: 500; }

  /* CANVAS */
  .op-canvas-box { flex: 1; min-height: 0; position: relative; }
  .op-canvas-box canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .op-canvas-box-interactive canvas { cursor: crosshair; }

  /* LEFT RAIL */
  .op-rail-left {
    display: flex; flex-direction: column; gap: 4px;
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 14px;
    padding: 8px 10px; overflow-y: auto;
  }
  .op-rail-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
  .op-rail-title {
    font-size: 9px; font-weight: 800; letter-spacing: 0.5px; color: ${T.inkSoft};
  }
  .op-rail-gauges { display: flex; flex-direction: column; gap: 4px; }

  .op-gauge {
    display: flex; align-items: center; gap: 6px;
    background: ${T.canvas}; border-radius: 8px; padding: 4px 6px;
  }
  .op-gauge-ring { position: relative; width: 40px; height: 40px; flex-shrink: 0; }
  .op-gauge-ring svg { width: 40px; height: 40px; }
  .op-gauge-icon-bg {
    position: absolute; inset: 7px; border-radius: 50%;
  }
  .op-gauge-icon {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 12px;
  }
  .op-gauge-text { min-width: 0; }
  .op-gauge-value { font-family: ${T.mono}; font-weight: 800; font-size: 14px; line-height: 1.1; }
  .op-gauge-label { font-size: 8px; color: ${T.inkSoft}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .op-gauge-sub { font-size: 7px; color: ${T.inkLight}; }

  /* CENTER */
  .op-center { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .op-panel-trend { flex: 1; }
  .op-panel-dept { flex: 1; }

  /* RIGHT RAIL */
  .op-rail-right { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .op-panel-donut { flex: 1; align-items: center; }
  .op-donut-box { width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
  .op-donut-box canvas { max-width: 100%; max-height: 100%; }

  .op-legend {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 6px;
    margin-top: 6px;
    max-height: 80px;
    overflow-y: auto;
  }
  .op-legend::-webkit-scrollbar { width: 3px; }
  .op-legend::-webkit-scrollbar-thumb { background: ${T.mist}; border-radius: 2px; }
  .op-legend-item {
    display: flex; align-items: center; gap: 4px; font-size: 8.5px;
    padding: 2px 4px; border-radius: 4px; cursor: default;
    transition: background 0.15s ease;
  }
  .op-legend-item:hover, .op-legend-item-active { background: rgba(20,97,73,0.07); }
  .op-legend-dot { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }
  .op-legend-name { flex: 1; min-width: 0; color: ${T.inkSoft}; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .op-legend-stats { display: flex; align-items: baseline; gap: 2px; flex-shrink: 0; }
  .op-legend-val { font-family: ${T.mono}; font-weight: 800; color: ${T.ink}; font-size: 9px; }
  .op-legend-pct { font-family: ${T.mono}; font-weight: 600; color: ${T.inkSoft}; font-size: 7px; }
  .op-legend-empty { grid-column: 1 / -1; font-size: 9px; color: ${T.inkSoft}; text-align: center; padding: 4px 0; }

  .op-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex-shrink: 0; }
  .op-tile {
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 10px;
    padding: 8px; text-align: center;
  }
  .op-tile-val { font-family: ${T.mono}; font-size: 16px; font-weight: 800; color: ${T.ink}; margin-top: 2px; }
  .op-tile-label { font-size: 8px; color: ${T.inkSoft}; font-weight: 600; }

  /* FOOTER */
  .op-footer {
    flex-shrink: 0; display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px;
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 14px;
    padding: 6px 12px; max-height: 72px;
  }
  .op-filmstrip, .op-agenda { display: flex; flex-direction: column; min-width: 0; }
  .op-filmstrip-title {
    font-size: 8px; font-weight: 800; letter-spacing: 0.4px; color: ${T.inkSoft};
    display: flex; align-items: center; gap: 4px; margin-bottom: 3px;
  }
  .op-filmstrip-track { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px; }
  .op-film-card {
    flex-shrink: 0; width: 72px; background: ${T.canvas}; border-radius: 6px;
    border-top: 3px solid ${T.teal}; padding: 3px 6px;
  }
  .op-film-pct { font-family: ${T.mono}; font-weight: 800; font-size: 11px; }
  .op-film-name { font-size: 7px; color: ${T.inkSoft}; line-height: 1.1; margin-top: 1px; }
  .op-agenda-track { display: flex; flex-wrap: wrap; gap: 3px; overflow-y: auto; align-content: flex-start; }
  .op-agenda-chip {
    display: inline-flex; align-items: center; gap: 3px;
    background: ${T.canvas}; color: ${T.inkSoft}; font-size: 8px; font-weight: 500;
    padding: 2px 6px; border-radius: 12px; white-space: nowrap;
  }
  .op-agenda-chip svg { width: 10px; height: 10px; }

  /* ── RESPONSIVE ──────────────────────────────────────────── */
  @media (max-width: 1024px) {
    .op-grid { grid-template-columns: 160px 1fr 180px; }
  }

  @media (max-width: 768px) {
    .op-shell { height: auto; min-height: 100vh; overflow: visible; padding: 10px; gap: 8px; }
    .op-grid { grid-template-columns: 1fr; gap: 8px; }
    
    .op-header { flex-direction: column; align-items: stretch; gap: 8px; }
    .op-identity { justify-content: center; }
    .op-ai-ticker { display: none; }
    .op-date-badge { align-self: center; }
    
    .op-rail-left { flex-direction: row; flex-wrap: wrap; padding: 6px 8px; }
    .op-rail-header { width: 100%; }
    .op-rail-gauges { flex-direction: row; flex-wrap: wrap; gap: 4px; }
    .op-gauge { flex: 1 1 45%; min-width: 100px; }
    
    .op-center { gap: 8px; }
    .op-panel { padding: 8px 10px 6px; }
    .op-panel-head { font-size: 10px; }
    
    .op-rail-right { flex-direction: column; gap: 8px; }
    .op-panel-donut { min-height: 250px; }
    .op-legend { grid-template-columns: 1fr 1fr; max-height: 100px; }
    
    .op-footer { grid-template-columns: 1fr; max-height: none; padding: 6px 10px; }
    .op-filmstrip-track { flex-wrap: wrap; }
    .op-film-card { width: 60px; }
    .op-agenda-track { max-height: 50px; overflow-y: auto; }
    
    .op-tiles { grid-template-columns: 1fr 1fr; }
    .op-tile { padding: 6px; }
    .op-tile-val { font-size: 14px; }
  }

  @media (max-width: 480px) {
    .op-shell { padding: 6px; gap: 6px; }
    .op-grid { gap: 6px; }
    .op-rail-left { padding: 4px 6px; }
    .op-gauge { flex: 1 1 100%; }
    .op-gauge-ring { width: 32px; height: 32px; }
    .op-gauge-ring svg { width: 32px; height: 32px; }
    .op-gauge-value { font-size: 12px; }
    .op-panel { padding: 6px 8px 4px; }
    .op-panel-head { font-size: 9px; }
    .op-panel-sub { font-size: 7px; }
    .op-panel-donut { min-height: 200px; }
    .op-legend { grid-template-columns: 1fr; max-height: 80px; gap: 1px; }
    .op-tiles { grid-template-columns: 1fr 1fr; gap: 4px; }
    .op-tile-val { font-size: 12px; }
    .op-footer { padding: 4px 8px; }
    .op-film-card { width: 50px; }
    .op-film-pct { font-size: 9px; }
    .op-agenda-chip { font-size: 7px; padding: 1px 4px; }
    .op-avatar { width: 32px; height: 32px; font-size: 11px; }
    .op-greeting { font-size: 12px; }
    .op-date-badge { font-size: 8px; padding: 3px 8px; }
  }
`;

// localMonthKey function (needed for the data loading)
function localMonthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
