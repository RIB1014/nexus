import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, differenceInCalendarDays, format } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

// Privacy: cycle data is sensitive — never logged to console or analytics, and
// excluded from any cross-module aggregation.

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const entries = await prisma.cycleEntry.findMany({
    where: { userId: auth.userId },
    orderBy: { date: "asc" },
  });

  // Estimate average cycle length from the gaps between period-start days.
  const periodStarts: Date[] = [];
  let prevWasPeriod = false;
  for (const e of entries) {
    if (e.periodDay && !prevWasPeriod) periodStarts.push(startOfDay(e.date));
    prevWasPeriod = e.periodDay;
  }
  let avgCycle = 28;
  if (periodStarts.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < periodStarts.length; i++) {
      gaps.push(differenceInCalendarDays(periodStarts[i], periodStarts[i - 1]));
    }
    const valid = gaps.filter((g) => g >= 18 && g <= 40);
    if (valid.length) avgCycle = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }

  const lastStart = periodStarts.at(-1) ?? null;
  const nextPredicted = lastStart
    ? format(new Date(lastStart.getTime() + avgCycle * 86_400_000), "yyyy-MM-dd")
    : null;

  return json({
    entries: entries.map((e) => ({
      date: format(startOfDay(e.date), "yyyy-MM-dd"),
      periodDay: e.periodDay,
      flowIntensity: e.flowIntensity,
      symptoms: e.symptoms,
      mood: e.mood,
      energy: e.energy,
      notes: e.notes,
    })),
    insights: {
      avgCycleLength: avgCycle,
      lastPeriodStart: lastStart ? format(lastStart, "yyyy-MM-dd") : null,
      nextPredictedStart: nextPredicted,
    },
  });
}

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodDay: z.boolean().optional(),
  flowIntensity: z.enum(["light", "medium", "heavy", "spotting"]).nullable().optional(),
  symptoms: z.array(z.string().max(40)).optional(),
  mood: z.number().int().min(1).max(10).nullable().optional(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't save that entry.");

  const date = startOfDay(new Date(parsed.data.date + "T00:00:00"));
  const { date: _d, ...rest } = parsed.data;

  await prisma.cycleEntry.upsert({
    where: { userId_date: { userId: auth.userId, date } },
    create: { userId: auth.userId, date, sensitiveData: true, ...rest },
    update: { ...rest },
  });
  return json({ ok: true });
}
