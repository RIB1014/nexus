import { endOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SmartListId } from "@/types/task";

const PALETTE = [
  "#6366F1",
  "#22C55E",
  "#F97316",
  "#38BDF8",
  "#F43F5E",
  "#A78BFA",
];

/** Upsert tags by name for this user and return their ids (for connect). */
export async function resolveTagIds(
  userId: string,
  names: string[],
): Promise<string[]> {
  const clean = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))];
  const ids: string[] = [];
  for (const name of clean) {
    const tag = await prisma.taskTag.upsert({
      where: { userId_name: { userId, name } },
      create: {
        userId,
        name,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      },
      update: {},
      select: { id: true },
    });
    ids.push(tag.id);
  }
  return ids;
}

/** Build the Prisma `where` for a smart list or a specific list. */
export function taskFilter(
  userId: string,
  opts: { view?: SmartListId; listId?: string; search?: string },
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { userId, parentId: null };
  const now = new Date();

  switch (opts.view) {
    case "today":
      where.completed = false;
      where.dueDate = { lte: endOfDay(now) };
      break;
    case "scheduled":
      where.completed = false;
      where.dueDate = { not: null };
      break;
    case "flagged":
      where.completed = false;
      where.flagged = true;
      break;
    case "completed":
      where.completed = true;
      break;
    case "all":
      where.completed = false;
      break;
    default:
      // Specific list (or no filter)
      if (opts.listId) where.listId = opts.listId;
      where.completed = false;
  }

  if (opts.search) {
    where.title = { contains: opts.search, mode: "insensitive" };
  }
  return where;
}
