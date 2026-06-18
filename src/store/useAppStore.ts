"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ACCENT,
  DEFAULT_PRESET,
  type FontScale,
  type RadiusScale,
  type ThemePresetId,
} from "@/lib/theme/presets";

interface AppState {
  // Appearance
  presetId: ThemePresetId;
  accentColor: string; // resolved accent hex (preset accent or custom)
  customAccent: string; // last custom hex the user picked
  radius: RadiusScale;
  fontScale: FontScale;
  bgColor: string | null; // custom page background override (null = preset)

  // Layout
  sidebarCollapsed: boolean;
  sidebarShowLabels: boolean;

  setPreset: (id: ThemePresetId, accent: string) => void;
  setCustomAccent: (hex: string) => void;
  setRadius: (r: RadiusScale) => void;
  setFontScale: (f: FontScale) => void;
  setBgColor: (hex: string | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarShowLabels: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      presetId: DEFAULT_PRESET,
      accentColor: DEFAULT_ACCENT,
      customAccent: DEFAULT_ACCENT,
      radius: "default",
      fontScale: "default",
      bgColor: null,

      sidebarCollapsed: false,
      sidebarShowLabels: true,

      setPreset: (id, accent) => set({ presetId: id, accentColor: accent }),
      setCustomAccent: (hex) =>
        set({ presetId: "custom", accentColor: hex, customAccent: hex }),
      setRadius: (radius) => set({ radius }),
      setFontScale: (fontScale) => set({ fontScale }),
      setBgColor: (bgColor) => set({ bgColor }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSidebarShowLabels: (sidebarShowLabels) => set({ sidebarShowLabels }),
    }),
    { name: "nexus-appearance" },
  ),
);
