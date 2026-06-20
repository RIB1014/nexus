"use client";

import { RotateCcw, Smile } from "lucide-react";
import { MODULE_MAP } from "@/lib/modules/registry";
import { moduleColor } from "@/lib/modules/colors";
import { useAppStore } from "@/store/useAppStore";
import { ColorPicker } from "@/components/ui/color-picker";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { ModuleTile } from "@/components/modules/ModuleTile";

/** Per-module color + emoji customization for the sidebar/tiles. */
export function ModuleAppearance({ enabledIds }: { enabledIds: string[] }) {
  const overrides = useAppStore((s) => s.moduleOverrides);
  const setOverride = useAppStore((s) => s.setModuleOverride);
  const modules = enabledIds.map((id) => MODULE_MAP[id]).filter(Boolean);

  if (modules.length === 0) {
    return <p className="text-small text-muted">Enable a module to customize its look.</p>;
  }

  return (
    <div className="grouped">
      {modules.map((m) => {
        const color = overrides[m.id]?.color ?? moduleColor(m.id);
        const emoji = overrides[m.id]?.emoji;
        const customized = Boolean(overrides[m.id]);
        return (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
            <ModuleTile color={color} emoji={emoji} Icon={m.icon} className="size-9 [&_svg]:size-[18px]" />
            <span className="flex-1 truncate text-small font-medium text-fg">{m.name}</span>

            <ColorPicker value={color} onChange={(hex) => setOverride(m.id, { color: hex })} align="end">
              <button
                className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-small text-muted transition-colors hover:bg-inset hover:text-fg"
                title="Color"
              >
                <span className="size-3.5 rounded-full" style={{ background: color }} />
                Color
              </button>
            </ColorPicker>

            <EmojiPicker value={emoji} onChange={(e) => setOverride(m.id, { emoji: e })} align="end">
              <button
                className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-small text-muted transition-colors hover:bg-inset hover:text-fg"
                title="Emoji"
              >
                {emoji ? <span className="text-base leading-none">{emoji}</span> : <Smile className="size-4" />}
                Emoji
              </button>
            </EmojiPicker>

            <button
              onClick={() => setOverride(m.id, { color: null, emoji: null })}
              disabled={!customized}
              title="Reset to default"
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-inset hover:text-fg disabled:opacity-30"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
