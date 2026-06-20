"use client";

import { useMemo, useState } from "react";
import {
  format, parseISO, addDays, nextSaturday, nextMonday, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isTomorrow,
} from "date-fns";
import {
  CalendarDays, Flag, Tag, ListChecks, Repeat, Clock, X, Plus, Check, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_META, type Priority, type TaskListDTO, type TaskTagDTO } from "@/types/task";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { useUpdateTag } from "@/lib/hooks/useTasks";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// ---------------------------------------------------------------------------
// Generic chip: a pill containing a popover-trigger label + a sibling clear
// button (never nested, to keep valid HTML).
// ---------------------------------------------------------------------------
function Chip({
  icon, label, active, onClear, contentClassName, renderContent,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClear?: () => void;
  contentClassName?: string;
  renderContent: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border pl-2.5 pr-1.5 text-small font-medium transition-colors",
        active ? "border-accent/50 bg-accent-muted text-accent" : "border-line text-muted hover:bg-inset",
      )}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 py-0.5 outline-none">{icon}{label}</button>
        </PopoverTrigger>
        {active && onClear ? (
          <button onClick={() => onClear()} className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10" aria-label="Clear">
            <X className="size-3" />
          </button>
        ) : <span className="w-0.5" />}
      </span>
      <PopoverContent align="start" className={cn("p-0", contentClassName)}>
        {renderContent(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

export function dateLabel(iso: string | null, time: string | null): string | null {
  if (!iso) return null;
  const d = parseISO(iso);
  let label = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEE, MMM d");
  if (time) {
    const [h, m] = time.split(":").map(Number);
    const t = new Date(); t.setHours(h, m);
    label += ` ${format(t, "h:mma").toLowerCase()}`;
  }
  return label;
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------
export function DateChip({
  date, time, onChange,
}: {
  date: string | null;
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
}) {
  return (
    <Chip
      icon={<CalendarDays className="size-3.5" />}
      label={dateLabel(date, time) ?? "Date"}
      active={!!date}
      onClear={() => onChange(null, null)}
      contentClassName="w-72"
      renderContent={(close) => <DatePickerPanel date={date} time={time} onChange={onChange} onDone={close} />}
    />
  );
}

function DatePickerPanel({
  date, time, onChange, onDone,
}: {
  date: string | null;
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  onDone: () => void;
}) {
  const [cursor, setCursor] = useState(() => (date ? parseISO(date) : new Date()));
  const days = useMemo(() => {
    const s = startOfWeek(startOfMonth(cursor));
    const e = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start: s, end: e });
  }, [cursor]);

  const presets = [
    { label: "Today", value: new Date() },
    { label: "Tomorrow", value: addDays(new Date(), 1) },
    { label: "This weekend", value: nextSaturday(new Date()) },
    { label: "Next week", value: nextMonday(new Date()) },
  ];
  const selected = date ? parseISO(date) : null;
  const set = (d: Date) => onChange(format(d, "yyyy-MM-dd"), time);

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-1 border-b border-line p-2">
        {presets.map((p) => (
          <button key={p.label} onClick={() => set(p.value)} className="rounded-md px-2 py-1.5 text-left text-small text-fg hover:bg-inset">
            {p.label}<span className="ml-1 text-faint">{format(p.value, "EEE")}</span>
          </button>
        ))}
      </div>
      <div className="p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-small font-medium text-fg">{format(cursor, "MMMM yyyy")}</span>
          <div className="flex">
            <button onClick={() => setCursor((c) => addDays(startOfMonth(c), -1))} className="rounded p-1 text-muted hover:bg-inset"><ChevronLeft className="size-4" /></button>
            <button onClick={() => setCursor((c) => addDays(endOfMonth(c), 1))} className="rounded p-1 text-muted hover:bg-inset"><ChevronRight className="size-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d, i) => <div key={i} className="py-1 text-center text-[0.625rem] text-faint">{d}</div>)}
          {days.map((d) => {
            const isSel = selected && isSameDay(d, selected);
            return (
              <button key={d.toISOString()} onClick={() => set(d)}
                className={cn("flex aspect-square items-center justify-center rounded-md text-small",
                  !isSameMonth(d, cursor) && "text-faint",
                  isSel ? "bg-accent text-accent-contrast" : isToday(d) ? "text-accent" : "text-fg hover:bg-inset")}>
                {format(d, "d")}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-line p-2">
        <Clock className="size-4 text-faint" />
        <input type="time" value={time ?? ""} disabled={!date}
          onChange={(e) => onChange(date, e.target.value || null)}
          className="h-8 flex-1 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent disabled:opacity-50" />
        <button onClick={onDone} className="rounded-md bg-accent px-3 py-1.5 text-small font-medium text-accent-contrast">Done</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Priority
// ---------------------------------------------------------------------------
const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low", "none"];
export function PriorityChip({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <Chip
      icon={<Flag className="size-3.5" style={value !== "none" ? { color: PRIORITY_META[value].color } : undefined} />}
      label={value !== "none" ? PRIORITY_META[value].label : "Priority"}
      active={value !== "none"}
      onClear={() => onChange("none")}
      contentClassName="w-40 p-1"
      renderContent={(close) => (
        <>
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => { onChange(p); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small text-fg hover:bg-inset">
              <Flag className="size-3.5" style={{ color: PRIORITY_META[p].color === "transparent" ? "var(--color-border-strong)" : PRIORITY_META[p].color }} />
              {PRIORITY_META[p].label}{value === p && <Check className="ml-auto size-3.5 text-accent" />}
            </button>
          ))}
        </>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
export function TagsChip({
  value, allTags, onChange,
}: {
  value: string[];
  allTags: TaskTagDTO[];
  onChange: (tags: string[]) => void;
}) {
  return (
    <Chip
      icon={<Tag className="size-3.5" />}
      label={value.length ? value.map((t) => `#${t}`).join(" ") : "Tags"}
      active={value.length > 0}
      onClear={() => onChange([])}
      contentClassName="w-56 p-2"
      renderContent={() => <TagsPanel value={value} allTags={allTags} onChange={onChange} />}
    />
  );
}

function TagsPanel({ value, allTags, onChange }: { value: string[]; allTags: TaskTagDTO[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const updateTag = useUpdateTag();
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter((t) => t !== name) : [...value, name]);
  const suggestions = allTags.filter((t) => t.name.includes(draft.toLowerCase()));
  return (
    <>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\p{L}\p{N}_-]/gu, "").toLowerCase())}
        onKeyDown={(e) => { if (e.key === "Enter" && draft) { toggle(draft); setDraft(""); } }}
        placeholder="Find or create tag…"
        className="mb-2 h-8 w-full rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent"
      />
      <div className="flex max-h-44 flex-col gap-0.5 overflow-y-auto">
        {draft && !allTags.some((t) => t.name === draft) && (
          <button onClick={() => { toggle(draft); setDraft(""); }} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-small text-accent hover:bg-inset">
            <Plus className="size-3.5" /> Create “{draft}”
          </button>
        )}
        {suggestions.map((t) => (
          <div key={t.id} className="group/tag flex items-center gap-2 rounded-md px-2 py-1.5 text-small text-fg hover:bg-inset">
            <ColorPicker value={t.color} onChange={(hex) => updateTag.mutate({ id: t.id, patch: { color: hex } })} align="start">
              <button className="shrink-0 rounded-full p-0.5 transition-transform hover:scale-125" aria-label={`${t.name} color`}>
                <span className="block size-2.5 rounded-full" style={{ background: t.color }} />
              </button>
            </ColorPicker>
            <button onClick={() => toggle(t.name)} className="flex flex-1 items-center text-left">
              {t.name}
              {value.includes(t.name) && <Check className="ml-auto size-3.5 text-accent" />}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
export function ListChip({
  value, lists, onChange,
}: {
  value: string | null;
  lists: TaskListDTO[];
  onChange: (id: string | null) => void;
}) {
  const list = lists.find((l) => l.id === value);
  return (
    <Chip
      icon={list?.icon ? <span>{list.icon}</span> : <ListChecks className="size-3.5" />}
      label={list?.name ?? "List"}
      active={!!value}
      onClear={() => onChange(null)}
      contentClassName="w-48 p-1"
      renderContent={(close) => (
        <>
          <button onClick={() => { onChange(null); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small text-muted hover:bg-inset">No list</button>
          {lists.map((l) => (
            <button key={l.id} onClick={() => { onChange(l.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small text-fg hover:bg-inset">
              {l.icon ? <span>{l.icon}</span> : <span className="size-2.5 rounded-full" style={{ background: l.color }} />}{l.name}
              {value === l.id && <Check className="ml-auto size-3.5 text-accent" />}
            </button>
          ))}
        </>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Repeat
// ---------------------------------------------------------------------------
const REPEATS = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Every 2 weeks" },
  { id: "monthly", label: "Monthly" },
] as const;
export function RepeatChip({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cur = REPEATS.find((r) => r.id === value);
  return (
    <Chip
      icon={<Repeat className="size-3.5" />}
      label={value !== "none" ? cur?.label ?? "Repeat" : "Repeat"}
      active={value !== "none"}
      onClear={() => onChange("none")}
      contentClassName="w-44 p-1"
      renderContent={(close) => (
        <>
          {REPEATS.map((r) => (
            <button key={r.id} onClick={() => { onChange(r.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small text-fg hover:bg-inset">
              {r.label}{value === r.id && <Check className="ml-auto size-3.5 text-accent" />}
            </button>
          ))}
        </>
      )}
    />
  );
}
