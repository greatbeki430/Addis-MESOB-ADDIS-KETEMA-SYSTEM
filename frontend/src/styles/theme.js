// ════════════════════════════════════════════════════════════
// styles/theme.js - Enhanced with animations & utilities
// ════════════════════════════════════════════════════════════

export const C = {
  primary: "#1a6b4a",
  light: "#2aaa78",
  bg: "#e8f5ee",
  dark: "#0d1f14",
  gray: "#f2f6f3",
  white: "#fff",
  muted: "#666",
  border: "#d0ddd6",
  cardBg: "#f8faf9",
  blue: "#1e4d8c",
  purple: "#7b2d8b",
  orange: "#c25a00",
  red: "#8b1a1a",
};

export const F = {
  sans: "'Noto Sans Ethiopic', sans-serif",
  serif: "'Noto Serif Ethiopic', serif",
};

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: "480px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1200px",
};

// Responsive font sizes
export const FONT_SIZES = {
  h1: "clamp(22px, 5vw, 28px)",
  h2: "clamp(18px, 4vw, 24px)",
  h3: "clamp(16px, 3.5vw, 20px)",
  body: "clamp(12px, 3vw, 14px)",
  small: "clamp(10px, 2.5vw, 12px)",
  tiny: "clamp(8px, 2vw, 10px)",
};

// Spacing utilities
export const SPACING = {
  xs: "clamp(4px, 1vw, 8px)",
  sm: "clamp(8px, 2vw, 12px)",
  md: "clamp(12px, 3vw, 16px)",
  lg: "clamp(16px, 4vw, 24px)",
  xl: "clamp(20px, 5vw, 32px)",
  xxl: "clamp(24px, 6vw, 40px)",
};

// Grid utilities
export const GRID = {
  cols1: "1fr",
  cols2: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
  cols3: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
  cols4: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  cols5: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
};

// ============================================================
// ANIMATION UTILITIES (new)
// ============================================================

export const ANIMATIONS = {
  // Duration
  duration: {
    fast: "0.15s",
    normal: "0.3s",
    slow: "0.5s",
    slower: "0.8s",
  },

  // Easing
  ease: {
    default: "ease",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
  },

  // Combined transition
  transition: (
    property = "all",
    duration = "0.3s",
    easing = "cubic-bezier(0.4, 0, 0.2, 1)",
  ) => {
    return `${property} ${duration} ${easing}`;
  },
};

// ============================================================
// BUTTON STYLES (enhanced)
// ============================================================

export const btn = {
  primary: {
    background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
    color: "#fff",
    border: "none",
    padding: "clamp(9px, 2.5vw, 11px) clamp(18px, 5vw, 26px)",
    borderRadius: 8,
    fontSize: "clamp(12px, 3vw, 14px)",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: F.sans,
    boxShadow: `0 4px 14px ${C.primary}44`,
    transition: ANIMATIONS.transition(),
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `0 6px 20px ${C.primary}66`,
    },
    "&:active": {
      transform: "translateY(0)",
    },
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
      transform: "none !important",
    },
  },
  secondary: {
    background: C.bg,
    color: C.primary,
    border: `2px solid ${C.primary}`,
    padding: "clamp(7px, 2vw, 9px) clamp(14px, 4vw, 20px)",
    borderRadius: 8,
    fontSize: "clamp(11px, 2.5vw, 13px)",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: F.sans,
    transition: ANIMATIONS.transition(),
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    "&:hover": {
      background: C.primary,
      color: "#fff",
      transform: "translateY(-2px)",
      boxShadow: `0 4px 14px ${C.primary}44`,
    },
    "&:active": {
      transform: "translateY(0)",
    },
  },
  danger: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "clamp(9px, 2.5vw, 11px) clamp(18px, 5vw, 26px)",
    borderRadius: 8,
    fontSize: "clamp(12px, 3vw, 14px)",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: F.sans,
    transition: ANIMATIONS.transition(),
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    "&:hover": {
      background: "#b91c1c",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 14px rgba(220,38,38,0.4)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  },
  small: {
    background: "transparent",
    color: C.primary,
    border: `1px solid ${C.border}`,
    padding: "clamp(4px, 1.5vw, 6px) clamp(10px, 3vw, 14px)",
    borderRadius: 6,
    fontSize: "clamp(10px, 2.5vw, 12px)",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: F.sans,
    transition: ANIMATIONS.transition(),
    "&:hover": {
      background: C.bg,
      borderColor: C.primary,
    },
  },
  icon: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "clamp(6px, 2vw, 8px)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: ANIMATIONS.transition(),
    "&:hover": {
      background: C.bg,
      transform: "scale(1.1)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
  },
};

