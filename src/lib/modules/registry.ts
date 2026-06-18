import {
  ListTodo,
  Calendar,
  GraduationCap,
  Mail,
  NotebookPen,
  Music,
  Dumbbell,
  Repeat,
  HeartPulse,
  Droplet,
  Wallet,
  Link2,
} from "lucide-react";
import type { ModuleDefinition } from "@/types/module";

/**
 * The module registry — the single source of truth for every feature in Nexus.
 * The sidebar, settings, onboarding, and dynamic [moduleSlug] route all read
 * from here. Adding a module = adding an entry here (+ a page/widget component).
 * See CONTRIBUTING.md.
 *
 * NOTE: this file is metadata-only (safe to import on the server). Page and
 * widget React components are wired separately and code-split via next/dynamic
 * in src/lib/modules/components.ts so nav rendering never bundles module code.
 */
export const MODULES: ModuleDefinition[] = [
  {
    id: "tasks",
    name: "Tasks",
    description: "Capture to-dos, organize them into lists, and never lose track.",
    icon: ListTodo,
    category: "productivity",
    defaultEnabled: true,
    recommendedFor: ["student", "musician", "athlete", "artist", "developer", "other"],
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "See tasks, events, and deadlines together across month and week views.",
    icon: Calendar,
    category: "productivity",
    defaultEnabled: true,
    recommendedFor: ["student", "athlete", "developer"],
  },
  {
    id: "notes",
    name: "Notes",
    description: "Write block-based, linked pages for lectures, projects, and ideas.",
    icon: NotebookPen,
    category: "productivity",
    defaultEnabled: false,
    recommendedFor: ["student", "artist", "developer"],
  },
  {
    id: "academic",
    name: "Academic Hub",
    description: "Track courses, grades, and assignments synced from Canvas.",
    icon: GraduationCap,
    category: "academic",
    defaultEnabled: false,
    requiredIntegrations: ["canvas"],
    recommendedFor: ["student"],
  },
  {
    id: "email",
    name: "Email Inbox",
    description: "Read and reply to your Outlook mail in a calm, focused inbox.",
    icon: Mail,
    category: "productivity",
    defaultEnabled: false,
    requiredIntegrations: ["outlook"],
    recommendedFor: ["student", "developer"],
  },
  {
    id: "practice-log",
    name: "Practice Log",
    description: "Log practice sessions, track repertoire, and watch your hours grow.",
    icon: Music,
    category: "creative",
    color: "#A78BFA",
    defaultEnabled: false,
    recommendedFor: ["musician"],
  },
  {
    id: "athletics",
    name: "Athletics",
    description: "Record workouts, track PRs, and follow your training over a season.",
    icon: Dumbbell,
    category: "athletics",
    color: "#38BDF8",
    defaultEnabled: false,
    recommendedFor: ["athlete"],
  },
  {
    id: "habits",
    name: "Habits",
    description: "Build routines with daily check-ins and streaks that keep you going.",
    icon: Repeat,
    category: "wellness",
    defaultEnabled: false,
    recommendedFor: ["student", "athlete", "musician", "other"],
  },
  {
    id: "wellness",
    name: "Mood & Wellness",
    description: "Check in on mood, energy, and sleep, and reflect with a private journal.",
    icon: HeartPulse,
    category: "wellness",
    defaultEnabled: false,
    recommendedFor: ["other"],
  },
  {
    id: "cycle",
    name: "Cycle Tracker",
    description: "Log your cycle and symptoms with clear, private, evidence-based insights.",
    icon: Droplet,
    category: "wellness",
    defaultEnabled: false,
    recommendedFor: [],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Log expenses, set budgets, and see where your money actually goes.",
    icon: Wallet,
    category: "productivity",
    defaultEnabled: false,
    recommendedFor: ["student", "other"],
  },
  {
    id: "links",
    name: "Links & Resources",
    description: "Save and organize links into collections you can find again fast.",
    icon: Link2,
    category: "productivity",
    defaultEnabled: false,
    recommendedFor: ["student", "developer", "artist"],
  },
];

export const MODULE_MAP: Record<string, ModuleDefinition> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
);

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULE_MAP[id];
}

export const IDENTITY_TAGS = [
  { id: "student", label: "Student", emoji: "🎓" },
  { id: "musician", label: "Musician", emoji: "🎵" },
  { id: "athlete", label: "Athlete", emoji: "🏃" },
  { id: "artist", label: "Artist", emoji: "🎨" },
  { id: "developer", label: "Developer", emoji: "💻" },
  { id: "other", label: "Other", emoji: "✨" },
] as const;

export type IdentityTagId = (typeof IDENTITY_TAGS)[number]["id"];

/** Modules recommended for a set of identity tags, plus always-on defaults. */
export function recommendedModuleIds(identityTags: string[]): string[] {
  const ids = new Set<string>();
  for (const m of MODULES) {
    if (m.defaultEnabled) ids.add(m.id);
    if (m.recommendedFor?.some((t) => identityTags.includes(t))) ids.add(m.id);
  }
  return [...ids];
}
