"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  THEME_PRESETS,
  type FontScale,
  type RadiusScale,
} from "@/lib/theme/presets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line py-6 first:pt-0 last:border-0">
      <h3 className="text-heading">{title}</h3>
      {description && (
        <p className="mt-0.5 text-small text-muted">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    presetId,
    accentColor,
    customAccent,
    radius,
    fontScale,
    sidebarShowLabels,
    setPreset,
    setCustomAccent,
    setRadius,
    setFontScale,
    setSidebarShowLabels,
  } = useAppStore();

  return (
    <div className="rounded-lg border border-line bg-panel px-5">
      <Section
        title="Theme preset"
        description="One accent color sets the tone for the whole app."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_PRESETS.map((preset) => {
            const active = presetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id, preset.accent)}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3 text-left transition-colors",
                  active
                    ? "border-accent ring-1 ring-accent"
                    : "border-line hover:bg-inset",
                )}
              >
                <span
                  className="size-7 shrink-0 rounded-full"
                  style={{ background: preset.accent }}
                />
                <span className="min-w-0">
                  <span className="block text-small font-medium text-fg">
                    {preset.name}
                  </span>
                  <span className="block truncate text-small text-muted">
                    {preset.personality}
                  </span>
                </span>
                {active && <Check className="ml-auto size-4 text-accent" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Custom accent"
        description="Pick any color and Nexus rebuilds around it."
      >
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Accent color"
            value={presetId === "custom" ? accentColor : customAccent}
            onChange={(e) => setCustomAccent(e.target.value)}
            className="size-10 cursor-pointer rounded-md border border-line bg-transparent"
          />
          <Input
            value={presetId === "custom" ? accentColor : customAccent}
            onChange={(e) => setCustomAccent(e.target.value)}
            className="w-32 font-data"
          />
          <span
            className="ml-1 rounded-md px-3 py-1.5 text-small font-medium text-accent-contrast"
            style={{ background: "var(--color-accent)" }}
          >
            Preview
          </span>
        </div>
      </Section>

      <Section title="Mode" description="Light, dark, or follow your system.">
        <div className="flex gap-2">
          {(
            [
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon;
            const active = mounted && theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-small font-medium transition-colors",
                  active
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-line text-muted hover:bg-inset hover:text-fg",
                )}
              >
                <Icon className="size-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Corners" description="How rounded surfaces should feel.">
        <SegmentedControl<RadiusScale>
          value={radius}
          onChange={setRadius}
          options={[
            { value: "sharp", label: "Sharp" },
            { value: "default", label: "Default" },
            { value: "rounded", label: "Rounded" },
          ]}
        />
      </Section>

      <Section title="Text size" description="Comfort vs. density.">
        <SegmentedControl<FontScale>
          value={fontScale}
          onChange={setFontScale}
          options={[
            { value: "compact", label: "Compact" },
            { value: "default", label: "Default" },
            { value: "comfortable", label: "Comfortable" },
          ]}
        />
      </Section>

      <Section title="Sidebar" description="Show labels next to module icons.">
        <div className="flex items-center justify-between">
          <Label htmlFor="sidebar-labels">Show labels</Label>
          <Switch
            id="sidebar-labels"
            checked={sidebarShowLabels}
            onCheckedChange={setSidebarShowLabels}
          />
        </div>
      </Section>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-line bg-canvas p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-sm px-3 py-1.5 text-small font-medium transition-colors",
            value === opt.value
              ? "bg-accent-muted text-accent"
              : "text-muted hover:text-fg",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
