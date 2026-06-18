"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkoutSummary } from "@/types/workout";

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

export function useWorkouts() {
  return useQuery({
    queryKey: ["workouts"],
    queryFn: () => jsonFetch<WorkoutSummary>("/api/workouts"),
  });
}

export function useLogWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      jsonFetch("/api/workouts", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/workouts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}
