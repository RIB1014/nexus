"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  Home,
  Settings,
  Moon,
  Plug,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { MODULE_MAP } from "@/lib/modules/registry";

interface CommandPaletteProps {
  enabledModuleIds: string[];
}

export function CommandPalette({ enabledModuleIds }: CommandPaletteProps) {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const modules = enabledModuleIds.map((id) => MODULE_MAP[id]).filter(Boolean);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
        <Command
          loop
          className="overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/20"
        >
          <Command.Input
            autoFocus
            placeholder="Search or run a command…"
            className="h-12 w-full border-b border-line bg-transparent px-4 text-body text-fg outline-none placeholder:text-faint"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-small text-muted">
              No results. Try a module name or “settings”.
            </Command.Empty>

            <Command.Group
              heading="Create"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:text-faint"
            >
              {enabledModuleIds.includes("tasks") && (
                <Item
                  onSelect={() => go("/tasks")}
                  icon={<Plus className="size-4" />}
                  keywords={["new", "todo", "add"]}
                >
                  New task
                </Item>
              )}
              {enabledModuleIds.includes("notes") && (
                <Item
                  onSelect={() => go("/notes")}
                  icon={<Plus className="size-4" />}
                  keywords={["new", "note", "page"]}
                >
                  New note
                </Item>
              )}
            </Command.Group>

            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:text-faint"
            >
              <Item onSelect={() => go("/")} icon={<Home className="size-4" />}>
                Go to Home
              </Item>
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <Item
                    key={m.id}
                    onSelect={() => go(`/${m.id}`)}
                    icon={<Icon className="size-4" />}
                    keywords={[m.name, m.id]}
                  >
                    Go to {m.name}
                  </Item>
                );
              })}
            </Command.Group>

            <Command.Group
              heading="Actions"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:text-faint"
            >
              <Item
                onSelect={() => {
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                  setOpen(false);
                }}
                icon={<Moon className="size-4" />}
              >
                Toggle dark mode
              </Item>
              <Item
                onSelect={() => go("/settings")}
                icon={<Settings className="size-4" />}
              >
                Open settings
              </Item>
              <Item
                onSelect={() => go("/settings/integrations")}
                icon={<Plug className="size-4" />}
                keywords={["canvas", "outlook", "connect"]}
              >
                Manage integrations
              </Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({
  children,
  icon,
  onSelect,
  keywords,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onSelect: () => void;
  keywords?: string[];
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      keywords={keywords}
      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-small text-fg outline-none data-[selected=true]:bg-inset"
    >
      <span className="text-muted">{icon}</span>
      <span className="flex-1">{children}</span>
      <ArrowRight className="size-3.5 text-faint opacity-0 data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}
