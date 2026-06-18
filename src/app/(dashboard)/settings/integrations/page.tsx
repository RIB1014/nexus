import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { INTEGRATIONS } from "@/lib/integrations/registry";
import { IntegrationCard } from "@/components/settings/IntegrationCard";

export default async function IntegrationsSettings() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");

  const rows = await prisma.integration.findMany({
    where: { userId: user.id },
    select: {
      provider: true,
      status: true,
      lastSyncedAt: true,
      metadata: true,
      errorMessage: true,
    },
  });
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-muted">
        Connect the services you already use. Nexus only reads what each card
        lists below — nothing more.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {INTEGRATIONS.map((integration) => {
          const row = byProvider.get(integration.id);
          return (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              connection={
                row
                  ? {
                      status: row.status,
                      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
                      accountEmail:
                        (row.metadata as { accountEmail?: string } | null)
                          ?.accountEmail ?? null,
                      errorMessage: row.errorMessage,
                    }
                  : null
              }
            />
          );
        })}
      </div>

      <a
        href="mailto:integrations@nexus.app?subject=Integration%20request"
        className="text-small text-accent hover:underline"
      >
        Don&apos;t see what you need? Request an integration →
      </a>
    </div>
  );
}
