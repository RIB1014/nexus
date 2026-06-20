"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Trash2 } from "lucide-react";
// Type-only imports are erased at build time, so they add no runtime/SSR cost.
import type { EmojiClickData, Theme, EmojiStyle } from "emoji-picker-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// The picker touches `window`, so load it client-only.
const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

/**
 * Full native emoji picker (the complete set your Mac has — searchable, by
 * category, with skin tones) wrapped in our popover. `onChange(null)` clears.
 */
export function EmojiPicker({
  value,
  onChange,
  children,
  align = "start",
}: {
  value?: string | null;
  onChange: (emoji: string | null) => void;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}) {
  const { resolvedTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-2.5 py-1.5">
          <span className="text-micro text-faint">Pick an emoji</span>
          <button
            onClick={() => onChange(null)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-micro text-muted transition-colors hover:bg-inset hover:text-fg"
          >
            <Trash2 className="size-3" /> Remove
          </button>
        </div>
        <Picker
          onEmojiClick={(e: EmojiClickData) => onChange(e.emoji)}
          theme={(resolvedTheme === "dark" ? "dark" : "light") as unknown as Theme}
          emojiStyle={"native" as unknown as EmojiStyle}
          lazyLoadEmojis
          width={320}
          height={380}
          previewConfig={{ showPreview: false }}
          searchPlaceHolder="Search emoji"
        />
      </PopoverContent>
    </Popover>
  );
}
