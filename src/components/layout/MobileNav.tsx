"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_MAP } from "@/lib/modules/registry";
import { moduleColor } from "@/lib/modules/colors";
import { useUIStore } from "@/store/useUIStore";
import { useAppStore } from "@/store/useAppStore";

interface MobileNavProps {
  enabledModuleIds: string[];
}

export function MobileNav({ enabledModuleIds }: MobileNavProps) {
  const pathname = usePathname();
  const openPalette = useUIStore((s) => s.setCommandPaletteOpen);
  const overrides = useAppStore((s) => s.moduleOverrides);

  // Home + up to 3 modules + Search = 5 touch targets.
  const modules = enabledModuleIds
    .map((id) => MODULE_MAP[id])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <nav className="glass pb-safe fixed inset-x-0 bottom-0 z-30 border-t md:hidden" style={{ borderColor: "var(--glass-border)" }}>
      <div className="flex h-16 items-stretch">
        <MobileItem
          href="/"
          label="Home"
          active={pathname === "/"}
          color="var(--color-accent)"
          icon={<Home className="size-5" />}
        />
        {modules.map((m) => {
          const href = `/${m.id}`;
          const Icon = m.icon;
          const color = overrides[m.id]?.color ?? moduleColor(m.id);
          const emoji = overrides[m.id]?.emoji;
          return (
            <MobileItem
              key={m.id}
              href={href}
              label={m.name}
              active={pathname.startsWith(href)}
              color={color}
              icon={emoji ? <span className="text-lg leading-none">{emoji}</span> : <Icon className="size-5" />}
            />
          );
        })}
        <button
          onClick={() => openPalette(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-faint"
        >
          <Search className="size-5" />
          <span className="text-[0.625rem]">Search</span>
        </button>
      </div>
    </nav>
  );
}

function MobileItem({
  href,
  label,
  icon,
  active,
  color,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
        !active && "text-faint",
      )}
      style={active ? { color } : undefined}
    >
      {icon}
      <span className="max-w-full truncate px-1 text-[0.625rem]">{label}</span>
    </Link>
  );
}
