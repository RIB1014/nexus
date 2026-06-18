import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, subDays, format } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

// Privacy: wellness data is sensitive — never logged to console or analytics.

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const since = startOfDay(subDays(new Date(), 30));
  const logs = await prisma.wellnessLog.findMany({
    where: { userId: auth.userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const todayKey = format(startOfDay(new Date()), "yyyy-MM-dd");
  const today = logs.find((l) => format(startOfDay(l.date), "yyyy-MM-dd") === todayKey) ?? null;

  const trend = logs.map((l) => ({
    date: format(startOfDay(l.date), "yyyy-MM-dd"),
    mood: l.moodScore,
    energy: l.energyScore,
    sleep: l.sleepHours,
  }));

  const gratitude = logs
    .filter((l) => l.gratitude.length > 0)
    .slice(-8)
    .reverse()
    .map((l) => ({ date: format(startOfDay(l.date), "yyyy-MM-dd"), items: l.gratitude }));

  return json({
    today: today
      ? {
          moodScore: today.moodScore,
          energyScore: today.energyScore,
          sleepHours: today.sleepHours,
          feelingTag: today.feelingTag,
          journalEntry: today.journalEntry,
          gratitude: today.gratitude,
        }
      : null,
    trend,
    gratitude,
  });
}

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
  energyScore: z.number().int().min(1).max(10).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  feelingTag: z.string().max(40).nullable().optional(),
  journalEntry: z.string().max(10000).nullable().optional(),
  gratitude: z.array(z.string().max(280)).max(5).optional(),
});

// Upsert today's (or a given day's) wellness check-in.
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't save your check-in.");

  const date = parsed.data.date
    ? startOfDay(new Date(parsed.data.date + "T00:00:00"))
    : startOfDay(new Date());

  const { date: _d, ...rest } = parsed.data;
  const log = await prisma.wellnessLog.upsert({
    where: { userId_date: { userId: auth.userId, date } },
    create: { userId: auth.userId, date, sensitiveData: true, ...rest },
    update: { ...rest },
    select: { id: true },
  });
  return json({ ok: true, id: log.id });
}
