import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { ModulesManager } from "@/components/settings/ModulesManager";
import { SidebarOrderManager } from "@/components/settings/SidebarOrderManager";
import { ModuleAppearance } from "@/components/settings/ModuleAppearance";

export default async function ModulesSettings() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabledIds = await getEnabledModuleIds(user.id);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-body text-muted">
        Turn modules on or off any time. Orbit starts minimal — enable only what
        you need, and add more whenever you like.
      </p>

      <section>
        <h3 className="mb-1 text-heading">Sidebar order</h3>
        <p className="mb-3 text-small text-muted">
          Drag to arrange how your enabled modules appear in the sidebar.
        </p>
        <SidebarOrderManager enabledIds={enabledIds} />
      </section>

      <section>
        <h3 className="mb-1 text-heading">Module color &amp; icon</h3>
        <p className="mb-3 text-small text-muted">
          Give each module its own color and emoji — they show in the sidebar and tiles.
        </p>
        <ModuleAppearance enabledIds={enabledIds} />
      </section>

      <section>
        <h3 className="mb-1 text-heading">All modules</h3>
        <p className="mb-3 text-small text-muted">
          Everything Orbit can do, grouped by area.
        </p>
        <ModulesManager enabledIds={enabledIds} />
      </section>
    </div>
  );
}
