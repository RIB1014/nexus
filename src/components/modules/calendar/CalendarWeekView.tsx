"use client";

import { useMemo } from "react";
import {
  startOfWeek, addDays, isSameDay, format, parseISO, setHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_PX = 48;

export function CalendarWeekView({
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
  const weekStart = startOfWeek(cursor);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const today = new Date();

  const allDayByDay = (day: Date) =>
    events.filter((e) => e.allDay && isSameDay(parseISO(e.start), day));
  const timedByDay = (day: Date) =>
    events.filter((e) => !e.allDay && isSameDay(parseISO(e.start), day));

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-panel">
      <div className="min-w-[720px]">
        {/* Header row */}
        <div className="grid border-b border-line" style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}>
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className="border-l border-line px-2 py-2 text-center">
              <div className="text-micro text-faint">{format(d, "EEE")}</div>
              <div className={cn(
                "mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full font-data text-small",
                isSameDay(d, today) ? "bg-accent text-accent-contrast" : "text-fg",
              )}>
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* All-day row */}
        <div className="grid border-b border-line" style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}>
          <div className="px-1 py-1 text-right text-[0.625rem] text-faint">all-day</div>
          {days.map((d) => (
            <div key={d.toISOString()} className="min-h-7 border-l border-line p-0.5">
              {allDayByDay(d).map((e) => (
                <button
                  key={e.id}
                  onClick={() => onOpenEvent(e)}
                  className={cn("mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[0.625rem]", e.isTask ? "border border-dashed text-accent" : "text-white")}
                  style={e.isTask ? { borderColor: "var(--color-accent)" } : { background: e.color ?? "var(--color-accent)" }}
                >
                  {e.title}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid" style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}>
          {/* hour labels */}
          <div className="flex flex-col">
            {hours.map((h) => (
              <div key={h} className="relative text-right pr-1" style={{ height: HOUR_PX }}>
                <span className="absolute -top-1.5 right-1 text-[0.625rem] text-faint">
                  {format(setHours(new Date(), h), "ha").toLowerCase()}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div key={day.toISOString()} className="relative border-l border-line">
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => onCreate(setHours(day, h))}
                  className="cursor-pointer border-b border-line/60 hover:bg-inset/40"
                  style={{ height: HOUR_PX }}
                />
              ))}
              {timedByDay(day).map((e) => {
                const s = parseISO(e.start);
                const en = parseISO(e.end);
                const top = (s.getHours() + s.getMinutes() / 60 - START_HOUR) * HOUR_PX;
                const height = Math.max(
                  18,
                  ((en.getTime() - s.getTime()) / 3_600_000) * HOUR_PX,
                );
                if (top < -HOUR_PX) return null;
                return (
                  <button
                    key={e.id}
                    onClick={() => onOpenEvent(e)}
                    className={cn(
                      "absolute inset-x-0.5 overflow-hidden rounded px-1 py-0.5 text-left text-[0.625rem] leading-tight",
                      e.isTask ? "border border-dashed text-accent" : "text-white",
                    )}
                    style={{
                      top,
                      height,
                      ...(e.isTask
                        ? { borderColor: "var(--color-accent)", background: "var(--color-accent-muted)" }
                        : { background: e.color ?? "var(--color-accent)" }),
                    }}
                  >
                    <span className="block truncate font-medium">{e.title}</span>
                    <span className="opacity-80">{format(s, "h:mm")}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
