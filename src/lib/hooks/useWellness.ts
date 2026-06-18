"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface WellnessToday {
  moodScore: number | null;
  energyScore: number | null;
  sleepHours: number | null;
  feelingTag: string | null;
  journalEntry: string | null;
  gratitude: string[];
}
export interface WellnessSummary {
  today: WellnessToday | null;
  trend: { date: string; mood: number | null; energy: number | null; sleep: number | null }[];
  gratitude: { date: string; items: string[] }[];
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error("Request failed.");
  return res.json();
}

export function useWellness() {
  return useQuery({
    queryKey: ["wellness"],
    queryFn: () => jsonFetch<WellnessSummary>("/api/wellness"),
  });
}

export function useSaveWellness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<WellnessToday>) =>
      jsonFetch("/api/wellness", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness"] }),
  });
}
