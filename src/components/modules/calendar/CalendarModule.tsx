"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay,
  addMonths, addWeeks, addDays, format,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Columns3, Square, ListChecks, Settings2, Search, CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";
import { useCalendarEvents, useUpdateEvent } from "@/lib/hooks/useCalendar";
import { useCalendars } from "@/lib/hooks/useCalendars";
import { useCalendarPrefs, type CalView } from "@/store/useCalendarPrefs";
import { CalendarMonthView } from "./CalendarMonthView";
import { TimeGridView } from "./TimeGridView";
import { CalendarAgendaView } from "./CalendarAgendaView";
import { CalendarSidebar } from "./CalendarSidebar";
import { EventDialog } from "./EventDialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function CalendarModule() {
  const prefs = useCalendarPrefs();
  const { data: calData } = useCalendars();
  const calendars = useMemo(() => calData?.calendars ?? [], [calData]);
  const update = useUpdateEvent();

  const [cursor, setCursor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalView>(prefs.defaultView);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventDTO | null>(null);
  const [createStart, setCreateStart] = useState<Date | undefined>();
  const [createEnd, setCreateEnd] = useState<Date | undefined>();

  const fmtTime = useMemo(() => (d: Date) =>
    prefs.timeFormat === "24" ? format(d, "HH:mm") : format(d, "h:mmaaa"), [prefs.timeFormat]);

  const calById = useMemo(() => new Map(calendars.map((c) => [c.id, c])), [calendars]);
  const colorOf = useMemo(() => (e: CalendarEventDTO) =>
    e.color ?? (e.calendarId ? calById.get(e.calendarId)?.color : undefined) ?? "var(--color-accent)", [calById]);
  const visibleIds = useMemo(() => new Set(calendars.filter((c) => c.visible).map((c) => c.id)), [calendars]);

  const range = useMemo(() => {
    if (viewMode === "month") return { start: startOfWeek(startOfMonth(cursor), { weekStartsOn: prefs.weekStartsOn }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: prefs.weekStartsOn }) };
    if (viewMode === "week") return { start: startOfWeek(cursor, { weekStartsOn: prefs.weekStartsOn }), end: endOfWeek(cursor, { weekStartsOn: prefs.weekStartsOn }) };
    if (viewMode === "agenda") return { start: startOfDay(cursor), end: endOfDay(addDays(cursor, 30)) };
    return { start: startOfDay(cursor), end: endOfDay(cursor) };
  }, [cursor, viewMode, prefs.weekStartsOn]);

  const { data } = useCalendarEvents(range.start.toISOString(), range.end.toISOString(), includeTasks);
  const events = useMemo(() => {
    let list = data?.events ?? [];
    list = list.filter((e) => (e.isTask ? true : !e.calendarId || visibleIds.has(e.calendarId)));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || (e.location ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [data, visibleIds, search]);

  const go = (dir: number) => setCursor((c) =>
    viewMode === "month" ? addMonths(c, dir) : viewMode === "week" ? addWeeks(c, dir) : addDays(c, dir));

  const openCreate = (start: Date, end?: Date) => { setEditingEvent(null); setCreateStart(start); setCreateEnd(end); setDialogOpen(true); };
  const openEvent = (e: CalendarEventDTO) => { if (e.isTask) return; setEditingEvent(e); setCreateStart(undefined); setCreateEnd(undefined); setDialogOpen(true); };

  const moveEvent = (e: CalendarEventDTO, newStart: Date) => {
    const dur = new Date(e.end).getTime() - new Date(e.start).getTime();
    update.mutate({ id: e.recurringBaseId ?? e.id, patch: { start: newStart.toISOString(), end: new Date(newStart.getTime() + dur).toISOString() } });
  };
  const resizeEvent = (e: CalendarEventDTO, newEnd: Date) => update.mutate({ id: e.recurringBaseId ?? e.id, patch: { end: newEnd.toISOString() } });

  // Week/day columns honoring week start + show-weekends.
  const gridDays = useMemo(() => {
    if (viewMode === "day") return [cursor];
    const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor, { weekStartsOn: prefs.weekStartsOn }), i));
    return prefs.showWeekends ? week : week.filter((d) => d.getDay() !== 0 && d.getDay() !== 6);
  }, [viewMode, cursor, prefs.weekStartsOn, prefs.showWeekends]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "t") { setCursor(new Date()); }
      else if (k === "d") setViewMode("day");
      else if (k === "w") setViewMode("week");
      else if (k === "m") setViewMode("month");
      else if (k === "a") setViewMode("agenda");
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (k === "c" || k === "n") openCreate(new Date(new Date().setMinutes(0)));
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const label = viewMode === "month" ? format(cursor, "MMMM yyyy")
    : viewMode === "week" ? `${format(startOfWeek(cursor, { weekStartsOn: prefs.weekStartsOn }), "MMM d")} – ${format(endOfWeek(cursor, { weekStartsOn: prefs.weekStartsOn }), "MMM d")}`
    : viewMode === "agenda" ? "Agenda"
    : format(cursor, "EEEE, MMMM d");

  const VIEWS: { id: CalView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "day", label: "Day", icon: Square },
    { id: "week", label: "Week", icon: Columns3 },
    { id: "month", label: "Month", icon: CalendarDays },
    { id: "agenda", label: "Agenda", icon: CalendarRange },
  ];

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-7">
      <CalendarSidebar cursor={cursor} onPickDate={setCursor} calendars={calendars} onCreateEvent={() => openCreate(new Date(new Date().setMinutes(0)))} />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-display !text-2xl">{label}</h2>
            <div className="flex items-center">
              <button onClick={() => go(-1)} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset" aria-label="Previous"><ChevronLeft className="size-4" /></button>
              <button onClick={() => setCursor(new Date())} className="rounded-md px-2.5 py-1.5 text-small text-muted hover:bg-inset">Today</button>
              <button onClick={() => go(1)} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset" aria-label="Next"><ChevronRight className="size-4" /></button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-2.5">
              <Search className="size-3.5 text-faint" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="h-full w-24 bg-transparent text-small text-fg outline-none placeholder:text-faint focus:w-36" />
            </div>

            <button onClick={() => setIncludeTasks((v) => !v)}
              className={cn("flex size-9 items-center justify-center rounded-md border transition-colors",
                includeTasks ? "border-accent bg-accent-muted text-accent" : "border-line bg-panel text-muted hover:text-fg")} title="Show task due dates">
              <ListChecks className="size-4" />
            </button>

            <div className="flex rounded-md border border-line bg-panel p-0.5">
              {VIEWS.map((vm) => {
                const Icon = vm.icon;
                return (
                  <button key={vm.id} onClick={() => setViewMode(vm.id)} title={`${vm.label} (${vm.id[0].toUpperCase()})`}
                    className={cn("flex items-center gap-1.5 rounded-sm px-2 py-1 text-small font-medium transition-colors",
                      viewMode === vm.id ? "bg-accent-muted text-accent" : "text-muted hover:text-fg")}>
                    <Icon className="size-4" /><span className="hidden md:inline">{vm.label}</span>
                  </button>
                );
              })}
            </div>

            <CalendarSettings />

            <Button onClick={() => openCreate(new Date(new Date().setMinutes(0)))} size="sm"><Plus /> <span className="hidden sm:inline">Event</span></Button>
          </div>
        </div>

        {/* Views */}
        {viewMode === "month" ? (
          <CalendarMonthView cursor={cursor} events={events} colorOf={colorOf} fmtTime={fmtTime} weekStartsOn={prefs.weekStartsOn}
            onCreate={(d) => openCreate(new Date(new Date(d).setHours(9, 0)))} onOpenEvent={openEvent} />
        ) : viewMode === "agenda" ? (
          <CalendarAgendaView events={events} colorOf={colorOf} fmtTime={fmtTime} onOpenEvent={openEvent} />
        ) : (
          <>
            <p className="text-small text-faint">Drag to create · drag events to move · drag the bottom edge to resize · keys: T today, D/W/M/A views, ← →</p>
            <TimeGridView days={gridDays} events={events} colorOf={colorOf} fmtTime={fmtTime}
              onCreate={openCreate} onOpenEvent={openEvent} onMoveEvent={moveEvent} onResizeEvent={resizeEvent} />
          </>
        )}
      </div>

      <EventDialog
        open={dialogOpen} onOpenChange={setDialogOpen} event={editingEvent}
        defaultStart={createStart} defaultEnd={createEnd}
        calendars={calendars}
        defaultCalendarId={calendars.find((c) => c.visible)?.id ?? calendars[0]?.id ?? null}
      />
    </div>
  );
}

