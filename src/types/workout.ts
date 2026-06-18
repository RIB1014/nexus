export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  distanceKm?: number;
  notes?: string;
}

export const WORKOUT_TYPES = [
  "Strength", "Cardio", "Sport Practice", "Recovery", "Flexibility", "Other",
] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export interface WorkoutDTO {
  id: string;
  type: string;
  durationMin: number;
  startTime: string;
  exercises: Exercise[];
  rpe: number | null;
  notes: string | null;
  bodyWeight: number | null;
}

export interface WorkoutStats {
  weekCount: number;
  weekMinutes: number;
  weekVolume: number; // sum of sets*reps*weight
  activeDays: string[]; // yyyy-MM-dd
  byType: { type: string; count: number }[];
  prs: { name: string; weight: number }[];
}

export interface WorkoutSummary {
  workouts: WorkoutDTO[];
  stats: WorkoutStats;
}
