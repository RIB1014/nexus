"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKOUT_TYPES, type Exercise } from "@/types/workout";
import { useLogWorkout } from "@/lib/hooks/useWorkouts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LogWorkoutDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const log = useLogWorkout();
  const [type, setType] = useState<string>("Strength");
  const [duration, setDuration] = useState(45);
  const [rpe, setRpe] = useState(0);
  const [notes, setNotes] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [rows, setRows] = useState<Exercise[]>([{ name: "" }]);

  const cardio = type === "Cardio";
  const reset = () => {
    setType("Strength"); setDuration(45); setRpe(0); setNotes(""); setBodyWeight(""); setRows([{ name: "" }]);
  };

  const setRow = (i: number, patch: Partial<Exercise>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const submit = async () => {
    const exercises = rows.filter((r) => r.name.trim());
    await log.mutateAsync({
      type,
      durationMin: duration,
      exercises,
      rpe: rpe || null,
      notes: notes || null,
      bodyWeight: bodyWeight ? Number(bodyWeight) : null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Log workout</DialogTitle></DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent">
                {WORKOUT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{cardio ? "Activities" : "Exercises"}</Label>
            <div className="flex flex-col gap-2">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder={cardio ? "Run, row…" : "Bench press…"} className="flex-1" />
                  {cardio ? (
                    <Input type="number" step="0.1" value={r.distanceKm ?? ""} onChange={(e) => setRow(i, { distanceKm: Number(e.target.value) || undefined })} placeholder="km" className="w-20" />
                  ) : (
                    <>
                      <Input type="number" value={r.sets ?? ""} onChange={(e) => setRow(i, { sets: Number(e.target.value) || undefined })} placeholder="sets" className="w-16" />
                      <Input type="number" value={r.reps ?? ""} onChange={(e) => setRow(i, { reps: Number(e.target.value) || undefined })} placeholder="reps" className="w-16" />
                      <Input type="number" value={r.weight ?? ""} onChange={(e) => setRow(i, { weight: Number(e.target.value) || undefined })} placeholder="lb" className="w-16" />
                    </>
                  )}
                  <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="text-faint hover:text-red-500" aria-label="Remove">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setRows((rs) => [...rs, { name: "" }])}>
              <Plus /> Add {cardio ? "activity" : "exercise"}
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Perceived exertion (RPE)</Label>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setRpe(n === rpe ? 0 : n)} className={cn(
                  "size-7 rounded-md border text-small transition-colors",
                  n <= rpe ? "border-accent bg-accent-muted text-accent" : "border-line text-muted hover:bg-inset",
                )}>{n}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Body weight (optional)</Label>
              <Input type="number" step="0.1" value={bodyWeight} onChange={(e) => setBodyWeight(e.target.value)} placeholder="lb" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-14" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={log.isPending}>{log.isPending ? "Saving…" : "Log workout"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
