# Nexus

A modular productivity platform for college students who are also musicians,
athletes, and more — one place to manage every area of life. Nexus starts
minimal and you **build it up from scratch**: you only see the modules you've
chosen to enable.

Design direction: *structured minimalism* — high information density without
visual noise. Think Linear meets Notion, but personal and lifestyle-aware.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** with a CSS-custom-property theme token system
- **Prisma** + **PostgreSQL**
- **NextAuth v5** (email/password + Microsoft OAuth)
- **Zustand** (app/appearance state), **TanStack Query** (server state)
- **@dnd-kit** (dashboard widget grid), **Framer Motion**, **cmdk**, **Tiptap**
- **Radix UI** primitives in a shadcn/ui-style component layer
- **Geist Sans / Geist Mono**

## Getting started

Prerequisites: Node 20+ and Docker (for local Postgres).

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres (Docker)
npm run db:up

# 3. Create the schema and seed a demo user
npm run db:push
npm run db:seed

# 4. Run the app
npm run dev
```

Open http://localhost:3000 and sign in with the seeded demo account:

```
Email:    demo@nexus.app
Password: password123
```

> The login screen pre-fills these — just press **Sign in**.

### Environment

Copy `.env.example` to `.env` (a working `.env` is already provided for local
dev). Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (matches `docker-compose.yml`) |
| `AUTH_SECRET` | NextAuth session signing secret |
| `ENCRYPTION_KEY` | AES-256-GCM key for encrypting integration tokens |
| `AUTH_MICROSOFT_ENTRA_ID_*` | Microsoft OAuth (optional; enables the provider) |
| `CANVAS_CLIENT_*` | Canvas OAuth (optional) |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:up` / `db:down` | Start / stop Postgres (Docker) |
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Seed the demo user + sample data |
| `npm run db:studio` | Open Prisma Studio |

## Architecture at a glance

```
src/
  app/
    (auth)/            login, signup
    (dashboard)/       app shell: layout, home, settings, /[moduleSlug]
    onboarding/        full-screen 3-step setup wizard
    api/               route handlers (Zod-validated, session-guarded)
  components/
    ui/                shadcn-style primitives (button, card, dialog, …)
    layout/            Sidebar, TopBar, MobileNav, CommandPalette, AppShell
    theme/             ThemeProvider (next-themes + token application)
    settings/          settings panels
    onboarding/        the wizard
    dashboard/         widget grid + widgets
  lib/
    modules/registry.ts       ← the module registry (source of truth)
    integrations/registry.ts  ← the integration registry
    integrations/adapter.ts   ← IntegrationClient contract
    auth/                      NextAuth config + session helpers
    theme/presets.ts          theme presets
    db/prisma.ts              Prisma client singleton
    crypto.ts                 AES-256-GCM token encryption
  store/                Zustand stores (appearance, UI)
  types/                module / integration / user types
prisma/
  schema.prisma         full data model
  seed.ts               demo data
```

### Key patterns

- **Module registry** — every feature registers metadata in
  `src/lib/modules/registry.ts`; the shell renders from it. Adding a module never
  touches the core shell. See [CONTRIBUTING.md](CONTRIBUTING.md).
- **Integration adapters** — external services implement a common interface and
  register in `src/lib/integrations/registry.ts`. See
  [docs/integrations.md](docs/integrations.md).
- **Theme tokens** — all colors reference CSS variables. Six presets × light/dark
  plus a full custom accent, radius scale, and font scale, all switchable live in
  Settings → Appearance.
- **Per-user security** — every query is scoped by the authenticated session's
  `userId`; integration tokens are encrypted at rest; Cycle/Wellness data is
  flagged `sensitiveData` and excluded from analytics.

## Build status

**Foundation** — complete:

- ✅ Scaffolding, Tailwind + CSS token system, ThemeProvider
- ✅ Auth (email/password + Microsoft OAuth stub)
- ✅ Prisma schema + seed (demo user + sample data)
- ✅ App shell: sidebar, top bar, mobile nav, command palette
- ✅ Settings: Appearance (theme/accent/custom bg/radius/font), Modules
  (toggle + drag-reorder), Integrations UI, Profile
- ✅ Onboarding wizard (3 steps)
- ✅ Home dashboard with drag-and-drop widget grid + warm empty states

**Modules** — fully functional:

- ✅ Tasks — list / board / calendar views, natural-language quick-add, lists +
  smart lists, subtasks, tags, priorities, optimistic updates
- ✅ Calendar — month + week views, events + task-due layer, click-to-create
- ✅ Notes — page tree, Tiptap block editor, autosave, search
- ✅ Habits — check-ins, streaks, GitHub-style heatmap, weekly ring
- ✅ Practice Log — sessions (timer), repertoire tracker, stats + heatmap
- ✅ Athletics — workout logging, weekly volume, PRs, type distribution
- ✅ Mood & Wellness — daily check-in, mood/energy trends, gratitude log
- ✅ Cycle Tracker — period + symptom logging, predicted cycle, phase insight
- ✅ Finance — expenses/income, per-category budgets, monthly summary
- ✅ Links — save with OpenGraph scrape, collections, search

**Pending** (require external OAuth credentials):

- ⏳ Academic Hub — needs a Canvas OAuth app
- ⏳ Email Inbox — needs a Microsoft / Outlook OAuth app

Every module is scoped per-user, Zod-validated, and built on the module
registry — see [CONTRIBUTING.md](CONTRIBUTING.md).
