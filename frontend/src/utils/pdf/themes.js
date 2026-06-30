// frontend/src/utils/pdf/themes.js

export const PDF_THEMES = {
  report: {
    name: "report",
    primaryColor: [26, 107, 74],
    secondaryColor: [46, 125, 50],
    accentColor: [139, 26, 26],
    headerStyle: "bold",
    tableStyle: "striped",
    colors: {
      header: [26, 107, 74],
      headerText: [255, 255, 255],
      accent: [194, 90, 0],
      muted: [100, 100, 100],
      border: [200, 200, 200],
      dark: [30, 30, 30],
      light: [245, 245, 245],
      success: [26, 107, 74],
      warning: [194, 90, 0],
      danger: [139, 26, 26],
    },
  },
  evaluation: {
    name: "evaluation",
    primaryColor: [0, 120, 200],
    secondaryColor: [25, 118, 210],
    accentColor: [255, 152, 0],
    headerStyle: "bold",
    tableStyle: "clean",
    colors: {
      header: [0, 120, 200],
      headerText: [255, 255, 255],
      accent: [255, 152, 0],
      muted: [100, 100, 100],
      border: [200, 200, 200],
      dark: [30, 30, 30],
      light: [245, 245, 245],
      success: [76, 175, 80],
      warning: [255, 152, 0],
      danger: [244, 67, 54],
    },
  },
  daily: {
    name: "daily",
    primaryColor: [194, 90, 0],
    secondaryColor: [230, 120, 0],
    accentColor: [26, 107, 74],
    headerStyle: "bold",
    tableStyle: "grid",
    colors: {
      header: [194, 90, 0],
      headerText: [255, 255, 255],
      accent: [26, 107, 74],
      muted: [100, 100, 100],
      border: [180, 180, 180],
      dark: [30, 30, 30],
      light: [245, 245, 245],
      success: [26, 107, 74],
      warning: [194, 90, 0],
      danger: [139, 26, 26],
    },
  },
};

/**
 * Get theme by name
 */
export const getTheme = (name) => {
  return PDF_THEMES[name] || PDF_THEMES.report;
};

/**
 * Merge theme with custom overrides
 */
export const mergeTheme = (name, overrides = {}) => {
  const baseTheme = getTheme(name);
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...(overrides.colors || {}),
    },
  };
};

/**
 * Get color as RGB array
 */
export const getColor = (theme, colorName) => {
  const themeColors = theme.colors || theme;
  return themeColors[colorName] || [0, 0, 0];
};
