"use client";

import { useState } from "react";
import { Check, Smile } from "lucide-react";
import { useCreateList } from "@/lib/hooks/useTasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { PALETTE } from "@/lib/theme/palette";

const DEFAULT_COLOR = PALETTE[8].hex; // blue

export function NewListDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const create = useCreateList();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [icon, setIcon] = useState("");

  const reset = () => {
    setName("");
    setColor(DEFAULT_COLOR);
    setIcon("");
  };

  const submit = async () => {
    if (!name.trim()) return;
    const res = await create.mutateAsync({
      name: name.trim(),
      color,
      icon: icon || null,
    });
    reset();
    onOpenChange(false);
    onCreated?.(res.list.id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New list</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="list-name">Name</Label>
            <Input
              id="list-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. School"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.slice(0, 10).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setColor(s.hex)}
                  className="flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110"
                  style={{ background: s.hex }}
                  aria-label={s.name}
                >
                  {color.toLowerCase() === s.hex.toLowerCase() && (
                    <Check className="size-4 text-white drop-shadow" strokeWidth={3} />
                  )}
                </button>
              ))}
              <ColorPicker value={color} onChange={setColor} align="end">
                <button
                  className="flex size-7 items-center justify-center rounded-full border border-dashed border-line-strong text-faint hover:bg-inset"
                  aria-label="Custom color"
                >
                  +
                </button>
              </ColorPicker>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Icon (optional)</Label>
            <div className="flex items-center gap-2.5">
              <EmojiPicker value={icon || null} onChange={(e) => setIcon(e ?? "")} align="start">
                <button className="flex size-9 items-center justify-center rounded-md border border-line hover:bg-inset" aria-label="Choose emoji">
                  {icon ? <span className="text-lg leading-none">{icon}</span> : <Smile className="size-4 text-faint" />}
                </button>
              </EmojiPicker>
              <span className="text-small text-muted">{icon ? "Click to change" : "Click to pick any emoji"}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            {create.isPending ? "Creating…" : "Create list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
