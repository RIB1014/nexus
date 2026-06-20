"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Search, Sun, Moon, LogOut, User as UserIcon, Settings } from "lucide-react";
import Link from "next/link";
import { cn, initials } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { useAppStore } from "@/store/useAppStore";
import { getModule } from "@/lib/modules/registry";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

function usePageTitle(fallback: string): string {
  const pathname = usePathname();
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/settings")) return "Settings";
  const slug = pathname.split("/")[1];
  return getModule(slug)?.name ?? fallback;
}

export function TopBar({ user }: TopBarProps) {
  const appName = useAppStore((s) => s.appName);
  const title = usePageTitle(appName);
  const openPalette = useUIStore((s) => s.setCommandPaletteOpen);

  return (
    <header
      className="glass pt-safe sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 md:px-6"
      style={{ borderColor: "var(--glass-border)" }}
    >
      <h1 className="truncate text-[1.35rem] font-bold tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => openPalette(true)}
          className="flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-small text-muted transition-colors hover:text-fg"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden rounded bg-inset px-1.5 py-0.5 font-data text-[0.625rem] text-faint sm:inline">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Avatar>
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-small font-medium text-fg">
                  {user.name ?? "Your account"}
                </span>
                <span className="truncate text-small text-muted">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <UserIcon /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/appearance">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex size-9 items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors hover:text-fg",
        className,
      )}
    >
      {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
