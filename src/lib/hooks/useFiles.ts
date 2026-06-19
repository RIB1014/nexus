"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface FileDTO {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  noteId: string | null;
  collection: string | null;
  createdAt: string;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Request failed.");
  }
  return res.json();
}

export function useFiles(noteId?: string) {
  return useQuery({
    queryKey: ["files", noteId ?? "all"],
    queryFn: () =>
      jsonFetch<{ files: FileDTO[]; collections: string[] }>(
        `/api/files${noteId ? `?noteId=${noteId}` : ""}`,
      ),
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; noteId?: string; collection?: string }) => {
      const fd = new FormData();
      fd.append("file", input.file);
      if (input.noteId) fd.append("noteId", input.noteId);
      if (input.collection) fd.append("collection", input.collection);
      return jsonFetch<{ file: FileDTO }>("/api/files", { method: "POST", body: fd });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/files/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
