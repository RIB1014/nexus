"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/types/calendar";
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/lib/hooks/useCalendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const COLORS = ["#6366F1", "#22C55E", "#F97316", "#38BDF8", "#F43F5E", "#A78BFA"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: CalendarEventDTO | null;
  defaultDate?: Date;
  defaultStart?: Date;
  defaultEnd?: Date;
}

const RECURRENCE = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Every weekday" },
  { id: "weekly", label: "Weekly" },
] as const;

function combine(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr || "00:00"}:00`).toISOString();
}

export function EventDialog({ open, onOpenChange, event, defaultDate, defaultStart, defaultEnd }: Props) {
  const create = useCreateEvent();
  const update = useUpdateEvent();
  const del = useDeleteEvent();
  const editing = Boolean(event && !event.isTask);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [recurrence, setRecurrence] = useState<string>("none");

  useEffect(() => {
    if (!open) return;
    if (event) {
      const s = parseISO(event.start);
      const e = parseISO(event.end);
      setTitle(event.title);
      setDate(format(s, "yyyy-MM-dd"));
      setAllDay(event.allDay);
      setStartTime(format(s, "HH:mm"));
      setEndTime(format(e, "HH:mm"));
      setLocation(event.location ?? "");
      setNotes(event.notes ?? "");
      setColor(event.color ?? COLORS[0]);
      setRecurrence(event.recurrence ?? "none");
    } else {
      const base = defaultStart ?? defaultDate ?? new Date();
      const end = defaultEnd ?? new Date(base.getTime() + 60 * 60 * 1000);
      setTitle("");
      setDate(format(base, "yyyy-MM-dd"));
      setAllDay(false);
      setStartTime(format(base, "HH:mm") === "00:00" ? "09:00" : format(base, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
      setLocation("");
      setNotes("");
      setColor(COLORS[0]);
      setRecurrence("none");
    }
  }, [open, event, defaultDate, defaultStart, defaultEnd]);

  const save = async () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      start: allDay ? combine(date, "00:00") : combine(date, startTime),
      end: allDay ? combine(date, "23:59") : combine(date, endTime),
      allDay,
      location: location || null,
      notes: notes || null,
      color,
      recurrence,
    };
    if (editing && event) await update.mutateAsync({ id: event.recurringBaseId ?? event.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="text-body"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="all-day"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            <Label htmlFor="all-day">All day</Label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 flex flex-col gap-1.5 sm:col-span-1">
              <Label className="text-micro text-faint">Date</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent"
              />
            </div>
            {!allDay && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-micro text-faint">Start</Label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-micro text-faint">End</Label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-9 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3">
            <MapPin className="size-4 text-faint" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="h-9 flex-1 bg-transparent text-small text-fg outline-none placeholder:text-faint"
            />
          </div>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="min-h-16"
          />

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("size-6 rounded-full", color === c && "ring-2 ring-offset-2 ring-offset-surface")}
                  style={{ background: c, ...(color === c ? { boxShadow: `0 0 0 2px ${c}` } : {}) }}
                  aria-label={c}
                />
              ))}
            </div>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="h-9 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent"
              title="Repeat"
            >
              {RECURRENCE.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {editing && event ? (
            <Button
              variant="ghost"
              className="text-red-500 hover:bg-red-500/10"
              onClick={async () => { await del.mutateAsync(event.id); onOpenChange(false); }}
            >
              <Trash2 /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={!title.trim()}>
              {editing ? "Save" : "Add event"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