function CalendarSettings() {
  const p = useCalendarPrefs();
  const Seg = <T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) => (
    <div className="inline-flex rounded-md border border-line bg-canvas p-0.5">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={cn("rounded-sm px-2.5 py-1 text-small font-medium transition-colors", value === o.v ? "bg-accent-muted text-accent" : "text-muted hover:text-fg")}>{o.label}</button>
      ))}
    </div>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex size-9 items-center justify-center rounded-md border border-line bg-panel text-muted hover:text-fg" title="Calendar settings"><Settings2 className="size-4" /></button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="mb-3 text-small font-semibold text-fg">Calendar settings</p>
        <div className="flex flex-col gap-3">
          <Row label="Week starts"><Seg value={String(p.weekStartsOn)} options={[{ v: "0", label: "Sun" }, { v: "1", label: "Mon" }]} onChange={(v) => p.setWeekStartsOn(v === "1" ? 1 : 0)} /></Row>
          <Row label="Time format"><Seg value={p.timeFormat} options={[{ v: "12", label: "12h" }, { v: "24", label: "24h" }]} onChange={p.setTimeFormat} /></Row>
          <Row label="Default view"><Seg value={p.defaultView} options={[{ v: "day", label: "D" }, { v: "week", label: "W" }, { v: "month", label: "M" }, { v: "agenda", label: "A" }]} onChange={p.setDefaultView} /></Row>
          <Row label="Weekends"><Seg value={p.showWeekends ? "y" : "n"} options={[{ v: "y", label: "Show" }, { v: "n", label: "Hide" }]} onChange={(v) => p.setShowWeekends(v === "y")} /></Row>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-small text-muted">{label}</span>{children}</div>;
}
