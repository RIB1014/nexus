import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import type { PracticeSessionDTO, PracticeStats } from "@/types/practice";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const all = await prisma.practiceSession.findMany({
    where: { userId: auth.userId },
    orderBy: { date: "desc" },
  });

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  let weekMin = 0, monthMin = 0, allMin = 0;
  const byInstrument = new Map<string, number>();
  const practiced = new Set<string>();
  const instruments = new Set<string>();

  for (const s of all) {
    allMin += s.durationMin;
    if (s.date >= weekStart) weekMin += s.durationMin;
    if (s.date >= monthStart) monthMin += s.durationMin;
    byInstrument.set(s.instrument, (byInstrument.get(s.instrument) ?? 0) + s.durationMin);
    practiced.add(format(startOfDay(s.date), "yyyy-MM-dd"));
    instruments.add(s.instrument);
  }

  // Streak: consecutive days (ending today/yesterday) with a session.
  let streak = 0;
  let cursor = startOfDay(now);
  if (!practiced.has(format(cursor, "yyyy-MM-dd"))) cursor = subDays(cursor, 1);
  while (practiced.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  const stats: PracticeStats = {
    weekMin, monthMin, allMin, streak,
    avgMin: all.length ? Math.round(allMin / all.length) : 0,
    weeklyGoalMin: 300,
    byInstrument: [...byInstrument.entries()]
      .map(([instrument, minutes]) => ({ instrument, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    practicedDays: [...practiced],
  };

  const sessions: PracticeSessionDTO[] = all.slice(0, 25).map((s) => ({
    id: s.id,
    instrument: s.instrument,
    durationMin: s.durationMin,
    date: s.date.toISOString(),
    pieces: (s.pieces as unknown as PracticeSessionDTO["pieces"]) ?? [],
    goals: s.goals,
    reflections: s.reflections,
    qualityRating: s.qualityRating,
    bpmRange: s.bpmRange,
    tags: s.tags,
  }));

  return json({ sessions, stats, instruments: [...instruments] });
}

const createSchema = z.object({
  instrument: z.string().trim().min(1).max(60),
  durationMin: z.number().int().min(1).max(1440),
  date: z.string().datetime().optional(),
  pieces: z.array(z.object({
    name: z.string().min(1),
    sections: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  goals: z.string().max(2000).nullable().optional(),
  reflections: z.string().max(2000).nullable().optional(),
  qualityRating: z.number().int().min(1).max(5).nullable().optional(),
  bpmRange: z.string().max(40).nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't log that session.");

  const session = await prisma.practiceSession.create({
    data: {
      userId: auth.userId,
      instrument: parsed.data.instrument,
      durationMin: parsed.data.durationMin,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      pieces: parsed.data.pieces ?? [],
      goals: parsed.data.goals ?? null,
      reflections: parsed.data.reflections ?? null,
      qualityRating: parsed.data.qualityRating ?? null,
      bpmRange: parsed.data.bpmRange ?? null,
      tags: parsed.data.tags ?? [],
    },
  });
  return json({ session }, { status: 201 });
}
