"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PracticeSummary, RepertoireItemDTO } from "@/types/practice";

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

export function usePractice() {
  return useQuery({
    queryKey: ["practice"],
    queryFn: () => jsonFetch<PracticeSummary>("/api/practice"),
  });
}

export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      jsonFetch("/api/practice", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/practice/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice"] }),
  });
}

export function useRepertoire() {
  return useQuery({
    queryKey: ["repertoire"],
    queryFn: () => jsonFetch<{ items: RepertoireItemDTO[] }>("/api/repertoire"),
  });
}

export function useAddRepertoire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      jsonFetch("/api/repertoire", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repertoire"] }),
  });
}

export function useUpdateRepertoire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: unknown }) =>
      jsonFetch(`/api/repertoire/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repertoire"] }),
  });
}

export function useDeleteRepertoire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/repertoire/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repertoire"] }),
  });
}
