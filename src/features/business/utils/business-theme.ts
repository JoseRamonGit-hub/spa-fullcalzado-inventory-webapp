import type { CSSProperties } from "react";
import type { Business } from "@/types";

export type BusinessTheme = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  foreground: string;
  gradient: string;
  shadow: string;
};

const FULL_CALZADO_THEME: BusinessTheme = {
  accent: "oklch(0.55 0.15 55)",
  accentBorder: "oklch(0.58 0.15 55 / 0.28)",
  accentSurface: "oklch(0.62 0.15 55 / 0.1)",
  foreground: "oklch(0.99 0.002 75)",
  gradient: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
  shadow: "0 10px 24px oklch(0.52 0.14 55 / 0.24)",
};

const BUSINESS_THEMES_BY_SLUG: Record<string, BusinessTheme> = {
  "full-calzado": FULL_CALZADO_THEME,
  "zapateria-estilos": {
    accent: "oklch(0.46 0.12 185)",
    accentBorder: "oklch(0.52 0.13 185 / 0.3)",
    accentSurface: "oklch(0.62 0.13 175 / 0.11)",
    foreground: "oklch(0.99 0.003 180)",
    gradient: "linear-gradient(135deg, oklch(0.66 0.14 165), oklch(0.44 0.12 195))",
    shadow: "0 10px 24px oklch(0.42 0.11 195 / 0.24)",
  },
};

export function getBusinessTheme(business: Pick<Business, "slug"> | null | undefined) {
  return BUSINESS_THEMES_BY_SLUG[business?.slug ?? ""] ?? FULL_CALZADO_THEME;
}

export function getBusinessAccentStyle(theme: BusinessTheme): CSSProperties {
  return {
    backgroundColor: theme.accentSurface,
    borderColor: theme.accentBorder,
    color: theme.accent,
  };
}

export function getBusinessIconStyle(theme: BusinessTheme): CSSProperties {
  return {
    background: theme.gradient,
    boxShadow: theme.shadow,
    color: theme.foreground,
  };
}

export function getBusinessDotStyle(theme: BusinessTheme): CSSProperties {
  return {
    background: theme.gradient,
  };
}
