import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // defaults to today
  completed: z.boolean(),
});

// Toggle (upsert) a habit's completion for a given day.
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const habit = await prisma.habit.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true },
  });
  if (!habit) return notFound("Habit not found.");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid check-in.");

  const date = parsed.data.date
    ? startOfDay(new Date(parsed.data.date + "T00:00:00"))
    : startOfDay(new Date());

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: id, date } },
    create: { habitId: id, userId: auth.userId, date, completed: parsed.data.completed },
    update: { completed: parsed.data.completed },
  });
  return json({ log });
}
