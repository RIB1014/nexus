"use client";

import { useMemo } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";
import { EmptyState } from "@/components/ui/empty-state";

export function CalendarAgendaView({
  events, colorOf, fmtTime, onOpenEvent,
}: {
  events: CalendarEventDTO[];
  colorOf: (e: CalendarEventDTO) => string;
  fmtTime: (d: Date) => string;
  onOpenEvent: (e: CalendarEventDTO) => void;
}) {
  const groups = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
    const map = new Map<string, CalendarEventDTO[]>();
    for (const e of sorted) {
      const key = format(parseISO(e.start), "yyyy-MM-dd");
      (map.get(key) ?? map.set(key, []).get(key)!).push(e);
    }
    return [...map.entries()];
  }, [events]);

  if (groups.length === 0) {
    return <EmptyState icon={<CalendarClock />} title="Nothing scheduled" description="Events in this range will appear here as a tidy agenda." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
      {groups.map(([key, list], gi) => {
        const d = parseISO(key);
        const label = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEEE");
        return (
          <div key={key} className={cn("flex gap-4 px-4 py-3", gi > 0 && "border-t border-line")}>
            <div className="w-24 shrink-0">
              <p className={cn("text-small font-semibold", isToday(d) ? "text-accent" : "text-fg")}>{label}</p>
              <p className="font-data text-[0.6875rem] text-faint">{format(d, "MMM d")}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {list.map((e) => (
                <button key={e.id} onClick={() => onOpenEvent(e)} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-inset">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.isTask ? "transparent" : colorOf(e), border: e.isTask ? `2px solid ${colorOf(e)}` : undefined }} />
                  <span className="w-28 shrink-0 font-data text-[0.6875rem] text-muted">
                    {e.allDay ? "all-day" : fmtTime(parseISO(e.start))}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-small text-fg">{e.title}</span>
                  {e.location && <span className="hidden truncate text-small text-faint sm:block">{e.location}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
