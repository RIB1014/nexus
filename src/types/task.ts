import type { Priority } from "@/lib/tasks/parse";

export type { Priority };

export type TaskStatus = "todo" | "in_progress" | "done";
export type SmartListId =
  | "today"
  | "scheduled"
  | "flagged"
  | "all"
  | "completed";

export interface TaskTagDTO {
  id: string;
  name: string;
  color: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null; // ISO
  dueTime: string | null; // "HH:MM"
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  flagged: boolean;
  parentId: string | null;
  listId: string | null;
  status: TaskStatus;
  estimatedMin: number | null;
  recurrence: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  tags: TaskTagDTO[];
  subtasks: TaskDTO[];
}

export interface TaskListDTO {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  order: number;
  count: number; // incomplete top-level tasks
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; rank: number }
> = {
  urgent: { label: "Urgent", color: "#ef4444", rank: 4 },
  high: { label: "High", color: "#f97316", rank: 3 },
  medium: { label: "Medium", color: "#f59e0b", rank: 2 },
  low: { label: "Low", color: "#38bdf8", rank: 1 },
  none: { label: "None", color: "transparent", rank: 0 },
};

export const SMART_LISTS: { id: SmartListId; name: string; icon: string }[] = [
  { id: "today", name: "Today", icon: "sun" },
  { id: "scheduled", name: "Scheduled", icon: "calendar" },
  { id: "flagged", name: "Flagged", icon: "flag" },
  { id: "all", name: "All", icon: "inbox" },
  { id: "completed", name: "Completed", icon: "check" },
];
