import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import { getModule } from "@/lib/modules/registry";

const schema = z.object({
  order: z.array(z.string()).min(1),
});

// PUT: persist sidebar order for the current user. `order` is the full ordered
// list of module ids; index becomes the stored `order`.
export async function PUT(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid order.");

  const valid = parsed.data.order.filter((id) => getModule(id));

  await prisma.$transaction(
    valid.map((moduleId, i) =>
      prisma.userModule.upsert({
        where: { userId_moduleId: { userId: auth.userId, moduleId } },
        create: { userId: auth.userId, moduleId, enabled: true, order: i },
        update: { order: i },
      }),
    ),
  );

  return json({ ok: true });
}
