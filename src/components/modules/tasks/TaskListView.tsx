"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Flag, ChevronRight, Check, Repeat, Square, CheckSquare, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDTO, TaskListDTO, TaskTagDTO } from "@/types/task";
import { PRIORITY_META } from "@/types/task";
import { formatDueLabel, DUE_TONE_CLASS } from "@/lib/tasks/format";
import { useUpdateTask } from "@/lib/hooks/useTasks";
import { DateChip } from "./TaskAttributeChips";

interface ListViewProps {
  tasks: TaskDTO[];
  onOpen: (task: TaskDTO) => void;
  lists?: TaskListDTO[];
  allTags?: TaskTagDTO[];
  selectionMode?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function TaskListView({ tasks, onOpen, selectionMode, selected, onToggleSelect }: ListViewProps) {
  if (tasks.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
      {tasks.map((t, i) => (
        <TaskRow
          key={t.id}
          task={t}
          onOpen={onOpen}
          first={i === 0}
          selectionMode={selectionMode}
          isSelected={selected?.has(t.id) ?? false}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

function TaskRow({
  task, onOpen, first, selectionMode, isSelected, onToggleSelect,
}: {
  task: TaskDTO;
  onOpen: (task: TaskDTO) => void;
  first: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const update = useUpdateTask();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const due = formatDueLabel(task.dueDate, task.dueTime, task.completed);
  const hasSubtasks = task.subtasks.length > 0;
  const doneSubs = task.subtasks.filter((s) => s.completed).length;

  const commitTitle = () => {
    setEditing(false);
    if (titleDraft.trim() && titleDraft !== task.title) update.mutate({ id: task.id, patch: { title: titleDraft.trim() } });
    else setTitleDraft(task.title);
  };

  return (
    <div className={cn(!first && "border-t border-line", isSelected && "bg-accent-muted/30")}>
      <div
        className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-inset/50"
        style={{ borderLeft: `2px solid ${PRIORITY_META[task.priority].color}` }}
      >
        {selectionMode ? (
          <button onClick={() => onToggleSelect?.(task.id)} className="mt-0.5 shrink-0 text-muted hover:text-accent" aria-label={isSelected ? "Deselect" : "Select"}>
            {isSelected ? <CheckSquare className="size-[18px] text-accent" /> : <Square className="size-[18px]" />}
          </button>
        ) : (
          <button onClick={() => update.mutate({ id: task.id, patch: { completed: !task.completed } })}
            className="mt-0.5 shrink-0" aria-label={task.completed ? "Mark incomplete" : "Mark complete"}>
            <TaskCheck done={task.completed} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          {/* Title — inline editable */}
          {editing ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setEditing(false); setTitleDraft(task.title); } }}
              className="w-full bg-transparent text-body text-fg outline-none"
            />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => (selectionMode ? onToggleSelect?.(task.id) : setEditing(true))}
                className={cn("truncate text-left text-body", task.completed ? "text-muted line-through" : "text-fg")}
              >
                {task.title}
              </button>
              {task.tags.map((tag) => (
                <span key={tag.id} className="hidden shrink-0 rounded-full px-1.5 py-0.5 text-micro sm:inline" style={{ background: `${tag.color}22`, color: tag.color }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Notes preview (Apple Reminders style) */}
          {task.notes && !editing && (
            <p className="mt-0.5 truncate text-small text-muted">{task.notes}</p>
          )}

          {/* Meta row */}
          {(due || hasSubtasks || (task.recurrence && task.recurrence !== "none")) && (
            <div className="mt-0.5 flex items-center gap-2 text-small">
              {due && <span className={cn("font-data text-[0.6875rem]", DUE_TONE_CLASS[due.tone])}>{due.text}</span>}
              {task.recurrence && task.recurrence !== "none" && (
                <span className="flex items-center gap-0.5 text-faint"><Repeat className="size-3" />{task.recurrence}</span>
              )}
              {hasSubtasks && <span className="text-faint">{doneSubs}/{task.subtasks.length}</span>}
            </div>
          )}
        </div>

        {/* Right-side controls (hover) */}
        <div className="flex shrink-0 items-center gap-1">
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            <DateChip
              date={task.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : null}
              time={task.dueTime}
              onChange={(d, t) => update.mutate({ id: task.id, patch: { dueDate: d ? new Date(`${d}T00:00:00`).toISOString() : null, dueTime: t } })}
            />
          </span>
          {task.flagged && <Flag className="size-3.5 text-amber-500" fill="currentColor" />}
          <button onClick={() => onOpen(task)} className="rounded p-1 text-faint opacity-0 transition-opacity hover:bg-inset hover:text-fg group-hover:opacity-100" aria-label="Details">
            <Pencil className="size-3.5" />
          </button>
          {hasSubtasks && (
            <button onClick={() => setExpanded((v) => !v)} className="rounded p-1 text-faint hover:bg-inset hover:text-muted" aria-label={expanded ? "Collapse" : "Expand"}>
              <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
            </button>
          )}
        </div>
      </div>

      {expanded && task.subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-3 border-t border-line/60 py-2.5 pl-14 pr-4 hover:bg-inset/40">
          <button onClick={() => update.mutate({ id: s.id, patch: { completed: !s.completed } })} className="shrink-0">
            <TaskCheck done={s.completed} small />
          </button>
          <span className={cn("flex-1 truncate text-small", s.completed ? "text-muted line-through" : "text-fg")}>{s.title}</span>
        </div>
      ))}
    </div>
  );
}

/** Apple Reminders checkbox: a ring tinted to the page/list color that fills
    solid with a check when complete. */
function TaskCheck({ done, small }: { done: boolean; small?: boolean }) {
  const size = small ? "size-4" : "size-[19px]";
  if (done) {
    return (
      <span className={cn("flex items-center justify-center rounded-full bg-accent text-accent-contrast", size)}>
        <Check className={small ? "size-2.5" : "size-3"} strokeWidth={3.5} />
      </span>
    );
  }
  return (
    <span
      className={cn("block rounded-full border-[1.5px] transition-colors", size)}
      style={{ borderColor: "color-mix(in oklab, var(--color-accent) 60%, var(--color-border-strong))" }}
    />
  );
}
