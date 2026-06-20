// Shared color system. ONE curated palette powers every colorable thing in
// Nexus — the global accent, every task list, every calendar, and tags. Each
// swatch is an Apple-system-style hue. A custom hex picker complements these.

export interface Swatch {
  id: string;
  name: string;
  hex: string;
}

/** Apple-system-inspired palette, ordered as a spectrum for a pleasant grid. */
export const PALETTE: Swatch[] = [
  { id: "red", name: "Red", hex: "#FF3B30" },
  { id: "orange", name: "Orange", hex: "#FF9500" },
  { id: "amber", name: "Amber", hex: "#FFB300" },
  { id: "yellow", name: "Yellow", hex: "#F5C518" },
  { id: "green", name: "Green", hex: "#34C759" },
  { id: "mint", name: "Mint", hex: "#00C7BE" },
  { id: "teal", name: "Teal", hex: "#30B0C7" },
  { id: "cyan", name: "Cyan", hex: "#32ADE6" },
  { id: "blue", name: "Blue", hex: "#0A84FF" },
  { id: "indigo", name: "Indigo", hex: "#5E5CE6" },
  { id: "purple", name: "Purple", hex: "#AF52DE" },
  { id: "pink", name: "Pink", hex: "#FF375F" },
  { id: "rose", name: "Rose", hex: "#F2557E" },
  { id: "brown", name: "Brown", hex: "#A2845E" },
  { id: "graphite", name: "Graphite", hex: "#8E8E93" },
];

export const PALETTE_HEXES = PALETTE.map((s) => s.hex);

/** Convert a hex color to "r g b" channels for rgb()/opacity composition. */
export function hexToRgbChannels(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

/** Relative luminance (0–1) per WCAG, used to pick readable foregrounds. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** Black or white text that reads cleanly on top of `hex`. */
export function readableForeground(hex: string): string {
  return luminance(hex) > 0.6 ? "#1b1b1f" : "#ffffff";
}

/** Is this color light enough that it needs a darker outline/text on light UI? */
export function isLight(hex: string): boolean {
  return luminance(hex) > 0.7;
}

export function isValidHex(value: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(value.trim()) || /^#?[0-9a-fA-F]{3}$/.test(value.trim());
}

export function normalizeHex(value: string): string {
  const v = value.trim();
  return v.startsWith("#") ? v : `#${v}`;
}
