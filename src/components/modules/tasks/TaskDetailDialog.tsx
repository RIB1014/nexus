"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Flag, Trash2, Plus, X, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDTO, TaskListDTO } from "@/types/task";
import { PRIORITY_META, type Priority } from "@/types/task";
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from "@/lib/hooks/useTasks";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high", "urgent"];

export function TaskDetailDialog({
  task,
  lists,
  open,
  onOpenChange,
}: {
  task: TaskDTO | null;
  lists: TaskListDTO[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateTask();
  const del = useDeleteTask();
  const createSub = useCreateTask();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [newSub, setNewSub] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
    }
  }, [task]);

  if (!task) return null;

  const patch = (p: Parameters<typeof update.mutate>[0]["patch"]) =>
    update.mutate({ id: task.id, patch: p });

  const commitTitle = () => {
    if (title.trim() && title !== task.title) patch({ title: title.trim() });
  };
  const commitNotes = () => {
    if (notes !== (task.notes ?? "")) patch({ notes: notes || null });
  };

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t) return;
    if (!task.tags.some((x) => x.name === t)) {
      patch({ tags: [...task.tags.map((x) => x.name), t] });
    }
    setTagDraft("");
  };
  const removeTag = (name: string) =>
    patch({ tags: task.tags.filter((x) => x.name !== name).map((x) => x.name) });

  const addSubtask = () => {
    if (!newSub.trim()) return;
    createSub.mutate({ title: newSub.trim(), parentId: task.id, listId: task.listId });
    setNewSub("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="sr-only">Edit task</DialogTitle>

        {/* Title + complete */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => patch({ completed: !task.completed })}
            className="mt-1 text-muted transition-colors hover:text-accent"
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed ? (
              <CheckCircle2 className="size-5 text-accent" />
            ) : (
              <Circle className="size-5" />
            )}
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className={cn(
              "flex-1 bg-transparent text-heading outline-none",
              task.completed && "text-muted line-through",
            )}
          />
          <button
            onClick={() => patch({ flagged: !task.flagged })}
            className={cn(
              "rounded-md p-1.5 transition-colors hover:bg-inset",
              task.flagged ? "text-amber-500" : "text-faint",
            )}
            aria-label="Toggle flag"
          >
            <Flag className="size-4" fill={task.flagged ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due date">
            <input
              type="date"
              value={task.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : ""}
              onChange={(e) =>
                patch({
                  dueDate: e.target.value
                    ? new Date(e.target.value + "T00:00:00").toISOString()
                    : null,
                })
              }
              className="h-9 w-full rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent"
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={task.dueTime ?? ""}
              disabled={!task.dueDate}
              onChange={(e) => patch({ dueTime: e.target.value || null })}
              className="h-9 w-full rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent disabled:opacity-50"
            />
          </Field>

          <Field label="List">
            <select
              value={task.listId ?? ""}
              onChange={(e) => patch({ listId: e.target.value || null })}
              className="h-9 w-full rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent"
            >
              <option value="">No list</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.icon ? `${l.icon} ` : ""}
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estimate (min)">
            <Input
              type="number"
              min={0}
              defaultValue={task.estimatedMin ?? ""}
              onBlur={(e) =>
                patch({
                  estimatedMin: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="h-9"
            />
          </Field>
        </div>

        {/* Priority */}
        <Field label="Priority">
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => patch({ priority: p })}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-small transition-colors",
                  task.priority === p
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-line text-muted hover:bg-inset",
                )}
              >
                {p !== "none" && (
                  <span
                    className="size-2 rounded-full"
                    style={{ background: PRIORITY_META[p].color }}
                  />
                )}
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        </Field>

        {/* Tags */}
        <Field label="Tags">
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tags.map((t) => (
              <span
                key={t.id}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-micro"
                style={{ background: `${t.color}22`, color: t.color }}
              >
                {t.name}
                <button onClick={() => removeTag(t.name)} aria-label={`Remove ${t.name}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add tag…"
              className="min-w-24 flex-1 bg-transparent text-small text-fg outline-none placeholder:text-faint"
            />
          </div>
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={commitNotes}
            placeholder="Add notes…"
          />
        </Field>

        {/* Subtasks */}
        <Field label={`Subtasks${task.subtasks.length ? ` (${task.subtasks.length})` : ""}`}>
          <div className="flex flex-col gap-1">
            {task.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() =>
                    update.mutate({ id: s.id, patch: { completed: !s.completed } })
                  }
                  className="text-muted hover:text-accent"
                >
                  {s.completed ? (
                    <CheckCircle2 className="size-4 text-accent" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 text-small",
                    s.completed && "text-muted line-through",
                  )}
                >
                  {s.title}
                </span>
                <button
                  onClick={() => del.mutate(s.id)}
                  className="text-faint hover:text-red-500"
                  aria-label="Delete subtask"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-2">
              <Plus className="size-4 text-faint" />
              <input
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask…"
                className="flex-1 bg-transparent text-small text-fg outline-none placeholder:text-faint"
              />
            </div>
          </div>
        </Field>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-500/10"
            onClick={() => {
              del.mutate(task.id);
              onOpenChange(false);
            }}
          >
            <Trash2 /> Delete
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-micro text-faint">{label}</Label>
      {children}
    </div>
  );
}
