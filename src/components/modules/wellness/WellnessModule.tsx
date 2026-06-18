"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWellness, useSaveWellness } from "@/lib/hooks/useWellness";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function moodEmoji(v: number) {
  if (v <= 2) return "😞";
  if (v <= 4) return "😕";
  if (v <= 6) return "😐";
  if (v <= 8) return "🙂";
  return "😄";
}

export function WellnessModule() {
  const { data } = useWellness();
  const save = useSaveWellness();

  const [mood, setMood] = useState(6);
  const [energy, setEnergy] = useState(6);
  const [sleep, setSleep] = useState("7.5");
  const [feeling, setFeeling] = useState("");
  const [journal, setJournal] = useState("");
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = data?.today;
    if (t) {
      if (t.moodScore) setMood(t.moodScore);
      if (t.energyScore) setEnergy(t.energyScore);
      if (t.sleepHours != null) setSleep(String(t.sleepHours));
      setFeeling(t.feelingTag ?? "");
      setJournal(t.journalEntry ?? "");
      setGratitude([t.gratitude[0] ?? "", t.gratitude[1] ?? "", t.gratitude[2] ?? ""]);
    }
  }, [data?.today]);

  const submit = async () => {
    await save.mutateAsync({
      moodScore: mood,
      energyScore: energy,
      sleepHours: Number(sleep) || null,
      feelingTag: feeling || null,
      journalEntry: journal || null,
      gratitude: gratitude.filter((g) => g.trim()),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-display !text-2xl">Mood &amp; Wellness</h2>
        <p className="mt-1 text-body text-muted">A private moment to check in with yourself.</p>
      </div>

      {/* Daily check-in */}
      <div className="rounded-lg border border-line bg-panel p-5">
        <div className="flex items-center gap-2">
          <Heart className="size-4 text-accent" />
          <h3 className="text-heading">Today&apos;s check-in</h3>
        </div>

        <div className="mt-5 flex flex-col gap-5">
          <Slider label="Mood" value={mood} onChange={setMood} emoji={moodEmoji(mood)} />
          <Slider label="Energy" value={energy} onChange={setEnergy} emoji={energy <= 4 ? "🔋" : energy <= 7 ? "⚡" : "🚀"} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Sleep (hours)</Label>
              <Input type="number" step="0.5" min={0} max={24} value={sleep} onChange={(e) => setSleep(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>One-word feeling</Label>
              <Input value={feeling} onChange={(e) => setFeeling(e.target.value)} placeholder="focused, calm…" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Journal (optional)</Label>
            <Textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Anything on your mind…" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5"><Sparkles className="size-3.5 text-accent" /> Three things I&apos;m grateful for</Label>
            {gratitude.map((g, i) => (
              <Input
                key={i}
                value={g}
                onChange={(e) => setGratitude((gs) => gs.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`Gratitude ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save check-in"}</Button>
            {saved && <span className="text-small text-accent">Saved — take a breath.</span>}
          </div>
        </div>
      </div>

      {/* Trend */}
      {data && data.trend.length > 1 && (
        <div className="rounded-lg border border-line bg-panel p-5">
          <h3 className="mb-1 text-heading">Last 30 days</h3>
          <div className="mb-4 flex gap-4 text-small">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" /> Mood</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-400" /> Energy</span>
          </div>
          <TrendChart points={data.trend} />
        </div>
      )}

      {/* Gratitude log */}
      {data && data.gratitude.length > 0 && (
        <div className="rounded-lg border border-line bg-panel p-5">
          <h3 className="mb-3 text-heading">Gratitude log</h3>
          <div className="flex flex-col gap-3">
            {data.gratitude.map((g) => (
              <div key={g.date}>
                <p className="font-data text-[0.6875rem] text-faint">{format(parseISO(g.date), "MMM d")}</p>
                <ul className="mt-0.5 flex flex-col gap-0.5">
                  {g.items.map((item, i) => (
                    <li key={i} className="text-small text-fg">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, onChange, emoji }: { label: string; value: number; onChange: (v: number) => void; emoji: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="flex items-center gap-2 text-small text-muted">
          <span className="text-lg leading-none">{emoji}</span>
          <span className="font-data text-fg">{value}/10</span>
        </span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-inset accent-[var(--color-accent)]"
      />
    </div>
  );
}

function TrendChart({ points }: { points: { date: string; mood: number | null; energy: number | null }[] }) {
  const W = 600, H = 120, pad = 6;
  const n = points.length;
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - 1) / 9) * (H - 2 * pad);
  const line = (key: "mood" | "energy") => {
    const pts = points.map((p, i) => (p[key] != null ? `${x(i)},${y(p[key]!)}` : null)).filter(Boolean);
    return pts.join(" ");
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
      <polyline fill="none" stroke="var(--color-accent)" strokeWidth="2" points={line("mood")} vectorEffect="non-scaling-stroke" />
      <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={line("energy")} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
