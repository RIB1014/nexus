"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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

const COLORS = ["#6366F1", "#22C55E", "#F97316", "#38BDF8", "#F43F5E", "#A78BFA", "#EAB308", "#EC4899"];
const ICONS = ["", "📚", "🏠", "🎵", "💪", "💼", "🎨", "✅", "🛒", "✈️"];

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
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState("");

  const reset = () => {
    setName("");
    setColor(COLORS[0]);
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
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full transition-transform",
                    color === c && "ring-2 ring-offset-2 ring-offset-surface",
                  )}
                  style={{ background: c, ...(color === c ? { boxShadow: `0 0 0 2px ${c}` } : {}) }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Icon (optional)</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((ic) => (
                <button
                  key={ic || "none"}
                  onClick={() => setIcon(ic)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border text-base",
                    icon === ic ? "border-accent bg-accent-muted" : "border-line hover:bg-inset",
                  )}
                >
                  {ic || "∅"}
                </button>
              ))}
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
