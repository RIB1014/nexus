import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { FilesModule } from "@/components/modules/files/FilesModule";

export default async function FilesPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("files")) redirect("/settings/modules");
  return <FilesModule />;
}
