import {
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
  isThisYear,
  format,
  endOfDay,
  isAfter,
} from "date-fns";

export type DueTone = "overdue" | "today" | "soon" | "default";

export interface DueLabel {
  text: string;
  tone: DueTone;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return format(d, "h:mma").toLowerCase();
}

export function formatDueLabel(
  iso: string | null,
  time: string | null,
  completed = false,
): DueLabel | null {
  if (!iso) return null;
  const d = parseISO(iso);
  let text: string;
  if (isToday(d)) text = "Today";
  else if (isTomorrow(d)) text = "Tomorrow";
  else if (isYesterday(d)) text = "Yesterday";
  else text = format(d, isThisYear(d) ? "MMM d" : "MMM d, yyyy");

  if (time) text += ` ${formatTime(time)}`;

  let tone: DueTone = "default";
  if (!completed) {
    if (isAfter(new Date(), endOfDay(d))) tone = "overdue";
    else if (isToday(d)) tone = "today";
    else if (isTomorrow(d)) tone = "soon";
  }
  return { text, tone };
}

export const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: "text-red-500",
  today: "text-accent",
  soon: "text-amber-500",
  default: "text-faint",
};
