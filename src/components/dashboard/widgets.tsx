"use client";

import Link from "next/link";
import { ListTodo, Calendar, Repeat, Music, ArrowRight } from "lucide-react";
import type { DashboardData } from "@/lib/data/dashboard";
import { getModule } from "@/lib/modules/registry";
import { EmptyState } from "@/components/ui/empty-state";

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-amber-400",
  low: "border-l-sky-400",
  none: "border-l-transparent",
};

export interface WidgetMeta {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  Component: React.FC<{ data: DashboardData }>;
}

function TasksWidget({ data }: { data: DashboardData }) {
  if (data.tasks.items.length === 0) {
    return (
      <EmptyState
        className="border-0 py-6"
        icon={<ListTodo />}
        title="You're all caught up"
        description="Nothing due today. Add a task to plan ahead."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {data.tasks.items.map((t) => (
        <li
          key={t.id}
          className={`flex items-center gap-2 rounded-md border-l-2 bg-inset/60 px-2.5 py-1.5 ${
            PRIORITY_BORDER[t.priority] ?? "border-l-transparent"
          }`}
        >
          <span className="size-3.5 shrink-0 rounded-full border border-line-strong" />
          <span className="min-w-0 flex-1 truncate text-small text-fg">
            {t.title}
          </span>
          {t.dueLabel && (
            <span
              className={`shrink-0 font-data text-[0.6875rem] ${
                t.dueLabel === "Overdue" ? "text-red-500" : "text-faint"
              }`}
            >
              {t.dueLabel}
            </span>
          )}
        </li>
      ))}
      {data.tasks.remaining > data.tasks.items.length && (
        <li className="px-2.5 pt-1 text-small text-muted">
          +{data.tasks.remaining - data.tasks.items.length} more
        </li>
      )}
    </ul>
  );
}

function EventsWidget({ data }: { data: DashboardData }) {
  if (data.events.items.length === 0) {
    return (
      <EmptyState
        className="border-0 py-6"
        icon={<Calendar />}
        title="Nothing scheduled"
        description="Upcoming events will show up here."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {data.events.items.map((e) => {
        const start = new Date(e.start);
        return (
          <li key={e.id} className="flex items-center gap-3">
            <div className="flex w-12 shrink-0 flex-col items-center rounded-md bg-inset py-1">
              <span className="font-data text-[0.625rem] text-faint">
                {start.toLocaleDateString(undefined, { month: "short" })}
              </span>
              <span className="text-small font-semibold text-fg">
                {start.getDate()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-small font-medium text-fg">
                {e.title}
              </p>
              <p className="truncate text-small text-muted">
                {start.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {e.location ? ` · ${e.location}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function HabitsWidget({ data }: { data: DashboardData }) {
  if (data.habits.items.length === 0) {
    return (
      <EmptyState
        className="border-0 py-6"
        icon={<Repeat />}
        title="No habits yet"
        description="Start a habit to build a streak."
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-small text-muted">
        {data.habits.completedToday} of {data.habits.items.length} done today
      </p>
      <div className="flex flex-col gap-1.5">
        {data.habits.items.map((h) => (
          <div key={h.id} className="flex items-center gap-2.5">
            <span
              className={`flex size-5 items-center justify-center rounded-full text-[0.625rem] ${
                h.doneToday
                  ? "bg-accent text-accent-contrast"
                  : "border border-line-strong text-transparent"
              }`}
            >
              ✓
            </span>
            <span className="text-base leading-none">{h.emoji ?? "•"}</span>
            <span
              className={`truncate text-small ${
                h.doneToday ? "text-muted line-through" : "text-fg"
              }`}
            >
              {h.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticeWidget({ data }: { data: DashboardData }) {
  const { streak, weeklyMinutes, weeklyGoalMinutes } = data.practice;
  const pct = Math.min(100, Math.round((weeklyMinutes / weeklyGoalMinutes) * 100));
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex size-20 items-center justify-center">
        <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
          />
        </svg>
        <span className="absolute font-data text-small font-semibold text-fg">
          {pct}%
        </span>
      </div>
      <div>
        <p className="text-display !text-2xl">🔥 {streak}</p>
        <p className="text-small text-muted">day streak</p>
        <p className="mt-1 text-small text-muted">
          {Math.round(weeklyMinutes / 60)}h {weeklyMinutes % 60}m this week
        </p>
      </div>
    </div>
  );
}

function GenericWidget({ moduleId }: { moduleId: string }) {
  const mod = getModule(moduleId);
  return (
    <div className="flex h-full flex-col justify-between gap-3">
      <p className="text-small text-muted">{mod?.description}</p>
      <Link
        href={`/${moduleId}`}
        className="flex items-center gap-1 text-small font-medium text-accent hover:underline"
      >
        Open {mod?.name} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

export const WIDGETS: Record<string, WidgetMeta> = {
  tasks: { title: "Today's tasks", href: "/tasks", icon: ListTodo, Component: TasksWidget },
  calendar: { title: "Upcoming", href: "/calendar", icon: Calendar, Component: EventsWidget },
  habits: { title: "Habits", href: "/habits", icon: Repeat, Component: HabitsWidget },
  "practice-log": { title: "Practice", href: "/practice-log", icon: Music, Component: PracticeWidget },
};

export function widgetFor(moduleId: string): WidgetMeta {
  const existing = WIDGETS[moduleId];
  if (existing) return existing;
  const mod = getModule(moduleId);
  return {
    title: mod?.name ?? moduleId,
    href: `/${moduleId}`,
    icon: mod?.icon ?? ArrowRight,
    Component: () => <GenericWidget moduleId={moduleId} />,
  };
}
