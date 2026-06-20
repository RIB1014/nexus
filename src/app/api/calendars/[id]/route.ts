import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, id: string) {
  return prisma.eventCalendar.findFirst({ where: { id, userId }, select: { id: true } });
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(8).nullable().optional(),
  visible: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Calendar not found.");
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't update that calendar.");
  const calendar = await prisma.eventCalendar.update({ where: { id }, data: parsed.data });
  return json({ calendar });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Calendar not found.");
  // Events keep existing; their calendarId becomes null (SetNull).
  await prisma.eventCalendar.delete({ where: { id } });
  return json({ ok: true });
}
