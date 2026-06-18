import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { FinanceModule } from "@/components/modules/finance/FinanceModule";

export default async function FinancePage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("finance")) redirect("/settings/modules");
  return <FinanceModule />;
}
