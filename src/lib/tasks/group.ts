import { parseISO, isToday, isTomorrow, startOfDay, isThisWeek } from "date-fns";
import type { TaskDTO, TaskListDTO, Priority } from "@/types/task";
import { PRIORITY_META } from "@/types/task";

export type GroupBy = "none" | "priority" | "date" | "list";

export interface TaskGroup {
  key: string;
  label: string;
  tasks: TaskDTO[];
}

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low", "none"];

function dateBucket(t: TaskDTO): { key: string; label: string; rank: number } {
  if (!t.dueDate) return { key: "none", label: "No date", rank: 5 };
  const d = parseISO(t.dueDate);
  if (!t.completed && d < startOfDay(new Date()) && !isToday(d)) return { key: "overdue", label: "Overdue", rank: 0 };
  if (isToday(d)) return { key: "today", label: "Today", rank: 1 };
  if (isTomorrow(d)) return { key: "tomorrow", label: "Tomorrow", rank: 2 };
  if (isThisWeek(d, { weekStartsOn: 0 })) return { key: "week", label: "This week", rank: 3 };
  return { key: "later", label: "Later", rank: 4 };
}

export function groupTasks(tasks: TaskDTO[], groupBy: GroupBy, lists: TaskListDTO[]): TaskGroup[] {
  if (groupBy === "none") return [{ key: "all", label: "", tasks }];

  const map = new Map<string, TaskGroup & { rank: number }>();
  for (const t of tasks) {
    let key: string, label: string, rank: number;
    if (groupBy === "priority") {
      key = t.priority; label = PRIORITY_META[t.priority].label; rank = PRIORITY_ORDER.indexOf(t.priority);
    } else if (groupBy === "date") {
      const b = dateBucket(t); key = b.key; label = b.label; rank = b.rank;
    } else {
      key = t.listId ?? "none";
      label = lists.find((l) => l.id === t.listId)?.name ?? "No list";
      rank = t.listId ? lists.findIndex((l) => l.id === t.listId) : 999;
    }
    if (!map.has(key)) map.set(key, { key, label, rank, tasks: [] });
    map.get(key)!.tasks.push(t);
  }
  return [...map.values()].sort((a, b) => a.rank - b.rank).map(({ key, label, tasks }) => ({ key, label, tasks }));
}
