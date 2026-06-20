"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Flag, Trash2, Plus, X, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDTO, TaskListDTO, TaskTagDTO } from "@/types/task";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/lib/hooks/useTasks";
import { DateChip, PriorityChip, ListChip, TagsChip, RepeatChip } from "./TaskAttributeChips";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function TaskDetailDialog({
  task, lists, allTags = [], open, onOpenChange,
}: {
  task: TaskDTO | null;
  lists: TaskListDTO[];
  allTags?: TaskTagDTO[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateTask();
  const del = useDeleteTask();
  const createSub = useCreateTask();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [newSub, setNewSub] = useState("");

  useEffect(() => {
    if (task) { setTitle(task.title); setNotes(task.notes ?? ""); }
  }, [task]);

  if (!task) return null;

  const patch = (p: Parameters<typeof update.mutate>[0]["patch"]) => update.mutate({ id: task.id, patch: p });
  const commitTitle = () => { if (title.trim() && title !== task.title) patch({ title: title.trim() }); };
  const commitNotes = () => { if (notes !== (task.notes ?? "")) patch({ notes: notes || null }); };
  const addSubtask = () => { if (newSub.trim()) { createSub.mutate({ title: newSub.trim(), parentId: task.id, listId: task.listId }); setNewSub(""); } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="sr-only">Edit task</DialogTitle>

        {/* Title + complete + flag */}
        <div className="flex items-start gap-3">
          <button onClick={() => patch({ completed: !task.completed })} className="mt-1 text-muted transition-colors hover:text-accent" aria-label={task.completed ? "Mark incomplete" : "Mark complete"}>
            {task.completed ? <CheckCircle2 className="size-5 text-accent" /> : <Circle className="size-5" />}
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className={cn("flex-1 bg-transparent text-heading outline-none", task.completed && "text-muted line-through")}
          />
          <button onClick={() => patch({ flagged: !task.flagged })} className={cn("rounded-md p-1.5 transition-colors hover:bg-inset", task.flagged ? "text-amber-500" : "text-faint")} aria-label="Toggle flag">
            <Flag className="size-4" fill={task.flagged ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Attribute chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <DateChip
            date={task.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : null}
            time={task.dueTime}
            onChange={(d, t) => patch({ dueDate: d ? new Date(`${d}T00:00:00`).toISOString() : null, dueTime: t })}
          />
          <PriorityChip value={task.priority} onChange={(p) => patch({ priority: p })} />
          <ListChip value={task.listId} lists={lists} onChange={(id) => patch({ listId: id })} />
          <TagsChip value={task.tags.map((t) => t.name)} allTags={allTags} onChange={(names) => patch({ tags: names })} />
          <RepeatChip value={task.recurrence ?? "none"} onChange={(r) => patch({ recurrence: r === "none" ? null : r })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-micro text-faint">Estimate (min)</Label>
          <Input type="number" min={0} defaultValue={task.estimatedMin ?? ""} key={task.id}
            onBlur={(e) => patch({ estimatedMin: e.target.value ? Number(e.target.value) : null })}
            className="h-9 w-32" />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-micro text-faint">Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={commitNotes} placeholder="Add notes…" />
        </div>

        {/* Subtasks */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-micro text-faint">Subtasks{task.subtasks.length ? ` (${task.subtasks.filter((s) => s.completed).length}/${task.subtasks.length})` : ""}</Label>
          <div className="flex flex-col gap-1">
            {task.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <button onClick={() => update.mutate({ id: s.id, patch: { completed: !s.completed } })} className="text-muted hover:text-accent">
                  {s.completed ? <CheckCircle2 className="size-4 text-accent" /> : <Circle className="size-4" />}
                </button>
                <span className={cn("flex-1 text-small", s.completed && "text-muted line-through")}>{s.title}</span>
                <button onClick={() => del.mutate(s.id)} className="text-faint hover:text-red-500" aria-label="Delete subtask"><X className="size-3.5" /></button>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-2">
              <Plus className="size-4 text-faint" />
              <input value={newSub} onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                placeholder="Add a subtask…" className="flex-1 bg-transparent text-small text-fg outline-none placeholder:text-faint" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10" onClick={() => { del.mutate(task.id); onOpenChange(false); }}>
            <Trash2 /> Delete
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
