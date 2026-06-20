"use client";

import { useAppStore } from "@/store/useAppStore";
import { moduleColor } from "./colors";

/** Resolved color + emoji for a module, honoring the user's overrides. */
export function useModuleVisual(id: string): { color: string; emoji?: string } {
  const ov = useAppStore((s) => s.moduleOverrides[id]);
  return { color: ov?.color ?? moduleColor(id), emoji: ov?.emoji };
}
