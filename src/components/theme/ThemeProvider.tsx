"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemes } from "next-themes";
import { useAppStore } from "@/store/useAppStore";
import {
  FONT_SCALE_VALUES,
  RADIUS_VALUES,
  hexToRgbChannels,
} from "@/lib/theme/presets";

/**
 * Applies the user's appearance tokens (accent, radius, font scale) to the
 * document root as CSS variables whenever they change. Light/dark is handled
 * by next-themes (which sets the `dark` class).
 */
function AppearanceTokens() {
  const accentColor = useAppStore((s) => s.accentColor);
  const radius = useAppStore((s) => s.radius);
  const fontScale = useAppStore((s) => s.fontScale);
  const bgColor = useAppStore((s) => s.bgColor);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-accent", accentColor);
    root.style.setProperty("--color-accent-rgb", hexToRgbChannels(accentColor));
  }, [accentColor]);

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
