"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NoteDTO, NoteTreeItem } from "@/types/note";

const TREE_KEY = ["notes-tree"];

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

export function useNotesTree() {
  return useQuery({
    queryKey: TREE_KEY,
    queryFn: () => jsonFetch<{ notes: NoteTreeItem[] }>("/api/notes"),
  });
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: ["note", id],
    enabled: Boolean(id),
    queryFn: () => jsonFetch<{ note: NoteDTO }>(`/api/notes/${id}`),
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title?: string; parentId?: string | null; emoji?: string | null }) =>
      jsonFetch<{ note: NoteTreeItem }>("/api/notes", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TREE_KEY }),
  });
}

export interface NotePatch {
  title?: string;
  emoji?: string | null;
  content?: unknown;
  parentId?: string | null;
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: NotePatch }) =>
      jsonFetch(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: TREE_KEY });
      qc.invalidateQueries({ queryKey: ["note", id] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TREE_KEY }),
  });
}
