import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { HabitsModule } from "@/components/modules/habits/HabitsModule";

export default async function HabitsPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("habits")) redirect("/settings/modules");
  return <HabitsModule />;
}
