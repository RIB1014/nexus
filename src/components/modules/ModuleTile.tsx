import type { ComponentType } from "react";
import { ColorIcon } from "@/components/ui/color-picker";

/**
 * A module's colored icon tile — shows the user's emoji if set, otherwise the
 * module's lucide glyph. Presentational (no hooks); callers pass resolved
 * color/emoji so it works inside list maps.
 */
export function ModuleTile({
  color,
  emoji,
  Icon,
  className,
}: {
  color: string;
  emoji?: string;
  Icon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <ColorIcon color={color} className={className}>
      {emoji ? (
        <span className="leading-none" style={{ fontSize: "0.95em" }}>{emoji}</span>
      ) : Icon ? (
        <Icon />
      ) : null}
    </ColorIcon>
  );
}
