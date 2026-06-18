import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import { MODULES, getModule } from "@/lib/modules/registry";

const schema = z.object({
  identityTags: z.array(z.string()).max(10),
  moduleIds: z.array(z.string()).min(1, "Enable at least one module."),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Choose at least one module to continue.");
  }

  const selected = new Set(
    parsed.data.moduleIds.filter((id) => getModule(id)),
  );
  if (selected.size === 0) return badRequest("Enable at least one module.");

  // Write a clean module state: every known module gets a row reflecting the
  // user's choice, in registry order.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.userId },
      data: { onboarded: true, identityTags: parsed.data.identityTags },
    }),
    ...MODULES.map((m, i) =>
      prisma.userModule.upsert({
        where: { userId_moduleId: { userId: auth.userId, moduleId: m.id } },
        create: {
          userId: auth.userId,
          moduleId: m.id,
          enabled: selected.has(m.id),
          order: i,
        },
        update: { enabled: selected.has(m.id) },
      }),
    ),
  ]);

  return json({ ok: true });
}
