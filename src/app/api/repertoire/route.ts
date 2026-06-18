import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const items = await prisma.repertoireItem.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
  });
  return json({ items });
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  composer: z.string().max(120).nullable().optional(),
  instrument: z.string().max(60).nullable().optional(),
  status: z.enum(["learning", "polishing", "performance-ready", "archived"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't add that piece.");

  const item = await prisma.repertoireItem.create({
    data: {
      userId: auth.userId,
      title: parsed.data.title,
      composer: parsed.data.composer ?? null,
      instrument: parsed.data.instrument ?? null,
      status: parsed.data.status ?? "learning",
      notes: parsed.data.notes ?? null,
    },
  });
  return json({ item }, { status: 201 });
}
