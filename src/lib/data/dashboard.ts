import {
  endOfDay,
  startOfDay,
  startOfWeek,
  isSameDay,
  subDays,
} from "date-fns";
import { prisma } from "@/lib/db/prisma";

export interface DashboardData {
  tasks: {
    items: { id: string; title: string; priority: string; dueLabel: string | null }[];
    remaining: number;
  };
  events: {
    items: { id: string; title: string; start: string; location: string | null }[];
  };
  habits: {
    items: { id: string; name: string; emoji: string | null; doneToday: boolean }[];
    completedToday: number;
  };
  practice: {
    streak: number;
    weeklyMinutes: number;
    weeklyGoalMinutes: number;
  };
}

function priorityToDueLabel(due: Date | null): string | null {
  if (!due) return null;
  const today = new Date();
  if (isSameDay(due, today)) return "Today";
  if (due < startOfDay(today)) return "Overdue";
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const todayEnd = endOfDay(now);
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const [taskItems, remaining, events, habits, todayHabitLogs, sessions] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          completed: false,
          parentId: null,
          dueDate: { lte: todayEnd },
        },
        orderBy: [{ dueDate: "asc" }],
        take: 5,
        select: { id: true, title: true, priority: true, dueDate: true },
      }),
      prisma.task.count({
        where: {
          userId,
          completed: false,
          parentId: null,
          dueDate: { lte: todayEnd },
        },
      }),
      prisma.calendarEvent.findMany({
        where: { userId, start: { gte: todayStart } },
        orderBy: { start: "asc" },
        take: 4,
        select: { id: true, title: true, start: true, location: true },
      }),
      prisma.habit.findMany({
        where: { userId, active: true },
        orderBy: { order: "asc" },
        take: 6,
        select: { id: true, name: true, emoji: true },
      }),
      prisma.habitLog.findMany({
        where: {
          userId,
          completed: true,
          date: { gte: todayStart, lte: todayEnd },
        },
        select: { habitId: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        select: { date: true, durationMin: true },
      }),
    ]);

  const doneHabitIds = new Set(todayHabitLogs.map((l) => l.habitId));
  const habitItems = habits.map((h) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    doneToday: doneHabitIds.has(h.id),
  }));

  // Practice streak: consecutive days (ending today or yesterday) with a session.
  const practiceDays = new Set(
    sessions.map((s) => startOfDay(s.date).getTime()),
  );
  let streak = 0;
  let cursor = startOfDay(now);
  if (!practiceDays.has(cursor.getTime())) cursor = subDays(cursor, 1);
  while (practiceDays.has(cursor.getTime())) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  const weeklyMinutes = sessions
    .filter((s) => s.date >= weekStart)
    .reduce((sum, s) => sum + s.durationMin, 0);

  return {
    tasks: {
      items: taskItems.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueLabel: priorityToDueLabel(t.dueDate),
      })),
      remaining,
    },
    events: {
      items: events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start.toISOString(),
        location: e.location,
      })),
    },
    habits: { items: habitItems, completedToday: doneHabitIds.size },
    practice: {
      streak,
      weeklyMinutes,
      weeklyGoalMinutes: 300,
    },
  };
}
