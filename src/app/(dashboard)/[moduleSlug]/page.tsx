import { notFound, redirect } from "next/navigation";
import { Hammer, Plug } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/data/user";
import { getModule } from "@/lib/modules/registry";
import { getIntegration } from "@/lib/integrations/registry";
import { MODULE_CATEGORY_LABELS } from "@/types/module";
import { hexToRgbChannels } from "@/lib/theme/presets";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { CSSProperties } from "react";

interface PageProps {
  params: Promise<{ moduleSlug: string }>;
}

/**
 * Dynamic module page. In this foundation build every module renders a
 * scaffolded placeholder; full module UIs land in their own deliverables and
 * will be wired here via next/dynamic against the module registry.
 */
export default async function ModulePage({ params }: PageProps) {
  const { moduleSlug } = await params;
  const mod = getModule(moduleSlug);
  if (!mod) notFound();

  const user = await getSessionUser();
  if (!user?.id) redirect("/login");

  const enabled = await getEnabledModuleIds(user.id);
  if (!enabled.includes(mod.id)) {
    // Enabled-but-not-here is fine; not-enabled sends them to turn it on.
    redirect(`/settings/modules`);
  }

  const Icon = mod.icon;
  const missingIntegration = mod.requiredIntegrations?.find(Boolean);
  const integration = missingIntegration
    ? getIntegration(missingIntegration)
    : undefined;

  // A module can override the accent for its own page (e.g. Practice Log violet).
  const accentStyle: CSSProperties | undefined = mod.color
    ? ({
        "--color-accent": mod.color,
        "--color-accent-rgb": hexToRgbChannels(mod.color),
      } as CSSProperties)
    : undefined;

  return (
    <div className="flex flex-col gap-6" style={accentStyle}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex size-11 items-center justify-center rounded-lg text-accent"
            style={{ background: "var(--color-accent-muted)" }}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-display !text-2xl">{mod.name}</h2>
              <Badge variant="outline">
                {MODULE_CATEGORY_LABELS[mod.category]}
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-body text-muted">
              {mod.description}
            </p>
          </div>
        </div>
      </header>

      {integration && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center gap-3">
            <Plug className="size-5 text-accent" />
            <div>
              <p className="text-small font-medium text-fg">
                Connect {integration.name} to use this module
              </p>
              <p className="text-small text-muted">{integration.description}</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/settings/integrations">Connect</Link>
          </Button>
        </div>
      )}

      <EmptyState
        icon={<Hammer />}
        title={`${mod.name} is taking shape`}
        description="The foundation is in place — this module's full experience is being built out next. Your data and settings are ready and waiting."
        action={
          <Button asChild variant="secondary">
            <Link href="/">Back to Home</Link>
          </Button>
        }
      />
    </div>
  );
}
