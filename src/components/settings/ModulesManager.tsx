"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/lib/modules/registry";
import {
  MODULE_CATEGORY_LABELS,
  type ModuleCategory,
} from "@/types/module";

const CATEGORY_ORDER: ModuleCategory[] = [
  "productivity",
  "academic",
  "creative",
  "athletics",
  "wellness",
];

export function ModulesManager({ enabledIds }: { enabledIds: string[] }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledIds));
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(moduleId: string, next: boolean) {
    // Optimistic update.
    setEnabled((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(moduleId);
      else copy.delete(moduleId);
      return copy;
    });
    setPending(moduleId);

    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, enabled: next }),
    });

    setPending(null);
    if (!res.ok) {
      // Roll back on failure.
      setEnabled((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(moduleId);
        else copy.add(moduleId);
        return copy;
      });
      return;
    }
    // Refresh server components (sidebar) to reflect the change.
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {CATEGORY_ORDER.map((category) => {
        const mods = MODULES.filter((m) => m.category === category);
        if (mods.length === 0) return null;
        return (
          <section key={category}>
            <h3 className="mb-3 text-micro text-faint">
              {MODULE_CATEGORY_LABELS[category]}
            </h3>
            <div className="overflow-hidden rounded-lg border border-line bg-panel">
              {mods.map((m, i) => {
                const Icon = m.icon;
                const isOn = enabled.has(m.id);
                return (
                  <div
                    key={m.id}
                    className={
                      "flex items-center gap-4 px-4 py-3" +
                      (i > 0 ? " border-t border-line" : "")
                    }
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-inset text-muted">
                      <Icon className="size-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-small font-medium text-fg">
                          {m.name}
                        </p>
                        {m.requiredIntegrations?.map((req) => (
                          <Badge key={req} variant="outline">
                            needs {req}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-small text-muted">{m.description}</p>
                    </div>
                    <Switch
                      checked={isOn}
                      disabled={pending === m.id}
                      onCheckedChange={(v) => toggle(m.id, v)}
                      aria-label={`Toggle ${m.name}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
