import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default async function ProfileSettings() {
  const sUser = await getSessionUser();
  if (!sUser?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: sUser.id },
    select: { name: true, email: true, timezone: true, weekStartsOn: true },
  });
  if (!user) redirect("/login");

  return (
    <ProfileForm
      initial={{
        name: user.name ?? "",
        email: user.email,
        timezone: user.timezone,
        weekStartsOn: user.weekStartsOn === 1 ? 1 : 0,
      }}
    />
  );
}
