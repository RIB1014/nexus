import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { LinksModule } from "@/components/modules/links/LinksModule";

export default async function LinksPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("links")) redirect("/settings/modules");
  return <LinksModule />;
}
