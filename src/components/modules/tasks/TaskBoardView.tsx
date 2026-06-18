"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDTO, TaskStatus } from "@/types/task";
import { PRIORITY_META } from "@/types/task";
import { formatDueLabel, DUE_TONE_CLASS } from "@/lib/tasks/format";
import { useUpdateTask } from "@/lib/hooks/useTasks";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

export function TaskBoardView({
  tasks,
  onOpen,
}: {
  tasks: TaskDTO[];
  onOpen: (t: TaskDTO) => void;
}) {
  const update = useUpdateTask();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = (status: TaskStatus) =>
    tasks.filter((t) => (t.status ?? "todo") === status);

  function onDragEnd(e: DragEndEvent) {
    const overId = e.over?.id as TaskStatus | undefined;
    const taskId = e.active.id as string;
    if (!overId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === overId) return;
    update.mutate({ id: taskId, patch: { status: overId } });
  }

  const grid = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => (
        <Column key={col.id} id={col.id} label={col.label} count={byStatus(col.id).length}>
          {byStatus(col.id).map((t) => (
            <Card key={t.id} task={t} onOpen={onOpen} draggable={mounted} />
          ))}
        </Column>
      ))}
    </div>
  );

  if (!mounted) return grid;

  return (
    <DndContext id="task-board" sensors={sensors} onDragEnd={onDragEnd}>
      {grid}
    </DndContext>
  );
}

function Column({
  id,
  label,
  count,
  children,
}: {
  id: TaskStatus;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-line bg-panel/50 p-2 transition-colors",
        isOver && "border-accent bg-accent-muted/30",
      )}
    >
      <div className="flex items-center justify-between px-1 py-1">
        <span className="text-small font-semibold text-fg">{label}</span>
        <span className="font-data text-[0.6875rem] text-faint">{count}</span>
      </div>
      <div className="flex min-h-16 flex-col gap-2">{children}</div>
    </div>
  );
}

function Card({
  task,
  onOpen,
  draggable,
}: {
  task: TaskDTO;
  onOpen: (t: TaskDTO) => void;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  });
  const due = formatDueLabel(task.dueDate, task.dueTime, task.completed);

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "rounded-md border border-line bg-surface p-2.5 shadow-sm",
        isDragging && "z-10 opacity-80",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 size-3 shrink-0 cursor-grab rounded-full active:cursor-grabbing"
          style={{ background: PRIORITY_META[task.priority].color || "var(--color-border-strong)" }}
          aria-label="Drag task"
        />
        <button onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
          <p className={cn("text-small text-fg", task.completed && "text-muted line-through")}>
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {due && (
              <span className={cn("font-data text-[0.625rem]", DUE_TONE_CLASS[due.tone])}>
                {due.text}
              </span>
            )}
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-1.5 py-0.5 text-[0.625rem]"
                style={{ background: `${tag.color}22`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            {task.flagged && <Flag className="size-3 text-amber-500" fill="currentColor" />}
          </div>
        </button>
      </div>
    </div>
  );
}
