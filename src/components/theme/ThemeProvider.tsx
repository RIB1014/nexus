"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemes } from "next-themes";
import { useAppStore } from "@/store/useAppStore";
import {
  FONT_SCALE_VALUES,
  RADIUS_VALUES,
  fontFamilyById,
  hexToRgbChannels,
  readableForeground,
} from "@/lib/theme/presets";

/**
 * Applies the user's appearance tokens (accent, radius, font family + scale,
 * background) to the document root as CSS variables whenever they change.
 * Light/dark is handled by next-themes (which sets the `dark` class).
 */
function AppearanceTokens() {
  const accentColor = useAppStore((s) => s.accentColor);
  const radius = useAppStore((s) => s.radius);
  const fontScale = useAppStore((s) => s.fontScale);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const bgColor = useAppStore((s) => s.bgColor);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-accent", accentColor);
    root.style.setProperty("--color-accent-rgb", hexToRgbChannels(accentColor));
    // Flip button/badge text to black on pale accents (yellow, mint, …).
    root.style.setProperty("--color-accent-contrast", readableForeground(accentColor));
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-app",
      fontFamilyById(fontFamily).stack,
    );
  }, [fontFamily]);

  useEffect(() => {
    const root = document.documentElement;
    if (bgColor) root.style.setProperty("--color-bg-primary", bgColor);
    else root.style.removeProperty("--color-bg-primary");
  }, [bgColor]);

  useEffect(() => {
    const root = document.documentElement;
    const r = RADIUS_VALUES[radius];
    root.style.setProperty("--app-radius-sm", r.sm);
    root.style.setProperty("--app-radius-md", r.md);
    root.style.setProperty("--app-radius-lg", r.lg);
  }, [radius]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SCALE_VALUES[fontScale];
  }, [fontScale]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppearanceTokens />
      {children}
    </NextThemes>
  );
}
