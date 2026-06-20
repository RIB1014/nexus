"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The Orbit mark — a small orbital system: a luminous core, two crossing
 * elliptical orbits with travelling satellites, and a soft top-light, set in a
 * gradient app-icon tile. The tile tints to the current accent (CSS gradient);
 * the orbital art is pure light over it, so it reads on any hue.
 */
export function BrandMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const core = `core-${uid}`;
  const sheen = `sheen-${uid}`;
  const ring = `ring-${uid}`;

  return (
    <span
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-[28%] shadow-card", className)}
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in oklab, var(--color-accent) 82%, #fff 18%), var(--color-accent) 52%, color-mix(in oklab, var(--color-accent) 60%, #000 40%))",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" className="size-full">
        <defs>
          <radialGradient id={core} cx="0.38" cy="0.32" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.62" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.78" />
          </radialGradient>
          <linearGradient id={ring} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id={sheen} cx="0.28" cy="0.16" r="0.85">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Top-light sheen */}
        <rect x="0" y="0" width="40" height="40" fill={`url(#${sheen})`} />

        {/* Orbits */}
        <g fill="none" stroke={`url(#${ring})`} strokeLinecap="round">
          <ellipse cx="20" cy="20" rx="14.6" ry="6" transform="rotate(-30 20 20)" strokeWidth="1.7" />
          <ellipse cx="20" cy="20" rx="14.6" ry="6" transform="rotate(32 20 20)" strokeWidth="1.4" strokeOpacity="0.7" />
        </g>

        {/* Satellites riding the orbits */}
        <circle cx="32.2" cy="13.5" r="2.5" fill="#ffffff" />
        <circle cx="8.2" cy="27.4" r="1.7" fill="#ffffff" fillOpacity="0.85" />

        {/* Luminous core */}
        <circle cx="20" cy="20" r="5.4" fill={`url(#${core})`} />
        <circle cx="17.9" cy="17.9" r="1.5" fill="#ffffff" />
      </svg>
    </span>
  );
}
