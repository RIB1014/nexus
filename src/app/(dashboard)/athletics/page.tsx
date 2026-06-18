import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { AthleticsModule } from "@/components/modules/athletics/AthleticsModule";

export default async function AthleticsPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("athletics")) redirect("/settings/modules");
  return <AthleticsModule />;
}
