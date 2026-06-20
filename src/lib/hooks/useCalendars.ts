"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EventCalendarDTO {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  order: number;
}

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

export function useCalendars() {
  return useQuery({
    queryKey: ["calendars"],
    queryFn: () => jsonFetch<{ calendars: EventCalendarDTO[] }>("/api/calendars"),
  });
}

export function useCreateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      jsonFetch("/api/calendars", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendars"] }),
  });
}

export function useUpdateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EventCalendarDTO> }) =>
      jsonFetch(`/api/calendars/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    // Optimistic for snappy visibility toggles.
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["calendars"] });
      const prev = qc.getQueryData<{ calendars: EventCalendarDTO[] }>(["calendars"]);
      if (prev) {
        qc.setQueryData(["calendars"], {
          calendars: prev.calendars.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["calendars"], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["calendars"] }); qc.invalidateQueries({ queryKey: ["calendar"] }); },
  });
}

export function useDeleteCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/calendars/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendars"] }); qc.invalidateQueries({ queryKey: ["calendar"] }); },
  });
}
