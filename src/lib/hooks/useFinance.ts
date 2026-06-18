"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ExpenseDTO {
  id: string; amount: number; type: string; category: string;
  merchant: string | null; date: string; note: string | null; recurring: boolean;
}
export interface BudgetDTO { id: string; category: string; limit: number; spent: number }
export interface FinanceSummary {
  expenses: ExpenseDTO[];
  budgets: BudgetDTO[];
  summary: {
    income: number; spent: number; net: number;
    topCategories: { category: string; amount: number }[];
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

export function useFinance() {
  return useQuery({ queryKey: ["finance"], queryFn: () => jsonFetch<FinanceSummary>("/api/finance") });
}
export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => jsonFetch("/api/finance", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance"] }),
  });
}
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/finance/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance"] }),
  });
}
export function useSetBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { category: string; limit: number }) =>
      jsonFetch("/api/budgets", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance"] }),
  });
}
