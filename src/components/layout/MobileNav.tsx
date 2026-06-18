"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_MAP } from "@/lib/modules/registry";
import { useUIStore } from "@/store/useUIStore";

interface MobileNavProps {
  enabledModuleIds: string[];
}

export function MobileNav({ enabledModuleIds }: MobileNavProps) {
  const pathname = usePathname();
  const openPalette = useUIStore((s) => s.setCommandPaletteOpen);

  // Home + up to 3 modules + Search = 5 touch targets.
  const modules = enabledModuleIds
    .map((id) => MODULE_MAP[id])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-line bg-panel/95 backdrop-blur md:hidden">
      <MobileItem
        href="/"
        label="Home"
        active={pathname === "/"}
        icon={<Home className="size-5" />}
      />
      {modules.map((m) => {
        const href = `/${m.id}`;
        const Icon = m.icon;
        return (
          <MobileItem
            key={m.id}
            href={href}
            label={m.name}
            active={pathname.startsWith(href)}
            icon={<Icon className="size-5" />}
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
    </nav>
  );
}

function MobileItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1",
        active ? "text-accent" : "text-faint",
      )}
    >
      {icon}
      <span className="max-w-full truncate px-1 text-[0.625rem]">{label}</span>
    </Link>
  );
}
