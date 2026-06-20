"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, format,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCalendars, useCreateCalendar, useUpdateCalendar, useDeleteCalendar, type EventCalendarDTO,
} from "@/lib/hooks/useCalendars";
import { useCalendarPrefs } from "@/store/useCalendarPrefs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const CAL_COLORS = ["#5b6cf0", "#22c55e", "#f97316", "#38bdf8", "#f43f5e", "#a78bfa", "#eab308", "#ec4899", "#14b8a6", "#64748b"];

export function CalendarSidebar({
  cursor, onPickDate, calendars,
}: {
  cursor: Date;
  onPickDate: (d: Date) => void;
  calendars: EventCalendarDTO[];
}) {
  const { weekStartsOn } = useCalendarPrefs();
  const create = useCreateCalendar();
  const update = useUpdateCalendar();
  const del = useDeleteCalendar();
  const [miniCursor, setMiniCursor] = useState(() => startOfMonth(cursor));
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const days = useMemo(() => {
    const s = startOfWeek(startOfMonth(miniCursor), { weekStartsOn });
    const e = endOfWeek(endOfMonth(miniCursor), { weekStartsOn });
    return eachDayOfInterval({ start: s, end: e });
  }, [miniCursor, weekStartsOn]);
  const weekdays = weekStartsOn === 1 ? ["M", "T", "W", "T", "F", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-60">
      {/* Mini month */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-small font-semibold text-fg">{format(miniCursor, "MMMM yyyy")}</span>
          <div className="flex">
            <button onClick={() => setMiniCursor((c) => addMonths(c, -1))} className="rounded p-1 text-muted hover:bg-inset"><ChevronLeft className="size-3.5" /></button>
            <button onClick={() => setMiniCursor((c) => addMonths(c, 1))} className="rounded p-1 text-muted hover:bg-inset"><ChevronRight className="size-3.5" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7">
          {weekdays.map((d, i) => <div key={i} className="py-0.5 text-center text-[0.5625rem] text-faint">{d}</div>)}
          {days.map((d) => {
            const sel = isSameDay(d, cursor);
            const today = isSameDay(d, new Date());
            return (
              <button key={d.toISOString()} onClick={() => onPickDate(d)}
                className={cn("flex aspect-square items-center justify-center rounded-full text-[0.6875rem] transition-colors",
                  !isSameMonth(d, miniCursor) && "text-faint",
                  sel ? "bg-accent text-accent-contrast" : today ? "font-semibold text-accent" : "text-fg hover:bg-inset")}>
                {format(d, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* My calendars */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-micro text-faint">My calendars</span>
          <button onClick={() => setAdding((v) => !v)} className="rounded p-0.5 text-faint hover:bg-inset hover:text-fg" aria-label="Add calendar"><Plus className="size-3.5" /></button>
        </div>

        {adding && (
          <div className="mb-2 flex gap-1">
            <input
              autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { create.mutate({ name: newName.trim(), color: CAL_COLORS[calendars.length % CAL_COLORS.length] }); setNewName(""); setAdding(false); } if (e.key === "Escape") setAdding(false); }}
              placeholder="Calendar name" className="h-7 flex-1 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent" />
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {calendars.map((c) => (
            <CalendarRow key={c.id} cal={c}
              onToggle={() => update.mutate({ id: c.id, patch: { visible: !c.visible } })}
              onColor={(color) => update.mutate({ id: c.id, patch: { color } })}
              onRename={(name) => update.mutate({ id: c.id, patch: { name } })}
              onDelete={() => del.mutate(c.id)} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function CalendarRow({
  cal, onToggle, onColor, onRename, onDelete,
}: {
  cal: EventCalendarDTO;
  onToggle: () => void;
  onColor: (c: string) => void;
  onRename: (n: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cal.name);
  return (
    <div className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-inset/60">
      {/* color + visibility */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative flex size-4 items-center justify-center rounded-[5px]" style={{ background: cal.visible ? cal.color : "transparent", border: `1.5px solid ${cal.color}` }} aria-label="Calendar color">
            {cal.visible && <Check className="size-3 text-white" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {CAL_COLORS.map((c) => (
              <button key={c} onClick={() => onColor(c)} className={cn("size-6 rounded-full", cal.color === c && "ring-2 ring-offset-2 ring-offset-surface")} style={{ background: c, ...(cal.color === c ? { boxShadow: `0 0 0 2px ${c}` } : {}) }} />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <button onClick={onToggle} className="min-w-0 flex-1 text-left">
        {editing ? (
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => { setEditing(false); if (name.trim() && name !== cal.name) onRename(name.trim()); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-full bg-transparent text-small text-fg outline-none" />
        ) : (
          <span className={cn("truncate text-small", cal.visible ? "text-fg" : "text-faint line-through")}>{cal.name}</span>
        )}
      </button>

      <button onClick={() => setEditing(true)} className="text-faint opacity-0 transition-opacity hover:text-fg group-hover:opacity-100" aria-label="Rename"><Pencil className="size-3" /></button>
      <button onClick={onDelete} className="text-faint opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" aria-label="Delete"><Trash2 className="size-3" /></button>
    </div>
  );
}
