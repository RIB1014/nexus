"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRACTICE_TAGS } from "@/types/practice";
import { useLogSession } from "@/lib/hooks/usePractice";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LogSessionDialog({
  open, onOpenChange, instruments,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instruments: string[];
}) {
  const log = useLogSession();
  const [instrument, setInstrument] = useState(instruments[0] ?? "");
  const [duration, setDuration] = useState(30);
  const [pieces, setPieces] = useState<string[]>([]);
  const [pieceDraft, setPieceDraft] = useState("");
  const [quality, setQuality] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [bpm, setBpm] = useState("");
  const [goals, setGoals] = useState("");
  const [reflections, setReflections] = useState("");

  // Simple timer.
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timer.current) {
      clearInterval(timer.current);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running]);

  useEffect(() => {
    if (seconds > 0) setDuration(Math.max(1, Math.round(seconds / 60)));
  }, [seconds]);

  const reset = () => {
    setInstrument(instruments[0] ?? "");
    setDuration(30); setPieces([]); setPieceDraft(""); setQuality(0);
    setTags([]); setBpm(""); setGoals(""); setReflections("");
    setSeconds(0); setRunning(false);
  };

  const addPiece = () => {
    if (pieceDraft.trim()) { setPieces((p) => [...p, pieceDraft.trim()]); setPieceDraft(""); }
  };

  const submit = async () => {
    if (!instrument.trim() || duration < 1) return;
    await log.mutateAsync({
      instrument: instrument.trim(),
      durationMin: duration,
      pieces: pieces.map((name) => ({ name })),
      qualityRating: quality || null,
      tags,
      bpmRange: bpm || null,
      goals: goals || null,
      reflections: reflections || null,
    });
    reset();
    onOpenChange(false);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Log practice session</DialogTitle></DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Instrument</Label>
              <Input
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                list="instrument-list"
                placeholder="Piano"
              />
              <datalist id="instrument-list">
                {instruments.map((i) => <option key={i} value={i} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3 rounded-md border border-line bg-inset/50 px-3 py-2">
            <span className="font-data text-lg text-fg tabular-nums">{mmss}</span>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" variant={running ? "secondary" : "default"} onClick={() => setRunning((r) => !r)}>
                {running ? <Pause /> : <Play />} {running ? "Pause" : "Start"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setSeconds(0); setRunning(false); }} aria-label="Reset timer">
                <RotateCcw />
              </Button>
            </div>
          </div>

          {/* Pieces */}
          <div className="flex flex-col gap-1.5">
            <Label>Pieces / repertoire</Label>
            <div className="flex flex-wrap gap-1.5">
              {pieces.map((p, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-small text-accent">
                  {p}
                  <button onClick={() => setPieces((ps) => ps.filter((_, j) => j !== i))}><X className="size-3" /></button>
                </span>
              ))}
            </div>
            <Input
              value={pieceDraft}
              onChange={(e) => setPieceDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPiece(); } }}
              placeholder="Add a piece and press Enter"
            />
          </div>

          {/* Quality */}
          <div className="flex flex-col gap-1.5">
            <Label>Session quality</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setQuality(n === quality ? 0 : n)} aria-label={`${n} stars`}>
                  <Star className={cn("size-6", n <= quality ? "fill-amber-400 text-amber-400" : "text-line-strong")} />
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRACTICE_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTags((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t])}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-small transition-colors",
                    tags.includes(t) ? "border-accent bg-accent-muted text-accent" : "border-line text-muted hover:bg-inset",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Metronome BPM range</Label>
            <Input value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="e.g. 60–96" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Goals for this session</Label>
            <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} className="min-h-14" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reflections — what improved? what needs work?</Label>
            <Textarea value={reflections} onChange={(e) => setReflections(e.target.value)} className="min-h-14" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!instrument.trim() || log.isPending}>
            {log.isPending ? "Saving…" : "Log session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
