import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, id: string) {
  return prisma.repertoireItem.findFirst({ where: { id, userId }, select: { id: true } });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  composer: z.string().max(120).nullable().optional(),
  instrument: z.string().max(60).nullable().optional(),
  status: z.enum(["learning", "polishing", "performance-ready", "archived"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Piece not found.");
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't update that piece.");
  const item = await prisma.repertoireItem.update({ where: { id }, data: parsed.data });
  return json({ item });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Piece not found.");
  await prisma.repertoireItem.delete({ where: { id } });
  return json({ ok: true });
}
