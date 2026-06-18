import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import { taskInclude, serializeTask } from "@/lib/tasks/serialize";
import { resolveTagIds, taskFilter } from "@/lib/tasks/server";
import type { SmartListId } from "@/types/task";

const SORTS = {
  due: [{ dueDate: "asc" as const }, { createdAt: "desc" as const }],
  priority: [{ priority: "desc" as const }, { createdAt: "desc" as const }],
  created: [{ createdAt: "desc" as const }],
  manual: [{ order: "asc" as const }, { createdAt: "desc" as const }],
};
type SortKey = keyof typeof SORTS;

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const view = (url.searchParams.get("view") as SmartListId | null) ?? undefined;
  const listId = url.searchParams.get("listId") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;
  const sort = (url.searchParams.get("sort") as SortKey | null) ?? "due";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const take = 50;

  const where = taskFilter(auth.userId, { view, listId, search });
  const orderBy = SORTS[sort] ?? SORTS.due;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy,
      skip: (page - 1) * take,
      take,
    }),
    prisma.task.count({ where }),
  ]);

  return json({
    tasks: tasks.map(serializeTask),
    page,
    total,
    hasMore: page * take < total,
  });
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(500),
  notes: z.string().max(10_000).optional(),
  listId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  flagged: z.boolean().optional(),
  estimatedMin: z.number().int().positive().nullable().optional(),
  recurrence: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't create that task.", parsed.error.flatten());

  const { tags, dueDate, listId, parentId, ...rest } = parsed.data;

  // Validate ownership of referenced list / parent.
  if (listId) {
    const list = await prisma.taskList.findFirst({
      where: { id: listId, userId: auth.userId },
      select: { id: true },
    });
    if (!list) return badRequest("That list doesn't exist.");
  }
  if (parentId) {
    const parent = await prisma.task.findFirst({
      where: { id: parentId, userId: auth.userId },
      select: { id: true },
    });
    if (!parent) return badRequest("That parent task doesn't exist.");
  }

  const tagIds = tags?.length ? await resolveTagIds(auth.userId, tags) : [];

  const task = await prisma.task.create({
    data: {
      ...rest,
      userId: auth.userId,
      listId: listId ?? null,
      parentId: parentId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tagIds.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: taskInclude,
  });

  return json({ task: serializeTask(task) }, { status: 201 });
}
