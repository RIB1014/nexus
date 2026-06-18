"use client";

import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({
  cursor,
  events,
  onCreate,
  onOpenEvent,
}: {
  cursor: Date;
  events: CalendarEventDTO[];
  onCreate: (date: Date) => void;
  onOpenEvent: (e: CalendarEventDTO) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEventDTO[]>();
    for (const e of events) {
      const key = format(parseISO(e.start), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const today = new Date();

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center text-micro text-faint">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={key}
              onClick={() => onCreate(day)}
              className={cn(
                "group min-h-28 cursor-pointer border-b border-r border-line p-1.5 transition-colors hover:bg-inset/40 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-inset/30",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span className={cn(
                  "flex size-5 items-center justify-center rounded-full font-data text-[0.6875rem]",
                  isToday ? "bg-accent text-accent-contrast" : "text-muted",
                  !inMonth && "text-faint",
                )}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onOpenEvent(e); }}
                    className={cn(
                      "flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[0.6875rem] hover:opacity-80",
                      e.isTask ? "border border-dashed" : "text-white",
                    )}
                    style={
                      e.isTask
                        ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
                        : { background: e.color ?? "var(--color-accent)" }
                    }
                  >
                    {!e.allDay && (
                      <span className="shrink-0 opacity-80">{format(parseISO(e.start), "h:mma").toLowerCase().replace(":00", "")}</span>
                    )}
                    <span className="truncate">{e.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="px-1 text-[0.625rem] text-faint">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
