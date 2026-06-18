import { startOfDay, subDays, format, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import type { HabitDTO, HabitsSummary } from "@/types/habit";

const HEATMAP_DAYS = 119; // 17 weeks

export function dayKey(d: Date): string {
  return format(startOfDay(d), "yyyy-MM-dd");
}

/** Build the full habits summary (streaks, today status, heatmap, week rate). */
export async function getHabitsSummary(userId: string): Promise<HabitsSummary> {
  const habits = await prisma.habit.findMany({
    where: { userId, active: true },
    orderBy: { order: "asc" },
  });

  const since = startOfDay(subDays(new Date(), HEATMAP_DAYS));
  const logs = await prisma.habitLog.findMany({
    where: { userId, completed: true, date: { gte: since } },
    select: { habitId: true, date: true },
  });

  // habitId -> set of completed day keys
  const byHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const set = byHabit.get(log.habitId) ?? new Set<string>();
    set.add(dayKey(log.date));
    byHabit.set(log.habitId, set);
  }

  const todayKey = dayKey(new Date());

  const dtos: HabitDTO[] = habits.map((h) => {
    const done = byHabit.get(h.id) ?? new Set<string>();

    // Streak: consecutive days ending today or yesterday.
    let streak = 0;
    let cursor = startOfDay(new Date());
    if (!done.has(dayKey(cursor))) cursor = subDays(cursor, 1);
    while (done.has(dayKey(cursor))) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }

    return {
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      frequency: h.frequency,
      customDays: h.customDays,
      category: h.category,
      targetStreak: h.targetStreak,
      order: h.order,
      streak,
      doneToday: done.has(todayKey),
      history: [...done],
    };
  });

  // Weekly rate: completed check-ins this week / (habits * days elapsed this week).
  const weekStart = startOfWeek(new Date());
  const daysElapsed = Math.floor(
    (startOfDay(new Date()).getTime() - weekStart.getTime()) / 86_400_000,
  ) + 1;
  let completedThisWeek = 0;
  for (const h of dtos) {
    completedThisWeek += h.history.filter(
      (k) => new Date(k) >= weekStart,
    ).length;
  }
  const expected = dtos.length * daysElapsed;
  const weekRate = expected > 0 ? Math.round((completedThisWeek / expected) * 100) : 0;

  return { habits: dtos, weekRate: Math.min(100, weekRate) };
}
