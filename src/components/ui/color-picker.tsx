"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PALETTE, isValidHex, normalizeHex } from "@/lib/theme/palette";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

/** A small filled circle showing a color — the universal "this is its color" dot. */
export function ColorDot({
  color,
  className,
  ring,
}: {
  color: string;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn("inline-block size-3 shrink-0 rounded-full", className)}
      style={{
        background: color,
        boxShadow: ring ? "0 0 0 2px var(--color-surface), 0 0 0 3px var(--color-border)" : undefined,
      }}
    />
  );
}

/**
 * A colored rounded-square icon tile (Apple Reminders list glyph). Pass an icon
 * as children; it renders white on the color.
 */
export function ColorIcon({
  color,
  className,
  children,
}: {
  color: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-white [&_svg]:size-4",
        className,
      )}
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

/**
 * Shared color picker: a curated palette grid plus a custom hex input. Wrap any
 * trigger as children, or omit children for a default swatch button.
 */
export function ColorPicker({
  value,
  onChange,
  align = "start",
  side = "bottom",
  children,
}: {
  value: string;
  onChange: (hex: string) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commitDraft = () => {
    if (isValidHex(draft)) onChange(normalizeHex(draft));
    else setDraft(value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            type="button"
            aria-label="Pick a color"
            className="flex size-6 items-center justify-center rounded-full ring-1 ring-line transition-transform hover:scale-110"
            style={{ background: value }}
          />
        )}
      </PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-[15.5rem] p-3">
        <div className="grid grid-cols-5 gap-2">
          {PALETTE.map((s) => {
            const active = value.toLowerCase() === s.hex.toLowerCase();
            return (
              <button
                key={s.id}
                type="button"
                title={s.name}
                onClick={() => onChange(s.hex)}
                className="flex aspect-square items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{ background: s.hex }}
              >
                {active && <Check className="size-4 text-white drop-shadow" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-line">
            <span className="absolute inset-0" style={{ background: value }} />
            <input
              type="color"
              aria-label="Custom color"
              value={isValidHex(draft) ? normalizeHex(draft) : value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="#5b6cf0"
            spellCheck={false}
            className="h-8 w-full rounded-md border border-line bg-canvas px-2 font-data text-small text-fg outline-none focus-visible:border-accent"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
