"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Music, Flame, Clock, Star, Trash2, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePractice, useDeleteSession, useRepertoire, useAddRepertoire, useUpdateRepertoire, useDeleteRepertoire,
} from "@/lib/hooks/usePractice";
import { REPERTOIRE_STATUS_META, type RepertoireStatus } from "@/types/practice";
import { LogSessionDialog } from "./LogSessionDialog";
import { HabitHeatmap } from "@/components/modules/habits/HabitHeatmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_ORDER: RepertoireStatus[] = ["learning", "polishing", "performance-ready", "archived"];

function fmtH(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function PracticeModule() {
  const { data } = usePractice();
  const delSession = useDeleteSession();
  const { data: repData } = useRepertoire();
  const addRep = useAddRepertoire();
  const updRep = useUpdateRepertoire();
  const delRep = useDeleteRepertoire();
  const [logOpen, setLogOpen] = useState(false);
  const [newPiece, setNewPiece] = useState("");

  const stats = data?.stats;
  const sessions = data?.sessions ?? [];
  const items = repData?.items ?? [];
  const goalPct = stats ? Math.min(100, Math.round((stats.weekMin / stats.weeklyGoalMin) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display !text-2xl">Practice Log</h2>
          <p className="mt-1 text-body text-muted">Every minute counts. Track it, reflect, improve.</p>
        </div>
        <Button onClick={() => setLogOpen(true)}><Plus /> Log session</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Clock className="size-4" />} label="This week" value={fmtH(stats?.weekMin ?? 0)} />
        <StatCard icon={<Clock className="size-4" />} label="This month" value={fmtH(stats?.monthMin ?? 0)} />
        <StatCard icon={<Flame className="size-4 text-orange-500" />} label="Streak" value={`${stats?.streak ?? 0} d`} />
        <div className="flex items-center gap-3 rounded-lg border border-line bg-panel p-3">
          <div className="relative flex size-12 items-center justify-center">
            <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(goalPct / 100) * 97.4} 97.4`} />
            </svg>
            <span className="absolute font-data text-[0.625rem] font-semibold">{goalPct}%</span>
          </div>
          <div>
            <p className="text-small text-muted">Weekly goal</p>
            <p className="text-small font-medium text-fg">{fmtH(stats?.weeklyGoalMin ?? 300)}</p>
          </div>
        </div>
      </div>

      {/* Heatmap + by-instrument */}
      {(stats?.allMin ?? 0) > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="mb-3 text-small font-medium text-fg">Practice heatmap</p>
            <div className="overflow-x-auto pb-1">
              <HabitHeatmap history={stats?.practicedDays ?? []} color="#A78BFA" />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="mb-3 text-small font-medium text-fg">Time by instrument</p>
            <div className="flex flex-col gap-2">
              {stats?.byInstrument.map((b) => {
                const pct = Math.round((b.minutes / (stats.allMin || 1)) * 100);
                return (
                  <div key={b.instrument}>
                    <div className="mb-1 flex justify-between text-small">
                      <span className="text-fg">{b.instrument}</span>
                      <span className="text-muted">{fmtH(b.minutes)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-inset">
                      <div className="h-full rounded-full bg-accent-gradient" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Repertoire */}
      <section>
        <h3 className="mb-2 text-heading">Repertoire</h3>
        <div className="mb-3 flex gap-2">
          <Input
            value={newPiece}
            onChange={(e) => setNewPiece(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newPiece.trim()) { addRep.mutate({ title: newPiece.trim() }); setNewPiece(""); } }}
            placeholder="Add a piece you're working on…"
            className="max-w-sm"
          />
          <Button variant="secondary" onClick={() => { if (newPiece.trim()) { addRep.mutate({ title: newPiece.trim() }); setNewPiece(""); } }}>
            <Plus /> Add
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-small text-muted">No pieces yet — add what you&apos;re learning above.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-panel">
            {items.map((it, i) => {
              const meta = REPERTOIRE_STATUS_META[it.status];
              return (
                <div key={it.id} className={cn("group flex items-center gap-3 px-4 py-2.5", i > 0 && "border-t border-line")}>
                  <Music2 className="size-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium text-fg">{it.title}</p>
                    {it.composer && <p className="truncate text-small text-muted">{it.composer}</p>}
                  </div>
                  <button
                    onClick={() => {
                      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(it.status) + 1) % STATUS_ORDER.length];
                      updRep.mutate({ id: it.id, patch: { status: next } });
                    }}
                    className="shrink-0 rounded-full px-2 py-0.5 text-micro"
                    style={{ background: `${meta.color}22`, color: meta.color }}
                    title="Click to change status"
                  >
                    {meta.label}
                  </button>
                  <button onClick={() => delRep.mutate(it.id)} className="shrink-0 text-faint opacity-0 hover:text-red-500 group-hover:opacity-100" aria-label="Delete piece">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent sessions */}
      <section>
        <h3 className="mb-2 text-heading">Recent sessions</h3>
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Music />}
            title="No sessions logged yet"
            description="Hit Log session to record your first practice — duration, pieces, and a reflection."
            action={<Button onClick={() => setLogOpen(true)}><Plus /> Log session</Button>}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <div key={s.id} className="group rounded-lg border border-line bg-panel p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-muted text-accent">
                    <Music className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-small font-medium text-fg">{s.instrument}</span>
                      <span className="font-data text-[0.6875rem] text-muted">{fmtH(s.durationMin)}</span>
                      {s.qualityRating ? (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: s.qualityRating }).map((_, i) => <Star key={i} className="size-3 fill-current" />)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-small text-muted">
                      {format(parseISO(s.date), "EEE, MMM d")}
                      {s.pieces.length > 0 && ` · ${s.pieces.map((p) => p.name).join(", ")}`}
                    </p>
                  </div>
                  <button onClick={() => delSession.mutate(s.id)} className="shrink-0 text-faint opacity-0 hover:text-red-500 group-hover:opacity-100" aria-label="Delete session">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {s.reflections && <p className="mt-2 border-t border-line pt-2 text-small text-muted">{s.reflections}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <LogSessionDialog open={logOpen} onOpenChange={setLogOpen} instruments={data?.instruments ?? []} />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="flex items-center gap-1.5 text-muted">{icon}<span className="text-small">{label}</span></div>
      <p className="mt-1 text-heading">{value}</p>
    </div>
  );
}
