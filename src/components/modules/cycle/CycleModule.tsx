"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, format, parseISO, differenceInCalendarDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Droplet, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCycle, useSaveCycleEntry, type CycleEntryDTO } from "@/lib/hooks/useCycle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const FLOWS = ["spotting", "light", "medium", "heavy"] as const;
const SYMPTOMS = ["cramps", "bloating", "headache", "fatigue", "tender breasts", "acne", "backache", "nausea", "cravings", "mood swings"];

const PHASE_INFO: Record<string, string> = {
  Menstrual: "Your period. Energy may run lower — rest is reasonable.",
  Follicular: "Estrogen is rising; energy and mood often climb.",
  Ovulation: "Peak fertility window; energy is often at its highest.",
  Luteal: "The premenstrual phase; some notice mood or energy dips.",
};

export function CycleModule() {
  const { data } = useCycle();
  const save = useSaveCycleEntry();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [showInfo, setShowInfo] = useState(true);

  const entries = useMemo(() => {
    const m = new Map<string, CycleEntryDTO>();
    (data?.entries ?? []).forEach((e) => m.set(e.date, e));
    return m;
  }, [data]);

  const insights = data?.insights;
  const selEntry = entries.get(selected);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  // Current phase, estimated from last period start + average length.
  const phase = useMemo(() => {
    if (!insights?.lastPeriodStart) return null;
    const start = parseISO(insights.lastPeriodStart);
    const day = (differenceInCalendarDays(new Date(), start) % insights.avgCycleLength) + 1;
    const ovul = insights.avgCycleLength - 14;
    if (day <= 5) return "Menstrual";
    if (Math.abs(day - ovul) <= 1) return "Ovulation";
    if (day < ovul) return "Follicular";
    return "Luteal";
  }, [insights]);

  const update = (patch: Partial<CycleEntryDTO>) =>
    save.mutate({ ...(selEntry ?? {}), ...patch, date: selected });

  const predictedStart = insights?.nextPredictedStart ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-display !text-2xl">Cycle Tracker</h2>
        <p className="mt-1 text-body text-muted">Private, clinical tracking. Your data stays yours.</p>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-3 gap-3">
        <Insight label="Avg cycle" value={insights ? `${insights.avgCycleLength} days` : "—"} />
        <Insight label="Last period" value={insights?.lastPeriodStart ? format(parseISO(insights.lastPeriodStart), "MMM d") : "—"} />
        <Insight label="Predicted next" value={predictedStart ? format(parseISO(predictedStart), "MMM d") : "—"} />
      </div>

      {phase && showInfo && (
        <div className="flex items-start gap-3 rounded-lg border border-line bg-accent-muted/40 p-3">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="flex-1">
            <p className="text-small font-medium text-fg">Likely phase: {phase}</p>
            <p className="text-small text-muted">{PHASE_INFO[phase]} This is an estimate, not medical advice.</p>
          </div>
          <button onClick={() => setShowInfo(false)} className="text-faint hover:text-fg" aria-label="Dismiss"><X className="size-4" /></button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-heading">{format(cursor, "MMMM yyyy")}</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setCursor((c) => addMonths(c, -1))} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset"><ChevronLeft className="size-4" /></button>
              <button onClick={() => setCursor((c) => addMonths(c, 1))} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-inset"><ChevronRight className="size-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((d, i) => <div key={i} className="px-2 py-1.5 text-center text-micro text-faint">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const e = entries.get(key);
              const inMonth = isSameMonth(day, cursor);
              const isSel = key === selected;
              const isPredicted = predictedStart === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "relative flex aspect-square items-center justify-center border-b border-r border-line text-small transition-colors [&:nth-child(7n)]:border-r-0",
                    !inMonth && "text-faint",
                    isSel && "ring-2 ring-inset ring-accent",
                  )}
                >
                  <span className={cn(
                    "flex size-7 items-center justify-center rounded-full",
                    e?.periodDay && "bg-red-500 text-white",
                    isPredicted && !e?.periodDay && "border border-dashed border-red-400 text-red-500",
                  )}>
                    {format(day, "d")}
                  </span>
                  {e && !e.periodDay && (e.symptoms.length > 0 || e.notes) && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 px-4 py-2 text-small text-muted">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-red-500" /> Period</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-full border border-dashed border-red-400" /> Predicted</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-accent" /> Logged symptoms</span>
          </div>
        </div>

        {/* Day editor */}
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-small font-medium text-fg">{format(parseISO(selected), "EEEE, MMMM d")}</p>

          <button
            onClick={() => update({ periodDay: !selEntry?.periodDay })}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-2 rounded-md border py-2 text-small font-medium transition-colors",
              selEntry?.periodDay ? "border-red-500 bg-red-500/10 text-red-500" : "border-line text-muted hover:bg-inset",
            )}
          >
            <Droplet className={cn("size-4", selEntry?.periodDay && "fill-current")} />
            {selEntry?.periodDay ? "Period day" : "Mark period day"}
          </button>

          {selEntry?.periodDay && (
            <div className="mt-3">
              <p className="mb-1.5 text-micro text-faint">Flow</p>
              <div className="flex gap-1.5">
                {FLOWS.map((f) => (
                  <button key={f} onClick={() => update({ flowIntensity: selEntry?.flowIntensity === f ? null : f })}
                    className={cn("flex-1 rounded-md border px-1 py-1 text-[0.6875rem] capitalize transition-colors",
                      selEntry?.flowIntensity === f ? "border-red-500 bg-red-500/10 text-red-500" : "border-line text-muted hover:bg-inset")}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <p className="mb-1.5 text-micro text-faint">Symptoms</p>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS.map((sym) => {
                const on = selEntry?.symptoms.includes(sym);
                return (
                  <button key={sym} onClick={() => {
                    const cur = selEntry?.symptoms ?? [];
                    update({ symptoms: on ? cur.filter((x) => x !== sym) : [...cur, sym] });
                  }}
                    className={cn("rounded-full border px-2 py-0.5 text-[0.6875rem] transition-colors",
                      on ? "border-accent bg-accent-muted text-accent" : "border-line text-muted hover:bg-inset")}>
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-micro text-faint">Notes</p>
            <Textarea
              defaultValue={selEntry?.notes ?? ""}
              key={selected}
              onBlur={(e) => { if (e.target.value !== (selEntry?.notes ?? "")) update({ notes: e.target.value || null }); }}
              placeholder="Anything you want to remember…"
              className="min-h-16"
            />
          </div>
        </div>
      </div>

      <p className="text-small text-faint">
        Cycle data is marked sensitive and is never used in analytics or other modules.
      </p>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-heading">{value}</p>
    </div>
  );
}
