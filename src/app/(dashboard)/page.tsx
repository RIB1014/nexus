import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getEnabledModuleIds } from "@/lib/data/user";
import { getDashboardData } from "@/lib/data/dashboard";
import { Greeting } from "@/components/dashboard/Greeting";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { ModuleShortcuts } from "@/components/dashboard/ModuleShortcuts";
import { WIDGETS } from "@/components/dashboard/widgets";

interface StoredWidget {
  id: string;
  moduleId: string;
}

export default async function HomePage() {
  const sUser = await getSessionUser();
  if (!sUser?.id) redirect("/login");

  const [user, enabledModuleIds, data] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sUser.id },
      select: { name: true, dashboardLayout: true },
    }),
    getEnabledModuleIds(sUser.id),
    getDashboardData(sUser.id),
  ]);

  const enabledSet = new Set(enabledModuleIds);
  const stored =
    (user?.dashboardLayout as { widgets?: StoredWidget[] } | null)?.widgets ??
    [];

  // Only show widgets for modules that are still enabled. If the layout is
  // empty, default to the modules that ship a real widget.
  let widgets = stored.filter((w) => enabledSet.has(w.moduleId));
  if (widgets.length === 0) {
    widgets = enabledModuleIds
      .filter((id) => id in WIDGETS)
      .map((id) => ({ id: `w-${id}`, moduleId: id }));
  }

  return (
    <div className="flex flex-col gap-7">
      <Greeting name={user?.name ?? null} />
      <ModuleShortcuts enabledModuleIds={enabledModuleIds} />
      <DashboardGrid
        initialWidgets={widgets}
        enabledModuleIds={enabledModuleIds}
        data={data}
      />
    </div>
  );
}
