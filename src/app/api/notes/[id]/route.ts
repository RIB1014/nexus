import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, id: string) {
  return prisma.note.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const note = await prisma.note.findFirst({ where: { id, userId: auth.userId } });
  if (!note) return notFound("Page not found.");
  return json({
    note: {
      id: note.id,
      title: note.title,
      emoji: note.emoji,
      parentId: note.parentId,
      order: note.order,
      content: note.content,
      tags: note.tags,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    },
  });
}

const patchSchema = z.object({
  title: z.string().trim().max(200).optional(),
  emoji: z.string().max(8).nullable().optional(),
  content: z.unknown().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Page not found.");

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't save that page.");

  // Prevent setting a page as its own parent.
  if (parsed.data.parentId === id) return badRequest("A page can't be its own parent.");

  const data: Prisma.NoteUpdateInput = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title || "Untitled";
  if (parsed.data.emoji !== undefined) data.emoji = parsed.data.emoji;
  if (parsed.data.content !== undefined) data.content = parsed.data.content as Prisma.InputJsonValue;
  if (parsed.data.order !== undefined) data.order = parsed.data.order;
  if (parsed.data.tags !== undefined) data.tags = parsed.data.tags;
  if (parsed.data.parentId !== undefined) {
    data.parent = parsed.data.parentId
      ? { connect: { id: parsed.data.parentId } }
      : { disconnect: true };
  }

  const note = await prisma.note.update({
    where: { id },
    data,
    select: { id: true, title: true, emoji: true, parentId: true, order: true, updatedAt: true },
  });
  return json({ note });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!(await own(auth.userId, id))) return notFound("Page not found.");
  await prisma.note.delete({ where: { id } }); // cascades to children
  return json({ ok: true });
}
