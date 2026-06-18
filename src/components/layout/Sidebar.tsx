"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeft, Settings, Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { MODULE_MAP } from "@/lib/modules/registry";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  enabledModuleIds: string[];
}

export function Sidebar({ enabledModuleIds }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const showLabels = useAppStore((s) => s.sidebarShowLabels);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const modules = enabledModuleIds
    .map((id) => MODULE_MAP[id])
    .filter(Boolean);

  const isCollapsed = collapsed || !showLabels;

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200 ease-out md:flex",
        isCollapsed ? "w-16" : "w-60",
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-3">
        <Link
          href="/"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-gradient text-accent-contrast"
        >
          <Sparkles className="size-4" />
        </Link>
        {!isCollapsed && <span className="text-heading">Nexus</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <NavItem
          href="/"
          label="Home"
          active={pathname === "/"}
          collapsed={isCollapsed}
          icon={<HomeGlyph />}
          onHover={() => router.prefetch("/")}
        />

        {modules.length > 0 && (
          <p
            className={cn(
              "px-2 pb-1 pt-4 text-micro text-faint",
              isCollapsed && "sr-only",
            )}
          >
            Modules
          </p>
        )}

        {modules.map((m) => {
          const href = `/${m.id}`;
          const Icon = m.icon;
          return (
            <NavItem
              key={m.id}
              href={href}
              label={m.name}
              active={pathname === href || pathname.startsWith(href + "/")}
              collapsed={isCollapsed}
              icon={<Icon className="size-[18px]" />}
              onHover={() => router.prefetch(href)}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-line px-2 py-2">
        <NavItem
          href="/settings/modules"
          label="Add modules"
          collapsed={isCollapsed}
          active={false}
          icon={<Plus className="size-[18px]" />}
        />
        <NavItem
          href="/settings"
          label="Settings"
          active={pathname.startsWith("/settings")}
          collapsed={isCollapsed}
          icon={<Settings className="size-[18px]" />}
          onHover={() => router.prefetch("/settings")}
        />
        <button
          onClick={toggleSidebar}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-2 py-2 text-small text-muted transition-colors hover:bg-inset hover:text-fg"
        >
          {collapsed ? (
            <PanelLeft className="size-[18px]" />
          ) : (
            <PanelLeftClose className="size-[18px]" />
          )}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  collapsed,
  onHover,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onHover?: () => void;
}) {
  const content = (
    <Link
      href={href}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-3 rounded-md px-2 py-2 text-small font-medium transition-colors",
        collapsed && "justify-center",
        active
          ? "bg-accent-muted text-accent"
          : "text-muted hover:bg-inset hover:text-fg",
      )}
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center">
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
