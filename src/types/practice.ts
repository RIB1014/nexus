export interface PracticePiece {
  name: string;
  sections?: string;
  notes?: string;
}

export interface PracticeSessionDTO {
  id: string;
  instrument: string;
  durationMin: number;
  date: string;
  pieces: PracticePiece[];
  goals: string | null;
  reflections: string | null;
  qualityRating: number | null;
  bpmRange: string | null;
  tags: string[];
}

export interface PracticeStats {
  weekMin: number;
  monthMin: number;
  allMin: number;
  streak: number;
  avgMin: number;
  weeklyGoalMin: number;
  byInstrument: { instrument: string; minutes: number }[];
  practicedDays: string[]; // yyyy-MM-dd
}

export interface PracticeSummary {
  sessions: PracticeSessionDTO[];
  stats: PracticeStats;
  instruments: string[];
}

export type RepertoireStatus =
  | "learning"
  | "polishing"
  | "performance-ready"
  | "archived";

export interface RepertoireItemDTO {
  id: string;
  title: string;
  composer: string | null;
  instrument: string | null;
  status: RepertoireStatus;
  lastPracticed: string | null;
  notes: string | null;
}

export const REPERTOIRE_STATUS_META: Record<
  RepertoireStatus,
  { label: string; color: string }
> = {
  learning: { label: "Learning", color: "#38BDF8" },
  polishing: { label: "Polishing", color: "#F59E0B" },
  "performance-ready": { label: "Performance-ready", color: "#22C55E" },
  archived: { label: "Archived", color: "#9A9AA4" },
};

export const PRACTICE_TAGS = [
  "scales", "sight-reading", "technique", "performance prep", "improv", "theory", "repertoire", "etudes",
];
