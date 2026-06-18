import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { CycleModule } from "@/components/modules/cycle/CycleModule";

export default async function CyclePage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("cycle")) redirect("/settings/modules");
  return <CycleModule />;
}
