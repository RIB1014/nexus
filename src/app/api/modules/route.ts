import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import { getModule } from "@/lib/modules/registry";

// GET: the user's module rows (enabled state + order).
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const rows = await prisma.userModule.findMany({
    where: { userId: auth.userId },
    orderBy: { order: "asc" },
  });
  return json({ modules: rows });
}

const toggleSchema = z.object({
  moduleId: z.string(),
  enabled: z.boolean(),
});

// POST: enable or disable a module for the current user.
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid module toggle.");
  if (!getModule(parsed.data.moduleId)) return badRequest("Unknown module.");

  const { moduleId, enabled } = parsed.data;

  // Order new modules to the end.
  const count = await prisma.userModule.count({ where: { userId: auth.userId } });

  const row = await prisma.userModule.upsert({
    where: { userId_moduleId: { userId: auth.userId, moduleId } },
    create: { userId: auth.userId, moduleId, enabled, order: count },
    update: { enabled },
  });

  return json({ module: row });
}
