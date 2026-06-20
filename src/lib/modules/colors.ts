// Each module gets a signature color (Apple-system palette), used for its
// colored icon tile in the sidebar and as the per-page accent — the Reminders
// "every list has its own color" motif applied to modules.

export const MODULE_COLORS: Record<string, string> = {
  tasks: "#0A84FF", // blue
  calendar: "#FF3B30", // red
  notes: "#FFB300", // amber
  academic: "#5E5CE6", // indigo
  email: "#32ADE6", // cyan
  "practice-log": "#AF52DE", // purple
  athletics: "#30B0C7", // teal
  habits: "#34C759", // green
  wellness: "#FF375F", // pink
  cycle: "#F2557E", // rose
  finance: "#00C7BE", // mint
  links: "#FF9500", // orange
  files: "#8E8E93", // graphite
};

export function moduleColor(id: string): string {
  return MODULE_COLORS[id] ?? "#8E8E93";
}
