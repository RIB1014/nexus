"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay,
  addMonths, addWeeks, addDays, format,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Columns3, Square, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";
import { useCalendarEvents, useUpdateEvent } from "@/lib/hooks/useCalendar";
import { CalendarMonthView } from "./CalendarMonthView";
import { TimeGridView } from "./TimeGridView";
import { EventDialog } from "./EventDialog";
import { Button } from "@/components/ui/button";

type ViewMode = "month" | "week" | "day";

export function CalendarModule() {
  const [cursor, setCursor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [includeTasks, setIncludeTasks] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventDTO | null>(null);
  const [createStart, setCreateStart] = useState<Date | undefined>();
  const [createEnd, setCreateEnd] = useState<Date | undefined>();

  const update = useUpdateEvent();

  const range = useMemo(() => {
    if (viewMode === "month") return { start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) };
    if (viewMode === "week") return { start: startOfWeek(cursor), end: endOfWeek(cursor) };
    return { start: startOfDay(cursor), end: endOfDay(cursor) };
  }, [cursor, viewMode]);

  const { data } = useCalendarEvents(range.start.toISOString(), range.end.toISOString(), includeTasks);
  const events = data?.events ?? [];

  const go = (dir: number) => setCursor((c) =>
    viewMode === "month" ? addMonths(c, dir) : viewMode === "week" ? addWeeks(c, dir) : addDays(c, dir));

  const openCreate = (start: Date, end?: Date) => {
    setEditingEvent(null);
    setCreateStart(start);
    setCreateEnd(end);
    setDialogOpen(true);
  };
  const openEvent = (e: CalendarEventDTO) => {
    if (e.isTask) return;
    setEditingEvent(e);
    setCreateStart(undefined);
    setCreateEnd(undefined);
    setDialogOpen(true);
  };

  const moveEvent = (e: CalendarEventDTO, newStart: Date) => {
    const dur = new Date(e.end).getTime() - new Date(e.start).getTime();
    const id = e.recurringBaseId ?? e.id;
    update.mutate({ id, patch: { start: newStart.toISOString(), end: new Date(newStart.getTime() + dur).toISOString() } });
  };
  const resizeEvent = (e: CalendarEventDTO, newEnd: Date) => {
    const id = e.recurringBaseId ?? e.id;
    update.mutate({ id, patch: { end: newEnd.toISOString() } });
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)), [cursor]);

  const label = viewMode === "month"
    ? format(cursor, "MMMM yyyy")
    : viewMode === "week"
      ? `${format(startOfWeek(cursor), "MMM d")} – ${format(endOfWeek(cursor), "MMM d")}`
      : format(cursor, "EEEE, MMMM d");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-display !text-2xl">{label}</h2>
          <div className="flex items-center">
            <button onClick={() => go(-1)} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset" aria-label="Previous"><ChevronLeft className="size-4" /></button>
            <button onClick={() => setCursor(new Date())} className="rounded-md px-2.5 py-1.5 text-small text-muted hover:bg-inset">Today</button>
            <button onClick={() => go(1)} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset" aria-label="Next"><ChevronRight className="size-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIncludeTasks((v) => !v)}
            className={cn("flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-small font-medium transition-colors",
              includeTasks ? "border-accent bg-accent-muted text-accent" : "border-line text-muted hover:bg-inset")} title="Show task due dates">
            <ListTodo className="size-4" /><span className="hidden sm:inline">Tasks</span>
          </button>

          <div className="flex rounded-md border border-line bg-panel p-0.5">
            {([
              { id: "day", label: "Day", icon: Square },
              { id: "week", label: "Week", icon: Columns3 },
              { id: "month", label: "Month", icon: CalendarDays },
            ] as const).map((vm) => {
              const Icon = vm.icon;
              return (
                <button key={vm.id} onClick={() => setViewMode(vm.id)}
                  className={cn("flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-small font-medium transition-colors",
                    viewMode === vm.id ? "bg-accent-muted text-accent" : "text-muted hover:text-fg")}>
                  <Icon className="size-4" /><span className="hidden sm:inline">{vm.label}</span>
                </button>
              );
            })}
          </div>

          <Button onClick={() => openCreate(new Date(new Date().setMinutes(0)))} size="sm"><Plus /> <span className="hidden sm:inline">Event</span></Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <CalendarMonthView cursor={cursor} events={events} onCreate={(d) => openCreate(new Date(new Date(d).setHours(9, 0)))} onOpenEvent={openEvent} />
      ) : (
        <>
          <p className="text-small text-faint">Drag on the grid to create · drag an event to move · drag its bottom edge to resize.</p>
          <TimeGridView
            days={viewMode === "week" ? weekDays : [cursor]}
            events={events}
            onCreate={(s, e) => openCreate(s, e)}
            onOpenEvent={openEvent}
            onMoveEvent={moveEvent}
            onResizeEvent={resizeEvent}
          />
        </>
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        defaultStart={createStart}
        defaultEnd={createEnd}
      />
    </div>
  );
}
