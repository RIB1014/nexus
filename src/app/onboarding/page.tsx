import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const sUser = await getSessionUser();
  if (!sUser?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: sUser.id },
    select: { onboarded: true, name: true },
  });
  if (!user) redirect("/login");
  if (user.onboarded) redirect("/");

  return <OnboardingWizard name={user.name ?? null} />;
}
