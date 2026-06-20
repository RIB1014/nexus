"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, format,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateCalendar, useUpdateCalendar, useDeleteCalendar, type EventCalendarDTO,
} from "@/lib/hooks/useCalendars";
import { useCalendarPrefs } from "@/store/useCalendarPrefs";
import { ColorPicker } from "@/components/ui/color-picker";
import { PALETTE, PALETTE_HEXES } from "@/lib/theme/palette";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const CAL_COLORS = PALETTE_HEXES;

export function CalendarSidebar({
  cursor, onPickDate, calendars, onCreateEvent,
}: {
  cursor: Date;
  onPickDate: (d: Date) => void;
  calendars: EventCalendarDTO[];
  onCreateEvent?: () => void;
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
      {/* Google-style Create button */}
      {onCreateEvent && (
        <button
          onClick={onCreateEvent}
          className="flex w-fit items-center gap-2.5 rounded-full bg-panel py-2.5 pl-3.5 pr-5 text-small font-medium text-fg shadow-card transition-shadow hover:shadow-pop"
        >
          <Plus className="size-4 text-accent" /> Create
        </button>
      )}

      {/* Mini month */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-small font-semibold text-fg">{format(miniCursor, "MMMM yyyy")}</span>
          <div className="flex">
            <button onClick={() => setMiniCursor((c) => addMonths(c, -1))} className="rounded-full p-1 text-muted hover:bg-inset"><ChevronLeft className="size-3.5" /></button>
            <button onClick={() => setMiniCursor((c) => addMonths(c, 1))} className="rounded-full p-1 text-muted hover:bg-inset"><ChevronRight className="size-3.5" /></button>
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
          <span className="group-title !p-0">My calendars</span>
          <button onClick={() => setAdding((v) => !v)} className="rounded-full p-0.5 text-faint hover:bg-inset hover:text-fg" aria-label="Add calendar"><Plus className="size-3.5" /></button>
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
    <div className="group flex items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-inset/60">
      {/* Colored checkbox toggles visibility (Google style). */}
      <button
        onClick={onToggle}
        className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] transition-transform hover:scale-105"
        style={{ background: cal.visible ? cal.color : "transparent", border: `1.5px solid ${cal.color}` }}
        aria-label={cal.visible ? "Hide calendar" : "Show calendar"}
      >
        {cal.visible && <Check className="size-3 text-white" strokeWidth={3} />}
      </button>

      <button onClick={onToggle} className="min-w-0 flex-1 text-left">
        {editing ? (
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => { setEditing(false); if (name.trim() && name !== cal.name) onRename(name.trim()); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-full bg-transparent text-small text-fg outline-none" />
        ) : (
          <span className={cn("truncate text-small", cal.visible ? "text-fg" : "text-faint")}>{cal.name}</span>
        )}
      </button>

      {/* Overflow menu: color palette + rename + delete (discoverable). */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="rounded p-1 text-faint opacity-0 transition-opacity hover:bg-line hover:text-fg group-hover:opacity-100" aria-label="Calendar options">
            <MoreHorizontal className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-2">
          <p className="px-1 pb-1.5 text-micro text-faint">Color</p>
          <div className="grid grid-cols-6 gap-1.5">
            {PALETTE.map((s) => (
              <button key={s.id} title={s.name} onClick={() => onColor(s.hex)}
                className="flex aspect-square items-center justify-center rounded-full transition-transform hover:scale-110" style={{ background: s.hex }}>
                {cal.color.toLowerCase() === s.hex.toLowerCase() && <Check className="size-3.5 text-white drop-shadow" strokeWidth={3} />}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-line pt-2">
            <ColorPicker value={cal.color} onChange={onColor} align="start">
              <button className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-small text-muted hover:bg-inset hover:text-fg">
                <span className="size-3.5 rounded-full" style={{ background: cal.color }} /> Custom…
              </button>
            </ColorPicker>
            <button onClick={() => setEditing(true)} className="ml-auto rounded-md px-1.5 py-1 text-small text-muted hover:bg-inset hover:text-fg">Rename</button>
            <button onClick={onDelete} className="rounded-md p-1 text-faint hover:bg-red-500/10 hover:text-red-500" aria-label="Delete calendar"><Trash2 className="size-3.5" /></button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
