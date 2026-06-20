import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, id: string) {
  return prisma.calendarEvent.findFirst({ where: { id, userId }, select: { id: true } });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  calendarId: z.string().nullable().optional(),
  recurrence: z.enum(["none", "daily", "weekdays", "weekly"]).nullable().optional(),
});

// Recurring occurrences carry a synthetic "<baseId>::<date>" id; edits/deletes
// act on the underlying series row.
function baseId(id: string): string {
  return id.includes("::") ? id.split("::")[0] : id;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const id = baseId((await params).id);
  if (!(await own(auth.userId, id))) return notFound("Event not found.");

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't update that event.");

  const { calendarId, start, end, ...rest } = parsed.data;
  const data: Prisma.CalendarEventUpdateInput = { ...rest };
  if (start) data.start = new Date(start);
  if (end) data.end = new Date(end);
  if (calendarId !== undefined) {
    data.calendar = calendarId ? { connect: { id: calendarId } } : { disconnect: true };
  }

  const event = await prisma.calendarEvent.update({ where: { id }, data });
  return json({ event });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const id = baseId((await params).id);
  if (!(await own(auth.userId, id))) return notFound("Event not found.");
  await prisma.calendarEvent.delete({ where: { id } });
  return json({ ok: true });
}
