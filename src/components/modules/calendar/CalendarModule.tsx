"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, addWeeks, format,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Columns3, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";
import { useCalendarEvents } from "@/lib/hooks/useCalendar";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarWeekView } from "./CalendarWeekView";
import { EventDialog } from "./EventDialog";
import { Button } from "@/components/ui/button";

type ViewMode = "month" | "week";

export function CalendarModule() {
  const [cursor, setCursor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [includeTasks, setIncludeTasks] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventDTO | null>(null);
  const [createDate, setCreateDate] = useState<Date | undefined>();

  const range = useMemo(() => {
    if (viewMode === "month") {
      return {
        start: startOfWeek(startOfMonth(cursor)),
        end: endOfWeek(endOfMonth(cursor)),
      };
    }
    return { start: startOfWeek(cursor), end: endOfWeek(cursor) };
  }, [cursor, viewMode]);

  const { data } = useCalendarEvents(
    range.start.toISOString(),
    range.end.toISOString(),
    includeTasks,
  );
  const events = data?.events ?? [];

  const go = (dir: number) =>
    setCursor((c) => (viewMode === "month" ? addMonths(c, dir) : addWeeks(c, dir)));

  const openCreate = (date: Date) => {
    setEditingEvent(null);
    setCreateDate(date);
    setDialogOpen(true);
  };
  const openEvent = (e: CalendarEventDTO) => {
    if (e.isTask) return; // task layer is read-only here
    setEditingEvent(e);
    setCreateDate(undefined);
    setDialogOpen(true);
  };

  const label =
    viewMode === "month"
      ? format(cursor, "MMMM yyyy")
      : `${format(startOfWeek(cursor), "MMM d")} – ${format(endOfWeek(cursor), "MMM d")}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-display !text-2xl">{label}</h2>
          <div className="flex items-center">
            <button onClick={() => go(-1)} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset" aria-label="Previous">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setCursor(new Date())} className="rounded-md px-2.5 py-1.5 text-small text-muted hover:bg-inset">Today</button>
            <button onClick={() => go(1)} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset" aria-label="Next">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIncludeTasks((v) => !v)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-small font-medium transition-colors",
              includeTasks ? "border-accent bg-accent-muted text-accent" : "border-line text-muted hover:bg-inset",
            )}
            title="Show task due dates"
          >
            <ListTodo className="size-4" />
            <span className="hidden sm:inline">Tasks</span>
          </button>

          <div className="flex rounded-md border border-line bg-panel p-0.5">
            {([
              { id: "month", label: "Month", icon: CalendarDays },
              { id: "week", label: "Week", icon: Columns3 },
            ] as const).map((vm) => {
              const Icon = vm.icon;
              return (
                <button
                  key={vm.id}
                  onClick={() => setViewMode(vm.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-small font-medium transition-colors",
                    viewMode === vm.id ? "bg-accent-muted text-accent" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{vm.label}</span>
                </button>
              );
            })}
          </div>

          <Button onClick={() => openCreate(new Date())} size="sm">
            <Plus /> <span className="hidden sm:inline">Event</span>
          </Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <CalendarMonthView cursor={cursor} events={events} onCreate={openCreate} onOpenEvent={openEvent} />
      ) : (
        <CalendarWeekView cursor={cursor} events={events} onCreate={openCreate} onOpenEvent={openEvent} />
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        defaultDate={createDate}
      />
    </div>
  );
}
