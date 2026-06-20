import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const owned = await prisma.taskTag.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true },
  });
  if (!owned) return notFound("Tag not found.");

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't update that tag.");

  const tag = await prisma.taskTag.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, color: true },
  });
  return json({ tag });
}
