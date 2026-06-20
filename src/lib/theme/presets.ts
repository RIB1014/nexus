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
export type FontFamilyId = "system" | "rounded" | "geist" | "serif";

export interface FontFamilyOption {
  id: FontFamilyId;
  name: string;
  /** CSS font-family stack applied to --font-app. */
  stack: string;
  description: string;
}

// The default leans on the OS font — SF Pro on macOS/iOS — for a native,
// Apple-clean feel with zero load cost. The others are opt-in via settings.
export const FONT_FAMILIES: FontFamilyOption[] = [
  {
    id: "system",
    name: "System",
    stack:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    description: "Apple San Francisco on Mac — crisp and native.",
  },
  {
    id: "rounded",
    name: "Rounded",
    stack:
      'var(--font-rounded), ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", system-ui, sans-serif',
    description: "Soft and friendly, the coziest option.",
  },
  {
    id: "geist",
    name: "Geist",
    stack: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
    description: "Modern geometric — a designer-tool feel.",
  },
  {
    id: "serif",
    name: "Serif",
    stack: 'var(--font-serif), Georgia, "Times New Roman", serif',
    description: "Editorial and calm, nice for writing.",
  },
];

export const DEFAULT_FONT_FAMILY: FontFamilyId = "system";

export function fontFamilyById(id: FontFamilyId): FontFamilyOption {
  return FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES[0];
}

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
  sharp: { sm: "4px", md: "7px", lg: "10px" },
  default: { sm: "8px", md: "12px", lg: "18px" }, // Apple-grouped-card feel
  rounded: { sm: "12px", md: "18px", lg: "26px" },
};

export const FONT_SCALE_VALUES: Record<FontScale, string> = {
  compact: "14px",
  default: "15px",
  comfortable: "16px",
};

export function presetById(id: ThemePresetId): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

// Color math lives in palette.ts now; re-export so existing imports keep working.
export { hexToRgbChannels, readableForeground } from "./palette";
