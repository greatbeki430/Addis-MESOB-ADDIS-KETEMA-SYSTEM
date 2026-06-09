// ════════════════════════════════════════════════════════════
// styles/theme.js - Enhanced with responsive utilities
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

// Responsive breakpoints (for consistent media queries)
export const BREAKPOINTS = {
  mobile: "480px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1200px",
};

// Responsive font sizes (clamp values)
export const FONT_SIZES = {
  h1: "clamp(22px, 5vw, 28px)",
  h2: "clamp(18px, 4vw, 24px)",
  h3: "clamp(16px, 3.5vw, 20px)",
  body: "clamp(12px, 3vw, 14px)",
  small: "clamp(10px, 2.5vw, 12px)",
  tiny: "clamp(8px, 2vw, 10px)",
};

// Spacing utilities (responsive)
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
  // Responsive grid columns
  cols1: "1fr",
  cols2: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
  cols3: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
  cols4: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  cols5: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
};

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
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    "@media (max-width: 480px)": {
      padding: "8px 16px",
      fontSize: 12,
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
    transition: "all 0.2s ease",
    "@media (max-width: 480px)": {
      padding: "6px 12px",
      fontSize: 11,
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
    transition: "all 0.2s ease",
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
    transition: "all 0.2s ease",
    "&:hover": {
      background: C.bg,
    },
  },
};

export const inp = {
  border: `1.5px solid ${C.border}`,
  borderRadius: 7,
  padding: "clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)",
  fontSize: "clamp(11px, 3vw, 13px)",
  fontFamily: F.sans,
  outline: "none",
  background: "#fafffe",
  width: "100%",
  transition: "border-color 0.2s ease",
  "&:focus": {
    borderColor: C.primary,
    boxShadow: `0 0 0 2px ${C.primary}22`,
  },
};

export const card = {
  background: C.white,
  borderRadius: 12,
  padding: "clamp(16px, 4vw, 24px)",
  marginBottom: "clamp(16px, 4vw, 20px)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  transition: "box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
};

// Responsive container
export const container = {
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "0 clamp(16px, 4vw, 24px)",
};

// Flexbox utilities
export const flex = {
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: SPACING.md,
  },
  between: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.md,
  },
  wrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
};

// Media query helper (for use with styled-components or inline styles)
export const media = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile})`,
  tablet: `@media (max-width: ${BREAKPOINTS.tablet})`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop})`,
};
