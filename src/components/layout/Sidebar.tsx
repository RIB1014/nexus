"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeft, Settings, Plus, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { MODULE_MAP } from "@/lib/modules/registry";
import { moduleColor } from "@/lib/modules/colors";
import { ModuleTile } from "@/components/modules/ModuleTile";
import { BrandMark } from "./BrandMark";
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
  const appName = useAppStore((s) => s.appName);
  const accentColor = useAppStore((s) => s.accentColor);
  const overrides = useAppStore((s) => s.moduleOverrides);

  const modules = enabledModuleIds.map((id) => MODULE_MAP[id]).filter(Boolean);
  const isCollapsed = collapsed || !showLabels;

  return (
    <aside
      className={cn(
        "glass hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 ease-out md:flex",
        isCollapsed ? "w-16" : "w-[15.5rem]",
      )}
      style={{ borderColor: "var(--glass-border)" }}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-3.5">
        <Link href="/" aria-label={appName} className="transition-transform hover:scale-105">
          <BrandMark />
        </Link>
        {!isCollapsed && (
          <span className="truncate text-[1.15rem] font-semibold tracking-[-0.02em]">{appName}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2">
        <NavItem
          href="/"
          label="Home"
          color={accentColor}
          tile={<ModuleTile color={accentColor} Icon={Home} className="size-7 shadow-sm" />}
          active={pathname === "/"}
          collapsed={isCollapsed}
          onHover={() => router.prefetch("/")}
        />

        {modules.length > 0 && (
          <p className={cn("px-2 pb-1 pt-4 text-micro text-faint", isCollapsed && "sr-only")}>
            Modules
          </p>
        )}

        {modules.map((m) => {
          const href = `/${m.id}`;
          const color = overrides[m.id]?.color ?? moduleColor(m.id);
          const emoji = overrides[m.id]?.emoji;
          return (
            <NavItem
              key={m.id}
              href={href}
              label={m.name}
              color={color}
              tile={<ModuleTile color={color} emoji={emoji} Icon={m.icon} className="size-7 shadow-sm" />}
              active={pathname === href || pathname.startsWith(href + "/")}
              collapsed={isCollapsed}
              onHover={() => router.prefetch(href)}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-2.5 py-2" style={{ borderColor: "var(--glass-border)" }}>
        <NavItem
          href="/settings/modules"
          label="Add modules"
          color="#8E8E93"
          tile={<ModuleTile color="#8E8E93" Icon={Plus} className="size-7 shadow-sm" />}
          active={false}
          collapsed={isCollapsed}
        />
        <NavItem
          href="/settings"
          label="Settings"
          color="#8E8E93"
          tile={<ModuleTile color="#8E8E93" Icon={Settings} className="size-7 shadow-sm" />}
          active={pathname.startsWith("/settings")}
          collapsed={isCollapsed}
          onHover={() => router.prefetch("/settings")}
        />
        <button
          onClick={toggleSidebar}
          className="mt-1 flex w-full items-center gap-3 rounded-[var(--app-radius-md)] px-2 py-1.5 text-small text-muted transition-colors hover:bg-inset hover:text-fg"
        >
          <span className="flex size-7 items-center justify-center">
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </span>
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  tile,
  color,
  active,
  collapsed,
  onHover,
}: {
  href: string;
  label: string;
  tile: React.ReactNode;
  color: string;
  active: boolean;
  collapsed: boolean;
  onHover?: () => void;
}) {
  const content = (
    <Link
      href={href}
      onMouseEnter={onHover}
      className={cn(
        "group/nav flex items-center gap-2.5 rounded-[var(--app-radius-md)] px-1.5 py-1 text-small font-medium transition-colors",
        collapsed && "justify-center",
        active ? "font-semibold" : "text-fg hover:bg-inset/70",
      )}
      style={active ? { background: `${color}22`, color } : undefined}
    >
      {tile}
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
