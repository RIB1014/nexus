import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import { getHabitsSummary } from "@/lib/data/habits";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  return json(await getHabitsSummary(auth.userId));
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  emoji: z.string().max(8).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  frequency: z.enum(["daily", "weekdays", "custom"]).optional(),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
  category: z.string().max(40).nullable().optional(),
  targetStreak: z.number().int().min(0).max(3650).optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't create that habit.");

  const count = await prisma.habit.count({ where: { userId: auth.userId } });
  const habit = await prisma.habit.create({
    data: {
      userId: auth.userId,
      name: parsed.data.name,
      emoji: parsed.data.emoji ?? null,
      color: parsed.data.color ?? "#6366F1",
      frequency: parsed.data.frequency ?? "daily",
      customDays: parsed.data.customDays ?? [],
      category: parsed.data.category ?? null,
      targetStreak: parsed.data.targetStreak ?? 0,
      order: count,
    },
  });
  return json({ habit }, { status: 201 });
}
