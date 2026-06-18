import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { NotesModule } from "@/components/modules/notes/NotesModule";

export default async function NotesPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("notes")) redirect("/settings/modules");
  return <NotesModule />;
}
