// Theme presets. Each preset is primarily an accent color; the neutral
// background/text/border palette comes from the light/dark base (globals.css).
// The accent is applied at runtime as the --color-accent CSS variable.

export type ThemePresetId =
  | "slate"
  | "forest"
  | "ember"
  | "arctic"
  | "rose"
  | "obsidian"
  | "custom";

export type RadiusScale = "sharp" | "default" | "rounded";
export type FontScale = "compact" | "default" | "comfortable";
export type BaseMode = "light" | "dark" | "system";

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  accent: string; // hex
  personality: string;
  /** Suggested base when a user first picks this preset. */
  prefersDark?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "slate",
    name: "Slate",
    accent: "#6366F1",
    personality: "Calm, academic — the default.",
  },
  {
    id: "forest",
    name: "Forest",
    accent: "#22C55E",
    personality: "Grounded, focus.",
  },
  {
    id: "ember",
    name: "Ember",
    accent: "#F97316",
    personality: "Energetic, warm.",
  },
  {
    id: "arctic",
    name: "Arctic",
    accent: "#38BDF8",
    personality: "Clean, athletic.",
  },
  {
    id: "rose",
    name: "Rose",
    accent: "#F43F5E",
    personality: "Soft, expressive.",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    accent: "#A78BFA",
    personality: "Dark-first, night-owl.",
    prefersDark: true,
  },
];

export const DEFAULT_PRESET: ThemePresetId = "slate";
export const DEFAULT_ACCENT = "#6366F1";

export const RADIUS_VALUES: Record<RadiusScale, { sm: string; md: string; lg: string }> = {
  sharp: { sm: "2px", md: "4px", lg: "6px" },
  default: { sm: "6px", md: "10px", lg: "16px" },
  rounded: { sm: "10px", md: "16px", lg: "24px" },
};

export const FONT_SCALE_VALUES: Record<FontScale, string> = {
  compact: "14px",
  default: "15px",
  comfortable: "16px",
};

export function presetById(id: ThemePresetId): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

/** Convert a hex color to "r g b" channel string for rgb()/opacity composition. */
export function hexToRgbChannels(hex: string): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `${r} ${g} ${b}`;
}
