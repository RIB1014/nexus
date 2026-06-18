"use client";

import { useState } from "react";
import { Sun, Calendar, Flag, Inbox, CheckCircle2, Plus, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskListDTO } from "@/types/task";
import { SMART_LISTS, type SmartListId } from "@/types/task";
import { NewListDialog } from "./NewListDialog";

const SMART_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  calendar: Calendar,
  flag: Flag,
  inbox: Inbox,
  check: CheckCircle2,
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

  return (
    <aside className="flex w-full flex-col gap-1 lg:w-56 lg:shrink-0">
      <div className="flex flex-col gap-0.5">
        {SMART_LISTS.map((sl) => {
          const Icon = SMART_ICONS[sl.icon] ?? Inbox;
          const active = selection.kind === "smart" && selection.id === sl.id;
          return (
            <button
              key={sl.id}
              onClick={() => onSelect({ kind: "smart", id: sl.id })}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-small font-medium transition-colors",
                active ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset hover:text-fg",
              )}
            >
              <Icon className="size-4" />
              {sl.name}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between px-2.5">
        <span className="text-micro text-faint">Lists</span>
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
            className="rounded-md px-2.5 py-1.5 text-left text-small text-faint hover:bg-inset"
          >
            Create your first list
          </button>
        )}
        {lists.map((l) => {
          const active = selection.kind === "list" && selection.id === l.id;
          return (
            <button
              key={l.id}
              onClick={() => onSelect({ kind: "list", id: l.id })}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-small font-medium transition-colors",
                active ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset hover:text-fg",
              )}
            >
              {l.icon ? (
                <span className="text-sm leading-none">{l.icon}</span>
              ) : (
                <span className="size-2.5 rounded-full" style={{ background: l.color }} />
              )}
              <span className="flex-1 truncate text-left">{l.name}</span>
              {l.count > 0 && (
                <span className="font-data text-[0.6875rem] text-faint">{l.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <NewListDialog open={newListOpen} onOpenChange={setNewListOpen} onCreated={(id) => onSelect({ kind: "list", id })} />
    </aside>
  );
}
