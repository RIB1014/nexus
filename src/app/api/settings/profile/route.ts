import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  timezone: z.string().min(1).optional(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid profile update.");

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: parsed.data,
    select: { name: true, timezone: true, weekStartsOn: true },
  });
  return json({ user });
}
