import { prisma } from "@/lib/db/prisma";

/** Enabled module ids for a user, in sidebar order. */
export async function getEnabledModuleIds(userId: string): Promise<string[]> {
  const rows = await prisma.userModule.findMany({
    where: { userId, enabled: true },
    orderBy: { order: "asc" },
    select: { moduleId: true },
  });
  return rows.map((r) => r.moduleId);
}

export async function getModuleRows(userId: string) {
  return prisma.userModule.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
}
