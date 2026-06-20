"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CalendarEventDTO } from "@/types/calendar";

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

export function useCalendarEvents(rangeStart: string, rangeEnd: string, includeTasks = true) {
  return useQuery({
    queryKey: ["calendar", rangeStart, rangeEnd, includeTasks],
    queryFn: () =>
      jsonFetch<{ events: CalendarEventDTO[] }>(
        `/api/calendar?start=${rangeStart}&end=${rangeEnd}&tasks=${includeTasks}`,
      ),
  });
}

export interface EventInput {
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  location?: string | null;
  notes?: string | null;
  color?: string | null;
  calendarId?: string | null;
  recurrence?: string | null;
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput) =>
      jsonFetch("/api/calendar", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EventInput> }) =>
      jsonFetch(`/api/calendar/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/calendar/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}
