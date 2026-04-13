/**
 * DeFi Sweeper Design System
 * Extracted from Figma (node 15:24) — single source of truth
 */

// ─── Colors ──────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bgPrimary: "#FFFFFF",
  bgSurface: "rgba(255,255,255,0.5)",
  bgSurfaceGradient: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) 100%)",
  bgTableHeader: "#f8f8f8",
  bgTableRow: "#FFFFFF",
  bgTableRowHover: "#fafafa",
  bgGrayButton: "#f2f2f2",
  bgGrayButtonHover: "#e5e5e5",
  bgTabContainer: "rgba(34,34,34,0.1)",
  bgTabActive: "#222222",

  // Text
  textHeading: "#0a0a0a",
  textPrimary: "#121212",
  textSecondary: "#545454",
  textMuted: "#757575",
  textOnAction: "#FFFFFF",
  textOnTab: "#222222",

  // Borders
  borderSubtle: "#d6d6d6",
  borderDefault: "#f0f0f0",
  borderButton: "rgba(0,0,0,0.1)",
  borderButtonLight: "rgba(0,0,0,0.07)",

  // Brand / Actions
  primary: "#6c6cff",
  primaryHover: "#5b5be6",
  healthyButtonOld: "rgba(120,172,8,0.5)",
  walletAccent: "#bcff2f",

  // Health status
  dead: "#e62e24",
  stale: "#e62e24",
  warning: "#f9a606",
  healthy: "#5a8400",
  healthyButton: "#a1eb00",

  // AI accent
  aiAccent: "#8B5CF6",

  // Gradient blobs
  gradientBlob1: "radial-gradient(circle, #c7b3ff 0%, #f9b4d2 35%, #b6d4fe 65%, #fde2b3 100%)",
  gradientBlob2: "radial-gradient(circle, #ddd6fe 0%, #fecdd3 50%, #bfdbfe 100%)",
} as const;

// ─── Typography ──────────────────────────────────────────────
export const typography = {
  // Font families (using Inter as substitute for Red Hat Display/Text)
  fontDisplay: "var(--font-sans), 'Red Hat Display', sans-serif",
  fontBody: "var(--font-sans), 'Red Hat Text', sans-serif",
  fontMono: "var(--font-mono), 'JetBrains Mono', monospace",

  // Sizes
  pageTitle: { size: "48px", weight: 800, tracking: "-0.96px", lineHeight: "1.2" },
  sectionTitle: { size: "28px", weight: 800, tracking: "-0.56px", lineHeight: "1.2" },
  cardTitle: { size: "18px", weight: 700, tracking: "-0.72px", lineHeight: "1.2" },
  bodyLarge: { size: "16px", weight: 600, tracking: "-0.32px", lineHeight: "1.46" },
  bodyDefault: { size: "16px", weight: 500, tracking: "-0.32px", lineHeight: "1.46" },
  label: { size: "14px", weight: 600, tracking: "-0.28px", lineHeight: "1.46" },
  labelSmall: { size: "14px", weight: 400, tracking: "-0.28px", lineHeight: "1.46" },
  caption: { size: "12px", weight: 400, tracking: "-0.24px", lineHeight: "1.4" },
  logo: { size: "20px", weight: 800, tracking: "-0.2px", lineHeight: "16px" },
  button: { size: "14px", weight: 600, tracking: "-0.28px", lineHeight: "1.46" },
  buttonLarge: { size: "16px", weight: 600, tracking: "0", lineHeight: "16px" },
} as const;

// ─── Spacing ─────────────────────────────────────────────────
export const spacing = {
  pagePaddingX: "80px",       // Desktop horizontal padding
  pagePaddingXMobile: "20px", // Mobile horizontal padding
  navPaddingX: "40px",
  navPaddingY: "16px",
  cardPadding: "16px",
  cardGap: "32px",            // Gap between major sections
  sectionGap: "24px",         // Gap inside cards
  metricGap: "4px",           // Gap between label and value
  tableRowHeight: "56px",
  tableHeaderHeight: "41px",
} as const;

// ─── Radii ───────────────────────────────────────────────────
export const radii = {
  card: "24px",
  cardSmall: "20px",
  cardInner: "14px",
  button: "32px",    // Pill buttons
  buttonSmall: "12px",
  tab: "32px",
  avatar: "8px",
  badge: "34px",
  full: "9999px",
} as const;

// ─── Shadows ─────────────────────────────────────────────────
export const shadows = {
  card: "0px 0px 40px 0px rgba(0,0,0,0.12)",
  cardSubtle: "0px 0px 40px -12px rgba(0,0,0,0.12)",
  sm: "0 2px 8px rgba(0,0,0,0.06)",
  md: "0 4px 16px rgba(0,0,0,0.08)",
  xl: "0 8px 32px rgba(0,0,0,0.12)",
} as const;

// ─── Backdrop ────────────────────────────────────────────────
export const backdrop = {
  blur: "25px",
  blurSmall: "6px",
} as const;
