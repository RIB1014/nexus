import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getEnabledModuleIds } from "@/lib/data/user";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      image: true,
      avatarUrl: true,
      onboarded: true,
    },
  });
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const enabledModuleIds = await getEnabledModuleIds(sessionUser.id);

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image ?? user.avatarUrl,
      }}
      enabledModuleIds={enabledModuleIds}
    >
      {children}
    </AppShell>
  );
}
