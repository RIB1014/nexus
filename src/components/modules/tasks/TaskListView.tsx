"use client";

import { useState } from "react";
import { Flag, ChevronRight, Circle, CheckCircle2, Repeat, Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/task";
import { PRIORITY_META } from "@/types/task";
import { formatDueLabel, DUE_TONE_CLASS } from "@/lib/tasks/format";
import { useUpdateTask } from "@/lib/hooks/useTasks";

interface ListViewProps {
  tasks: TaskDTO[];
  onOpen: (task: TaskDTO) => void;
  selectionMode?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function TaskListView({ tasks, onOpen, selectionMode, selected, onToggleSelect }: ListViewProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
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
  task,
  onOpen,
  first,
  selectionMode,
  isSelected,
  onToggleSelect,
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
  const due = formatDueLabel(task.dueDate, task.dueTime, task.completed);
  const hasSubtasks = task.subtasks.length > 0;
  const doneSubs = task.subtasks.filter((s) => s.completed).length;

  return (
    <div className={cn(!first && "border-t border-line", isSelected && "bg-accent-muted/30")}>
      <div
        className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-inset/60"
        style={{
          borderLeft: `2px solid ${PRIORITY_META[task.priority].color}`,
        }}
      >
        {selectionMode ? (
          <button
            onClick={() => onToggleSelect?.(task.id)}
            className="shrink-0 text-muted transition-colors hover:text-accent"
            aria-label={isSelected ? "Deselect" : "Select"}
          >
            {isSelected ? <CheckSquare className="size-[18px] text-accent" /> : <Square className="size-[18px]" />}
          </button>
        ) : (
          <button
            onClick={() => update.mutate({ id: task.id, patch: { completed: !task.completed } })}
            className="shrink-0 text-muted transition-colors hover:text-accent"
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed ? (
              <CheckCircle2 className="size-[18px] text-accent" />
            ) : (
              <Circle className="size-[18px]" />
            )}
          </button>
        )}

        <button
          onClick={() => (selectionMode ? onToggleSelect?.(task.id) : onOpen(task))}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-body",
                task.completed ? "text-muted line-through" : "text-fg",
              )}
            >
              {task.title}
            </span>
            {task.tags.map((tag) => (
              <span
                key={tag.id}
                className="hidden shrink-0 rounded-full px-1.5 py-0.5 text-micro sm:inline"
                style={{ background: `${tag.color}22`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
          {(due || hasSubtasks) && (
            <div className="mt-0.5 flex items-center gap-2 text-small">
              {due && (
                <span className={cn("font-data text-[0.6875rem]", DUE_TONE_CLASS[due.tone])}>
                  {due.text}
                </span>
              )}
              {hasSubtasks && (
                <span className="text-faint">
                  {doneSubs}/{task.subtasks.length} subtasks
                </span>
              )}
            </div>
          )}
        </button>

        {task.recurrence && task.recurrence !== "none" && (
          <Repeat className="size-3.5 shrink-0 text-muted" aria-label="Repeats" />
        )}
        {task.flagged && (
          <Flag className="size-3.5 shrink-0 text-amber-500" fill="currentColor" />
        )}
        {hasSubtasks && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded p-1 text-faint hover:bg-inset hover:text-muted"
            aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
          >
            <ChevronRight
              className={cn("size-4 transition-transform", expanded && "rotate-90")}
            />
          </button>
        )}
      </div>

      {expanded &&
        task.subtasks.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 border-t border-line/60 py-2 pl-12 pr-3 hover:bg-inset/40"
          >
            <button
              onClick={() => update.mutate({ id: s.id, patch: { completed: !s.completed } })}
              className="shrink-0 text-muted hover:text-accent"
            >
              {s.completed ? (
                <CheckCircle2 className="size-4 text-accent" />
              ) : (
                <Circle className="size-4" />
              )}
            </button>
            <span
              className={cn(
                "flex-1 truncate text-small",
                s.completed ? "text-muted line-through" : "text-fg",
              )}
            >
              {s.title}
            </span>
          </div>
        ))}
    </div>
  );
}
