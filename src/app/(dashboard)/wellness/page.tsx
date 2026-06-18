import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { WellnessModule } from "@/components/modules/wellness/WellnessModule";

export default async function WellnessPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("wellness")) redirect("/settings/modules");
  return <WellnessModule />;
}
