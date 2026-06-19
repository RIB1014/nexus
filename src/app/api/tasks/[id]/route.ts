import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";
import { taskInclude, serializeTask } from "@/lib/tasks/serialize";
import { resolveTagIds } from "@/lib/tasks/server";

type Ctx = { params: Promise<{ id: string }> };

async function ownTask(userId: string, id: string) {
  return prisma.task.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: auth.userId },
    include: taskInclude,
  });
  if (!task) return notFound("Task not found.");
  return json({ task: serializeTask(task) });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  notes: z.string().max(10_000).nullable().optional(),
  listId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  completed: z.boolean().optional(),
  flagged: z.boolean().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  estimatedMin: z.number().int().positive().nullable().optional(),
  order: z.number().int().optional(),
  recurrence: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  if (!(await ownTask(auth.userId, id))) return notFound("Task not found.");

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't update that task.");

  const { tags, dueDate, completed, ...rest } = parsed.data;

  const data: Prisma.TaskUpdateInput = { ...rest };
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (completed !== undefined) {
    data.completed = completed;
    data.completedAt = completed ? new Date() : null;
    // Completing a task moves it to the done column; reopening returns to todo.
    if (parsed.data.status === undefined) data.status = completed ? "done" : "todo";
  }
  if (tags !== undefined) {
    const tagIds = tags.length ? await resolveTagIds(auth.userId, tags) : [];
    data.tags = { set: tagIds.map((tid) => ({ id: tid })) };
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });

  // Recurring tasks: completing one spawns the next occurrence.
  if (completed === true && task.recurrence && task.recurrence !== "none") {
    const nextDue = advanceDate(task.dueDate ?? new Date(), task.recurrence);
    await prisma.task.create({
      data: {
        userId: auth.userId,
        listId: task.listId,
        title: task.title,
        notes: task.notes,
        priority: task.priority,
        flagged: task.flagged,
        estimatedMin: task.estimatedMin,
        recurrence: task.recurrence,
        dueDate: nextDue,
        dueTime: task.dueTime,
        tags: { connect: task.tags.map((t) => ({ id: t.id })) },
      },
    });
  }

  return json({ task: serializeTask(task) });
}

function advanceDate(from: Date, rule: string): Date {
  const d = new Date(from);
  switch (rule) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    default: d.setDate(d.getDate() + 1);
  }
  return d;
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  if (!(await ownTask(auth.userId, id))) return notFound("Task not found.");
  await prisma.task.delete({ where: { id } }); // cascades to subtasks
  return json({ ok: true });
}
