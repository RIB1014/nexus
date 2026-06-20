import { cn } from "@/lib/utils";

/**
 * The Orbit mark — a ring with an orbiting dot. Premium, minimal, Apple-clean.
 * Tints to the current accent so it adapts to the user's color.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] shadow-card",
        className,
      )}
      style={{
        background:
          "linear-gradient(145deg, color-mix(in oklab, var(--color-accent) 90%, #fff 10%), color-mix(in oklab, var(--color-accent) 72%, #000 28%))",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[19px]">
        <ellipse cx="12" cy="12" rx="8.5" ry="4.4" transform="rotate(-32 12 12)" stroke="#fff" strokeOpacity="0.92" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="3" fill="#fff" />
        <circle cx="18.4" cy="7.7" r="1.7" fill="#fff" />
      </svg>
    </span>
  );
}
