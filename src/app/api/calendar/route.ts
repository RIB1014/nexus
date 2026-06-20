import { NextResponse } from "next/server";
import { z } from "zod";
import { addDays, isAfter, startOfDay } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import type { CalendarEventDTO } from "@/types/calendar";

// Generate occurrence start-times for a recurring event within [from, to].
function occurrences(seriesStart: Date, rule: string, from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const hours = seriesStart.getHours();
  const mins = seriesStart.getMinutes();
  let cursor = startOfDay(seriesStart) > startOfDay(from) ? new Date(seriesStart) : new Date(from);
  cursor = new Date(cursor);
  cursor.setHours(hours, mins, 0, 0);
  // Don't emit occurrences before the series actually starts.
  if (cursor < seriesStart) cursor = new Date(seriesStart);

  let guard = 0;
  while (!isAfter(cursor, to) && guard < 800) {
    guard++;
    const dow = cursor.getDay();
    const matches =
      rule === "daily" ||
      (rule === "weekly" && dow === seriesStart.getDay()) ||
      (rule === "weekdays" && dow >= 1 && dow <= 5);
    if (matches && cursor >= from && cursor >= seriesStart) out.push(new Date(cursor));
    // Step: weekly jumps 7 days from the series weekday; others step daily.
    cursor = addDays(cursor, rule === "weekly" ? 7 : 1);
    cursor.setHours(hours, mins, 0, 0);
  }
  return out;
}

// GET events (and, optionally, task due dates as a layer) within a range.
export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");
  const includeTasks = url.searchParams.get("tasks") !== "false";

  const start = startParam ? new Date(startParam) : new Date();
  const end = endParam ? new Date(endParam) : new Date(start.getFullYear(), start.getMonth() + 2, 0);

  // Pull events whose first occurrence is on/before the range end. Recurring
  // ones may have started earlier, so we don't filter on `start >= rangeStart`.
  const events = await prisma.calendarEvent.findMany({
    where: { userId: auth.userId, start: { lte: end } },
    orderBy: { start: "asc" },
  });

  const items: CalendarEventDTO[] = [];
  for (const e of events) {
    const base = {
      title: e.title,
      allDay: e.allDay,
      location: e.location,
      notes: e.notes,
      color: e.color,
      calendarId: e.calendarId,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
    };
    const durationMs = e.end.getTime() - e.start.getTime();

    if (e.recurrence && e.recurrence !== "none") {
      // Expand occurrences that fall within the requested range.
      for (const occStart of occurrences(e.start, e.recurrence, start, end)) {
        const occEnd = new Date(occStart.getTime() + durationMs);
        items.push({
          ...base,
          id: `${e.id}::${occStart.toISOString().slice(0, 10)}`,
          start: occStart.toISOString(),
          end: occEnd.toISOString(),
          recurrence: e.recurrence,
          recurringBaseId: e.id,
        });
      }
    } else if (e.start >= start) {
      items.push({
        ...base,
        id: e.id,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        recurrence: e.recurrence,
      });
    }
  }

  if (includeTasks) {
    const tasks = await prisma.task.findMany({
      where: {
        userId: auth.userId,
        completed: false,
        dueDate: { gte: start, lte: end },
      },
      select: { id: true, title: true, dueDate: true, dueTime: true },
    });
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const d = new Date(t.dueDate);
      if (t.dueTime) {
        const [h, m] = t.dueTime.split(":").map(Number);
        d.setHours(h, m, 0, 0);
      }
      items.push({
        id: `task-${t.id}`,
        title: t.title,
        start: d.toISOString(),
        end: d.toISOString(),
        allDay: !t.dueTime,
        location: null,
        notes: null,
        color: null,
        sourceType: "task",
        sourceId: t.id,
        isTask: true,
      });
    }
  }

  return json({ events: items });
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  start: z.string().datetime(),
  end: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  calendarId: z.string().nullable().optional(),
  recurrence: z.enum(["none", "daily", "weekdays", "weekly"]).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't create that event.");

  const start = new Date(parsed.data.start);
  const end = parsed.data.end ? new Date(parsed.data.end) : new Date(start.getTime() + 60 * 60 * 1000);

  const event = await prisma.calendarEvent.create({
    data: {
      userId: auth.userId,
      title: parsed.data.title,
      start,
      end,
      allDay: parsed.data.allDay ?? false,
      location: parsed.data.location ?? null,
      notes: parsed.data.notes ?? null,
      color: parsed.data.color ?? null,
      calendarId: parsed.data.calendarId ?? null,
      recurrence: parsed.data.recurrence && parsed.data.recurrence !== "none" ? parsed.data.recurrence : null,
      sourceType: "manual",
    },
  });
  return json({ event }, { status: 201 });
}
