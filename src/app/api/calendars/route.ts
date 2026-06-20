import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

const DEFAULTS = [
  { name: "Personal", color: "#5b6cf0" },
  { name: "School", color: "#22c55e" },
  { name: "Social", color: "#f97316" },
];

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  let calendars = await prisma.eventCalendar.findMany({
    where: { userId: auth.userId },
    orderBy: { order: "asc" },
  });

  // First run: create default calendars and adopt any orphan events.
  if (calendars.length === 0) {
    await prisma.$transaction(
      DEFAULTS.map((d, i) =>
        prisma.eventCalendar.create({ data: { userId: auth.userId, name: d.name, color: d.color, order: i } }),
      ),
    );
    calendars = await prisma.eventCalendar.findMany({ where: { userId: auth.userId }, orderBy: { order: "asc" } });
    await prisma.calendarEvent.updateMany({
      where: { userId: auth.userId, calendarId: null },
      data: { calendarId: calendars[0].id },
    });
  }

  return json({ calendars });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(8).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't create that calendar.");

  const count = await prisma.eventCalendar.count({ where: { userId: auth.userId } });
  const calendar = await prisma.eventCalendar.create({
    data: { userId: auth.userId, name: parsed.data.name, color: parsed.data.color ?? "#5b6cf0", icon: parsed.data.icon ?? null, order: count },
  });
  return json({ calendar }, { status: 201 });
}
