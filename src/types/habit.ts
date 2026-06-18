export interface HabitDTO {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  frequency: string; // 'daily' | 'weekdays' | 'custom'
  customDays: number[];
  category: string | null;
  targetStreak: number;
  order: number;
  streak: number; // current consecutive-day streak
  doneToday: boolean;
  /** Completion map for the heatmap: "yyyy-MM-dd" -> true. */
  history: string[]; // dates (yyyy-MM-dd) completed in the window
}

export interface HabitsSummary {
  habits: HabitDTO[];
  weekRate: number; // 0–100 % of expected check-ins done this week
}
