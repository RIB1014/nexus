import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import type { CalendarEventDTO } from "@/types/calendar";

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

  const events = await prisma.calendarEvent.findMany({
    where: { userId: auth.userId, start: { gte: start, lte: end } },
    orderBy: { start: "asc" },
  });

  const items: CalendarEventDTO[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    allDay: e.allDay,
    location: e.location,
    notes: e.notes,
    color: e.color,
    sourceType: e.sourceType,
    sourceId: e.sourceId,
  }));

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
      color: parsed.data.color ?? "#6366F1",
      sourceType: "manual",
    },
  });
  return json({ event }, { status: 201 });
}
