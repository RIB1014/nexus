import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { dashboardLayout: true },
  });
  return json({ layout: user?.dashboardLayout ?? { widgets: [] } });
}

const schema = z.object({
  widgets: z.array(
    z.object({ id: z.string(), moduleId: z.string() }),
  ),
});

// PUT: persist the widget order / pinned set for the current user.
export async function PUT(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid dashboard layout.");

  await prisma.user.update({
    where: { id: auth.userId },
    data: { dashboardLayout: parsed.data },
  });
  return json({ ok: true });
}
