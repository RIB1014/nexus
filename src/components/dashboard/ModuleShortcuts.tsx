"use client";

import Link from "next/link";
import { MODULE_MAP } from "@/lib/modules/registry";
import { moduleColor } from "@/lib/modules/colors";
import { ColorIcon } from "@/components/ui/color-picker";

/**
 * A colorful quick-launch grid of the user's modules — the bright, tactile
 * "jump back in" row that makes the home feel alive (Apple/Google launcher).
 */
export function ModuleShortcuts({ enabledModuleIds }: { enabledModuleIds: string[] }) {
  const modules = enabledModuleIds.map((id) => MODULE_MAP[id]).filter(Boolean);
  if (modules.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="group-title">Jump back in</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {modules.map((m) => {
          const color = moduleColor(m.id);
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={`/${m.id}`}
              className="app-card group flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:shadow-pop"
              style={{ borderTopColor: color, borderTopWidth: 2 }}
            >
              <ColorIcon color={color} className="size-9 [&_svg]:size-[18px]">
                <Icon />
              </ColorIcon>
              <span className="min-w-0">
                <span className="block truncate text-small font-semibold text-fg">{m.name}</span>
                <span className="block truncate text-micro normal-case tracking-normal text-muted">
                  {m.description.split(/[.,]/)[0]}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
