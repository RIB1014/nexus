"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  format,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/task";
import { PRIORITY_META } from "@/types/task";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskCalendarView({
  tasks,
  onOpen,
}: {
  tasks: TaskDTO[];
  onOpen: (t: TaskDTO) => void;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskDTO[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = format(parseISO(t.dueDate), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  const today = new Date();

  return (
    <div className="rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-heading">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded-md px-2.5 py-1.5 text-small text-muted hover:bg-inset"
          >
            Today
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center text-micro text-faint">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r border-line p-1.5 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-inset/30",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full font-data text-[0.6875rem]",
                    isToday ? "bg-accent text-accent-contrast" : "text-muted",
                    !inMonth && "text-faint",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onOpen(t)}
                    className={cn(
                      "flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[0.6875rem]",
                      t.completed ? "text-muted line-through" : "text-fg",
                      "hover:bg-inset",
                    )}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{
                        background:
                          PRIORITY_META[t.priority].color === "transparent"
                            ? "var(--color-accent)"
                            : PRIORITY_META[t.priority].color,
                      }}
                    />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="px-1 text-[0.625rem] text-faint">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
