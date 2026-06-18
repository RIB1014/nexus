"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface LinkDTO {
  id: string; url: string; title: string | null; description: string | null;
  imageUrl: string | null; collection: string | null; tags: string[]; createdAt: string;
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

export function useLinks() {
  return useQuery({
    queryKey: ["links"],
    queryFn: () => jsonFetch<{ links: LinkDTO[]; collections: string[] }>("/api/links"),
  });
}
export function useAddLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { url: string; collection?: string | null; tags?: string[] }) =>
      jsonFetch("/api/links", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });
}
export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/links/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });
}
