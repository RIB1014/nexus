import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import type { NoteTreeItem } from "@/types/note";

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

// GET the page tree (metadata only — no content).
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const notes = await prisma.note.findMany({
    where: { userId: auth.userId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, emoji: true, parentId: true, order: true, updatedAt: true },
  });

  const tree: NoteTreeItem[] = notes.map((n) => ({
    id: n.id,
    title: n.title,
    emoji: n.emoji,
    parentId: n.parentId,
    order: n.order,
    updatedAt: n.updatedAt.toISOString(),
  }));
  return json({ notes: tree });
}

const createSchema = z.object({
  title: z.string().trim().max(200).optional(),
  parentId: z.string().nullable().optional(),
  emoji: z.string().max(8).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body ?? {});
  if (!parsed.success) return badRequest("Couldn't create that page.");

  if (parsed.data.parentId) {
    const parent = await prisma.note.findFirst({
      where: { id: parsed.data.parentId, userId: auth.userId },
      select: { id: true },
    });
    if (!parent) return badRequest("Parent page doesn't exist.");
  }

  const count = await prisma.note.count({
    where: { userId: auth.userId, parentId: parsed.data.parentId ?? null },
  });

  const note = await prisma.note.create({
    data: {
      userId: auth.userId,
      title: parsed.data.title || "Untitled",
      emoji: parsed.data.emoji ?? null,
      parentId: parsed.data.parentId ?? null,
      content: EMPTY_DOC,
      order: count,
    },
    select: { id: true, title: true, emoji: true, parentId: true, order: true, updatedAt: true },
  });
  return json({ note }, { status: 201 });
}
