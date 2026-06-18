import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { PracticeModule } from "@/components/modules/practice/PracticeModule";

export default async function PracticeLogPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("practice-log")) redirect("/settings/modules");
  return <PracticeModule />;
}
