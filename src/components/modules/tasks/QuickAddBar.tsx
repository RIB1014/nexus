"use client";

import { useMemo, useState } from "react";
import { Plus, CornerDownLeft } from "lucide-react";
import { parseQuickAdd } from "@/lib/tasks/parse";
import { formatDueLabel } from "@/lib/tasks/format";
import { PRIORITY_META } from "@/types/task";
import { useCreateTask } from "@/lib/hooks/useTasks";

export function QuickAddBar({
  listId,
  defaultPriority,
  defaultFlagged,
}: {
  listId?: string | null;
  defaultPriority?: string;
  defaultFlagged?: boolean;
}) {
  const [value, setValue] = useState("");
  const create = useCreateTask();

  const parsed = useMemo(
    () => (value.trim() ? parseQuickAdd(value) : null),
    [value],
  );

  const submit = () => {
    if (!parsed?.title.trim()) return;
    create.mutate({
      title: parsed.title,
      dueDate: parsed.dueDate?.toISOString() ?? null,
      dueTime: parsed.dueTime,
      priority: parsed.priority !== "none" ? parsed.priority : defaultPriority,
      tags: parsed.tags,
      flagged: defaultFlagged,
      listId: listId ?? null,
      recurrence: parsed.recurrence !== "none" ? parsed.recurrence : null,
    });
    setValue("");
  };

  const due = parsed ? formatDueLabel(parsed.dueDate?.toISOString() ?? null, parsed.dueTime) : null;

  return (
    <div className="rounded-lg border border-line bg-panel">
      <div className="flex items-center gap-2 px-3">
        <Plus className="size-4 shrink-0 text-faint" />
        <input
          id="quick-add-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a task — try “essay tomorrow 3pm high #school every week”"
          className="h-11 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-faint"
        />
        {value.trim() && (
          <button
            onClick={submit}
            className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-small font-medium text-accent-contrast"
          >
            Add <CornerDownLeft className="size-3.5" />
          </button>
        )}
      </div>

      {parsed && (due || parsed.priority !== "none" || parsed.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-1.5 text-small">
          <span className="text-faint">Detected:</span>
          {due && (
            <span className="rounded bg-inset px-1.5 py-0.5 font-data text-[0.6875rem] text-fg">
              {due.text}
            </span>
          )}
          {parsed.priority !== "none" && (
            <span
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-micro"
              style={{
                background: `${PRIORITY_META[parsed.priority].color}22`,
                color: PRIORITY_META[parsed.priority].color,
              }}
            >
              {PRIORITY_META[parsed.priority].label}
            </span>
          )}
          {parsed.tags.map((t) => (
            <span key={t} className="rounded bg-accent-muted px-1.5 py-0.5 text-micro text-accent">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
