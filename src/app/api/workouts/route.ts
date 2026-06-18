import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, startOfWeek, format } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import type { Exercise, WorkoutDTO, WorkoutStats } from "@/types/workout";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const all = await prisma.workout.findMany({
    where: { userId: auth.userId },
    orderBy: { startTime: "desc" },
  });

  const weekStart = startOfWeek(new Date());
  let weekCount = 0, weekMinutes = 0, weekVolume = 0;
  const activeDays = new Set<string>();
  const byType = new Map<string, number>();
  const prByExercise = new Map<string, number>();

  for (const w of all) {
    activeDays.add(format(startOfDay(w.startTime), "yyyy-MM-dd"));
    byType.set(w.type, (byType.get(w.type) ?? 0) + 1);
    const exercises = (w.exercises as unknown as Exercise[]) ?? [];
    for (const ex of exercises) {
      if (ex.weight && ex.weight > (prByExercise.get(ex.name) ?? 0)) {
        prByExercise.set(ex.name, ex.weight);
      }
    }
    if (w.startTime >= weekStart) {
      weekCount += 1;
      weekMinutes += w.durationMin;
      for (const ex of exercises) {
        weekVolume += (ex.sets ?? 0) * (ex.reps ?? 0) * (ex.weight ?? 0);
      }
    }
  }

  const stats: WorkoutStats = {
    weekCount, weekMinutes, weekVolume: Math.round(weekVolume),
    activeDays: [...activeDays],
    byType: [...byType.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    prs: [...prByExercise.entries()].map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight).slice(0, 6),
  };

  const workouts: WorkoutDTO[] = all.slice(0, 25).map((w) => ({
    id: w.id,
    type: w.type,
    durationMin: w.durationMin,
    startTime: w.startTime.toISOString(),
    exercises: (w.exercises as unknown as Exercise[]) ?? [],
    rpe: w.rpe,
    notes: w.notes,
    bodyWeight: w.bodyWeight,
  }));

  return json({ workouts, stats });
}

const exerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().optional(),
  reps: z.number().optional(),
  weight: z.number().optional(),
  distanceKm: z.number().optional(),
  notes: z.string().optional(),
});

const createSchema = z.object({
  type: z.string().min(1).max(40),
  durationMin: z.number().int().min(1).max(1440),
  startTime: z.string().datetime().optional(),
  exercises: z.array(exerciseSchema).optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  bodyWeight: z.number().positive().nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't log that workout.");

  const workout = await prisma.workout.create({
    data: {
      userId: auth.userId,
      type: parsed.data.type,
      durationMin: parsed.data.durationMin,
      startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : new Date(),
      exercises: parsed.data.exercises ?? [],
      rpe: parsed.data.rpe ?? null,
      notes: parsed.data.notes ?? null,
      bodyWeight: parsed.data.bodyWeight ?? null,
    },
  });
  return json({ workout }, { status: 201 });
}
