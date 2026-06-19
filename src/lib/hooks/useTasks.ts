"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { TaskDTO, TaskListDTO, TaskTagDTO } from "@/types/task";

export interface TaskFilter {
  view?: string;
  listId?: string;
  search?: string;
  sort?: "due" | "priority" | "created" | "manual";
}

const keys = {
  tasks: (f: TaskFilter): QueryKey => ["tasks", f],
  lists: ["task-lists"] as QueryKey,
  tags: ["task-tags"] as QueryKey,
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed.");
  }
  return res.json();
}

function filterToQuery(f: TaskFilter): string {
  const p = new URLSearchParams();
  if (f.view) p.set("view", f.view);
  if (f.listId) p.set("listId", f.listId);
  if (f.search) p.set("q", f.search);
  if (f.sort) p.set("sort", f.sort);
  return p.toString();
}

// --- Queries ---------------------------------------------------------------

export function useTasks(filter: TaskFilter) {
  return useQuery({
    queryKey: keys.tasks(filter),
    queryFn: () =>
      jsonFetch<{ tasks: TaskDTO[]; total: number }>(
        `/api/tasks?${filterToQuery(filter)}`,
      ),
  });
}

export function useTaskLists() {
  return useQuery({
    queryKey: keys.lists,
    queryFn: () => jsonFetch<{ lists: TaskListDTO[] }>("/api/task-lists"),
  });
}

export function useTaskTags() {
  return useQuery({
    queryKey: keys.tags,
    queryFn: () => jsonFetch<{ tags: TaskTagDTO[] }>("/api/task-tags"),
  });
}

// --- Mutations -------------------------------------------------------------

function useInvalidateTasks() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: keys.lists });
    qc.invalidateQueries({ queryKey: keys.tags });
  };
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  listId?: string | null;
  parentId?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: string;
  flagged?: boolean;
  estimatedMin?: number | null;
  recurrence?: string | null;
  tags?: string[];
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      jsonFetch<{ task: TaskDTO }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export type UpdateTaskInput = Partial<{
  title: string;
  notes: string | null;
  listId: string | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: string;
  completed: boolean;
  flagged: boolean;
  status: "todo" | "in_progress" | "done";
  estimatedMin: number | null;
  order: number;
  recurrence: string | null;
  tags: string[];
}>;

/**
 * Update with optimistic cache patching across every loaded task list so the
 * UI never waits for the round trip (complete, flag, priority, move, …).
 */
export function useUpdateTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTaskInput }) =>
      jsonFetch<{ task: TaskDTO }>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshots = qc.getQueriesData<{ tasks: TaskDTO[] }>({
        queryKey: ["tasks"],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        qc.setQueryData(key, {
          ...data,
          tasks: data.tasks.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        });
      }
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: invalidate,
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) =>
      jsonFetch<{ ok: true }>(`/api/tasks/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshots = qc.getQueriesData<{ tasks: TaskDTO[] }>({
        queryKey: ["tasks"],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        qc.setQueryData(key, {
          ...data,
          tasks: data.tasks.filter((t) => t.id !== id),
        });
      }
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: invalidate,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string; icon?: string | null }) =>
      jsonFetch<{ list: TaskListDTO }>("/api/task-lists", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.lists }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jsonFetch<{ ok: true }>(`/api/task-lists/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.lists });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
