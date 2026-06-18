"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  IDENTITY_TAGS,
  MODULES,
  recommendedModuleIds,
} from "@/lib/modules/registry";
import { INTEGRATIONS } from "@/lib/integrations/registry";
import {
  MODULE_CATEGORY_LABELS,
  type ModuleCategory,
} from "@/types/module";

const CATEGORY_ORDER: ModuleCategory[] = [
  "productivity",
  "academic",
  "creative",
  "athletics",
  "wellness",
];

const STEPS = ["Who are you?", "Enable modules", "Connect platforms"];

export function OnboardingWizard({ name }: { name: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState<Set<string>>(new Set(["student"]));
  const [modules, setModules] = useState<Set<string>>(
    new Set(recommendedModuleIds(["student"])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleIdentity(id: string) {
    setIdentity((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Re-seed recommended modules from the new identity selection.
      setModules(new Set(recommendedModuleIds([...next])));
      return next;
    });
  }

  function toggleModule(id: string) {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityTags: [...identity],
        moduleIds: [...modules],
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const canContinue =
    step === 0 ? identity.size > 0 : step === 1 ? modules.size > 0 : true;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Header / progress */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-accent-gradient text-accent-contrast">
            <Sparkles className="size-4" />
          </div>
          <span className="text-heading">Nexus</span>
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-8 bg-accent" : "w-4 bg-line-strong",
                i < step && "bg-accent",
              )}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex-1"
          >
            {step === 0 && (
              <Step
                title={`Welcome${name ? `, ${name.split(" ")[0]}` : ""} 👋`}
                subtitle="Tell us a bit about you so we can suggest the right modules. Pick all that fit."
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {IDENTITY_TAGS.map((tag) => {
                    const active = identity.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleIdentity(tag.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                          active
                            ? "border-accent bg-accent-muted"
                            : "border-line hover:bg-inset",
                        )}
                      >
                        <span className="text-2xl">{tag.emoji}</span>
                        <span
                          className={cn(
                            "text-small font-medium",
                            active ? "text-accent" : "text-fg",
                          )}
                        >
                          {tag.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Step>
            )}

            {step === 1 && (
              <Step
                title="Build your toolkit"
                subtitle="We've pre-selected modules based on you. Toggle anything — you can always change this later."
              >
                <div className="flex flex-col gap-6">
                  {CATEGORY_ORDER.map((category) => {
                    const mods = MODULES.filter((m) => m.category === category);
                    if (!mods.length) return null;
                    return (
                      <div key={category}>
                        <p className="mb-2 text-micro text-faint">
                          {MODULE_CATEGORY_LABELS[category]}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {mods.map((m) => {
                            const active = modules.has(m.id);
                            const Icon = m.icon;
                            return (
                              <button
                                key={m.id}
                                onClick={() => toggleModule(m.id)}
                                className={cn(
                                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                                  active
                                    ? "border-accent bg-accent-muted/40"
                                    : "border-line hover:bg-inset",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                                    active
                                      ? "bg-accent text-accent-contrast"
                                      : "bg-inset text-muted",
                                  )}
                                >
                                  <Icon className="size-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="flex items-center gap-1.5 text-small font-medium text-fg">
                                    {m.name}
                                    {active && (
                                      <Check className="size-3.5 text-accent" />
                                    )}
                                  </span>
                                  <span className="block text-small text-muted">
                                    {m.description}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Step>
            )}

            {step === 2 && (
              <Step
                title="Connect your platforms"
                subtitle="Optional — link Canvas and Outlook to pull in courses, deadlines, and mail. You can do this any time in Settings."
              >
                <div className="flex flex-col gap-3">
                  {INTEGRATIONS.filter((i) =>
                    ["canvas", "outlook"].includes(i.id),
                  ).map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center gap-4 rounded-lg border border-line p-4"
                    >
                      <div className="flex size-11 items-center justify-center rounded-lg bg-inset text-xl">
                        {i.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-small font-semibold text-fg">
                          {i.name}
                        </p>
                        <p className="text-small text-muted">{i.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        title="Connecting lands with the integration deliverable"
                      >
                        Connect
                      </Button>
                    </div>
                  ))}
                  <p className="text-small text-muted">
                    No rush — skip for now and add these later.
                  </p>
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-4 text-small text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Footer controls */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              <ArrowLeft /> Back
            </Button>
          ) : (
            <span />
          )}

          {step < 2 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
            >
              Continue <ArrowRight />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={finish}
                disabled={submitting}
              >
                Skip for now
              </Button>
              <Button onClick={finish} disabled={submitting || !canContinue}>
                {submitting ? "Setting up…" : "Enter Nexus"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-display !text-3xl">{title}</h1>
      <p className="mt-2 max-w-lg text-body text-muted">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
