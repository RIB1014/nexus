import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, id: string) {
  return prisma.habit.findFirst({ where: { id, userId }, select: { id: true } });
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  emoji: z.string().max(8).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  frequency: z.enum(["daily", "weekdays", "custom"]).optional(),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
  targetStreak: z.number().int().min(0).max(3650).optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Habit not found.");

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't update that habit.");

  const habit = await prisma.habit.update({ where: { id }, data: parsed.data });
  return json({ habit });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Habit not found.");
  await prisma.habit.delete({ where: { id } });
  return json({ ok: true });
}
