"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CycleEntryDTO {
  date: string;
  periodDay: boolean;
  flowIntensity: string | null;
  symptoms: string[];
  mood: number | null;
  energy: number | null;
  notes: string | null;
}
export interface CycleSummary {
  entries: CycleEntryDTO[];
  insights: {
    avgCycleLength: number;
    lastPeriodStart: string | null;
    nextPredictedStart: string | null;
  };
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error("Request failed.");
  return res.json();
}

export function useCycle() {
  return useQuery({ queryKey: ["cycle"], queryFn: () => jsonFetch<CycleSummary>("/api/cycle") });
}
export function useSaveCycleEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CycleEntryDTO> & { date: string }) =>
      jsonFetch("/api/cycle", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cycle"] }),
  });
}
