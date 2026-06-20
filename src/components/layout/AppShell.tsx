"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import { ModuleAccent } from "./ModuleAccent";

interface AppShellProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  enabledModuleIds: string[];
  children: React.ReactNode;
}

export function AppShell({ user, enabledModuleIds, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar enabledModuleIds={enabledModuleIds} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <ModuleAccent className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6">
            {children}
          </ModuleAccent>
        </main>
      </div>

      <MobileNav enabledModuleIds={enabledModuleIds} />
      <CommandPalette enabledModuleIds={enabledModuleIds} />
    </div>
  );
}
