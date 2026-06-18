import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { TasksModule } from "@/components/modules/tasks/TasksModule";

export default async function TasksPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");

  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("tasks")) redirect("/settings/modules");

  return <TasksModule />;
}
