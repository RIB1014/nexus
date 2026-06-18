"use client";

import { useState } from "react";
import { Plus, Repeat, Flame, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHabits, useToggleHabit, useDeleteHabit } from "@/lib/hooks/useHabits";
import { HabitHeatmap } from "./HabitHeatmap";
import { NewHabitDialog } from "./NewHabitDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function HabitsModule() {
  const { data, isLoading } = useHabits();
  const toggle = useToggleHabit();
  const del = useDeleteHabit();
  const [newOpen, setNewOpen] = useState(false);

  const habits = data?.habits ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display !text-2xl">Habits</h2>
          <p className="mt-1 text-body text-muted">
            Small things, done daily. Tap to check in.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus /> New habit
        </Button>
      </div>

      {/* Weekly summary */}
      {habits.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-line bg-panel p-4">
          <div className="relative flex size-14 items-center justify-center">
            <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${((data?.weekRate ?? 0) / 100) * 97.4} 97.4`}
              />
            </svg>
            <span className="absolute font-data text-small font-semibold">{data?.weekRate ?? 0}%</span>
          </div>
          <div>
            <p className="text-small font-medium text-fg">This week</p>
            <p className="text-small text-muted">
              {habits.filter((h) => h.doneToday).length} of {habits.length} done today
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <EmptyState
          icon={<Repeat />}
          title="No habits yet"
          description="Start small — one habit you can do today. Streaks build from there."
          action={<Button onClick={() => setNewOpen(true)}><Plus /> Add your first habit</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((h) => (
            <div key={h.id} className="group rounded-lg border border-line bg-panel p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggle.mutate({ id: h.id, completed: !h.doneToday })}
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-xl transition-colors",
                    h.doneToday ? "border-transparent" : "border-line-strong",
                  )}
                  style={h.doneToday ? { background: h.color ?? "var(--color-accent)" } : undefined}
                  aria-label={h.doneToday ? "Mark not done today" : "Mark done today"}
                >
                  {h.doneToday ? <Check className="size-5 text-white" /> : <span>{h.emoji ?? "•"}</span>}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-fg">{h.name}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-small text-muted">
                    <span className="flex items-center gap-1">
                      <Flame className="size-3.5 text-orange-500" />
                      {h.streak} day{h.streak === 1 ? "" : "s"}
                    </span>
                    {h.targetStreak > 0 && <span>goal {h.targetStreak}</span>}
                  </div>
                </div>

                <button
                  onClick={() => del.mutate(h.id)}
                  className="rounded-md p-1.5 text-faint opacity-0 transition-opacity hover:bg-inset hover:text-red-500 group-hover:opacity-100"
                  aria-label="Delete habit"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-3 overflow-x-auto pb-1">
                <HabitHeatmap
                  history={h.history}
                  color={h.color ?? "#6366F1"}
                  onToggleDay={(date, next) => toggle.mutate({ id: h.id, date, completed: next })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <NewHabitDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
