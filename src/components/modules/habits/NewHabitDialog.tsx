"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCreateHabit } from "@/lib/hooks/useHabits";
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

const EMOJIS = ["✅", "🎹", "📖", "🏃", "💧", "🧘", "🛏️", "🥗", "✍️", "🧹", "☀️", "💪"];
const COLORS = ["#6366F1", "#22C55E", "#F97316", "#38BDF8", "#F43F5E", "#A78BFA"];
const FREQS = [
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Weekdays" },
  { id: "custom", label: "Custom" },
] as const;

export function NewHabitDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateHabit();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [color, setColor] = useState(COLORS[0]);
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "custom">("daily");
  const [target, setTarget] = useState(30);

  const reset = () => {
    setName("");
    setEmoji("✅");
    setColor(COLORS[0]);
    setFrequency("daily");
    setTarget(30);
  };

  const submit = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), emoji, color, frequency, targetStreak: target });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Read 20 pages"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border text-base",
                    emoji === e ? "border-accent bg-accent-muted" : "border-line hover:bg-inset",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("size-7 rounded-full", color === c && "ring-2 ring-offset-2 ring-offset-surface")}
                  style={{ background: c, ...(color === c ? { boxShadow: `0 0 0 2px ${c}` } : {}) }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Frequency</Label>
            <div className="flex gap-1.5">
              {FREQS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrequency(f.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-small font-medium transition-colors",
                    frequency === f.id ? "border-accent bg-accent-muted text-accent" : "border-line text-muted hover:bg-inset",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="habit-target">Target streak (days)</Label>
            <Input
              id="habit-target"
              type="number"
              min={0}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            {create.isPending ? "Creating…" : "Create habit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
