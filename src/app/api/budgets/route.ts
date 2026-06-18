import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

const schema = z.object({
  category: z.string().min(1).max(40),
  limit: z.number().positive(),
});

// Upsert a budget for a category.
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't save that budget.");

  const budget = await prisma.budget.upsert({
    where: { userId_category: { userId: auth.userId, category: parsed.data.category } },
    create: { userId: auth.userId, category: parsed.data.category, limit: parsed.data.limit },
    update: { limit: parsed.data.limit },
  });
  return json({ budget });
}
