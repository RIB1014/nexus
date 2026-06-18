"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Dumbbell, Trophy, Trash2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkouts, useDeleteWorkout } from "@/lib/hooks/useWorkouts";
import { LogWorkoutDialog } from "./LogWorkoutDialog";
import { HabitHeatmap } from "@/components/modules/habits/HabitHeatmap";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const TYPE_COLOR: Record<string, string> = {
  Strength: "#F43F5E", Cardio: "#38BDF8", "Sport Practice": "#22C55E",
  Recovery: "#A78BFA", Flexibility: "#F59E0B", Other: "#9A9AA4",
};

export function AthleticsModule() {
  const { data } = useWorkouts();
  const del = useDeleteWorkout();
  const [logOpen, setLogOpen] = useState(false);

  const stats = data?.stats;
  const workouts = data?.workouts ?? [];
  const maxType = Math.max(1, ...(stats?.byType.map((t) => t.count) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display !text-2xl">Athletics</h2>
          <p className="mt-1 text-body text-muted">Train, track, and watch the numbers climb.</p>
        </div>
        <Button onClick={() => setLogOpen(true)}><Plus /> Log workout</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Workouts this week" value={`${stats?.weekCount ?? 0}`} />
        <Stat label="Minutes this week" value={`${stats?.weekMinutes ?? 0}`} />
        <Stat label="Volume this week" value={`${(stats?.weekVolume ?? 0).toLocaleString()}`} />
      </div>

      {workouts.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="mb-3 text-small font-medium text-fg">Frequency</p>
            <div className="overflow-x-auto pb-1">
              <HabitHeatmap history={stats?.activeDays ?? []} color="#38BDF8" />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="mb-3 text-small font-medium text-fg">By type</p>
            <div className="flex flex-col gap-2">
              {stats?.byType.map((t) => (
                <div key={t.type}>
                  <div className="mb-1 flex justify-between text-small">
                    <span className="text-fg">{t.type}</span>
                    <span className="text-muted">{t.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-inset">
                    <div className="h-full rounded-full" style={{ width: `${(t.count / maxType) * 100}%`, background: TYPE_COLOR[t.type] ?? "var(--color-accent)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats && stats.prs.length > 0 && (
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <p className="text-small font-medium text-fg">Personal records</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.prs.map((pr) => (
              <span key={pr.name} className="rounded-md border border-line bg-inset px-2.5 py-1 text-small">
                <span className="text-fg">{pr.name}</span>{" "}
                <span className="font-data text-accent">{pr.weight} lb</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <section>
        <h3 className="mb-2 text-heading">Recent workouts</h3>
        {workouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="No workouts logged yet"
            description="Log your first session — strength, cardio, or sport practice."
            action={<Button onClick={() => setLogOpen(true)}><Plus /> Log workout</Button>}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {workouts.map((w) => (
              <div key={w.id} className="group rounded-lg border border-line bg-panel p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md" style={{ background: `${TYPE_COLOR[w.type] ?? "#9A9AA4"}22`, color: TYPE_COLOR[w.type] ?? "#9A9AA4" }}>
                    <Activity className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-small font-medium text-fg">{w.type}</span>
                      <span className="font-data text-[0.6875rem] text-muted">{w.durationMin}m</span>
                      {w.rpe ? <span className="text-[0.6875rem] text-muted">RPE {w.rpe}</span> : null}
                    </div>
                    <p className="truncate text-small text-muted">
                      {format(parseISO(w.startTime), "EEE, MMM d")}
                      {w.exercises.length > 0 && ` · ${w.exercises.map((e) => e.name).join(", ")}`}
                    </p>
                  </div>
                  <button onClick={() => del.mutate(w.id)} className="shrink-0 text-faint opacity-0 hover:text-red-500 group-hover:opacity-100" aria-label="Delete workout">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <LogWorkoutDialog open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-heading">{value}</p>
    </div>
  );
}
