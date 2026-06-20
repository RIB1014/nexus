"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CornerDownLeft, Loader2 } from "lucide-react";

/**
 * Capture a task from anywhere on the home screen — type and hit Enter. Posts
 * straight to the Tasks API and refreshes the dashboard data.
 */
export function QuickCapture() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (res.ok) {
        setTitle("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-card flex items-center gap-2.5 px-3.5 py-2.5">
      <Plus className="size-4 shrink-0 text-accent" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="Quick add a task — type and press Enter"
        className="flex-1 bg-transparent text-body text-fg outline-none placeholder:text-faint"
      />
      {busy ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-faint" />
      ) : (
        title.trim() && (
          <button
            onClick={add}
            className="flex items-center gap-1 rounded-md bg-accent-soft px-2 py-1 text-small font-medium text-accent"
            aria-label="Add task"
          >
            <CornerDownLeft className="size-3.5" /> Add
          </button>
        )
      )}
    </div>
  );
}
