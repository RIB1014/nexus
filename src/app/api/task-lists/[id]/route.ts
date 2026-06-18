import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(8).nullable().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const owned = await prisma.taskList.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true },
  });
  if (!owned) return notFound("List not found.");

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't update that list.");

  const list = await prisma.taskList.update({ where: { id }, data: parsed.data });
  return json({ list });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const owned = await prisma.taskList.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true },
  });
  if (!owned) return notFound("List not found.");

  // Tasks in the list are kept but unassigned (listId -> null via SetNull).
  await prisma.taskList.delete({ where: { id } });
  return json({ ok: true });
}
