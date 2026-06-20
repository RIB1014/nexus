"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  FONT_FAMILIES,
  fontFamilyById,
  type FontFamilyId,
  type FontScale,
  type RadiusScale,
} from "@/lib/theme/presets";
import { PALETTE } from "@/lib/theme/palette";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { BrandMark } from "@/components/layout/BrandMark";

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
      {description && <p className="mt-0.5 text-small text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    appName,
    accentColor,
    radius,
    fontScale,
    fontFamily,
    bgColor,
    sidebarShowLabels,
    setAppName,
    setCustomAccent,
    setRadius,
    setFontScale,
    setFontFamily,
    setBgColor,
    setSidebarShowLabels,
  } = useAppStore();

  return (
    <div className="app-card px-5">
      <Section title="Branding" description="Name your workspace. This shows on the sidebar logo and headers.">
        <div className="flex items-center gap-3">
          <BrandMark className="size-9" />
          <Input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Nexus"
            maxLength={24}
            className="w-56 text-body"
          />
        </div>
      </Section>

      <Section
        title="Accent color"
        description="One color tints buttons, highlights, and the active state across the whole app."
      >
        <div className="grid grid-cols-8 gap-2.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
          {PALETTE.map((s) => {
            const active = accentColor.toLowerCase() === s.hex.toLowerCase();
            return (
              <button
                key={s.id}
                title={s.name}
                onClick={() => setCustomAccent(s.hex)}
                className="flex aspect-square items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{ background: s.hex }}
              >
                {active && <Check className="size-4 text-white drop-shadow" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ColorPicker value={accentColor} onChange={setCustomAccent}>
            <button className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2 text-small font-medium text-fg transition-colors hover:bg-inset">
              <span className="size-4 rounded-full" style={{ background: accentColor }} />
              Custom…
            </button>
          </ColorPicker>
          <span className="font-data text-small text-muted">{accentColor.toUpperCase()}</span>
          <span
            className="ml-auto rounded-md px-3 py-1.5 text-small font-semibold text-accent-contrast"
            style={{ background: "var(--color-accent)" }}
          >
            Aa Preview
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

      <Section title="Font" description="Pick the typeface that feels right. System is Apple's SF on Mac.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FONT_FAMILIES.map((f) => {
            const active = fontFamily === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFontFamily(f.id as FontFamilyId)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                  active ? "border-accent ring-1 ring-accent" : "border-line hover:bg-inset",
                )}
              >
                <span className="text-lg font-semibold text-fg" style={{ fontFamily: f.stack }}>
                  Ag
                </span>
                <span className="flex w-full items-center justify-between">
                  <span className="text-small font-medium text-fg">{f.name}</span>
                  {active && <Check className="size-3.5 text-accent" />}
                </span>
                <span className="text-micro normal-case tracking-normal text-muted">
                  {f.description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-small text-muted" style={{ fontFamily: fontFamilyById(fontFamily).stack }}>
          The quick brown fox jumps over the lazy dog — 1234567890
        </p>
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

      <Section title="Custom background" description="Override the page background with your own color.">
        <div className="flex items-center gap-3">
          <Switch
            id="custom-bg"
            checked={bgColor !== null}
            onCheckedChange={(v) => setBgColor(v ? (bgColor ?? "#0b0b0e") : null)}
          />
          <Label htmlFor="custom-bg">Use a custom background</Label>
          {bgColor !== null && (
            <ColorPicker value={bgColor} onChange={setBgColor}>
              <button
                className="ml-2 size-9 rounded-md border border-line"
                style={{ background: bgColor }}
                aria-label="Background color"
              />
            </ColorPicker>
          )}
        </div>
      </Section>

      <Section title="Sidebar" description="Show labels next to module icons.">
        <div className="flex items-center justify-between">
          <Label htmlFor="sidebar-labels">Show labels</Label>
          <Switch id="sidebar-labels" checked={sidebarShowLabels} onCheckedChange={setSidebarShowLabels} />
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
            value === opt.value ? "bg-accent-muted text-accent" : "text-muted hover:text-fg",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
