"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, Boxes, Plug, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/modules", label: "Modules", icon: Boxes },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-small font-medium transition-colors",
              active
                ? "bg-accent-muted text-accent"
                : "text-muted hover:bg-inset hover:text-fg",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
