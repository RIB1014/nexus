"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Wallet, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance, useAddTransaction, useDeleteTransaction, useSetBudget } from "@/lib/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

const CATEGORIES = ["Food", "Groceries", "Transport", "Rent", "Subscriptions", "Entertainment", "Education", "Health", "Shopping", "Income", "Other"];
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinanceModule() {
  const { data } = useFinance();
  const add = useAddTransaction();
  const del = useDeleteTransaction();
  const setBudget = useSetBudget();

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("Food");
  const [merchant, setMerchant] = useState("");

  const [budgetCat, setBudgetCat] = useState("Food");
  const [budgetLimit, setBudgetLimit] = useState("");

  const s = data?.summary;
  const expenses = data?.expenses ?? [];
  const budgets = data?.budgets ?? [];

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    await add.mutateAsync({ amount: amt, type, category: type === "income" ? "Income" : category, merchant: merchant || null });
    setAmount(""); setMerchant("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-display !text-2xl">Finance</h2>
        <p className="mt-1 text-body text-muted">Manual, private money tracking — no bank connection.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-line bg-panel p-3">
          <div className="flex items-center gap-1.5 text-muted"><TrendingUp className="size-4 text-green-500" /><span className="text-small">Income</span></div>
          <p className="mt-1 text-heading">{money(s?.income ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-3">
          <div className="flex items-center gap-1.5 text-muted"><TrendingDown className="size-4 text-red-500" /><span className="text-small">Spent</span></div>
          <p className="mt-1 text-heading">{money(s?.spent ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-3">
          <span className="text-small text-muted">Net this month</span>
          <p className={cn("mt-1 text-heading", (s?.net ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{money(s?.net ?? 0)}</p>
        </div>
      </div>

      {/* Quick add */}
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex rounded-md border border-line bg-canvas p-0.5">
            {(["expense", "income"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className={cn("rounded-sm px-3 py-1.5 text-small font-medium capitalize", type === t ? "bg-accent-muted text-accent" : "text-muted")}>{t}</button>
            ))}
          </div>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Amount" className="w-28" />
          {type === "expense" && (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none focus-visible:border-accent">
              {CATEGORIES.filter((c) => c !== "Income").map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Merchant / note" className="min-w-32 flex-1" />
          <Button onClick={submit} disabled={add.isPending}><Plus /> Add</Button>
        </div>
      </div>

      {/* Budgets */}
      <section>
        <h3 className="mb-2 text-heading">Budgets</h3>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <select value={budgetCat} onChange={(e) => setBudgetCat(e.target.value)} className="h-9 rounded-md border border-line bg-canvas px-2 text-small text-fg outline-none">
            {CATEGORIES.filter((c) => c !== "Income").map((c) => <option key={c}>{c}</option>)}
          </select>
          <Input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} placeholder="Monthly limit" className="w-36" />
          <Button variant="secondary" onClick={() => { const l = Number(budgetLimit); if (l > 0) { setBudget.mutate({ category: budgetCat, limit: l }); setBudgetLimit(""); } }}>Set budget</Button>
        </div>
        {budgets.length === 0 ? (
          <p className="text-small text-muted">No budgets yet — set a monthly limit for a category above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {budgets.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
              const over = b.spent > b.limit;
              return (
                <div key={b.id} className="rounded-lg border border-line bg-panel p-3">
                  <div className="mb-1.5 flex justify-between text-small">
                    <span className="font-medium text-fg">{b.category}</span>
                    <span className={cn(over ? "text-red-500" : "text-muted")}>{money(b.spent)} / {money(b.limit)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-inset">
                    <div className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-accent-gradient")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transactions */}
      <section>
        <h3 className="mb-2 text-heading">Recent transactions</h3>
        {expenses.length === 0 ? (
          <EmptyState icon={<Wallet />} title="No transactions yet" description="Log your first expense or income above to start tracking." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-panel">
            {expenses.slice(0, 30).map((e, i) => (
              <div key={e.id} className={cn("group flex items-center gap-3 px-4 py-2.5", i > 0 && "border-t border-line")}>
                <span className={cn("rounded-full px-2 py-0.5 text-micro", e.type === "income" ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-inset text-muted")}>{e.category}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small text-fg">{e.merchant || e.note || e.category}</p>
                  <p className="font-data text-[0.6875rem] text-faint">{format(parseISO(e.date), "MMM d")}</p>
                </div>
                <span className={cn("font-data text-small", e.type === "income" ? "text-green-600 dark:text-green-400" : "text-fg")}>
                  {e.type === "income" ? "+" : "−"}{money(e.amount)}
                </span>
                <button onClick={() => del.mutate(e.id)} className="text-faint opacity-0 hover:text-red-500 group-hover:opacity-100" aria-label="Delete"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
