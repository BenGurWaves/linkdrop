export type Theme = {
  key: string;
  name: string;
  bg: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  linkBg: string;
  linkText: string;
  dark: boolean;
  free: boolean;
};

export const themes: Record<string, Theme> = {
  sage: {
    key: "sage",
    name: "Sage",
    bg: "#F5F0EB",
    accent: "#A8B5A0",
    textPrimary: "#3A3A38",
    textSecondary: "#7A8370",
    linkBg: "#A8B5A0",
    linkText: "#FFFFFF",
    dark: false,
    free: true,
  },
  dusk: {
    key: "dusk",
    name: "Dusk",
    bg: "#3A3A38",
    accent: "#E0BFB8",
    textPrimary: "#F5F0EB",
    textSecondary: "#B5AEA6",
    linkBg: "#E0BFB8",
    linkText: "#3A3A38",
    dark: true,
    free: true,
  },
  terracotta: {
    key: "terracotta",
    name: "Terracotta",
    bg: "#F5F0EB",
    accent: "#C4836A",
    textPrimary: "#3A3A38",
    textSecondary: "#7A8370",
    linkBg: "#C4836A",
    linkText: "#FFFFFF",
    dark: false,
    free: true,
  },
  midnight: {
    key: "midnight",
    name: "Midnight",
    bg: "#1a1a2e",
    accent: "#e94560",
    textPrimary: "#F5F0EB",
    textSecondary: "#a0a0b0",
    linkBg: "#e94560",
    linkText: "#ffffff",
    dark: true,
    free: false,
  },
  forest: {
    key: "forest",
    name: "Forest",
    bg: "#1b4332",
    accent: "#95d5b2",
    textPrimary: "#d8f3dc",
    textSecondary: "#95d5b2",
    linkBg: "#95d5b2",
    linkText: "#1b4332",
    dark: true,
    free: false,
  },
  sand: {
    key: "sand",
    name: "Sand",
    bg: "#fefae0",
    accent: "#bc6c25",
    textPrimary: "#283618",
    textSecondary: "#606c38",
    linkBg: "#bc6c25",
    linkText: "#ffffff",
    dark: false,
    free: false,
  },
  monochrome: {
    key: "monochrome",
    name: "Monochrome",
    bg: "#ffffff",
    accent: "#000000",
    textPrimary: "#000000",
    textSecondary: "#666666",
    linkBg: "#000000",
    linkText: "#ffffff",
    dark: false,
    free: false,
  },
};

export const freeThemeKeys = Object.keys(themes).filter((k) => themes[k].free);

export function getTheme(key: string): Theme {
  return themes[key] ?? themes.sage;
}

export function themeToCSS(
  theme: Theme,
  accentOverride?: string,
  customCss?: Record<string, unknown>
): Record<string, string> {
  const accent = accentOverride ?? theme.accent;
  const base: Record<string, string> = {
    "--ld-bg": theme.bg,
    "--ld-accent": accent,
    "--ld-text-primary": theme.textPrimary,
    "--ld-text-secondary": theme.textSecondary,
    "--ld-link-bg": accentOverride ?? theme.linkBg,
    "--ld-link-text": theme.linkText,
  };

  // Apply Pro custom color overrides from custom_css jsonb
  if (customCss) {
    if (typeof customCss.bgColor === "string") base["--ld-bg"] = customCss.bgColor;
    if (typeof customCss.linkColor === "string") base["--ld-link-bg"] = customCss.linkColor;
    if (typeof customCss.linkTextColor === "string") base["--ld-link-text"] = customCss.linkTextColor;
    if (typeof customCss.textColor === "string") {
      base["--ld-text-primary"] = customCss.textColor;
      base["--ld-text-secondary"] = customCss.textColor;
    }
  }

  return base;
}
