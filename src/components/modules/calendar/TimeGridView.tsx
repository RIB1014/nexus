"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isSameDay, format, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";

const HOUR_PX = 48;
const SNAP_MIN = 15;
const DAY_MIN = 24 * 60;

type Drag =
  | { kind: "create"; dayIndex: number; startMin: number; endMin: number }
  | { kind: "move"; id: string; dayIndex: number; startMin: number; durationMin: number; grabOffset: number }
  | { kind: "resize"; id: string; dayIndex: number; startMin: number; endMin: number };

function snap(min: number) {
  return Math.max(0, Math.min(DAY_MIN, Math.round(min / SNAP_MIN) * SNAP_MIN));
}
function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, m === 0 ? "ha" : "h:mma").toLowerCase();
}

export function TimeGridView({
  days,
  events,
  onCreate,
  onOpenEvent,
  onMoveEvent,
  onResizeEvent,
  colorOf,
  fmtTime,
}: {
  days: Date[];
  events: CalendarEventDTO[];
  onCreate: (start: Date, end: Date) => void;
  onOpenEvent: (e: CalendarEventDTO) => void;
  onMoveEvent: (e: CalendarEventDTO, newStart: Date) => void;
  onResizeEvent: (e: CalendarEventDTO, newEnd: Date) => void;
  colorOf: (e: CalendarEventDTO) => string;
  fmtTime: (d: Date) => string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());

  useEffect(() => {
    const t = setInterval(() => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Scroll to ~7am on mount.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX - 12;
  }, []);

  const eventsByDay = useMemo(() => {
    return days.map((day) =>
      events.filter((e) => !e.allDay && isSameDay(parseISO(e.start), day)),
    );
  }, [days, events]);
  const allDayByDay = useMemo(() => {
    return days.map((day) =>
      events.filter((e) => e.allDay && isSameDay(parseISO(e.start), day)),
    );
  }, [days, events]);

  function geom(clientX: number, clientY: number) {
    const rect = gridRef.current!.getBoundingClientRect();
    const colWidth = rect.width / days.length;
    const dayIndex = Math.max(0, Math.min(days.length - 1, Math.floor((clientX - rect.left) / colWidth)));
    const y = clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    const min = (y / HOUR_PX) * 60;
    return { dayIndex, min };
  }

  // Global pointer handlers while dragging.
  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      const { dayIndex, min } = geom(e.clientX, e.clientY);
      setDrag((d) => {
        if (!d) return d;
        if (d.kind === "create") return { ...d, dayIndex, endMin: snap(min) };
        if (d.kind === "move") return { ...d, dayIndex, startMin: snap(min - d.grabOffset) };
        if (d.kind === "resize") return { ...d, endMin: Math.max(d.startMin + SNAP_MIN, snap(min)) };
        return d;
      });
    }
    function onUp() {
      setDrag((d) => {
        if (!d) return null;
        if (d.kind === "create") {
          const a = Math.min(d.startMin, d.endMin);
          const b = Math.max(d.startMin, d.endMin);
          const day = days[d.dayIndex];
          if (b - a >= SNAP_MIN) {
            onCreate(minToDate(day, a), minToDate(day, Math.max(b, a + SNAP_MIN)));
          }
        } else if (d.kind === "move") {
          const ev = events.find((x) => x.id === d.id);
          if (ev) onMoveEvent(ev, minToDate(days[d.dayIndex], d.startMin));
        } else if (d.kind === "resize") {
          const ev = events.find((x) => x.id === d.id);
          if (ev) onResizeEvent(ev, minToDate(days[d.dayIndex], d.endMin));
        }
        return null;
      });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, days, events]);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
      {/* Header */}
      <div className="grid border-b border-line" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => {
          const today = isSameDay(d, new Date());
          return (
            <div key={d.toISOString()} className="border-l border-line py-2 text-center">
              <div className="text-micro text-faint">{format(d, "EEE")}</div>
              <div className={cn("mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full font-data text-small",
                today ? "bg-accent text-accent-contrast" : "text-fg")}>{format(d, "d")}</div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      <div className="grid border-b border-line" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div className="px-1 py-1 text-right text-[0.625rem] text-faint">all-day</div>
        {allDayByDay.map((list, i) => (
          <div key={i} className="min-h-7 border-l border-line p-0.5">
            {list.map((e) => (
              <button key={e.id} onClick={() => onOpenEvent(e)}
                className={cn("mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[0.625rem]", e.isTask ? "border border-dashed" : "text-white")}
                style={e.isTask ? { borderColor: colorOf(e), color: colorOf(e) } : { background: colorOf(e) }}>
                {e.title}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="relative text-right pr-1" style={{ height: HOUR_PX }}>
                <span className="absolute -top-1.5 right-1 text-[0.625rem] text-faint">{h === 0 ? "" : fmtMin(h * 60)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div ref={gridRef} className="col-span-full grid" style={{ gridColumn: `2 / span ${days.length}`, gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map((day, di) => {
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className="relative border-l border-line"
                  style={{ height: 24 * HOUR_PX }}
                  onPointerDown={(e) => {
                    if (e.target !== e.currentTarget) return; // only empty space
                    const { min } = geom(e.clientX, e.clientY);
                    const s = snap(min);
                    setDrag({ kind: "create", dayIndex: di, startMin: s, endMin: s + 30 });
                  }}
                >
                  {/* hour lines */}
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="pointer-events-none border-b border-line/50" style={{ height: HOUR_PX }} />
                  ))}

                  {/* now line */}
                  {today && (
                    <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: (nowMin / 60) * HOUR_PX }}>
                      <div className="size-2 -ml-1 rounded-full bg-red-500" />
                      <div className="h-px flex-1 bg-red-500" />
                    </div>
                  )}

                  {/* events */}
                  {eventsByDay[di].map((e) => <EventBlock key={e.id} e={e} onOpen={onOpenEvent} onStartMove={setDrag} dayIndex={di} colorOf={colorOf} fmtTime={fmtTime} />)}

                  {/* drag ghost */}
                  {drag && drag.dayIndex === di && (drag.kind === "create" || drag.kind === "move" || drag.kind === "resize") && (
                    <DragGhost drag={drag} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function minToDate(day: Date, min: number): Date {
  const d = startOfDay(day);
  d.setMinutes(min);
  return d;
}

function EventBlock({
  e, onOpen, onStartMove, dayIndex, colorOf, fmtTime,
}: {
  e: CalendarEventDTO;
  onOpen: (e: CalendarEventDTO) => void;
  onStartMove: (d: Drag) => void;
  dayIndex: number;
  colorOf: (e: CalendarEventDTO) => string;
  fmtTime: (d: Date) => string;
}) {
  const s = parseISO(e.start);
  const en = parseISO(e.end);
  const startMin = s.getHours() * 60 + s.getMinutes();
  const durationMin = Math.max(SNAP_MIN, (en.getTime() - s.getTime()) / 60000);
  const top = (startMin / 60) * HOUR_PX;
  const height = (durationMin / 60) * HOUR_PX;
  const isTask = e.isTask;
  const color = colorOf(e);

  return (
    <div
      className={cn(
        "absolute inset-x-0.5 z-10 overflow-hidden rounded px-1.5 py-0.5 text-left text-[0.6875rem] leading-tight shadow-sm",
        isTask ? "border border-dashed" : "text-white",
        !isTask && "cursor-grab active:cursor-grabbing",
      )}
      style={{
        top, height,
        ...(isTask
          ? { borderColor: color, background: "var(--color-accent-muted)", color }
          : { background: color }),
      }}
      onPointerDown={(ev) => {
        if (isTask) return;
        ev.stopPropagation();
        onStartMove({ kind: "move", id: e.id, dayIndex, startMin, durationMin, grabOffset: 0 });
      }}
      onClick={(ev) => { ev.stopPropagation(); onOpen(e); }}
    >
      <div className="flex items-center gap-1 font-medium">
        {e.recurrence && e.recurrence !== "none" && <span title="Repeats">↻</span>}
        <span className="truncate">{e.title}</span>
      </div>
      <div className="opacity-80">{fmtTime(s)}–{fmtTime(en)}</div>
      {!isTask && (
        <div
          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
          onPointerDown={(ev) => {
            ev.stopPropagation();
            onStartMove({ kind: "resize", id: e.id, dayIndex, startMin, endMin: startMin + durationMin });
          }}
        />
      )}
    </div>
  );
}

function DragGhost({ drag }: { drag: Drag }) {
  let a: number, b: number;
  if (drag.kind === "create") { a = Math.min(drag.startMin, drag.endMin); b = Math.max(drag.startMin, drag.endMin); }
  else if (drag.kind === "move") { a = drag.startMin; b = drag.startMin + drag.durationMin; }
  else { a = drag.startMin; b = drag.endMin; }
  return (
    <div className="pointer-events-none absolute inset-x-0.5 z-30 rounded border-2 border-accent bg-accent-muted/70 px-1.5 py-0.5 text-[0.625rem] text-accent"
      style={{ top: (a / 60) * HOUR_PX, height: ((b - a) / 60) * HOUR_PX }}>
      {fmtMin(a)} – {fmtMin(b)}
    </div>
  );
}
