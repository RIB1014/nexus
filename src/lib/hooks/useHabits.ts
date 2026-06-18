"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HabitsSummary } from "@/types/habit";

const KEY = ["habits"];

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Request failed.");
  }
  return res.json();
}

export function useHabits() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => jsonFetch<HabitsSummary>("/api/habits"),
  });
}

export interface CreateHabitInput {
  name: string;
  emoji?: string | null;
  color?: string | null;
  frequency?: "daily" | "weekdays" | "custom";
  targetStreak?: number;
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHabitInput) =>
      jsonFetch("/api/habits", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/habits/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Toggle a habit's completion for a day with optimistic update. */
export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      date,
      completed,
    }: {
      id: string;
      date?: string;
      completed: boolean;
    }) =>
      jsonFetch(`/api/habits/${id}/logs`, {
        method: "POST",
        body: JSON.stringify({ date, completed }),
      }),
    onMutate: async ({ id, date, completed }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<HabitsSummary>(KEY);
      if (prev) {
        const key = date ?? new Date().toISOString().slice(0, 10);
        const isToday = key === new Date().toISOString().slice(0, 10);
        qc.setQueryData<HabitsSummary>(KEY, {
          ...prev,
          habits: prev.habits.map((h) => {
            if (h.id !== id) return h;
            const history = completed
              ? [...new Set([...h.history, key])]
              : h.history.filter((d) => d !== key);
            return {
              ...h,
              history,
              doneToday: isToday ? completed : h.doneToday,
              streak: isToday
                ? Math.max(0, h.streak + (completed ? 1 : -1))
                : h.streak,
            };
          }),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
