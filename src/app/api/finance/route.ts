import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const monthStart = startOfMonth(new Date());
  const [expenses, budgets] = await Promise.all([
    prisma.expense.findMany({ where: { userId: auth.userId }, orderBy: { date: "desc" }, take: 100 }),
    prisma.budget.findMany({ where: { userId: auth.userId } }),
  ]);

  let income = 0, spent = 0;
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    if (e.date < monthStart) continue;
    if (e.type === "income") income += e.amount;
    else {
      spent += e.amount;
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    }
  }

  return json({
    expenses: expenses.map((e) => ({
      id: e.id, amount: e.amount, type: e.type, category: e.category,
      merchant: e.merchant, date: e.date.toISOString(), note: e.note, recurring: e.recurring,
    })),
    budgets: budgets.map((b) => ({
      id: b.id, category: b.category, limit: b.limit, spent: byCategory.get(b.category) ?? 0,
    })),
    summary: {
      income: Math.round(income * 100) / 100,
      spent: Math.round(spent * 100) / 100,
      net: Math.round((income - spent) * 100) / 100,
      topCategories: [...byCategory.entries()]
        .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
        .sort((a, b) => b.amount - a.amount).slice(0, 6),
    },
  });
}

const createSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["expense", "income"]).optional(),
  category: z.string().min(1).max(40),
  merchant: z.string().max(120).nullable().optional(),
  date: z.string().datetime().optional(),
  note: z.string().max(500).nullable().optional(),
  recurring: z.boolean().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Couldn't log that transaction.");

  const e = await prisma.expense.create({
    data: {
      userId: auth.userId,
      amount: parsed.data.amount,
      type: parsed.data.type ?? "expense",
      category: parsed.data.category,
      merchant: parsed.data.merchant ?? null,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      note: parsed.data.note ?? null,
      recurring: parsed.data.recurring ?? false,
    },
  });
  return json({ expense: e }, { status: 201 });
}
