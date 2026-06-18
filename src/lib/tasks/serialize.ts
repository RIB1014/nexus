import type { Prisma } from "@prisma/client";
import type { Priority, TaskDTO, TaskStatus } from "@/types/task";

// The shape we always select for a task (with tags + one level of subtasks).
export const taskInclude = {
  tags: { select: { id: true, name: true, color: true } },
  subtasks: {
    include: { tags: { select: { id: true, name: true, color: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
type TaskTagRow = { id: string; name: string; color: string };

function serializeBase(t: {
  id: string;
  title: string;
  notes: string | null;
  dueDate: Date | null;
  dueTime: string | null;
  priority: string;
  completed: boolean;
  completedAt: Date | null;
  flagged: boolean;
  parentId: string | null;
  listId: string | null;
  status: string;
  estimatedMin: number | null;
  recurrence: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  tags: TaskTagRow[];
}) {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    dueDate: t.dueDate?.toISOString() ?? null,
    dueTime: t.dueTime,
    priority: t.priority as Priority,
    completed: t.completed,
    completedAt: t.completedAt?.toISOString() ?? null,
    flagged: t.flagged,
    parentId: t.parentId,
    listId: t.listId,
    status: t.status as TaskStatus,
    estimatedMin: t.estimatedMin,
    recurrence: t.recurrence,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    tags: t.tags,
  };
}

export function serializeTask(t: TaskWithRelations): TaskDTO {
  return {
    ...serializeBase(t),
    subtasks: t.subtasks.map((s) => ({ ...serializeBase(s), subtasks: [] })),
  };
}
