"use client";

import { useState } from "react";
import { Sun, CalendarClock, Flag, Inbox, CheckCircle2, Plus, Trash2, List as ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskListDTO } from "@/types/task";
import { SMART_LISTS, type SmartListId } from "@/types/task";
import { useUpdateList, useDeleteList } from "@/lib/hooks/useTasks";
import { ColorPicker, ColorIcon } from "@/components/ui/color-picker";
import { NewListDialog } from "./NewListDialog";

const SMART_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  calendar: CalendarClock,
  flag: Flag,
  inbox: Inbox,
  check: CheckCircle2,
};

/** Apple Reminders smart-list colors. */
export const SMART_COLORS: Record<SmartListId, string> = {
  today: "#0A84FF",
  scheduled: "#FF3B30",
  flagged: "#FF9500",
  all: "#8E8E93",
  completed: "#34C759",
};

export type Selection =
  | { kind: "smart"; id: SmartListId }
  | { kind: "list"; id: string };

export function TaskSidebar({
  lists,
  selection,
  onSelect,
}: {
  lists: TaskListDTO[];
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const [newListOpen, setNewListOpen] = useState(false);
  const updateList = useUpdateList();
  const deleteList = useDeleteList();

  return (
    <aside className="flex w-full flex-col gap-1 lg:w-[15rem] lg:shrink-0">
      {/* Smart lists */}
      <div className="flex flex-col gap-0.5">
        {SMART_LISTS.map((sl) => {
          const Icon = SMART_ICONS[sl.icon] ?? Inbox;
          const color = SMART_COLORS[sl.id];
          const active = selection.kind === "smart" && selection.id === sl.id;
          return (
            <button
              key={sl.id}
              onClick={() => onSelect({ kind: "smart", id: sl.id })}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--app-radius-md)] px-2 py-1.5 text-small font-medium transition-colors",
                active ? "font-semibold" : "text-fg hover:bg-inset/70",
              )}
              style={active ? { background: `${color}22`, color } : undefined}
            >
              <ColorIcon color={color}>
                <Icon className="size-4" />
              </ColorIcon>
              {sl.name}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between px-2">
        <span className="group-title !p-0">My Lists</span>
        <button
          onClick={() => setNewListOpen(true)}
          className="rounded p-0.5 text-faint hover:bg-inset hover:text-fg"
          aria-label="New list"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        {lists.length === 0 && (
          <button
            onClick={() => setNewListOpen(true)}
            className="rounded-md px-2 py-1.5 text-left text-small text-faint hover:bg-inset"
          >
            Create your first list
          </button>
        )}
        {lists.map((l) => {
          const active = selection.kind === "list" && selection.id === l.id;
          return (
            <div
              key={l.id}
              className={cn(
                "group flex items-center gap-2.5 rounded-[var(--app-radius-md)] px-2 transition-colors",
                active ? "" : "hover:bg-inset/70",
              )}
              style={active ? { background: `${l.color}22` } : undefined}
            >
              <ColorPicker
                value={l.color}
                onChange={(hex) => updateList.mutate({ id: l.id, patch: { color: hex } })}
              >
                <button className="shrink-0 transition-transform hover:scale-105" aria-label={`${l.name} color`}>
                  <ColorIcon color={l.color}>
                    {l.icon ? <span className="text-xs leading-none">{l.icon}</span> : <ListIcon className="size-4" />}
                  </ColorIcon>
                </button>
              </ColorPicker>
              <button
                onClick={() => onSelect({ kind: "list", id: l.id })}
                className="flex flex-1 items-center py-1.5 text-small font-medium"
                style={active ? { color: l.color } : undefined}
              >
                <span className={cn("flex-1 truncate text-left", !active && "text-fg")}>{l.name}</span>
              </button>
              {l.count > 0 && (
                <span className="font-data text-[0.6875rem] text-faint group-hover:hidden">{l.count}</span>
              )}
              <button
                onClick={() => {
                  if (confirm(`Delete list "${l.name}"? Its tasks move to Inbox.`)) deleteList.mutate(l.id);
                }}
                className="hidden rounded p-1 text-faint hover:bg-line hover:text-red-500 group-hover:block"
                aria-label={`Delete ${l.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <NewListDialog open={newListOpen} onOpenChange={setNewListOpen} onCreated={(id) => onSelect({ kind: "list", id })} />
    </aside>
  );
}