// ============================================================
// INPUT STYLES (enhanced)
// ============================================================

export const inp = {
  border: `1.5px solid ${C.border}`,
  borderRadius: 7,
  padding: "clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)",
  fontSize: "clamp(11px, 3vw, 13px)",
  fontFamily: F.sans,
  outline: "none",
  background: "#fafffe",
  width: "100%",
  transition: ANIMATIONS.transition("border-color, box-shadow"),
  "&:focus": {
    borderColor: C.primary,
    boxShadow: `0 0 0 3px ${C.primary}22`,
    background: "#fff",
  },
  "&:hover": {
    borderColor: C.primary + "66",
  },
  "&:disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

// ============================================================
// CARD STYLES (enhanced)
// ============================================================

export const card = {
  background: C.white,
  borderRadius: 12,
  padding: "clamp(16px, 4vw, 24px)",
  marginBottom: "clamp(16px, 4vw, 20px)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  transition: ANIMATIONS.transition("box-shadow, transform"),
  "&:hover": {
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
};

// ============================================================
// CONTAINER (enhanced)
// ============================================================

export const container = {
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "0 clamp(16px, 4vw, 24px)",
};

// ============================================================
// FLEX UTILITIES (enhanced)
// ============================================================

export const flex = {
  row: (gap = SPACING.md) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: gap,
  }),
  column: (gap = SPACING.md) => ({
    display: "flex",
    flexDirection: "column",
    gap: gap,
  }),
  between: (gap = SPACING.md) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: gap,
  }),
  wrap: (gap = SPACING.md) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: gap,
  }),
  center: (gap = SPACING.md) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: gap,
  }),
  evenly: (gap = SPACING.md) => ({
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    gap: gap,
    flexWrap: "wrap",
  }),
};

// ============================================================
// GRID UTILITIES (enhanced)
// ============================================================

export const grid = {
  cols: (minWidth = "200px") => ({
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}), 1fr))`,
    gap: SPACING.md,
  }),
  colsFixed: (count = 2) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${count}, 1fr)`,
    gap: SPACING.md,
  }),
  responsive: (
    mobile = "1fr",
    tablet = "1fr 1fr",
    desktop = "1fr 1fr 1fr",
  ) => ({
    display: "grid",
    gridTemplateColumns: mobile,
    gap: SPACING.md,
    [`@media (min-width: ${BREAKPOINTS.tablet})`]: {
      gridTemplateColumns: tablet,
    },
    [`@media (min-width: ${BREAKPOINTS.desktop})`]: {
      gridTemplateColumns: desktop,
    },
  }),
};

// ============================================================
// TEXT UTILITIES (new)
// ============================================================

export const text = {
  gradient: {
    background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  muted: {
    color: C.muted,
    fontSize: FONT_SIZES.small,
  },
  center: {
    textAlign: "center",
  },
  truncate: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  uppercase: {
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};

// ============================================================
// SHADOW UTILITIES (new)
// ============================================================

export const shadows = {
  sm: "0 1px 3px rgba(0,0,0,0.06)",
  md: "0 2px 12px rgba(0,0,0,0.08)",
  lg: "0 4px 24px rgba(0,0,0,0.12)",
  xl: "0 8px 40px rgba(0,0,0,0.16)",
  glow: `0 0 30px ${C.primary}33`,
  none: "none",
};

// ============================================================
// BORDER RADIUS UTILITIES (new)
// ============================================================

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  xxl: "24px",
  full: "50%",
  pill: "9999px",
};

// ============================================================
// MEDIA QUERY HELPER
// ============================================================

export const media = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile})`,
  tablet: `@media (max-width: ${BREAKPOINTS.tablet})`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop})`,
  wide: `@media (min-width: ${BREAKPOINTS.wide})`,
};

// ============================================================
// EXPORT ALL
// ============================================================

export default {
  C,
  F,
  BREAKPOINTS,
  FONT_SIZES,
  SPACING,
  GRID,
  ANIMATIONS,
  btn,
  inp,
  card,
  container,
  flex,
  grid,
  text,
  shadows,
  radius,
  media,
};
