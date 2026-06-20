"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { hexToRgbChannels, readableForeground } from "@/lib/theme/palette";

/**
 * Scopes the accent color to a subtree. Everything inside renders as if `color`
 * were the app accent — this is what lets opening a red list turn its whole
 * view red (Apple Reminders list-detail theming), without touching the global
 * accent the user picked in Settings.
 */
export function AccentScope({
  color,
  as,
  className,
  style,
  children,
}: {
  color: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const Comp = as ?? "div";
  const vars = {
    "--color-accent": color,
    "--color-accent-rgb": hexToRgbChannels(color),
    "--color-accent-contrast": readableForeground(color),
  } as CSSProperties;
  return (
    <Comp className={className} style={{ ...vars, ...style }}>
      {children}
    </Comp>
  );
}
