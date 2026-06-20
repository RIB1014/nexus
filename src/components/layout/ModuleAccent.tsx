"use client";

import { usePathname } from "next/navigation";
import { MODULE_COLORS } from "@/lib/modules/colors";
import { useAppStore } from "@/store/useAppStore";
import { AccentScope } from "@/components/theme/AccentScope";

/**
 * Themes the whole content area to the current module's signature color — so
 * Calendar reads red, Habits green, etc. (Apple Reminders "each list has its
 * own color", applied to modules). Home and Settings keep the user's chosen
 * accent. Modules can still re-scope deeper (e.g. Tasks per selected list).
 */
export function ModuleAccent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const accent = useAppStore((s) => s.accentColor);
  const slug = pathname.split("/")[1] ?? "";
  const color = slug in MODULE_COLORS ? MODULE_COLORS[slug] : accent;
  return (
    <AccentScope color={color} className={className}>
      {children}
    </AccentScope>
  );
}
