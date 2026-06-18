import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, json } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const tags = await prisma.taskTag.findMany({
    where: { userId: auth.userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
  return json({ tags });
}
