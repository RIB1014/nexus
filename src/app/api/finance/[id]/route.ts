import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, notFound, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const owned = await prisma.expense.findFirst({ where: { id, userId: auth.userId }, select: { id: true } });
  if (!owned) return notFound("Transaction not found.");
  await prisma.expense.delete({ where: { id } });
  return json({ ok: true });
}
