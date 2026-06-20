"use client";

import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const EMOJIS = [
  "✅", "📚", "🏠", "🎵", "💪", "💼", "🎨", "🛒",
  "✈️", "📝", "📅", "⭐️", "🔥", "💡", "❤️", "🏃",
  "🎯", "☕️", "🌙", "🌿", "💰", "🔗", "📁", "🎮",
  "🧠", "📷", "🍎", "⚽️", "🎸", "🧪", "🩺", "🌸",
  "🗂️", "⏰", "📈", "🧘", "🐾", "🌎", "🎧", "🏆",
];

/** A compact emoji grid for picking (or clearing) an icon. */
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
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-[17rem] p-2">
        <div className="grid grid-cols-8 gap-1">
          <button
            onClick={() => onChange(null)}
            title="No emoji"
            className="flex aspect-square items-center justify-center rounded-md text-faint hover:bg-inset"
          >
            ∅
          </button>
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => onChange(e)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-lg transition-colors hover:bg-inset",
                value === e && "bg-accent-muted",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
