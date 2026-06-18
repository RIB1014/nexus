"use client";

import { useMemo } from "react";
import {
  startOfWeek,
  startOfDay,
  subWeeks,
  eachDayOfInterval,
  format,
  isAfter,
} from "date-fns";
import { cn } from "@/lib/utils";

const WEEKS = 17;

/** GitHub-style completion heatmap for one habit. */
export function HabitHeatmap({
  history,
  color = "#6366F1",
  onToggleDay,
}: {
  history: string[];
  color?: string;
  onToggleDay?: (dateKey: string, next: boolean) => void;
}) {
  const done = useMemo(() => new Set(history), [history]);
  const today = startOfDay(new Date());

  const weeks = useMemo(() => {
    const start = startOfWeek(subWeeks(today, WEEKS - 1));
    const days = eachDayOfInterval({ start, end: today });
    const cols: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]);

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const future = isAfter(day, today);
            const isDone = done.has(key);
            return (
              <button
                key={key}
                disabled={future || !onToggleDay}
                onClick={() => onToggleDay?.(key, !isDone)}
                title={`${format(day, "EEE, MMM d")}${isDone ? " · done" : ""}`}
                className={cn(
                  "size-3 rounded-[3px] transition-transform",
                  future && "opacity-0",
                  !isDone && !future && "bg-inset",
                  onToggleDay && !future && "hover:scale-110",
                )}
                style={isDone ? { background: color } : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
