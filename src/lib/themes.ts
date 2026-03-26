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
};

export const freeThemeKeys = Object.keys(themes).filter((k) => themes[k].free);

export function getTheme(key: string): Theme {
  return themes[key] ?? themes.sage;
}

export function themeToCSS(
  theme: Theme,
  accentOverride?: string
): Record<string, string> {
  const accent = accentOverride ?? theme.accent;
  return {
    "--ld-bg": theme.bg,
    "--ld-accent": accent,
    "--ld-text-primary": theme.textPrimary,
    "--ld-text-secondary": theme.textSecondary,
    "--ld-link-bg": accentOverride ?? theme.linkBg,
    "--ld-link-text": theme.linkText,
  };
}
