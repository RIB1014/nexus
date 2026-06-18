import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import type { TaskListDTO } from "@/types/task";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const lists = await prisma.taskList.findMany({
    where: { userId: auth.userId, isSmartList: false },
    orderBy: { order: "asc" },
  });

  // Incomplete top-level task counts per list.
  const counts = await prisma.task.groupBy({
    by: ["listId"],
    where: { userId: auth.userId, completed: false, parentId: null, listId: { not: null } },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.listId, c._count._all]));

  const result: TaskListDTO[] = lists.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    icon: l.icon,
    order: l.order,
    count: countMap.get(l.id) ?? 0,
  }));
  return json({ lists: result });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(8).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't create that list.");

  const count = await prisma.taskList.count({ where: { userId: auth.userId } });
  const list = await prisma.taskList.create({
    data: {
      userId: auth.userId,
      name: parsed.data.name,
      color: parsed.data.color ?? "#6366F1",
      icon: parsed.data.icon ?? null,
      order: count,
    },
  });
  return json({ list }, { status: 201 });
}
