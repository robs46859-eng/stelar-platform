import {
  argbFromHex,
  hexFromArgb,
  SchemeContent,
  Hct,
} from "@material/material-color-utilities";

export type M3Palette = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
};

export function generateM3Palette(seedHex: string, isDark = false): M3Palette {
  const seedArgb = argbFromHex(seedHex);
  const hct = Hct.fromInt(seedArgb);
  const scheme = new SchemeContent(hct, isDark, 0);

  return {
    primary: hexFromArgb(scheme.primary),
    onPrimary: hexFromArgb(scheme.onPrimary),
    primaryContainer: hexFromArgb(scheme.primaryContainer),
    onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
    secondary: hexFromArgb(scheme.secondary),
    onSecondary: hexFromArgb(scheme.onSecondary),
    secondaryContainer: hexFromArgb(scheme.secondaryContainer),
    onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),
    tertiary: hexFromArgb(scheme.tertiary),
    onTertiary: hexFromArgb(scheme.onTertiary),
    tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
    onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),
    error: hexFromArgb(scheme.error),
    onError: hexFromArgb(scheme.onError),
    errorContainer: hexFromArgb(scheme.errorContainer),
    onErrorContainer: hexFromArgb(scheme.onErrorContainer),
    background: hexFromArgb(scheme.background),
    onBackground: hexFromArgb(scheme.onBackground),
    surface: hexFromArgb(scheme.surface),
    onSurface: hexFromArgb(scheme.onSurface),
    surfaceVariant: hexFromArgb(scheme.surfaceVariant),
    onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),
    outline: hexFromArgb(scheme.outline),
    outlineVariant: hexFromArgb(scheme.outlineVariant),
    shadow: hexFromArgb(scheme.shadow),
    scrim: hexFromArgb(scheme.scrim),
    inverseSurface: hexFromArgb(scheme.inverseSurface),
    inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
    inversePrimary: hexFromArgb(scheme.inversePrimary),
  };
}

export function applyM3Palette(palette: M3Palette) {
  const root = document.documentElement;
  Object.entries(palette).forEach(([key, value]) => {
    const cssKey = `--md-sys-color-${key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}`;
    root.style.setProperty(cssKey, value);
  });
}

/**
 * "Modern Homey Minimalism" (Desktop MODERN_HOMEY_TEMPLATE):
 * Alabaster, Soft Charcoal, Warm Sand, Sage Green, Creamy Olive, soft borders.
 */
export const modernHomeyPalette: M3Palette = {
  primary: "#D4A373",
  onPrimary: "#FFFFFF",
  primaryContainer: "#E9EDC9",
  onPrimaryContainer: "#2C2C2C",
  secondary: "#CCD5AE",
  onSecondary: "#2C2C2C",
  secondaryContainer: "#E9EDC9",
  onSecondaryContainer: "#2C2C2C",
  tertiary: "#B08968",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FAF9F6",
  onTertiaryContainer: "#2C2C2C",
  error: "#B85C5C",
  onError: "#FFFFFF",
  errorContainer: "#F9E5E5",
  onErrorContainer: "#2C2C2C",
  background: "#FAF9F6",
  onBackground: "#2C2C2C",
  surface: "#FFFFFF",
  onSurface: "#2C2C2C",
  surfaceVariant: "#E9EDC9",
  onSurfaceVariant: "#4A4A4A",
  outline: "#E5E5E5",
  outlineVariant: "#E0E0E0",
  shadow: "rgba(0,0,0,0.08)",
  scrim: "rgba(44, 44, 44, 0.35)",
  inverseSurface: "#2C2C2C",
  inverseOnSurface: "#FAF9F6",
  inversePrimary: "#E9EDC9",
};

export function applyModernHomeyPalette() {
  applyM3Palette(modernHomeyPalette);
}
