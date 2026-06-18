"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Seoul",
  "Asia/Tokyo",
  "UTC",
];

interface Initial {
  name: string;
  email: string;
  timezone: string;
  weekStartsOn: 0 | 1;
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(initial.weekStartsOn);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, timezone, weekStartsOn }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={initial.email} disabled />
          <p className="text-small text-muted">
            Your email is tied to your account and can&apos;t be changed here.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tz">Time zone</Label>
          <select
            id="tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-9 rounded-md border border-line bg-canvas px-3 text-body text-fg outline-none focus-visible:border-accent"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Week starts on</Label>
          <div className="inline-flex w-fit rounded-md border border-line bg-canvas p-1">
            {([
              { v: 0, label: "Sunday" },
              { v: 1, label: "Monday" },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setWeekStartsOn(opt.v)}
                className={
                  "rounded-sm px-3 py-1.5 text-small font-medium transition-colors " +
                  (weekStartsOn === opt.v
                    ? "bg-accent-muted text-accent"
                    : "text-muted hover:text-fg")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && <span className="text-small text-accent">Saved</span>}
        </div>
      </div>
    </div>
  );
}
