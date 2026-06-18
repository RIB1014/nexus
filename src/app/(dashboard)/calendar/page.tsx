import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { CalendarModule } from "@/components/modules/calendar/CalendarModule";

export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes("calendar")) redirect("/settings/modules");
  return <CalendarModule />;
}
