<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Nexus project notes

- **Stack:** Next.js 16 (App Router), Tailwind v4 (CSS-first `@theme` in `globals.css`), Prisma 6 + Postgres, NextAuth v5, Zustand, TanStack Query, @dnd-kit, Radix/shadcn-style UI. Node 20+, Docker for Postgres.
- **Run locally:** `npm run db:up && npm run db:push && npm run db:seed && npm run dev`. Demo login: `demo@nexus.app` / `password123`.
- **Module registry** (`src/lib/modules/registry.ts`) is the source of truth — the sidebar, settings, onboarding, command palette, and `/[moduleSlug]` all read from it. Add a module there; don't edit the shell. See `CONTRIBUTING.md`.
- **Integration registry** (`src/lib/integrations/registry.ts`) + `IntegrationClient` (`adapter.ts`). See `docs/integrations.md`.
- **Theme tokens, always.** Use Tailwind utilities backed by CSS vars: `bg-canvas` `bg-panel` `bg-inset` `bg-surface` `bg-accent` `bg-accent-muted` `text-fg` `text-muted` `text-faint` `border-line` `border-line-strong` `text-accent-contrast`. Never hardcode colors. Type scale classes: `text-display/heading/body/small/micro`, `font-data`.
- **Security:** scope every Prisma query by the session `userId` (`requireUser()` in `src/lib/api.ts` for routes; `getUserId()` in server components). Encrypt integration tokens with `src/lib/crypto.ts`. Never log Cycle/Wellness data.
- **Auth split:** edge-safe base config in `src/lib/auth/config.ts` (used by `middleware.ts`); full config with Prisma adapter + Credentials in `src/auth.ts`.
- **Tailwind v4 note:** unknown utility classes silently no-op; `tailwindcss-animate` is NOT installed, so `animate-in`/`fade-in-0` classes are inert (harmless).
- **dnd-kit + SSR:** gate `DndContext` behind a `mounted` flag and render a static grid first to avoid hydration id mismatches (see `DashboardGrid.tsx`).
- Verify changes with `npm run typecheck` and `npm run build` before declaring done.
