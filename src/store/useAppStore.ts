"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ACCENT,
  DEFAULT_FONT_FAMILY,
  DEFAULT_PRESET,
  type FontFamilyId,
  type FontScale,
  type RadiusScale,
  type ThemePresetId,
} from "@/lib/theme/presets";

export const DEFAULT_APP_NAME = "Orbit";
const LEGACY_APP_NAME = "Nexus";

interface AppState {
  // Branding
  appName: string;

  // Appearance
  presetId: ThemePresetId;
  accentColor: string; // resolved accent hex (preset accent or custom)
  customAccent: string; // last custom hex the user picked
  radius: RadiusScale;
  fontScale: FontScale;
  fontFamily: FontFamilyId;
  bgColor: string | null; // custom page background override (null = preset)

  // Layout
  sidebarCollapsed: boolean;
  sidebarShowLabels: boolean;

  setAppName: (name: string) => void;
  setPreset: (id: ThemePresetId, accent: string) => void;
  setCustomAccent: (hex: string) => void;
  setRadius: (r: RadiusScale) => void;
  setFontScale: (f: FontScale) => void;
  setFontFamily: (f: FontFamilyId) => void;
  setBgColor: (hex: string | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarShowLabels: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      appName: DEFAULT_APP_NAME,
      presetId: DEFAULT_PRESET,
      accentColor: DEFAULT_ACCENT,
      customAccent: DEFAULT_ACCENT,
      radius: "default",
      fontScale: "default",
      fontFamily: DEFAULT_FONT_FAMILY,
      bgColor: null,

      sidebarCollapsed: false,
      sidebarShowLabels: true,

      setAppName: (appName) =>
        set({ appName: appName.trim().slice(0, 24) || DEFAULT_APP_NAME }),
      setPreset: (id, accent) => set({ presetId: id, accentColor: accent }),
      setCustomAccent: (hex) =>
        set({ presetId: "custom", accentColor: hex, customAccent: hex }),
      setRadius: (radius) => set({ radius }),
      setFontScale: (fontScale) => set({ fontScale }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setBgColor: (bgColor) => set({ bgColor }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSidebarShowLabels: (sidebarShowLabels) => set({ sidebarShowLabels }),
    }),
    {
      name: "nexus-appearance",
      version: 1,
      // Bump anyone still on the old default name to the new brand, without
      // clobbering a name they chose themselves.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<AppState> | undefined;
        if (state && version < 1 && (!state.appName || state.appName === LEGACY_APP_NAME)) {
          state.appName = DEFAULT_APP_NAME;
        }
        return state as AppState;
      },
    },
  ),
);
