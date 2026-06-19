"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, CornerDownLeft, Flag, X, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseQuickAdd } from "@/lib/tasks/parse";
import type { Priority, TaskListDTO, TaskTagDTO } from "@/types/task";
import { useCreateTask } from "@/lib/hooks/useTasks";
import { DateChip, PriorityChip, TagsChip, ListChip, RepeatChip } from "./TaskAttributeChips";

interface Draft {
  title: string;
  notes: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority;
  listId: string | null;
  tags: string[];
  recurrence: string;
  flagged: boolean;
  subtasks: string[];
}

function emptyDraft(listId: string | null, flagged: boolean): Draft {
  return {
    title: "", notes: "", dueDate: null, dueTime: null, priority: "none",
    listId, tags: [], recurrence: "none", flagged, subtasks: [],
  };
}

export function TaskComposer({
  lists, allTags, defaultListId, defaultFlagged = false,
}: {
  lists: TaskListDTO[];
  allTags: TaskTagDTO[];
  defaultListId: string | null;
  defaultFlagged?: boolean;
}) {
  const create = useCreateTask();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(defaultListId, defaultFlagged));
  const [subDraft, setSubDraft] = useState("");
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const reset = () => { setDraft(emptyDraft(defaultListId, defaultFlagged)); setSubDraft(""); };

  useEffect(() => { if (expanded) titleRef.current?.focus(); }, [expanded]);

  // Live NL preview applied to the title field.
  const parsed = draft.title.trim() ? parseQuickAdd(draft.title) : null;

  const submit = async () => {
    const p = draft.title.trim() ? parseQuickAdd(draft.title) : null;
    const title = (p?.title ?? draft.title).trim();
    if (!title) return;

    const dueDate = draft.dueDate ?? (p?.dueDate ? p.dueDate.toISOString().slice(0, 10) : null);
    const dueTime = draft.dueTime ?? p?.dueTime ?? null;
    const priority = draft.priority !== "none" ? draft.priority : (p?.priority ?? "none");
    const recurrence = draft.recurrence !== "none" ? draft.recurrence : (p?.recurrence ?? "none");
    const tags = [...new Set([...draft.tags, ...(p?.tags ?? [])])];

    const res = await create.mutateAsync({
      title,
      notes: draft.notes || undefined,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      dueTime,
      priority,
      recurrence: recurrence !== "none" ? recurrence : null,
      tags,
      flagged: draft.flagged,
      listId: draft.listId,
    });

    const parentId = res.task.id;
    for (const s of draft.subtasks.filter((x) => x.trim())) {
      await create.mutateAsync({ title: s.trim(), parentId, listId: draft.listId });
    }
    reset();
    // Keep the composer open for rapid entry; refocus title.
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  if (!expanded) {
    return (
      <button
        id="quick-add-input"
        onClick={() => setExpanded(true)}
        onFocus={() => setExpanded(true)}
        className="flex h-11 w-full items-center gap-2 rounded-lg border border-line bg-panel px-3 text-left text-body text-faint transition-colors hover:border-line-strong"
      >
        <Plus className="size-4" /> Add a task…
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-accent/40 bg-panel p-3 shadow-sm ring-1 ring-accent/10">
      {/* Title */}
      <textarea
        ref={titleRef}
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape") { setExpanded(false); reset(); }
        }}
        rows={1}
        placeholder="What do you need to do?"
        className="w-full resize-none bg-transparent text-body font-medium text-fg outline-none placeholder:text-faint"
      />

      {/* Notes (Apple Reminders style) */}
      <textarea
        value={draft.notes}
        onChange={(e) => patch({ notes: e.target.value })}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
        rows={1}
        placeholder="Notes"
        className="mt-1 w-full resize-none bg-transparent text-small text-muted outline-none placeholder:text-faint"
      />

      {/* NL detected hint */}
      {parsed && (parsed.dueDate || parsed.priority !== "none" || parsed.tags.length > 0 || parsed.recurrence !== "none") && (
        <p className="mt-1 text-[0.6875rem] text-faint">
          Detected from text — will apply on add. Set a chip below to override.
        </p>
      )}

      {/* Subtasks */}
      {draft.subtasks.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 border-l-2 border-line pl-3">
          {draft.subtasks.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-line-strong" />
              <input
                value={s}
                onChange={(e) => patch({ subtasks: draft.subtasks.map((x, j) => j === i ? e.target.value : x) })}
                className="flex-1 bg-transparent text-small text-fg outline-none"
              />
              <button onClick={() => patch({ subtasks: draft.subtasks.filter((_, j) => j !== i) })} className="text-faint hover:text-red-500"><X className="size-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 border-l-2 border-transparent pl-3">
        <ListPlus className="size-3.5 text-faint" />
        <input
          value={subDraft}
          onChange={(e) => setSubDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && subDraft.trim()) { patch({ subtasks: [...draft.subtasks, subDraft.trim()] }); setSubDraft(""); } }}
          placeholder="Add subtask"
          className="flex-1 bg-transparent text-small text-muted outline-none placeholder:text-faint"
        />
      </div>

      {/* Attribute chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DateChip date={draft.dueDate} time={draft.dueTime} onChange={(d, t) => patch({ dueDate: d, dueTime: t })} />
        <PriorityChip value={draft.priority} onChange={(p) => patch({ priority: p })} />
        <TagsChip value={draft.tags} allTags={allTags} onChange={(t) => patch({ tags: t })} />
        <ListChip value={draft.listId} lists={lists} onChange={(id) => patch({ listId: id })} />
        <RepeatChip value={draft.recurrence} onChange={(r) => patch({ recurrence: r })} />
        <button
          onClick={() => patch({ flagged: !draft.flagged })}
          className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-small font-medium transition-colors",
            draft.flagged ? "border-amber-400/50 bg-amber-400/10 text-amber-500" : "border-line text-muted hover:bg-inset")}
        >
          <Flag className="size-3.5" fill={draft.flagged ? "currentColor" : "none"} /> Flag
        </button>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <span className="hidden text-[0.6875rem] text-faint sm:block">Enter to add · Shift+Enter for a new line · Esc to close</span>
        <div className="flex items-center gap-2">
          <button onClick={() => { setExpanded(false); reset(); }} className="rounded-md px-3 py-1.5 text-small text-muted hover:bg-inset">Cancel</button>
          <button onClick={submit} disabled={!draft.title.trim() || create.isPending}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-small font-medium text-accent-contrast disabled:opacity-50">
            Add task <CornerDownLeft className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
