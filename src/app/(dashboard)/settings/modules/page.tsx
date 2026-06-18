import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { ModulesManager } from "@/components/settings/ModulesManager";

export default async function ModulesSettings() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabledIds = await getEnabledModuleIds(user.id);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-body text-muted">
        Turn modules on or off any time. Nexus starts minimal — enable only what
        you need, and add more whenever you like.
      </p>
      <div className="mt-4">
        <ModulesManager enabledIds={enabledIds} />
      </div>
    </div>
  );
}
