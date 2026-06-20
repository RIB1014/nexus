@AGENTS.md

> The line above imports `AGENTS.md`, which holds the **concise, must-follow
> operating rules** (stack quirks, theme tokens, security invariants, Tailwind v4
> notes). Read it first. Everything below is the **comprehensive project map** —
> architecture, file structure, build status, decisions, and what's next.

---

# Nexus — Project Guide

## 1. What this is

**Nexus** is a modular personal-productivity web app for students and other
"organized people." One shell hosts many self-contained **modules** (Tasks,
Calendar, Notes, Habits, etc.); users turn modules on/off, reorder them, and
pick the ones that match their identity (student / musician / athlete / artist /
developer). The north-star is to combine the best of tools people already love
(Apple Reminders + TickTick for Tasks, Google + Apple Calendar for Calendar)
into one cohesive, customizable home.

**Design intent:** simple, clean, and *warm* — a tool an organized person
actually wants to live in. UI quality bar is highest for **Tasks** and
**Calendar**.

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, route groups, route handlers) |
| Language | TypeScript, **React 19** |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` in `globals.css`), CSS-var token system, `next-themes` for dark mode |
| UI primitives | Radix UI (shadcn-style local components in `src/components/ui`), `lucide-react`, `framer-motion`, `cmdk` (command palette), Tiptap (Notes editor) |
| Data layer | **Prisma 6** + **PostgreSQL** (Docker) |
| Auth | **NextAuth v5 (beta)** — JWT strategy, Credentials + Microsoft Entra stub |
| Server state | **TanStack Query** (optimistic updates) |
| Client state | **Zustand** (persisted stores) |
| Drag & drop | **@dnd-kit** |
| Crypto | AES-256-GCM for integration tokens (`src/lib/crypto.ts`) |
| Misc | `date-fns`, `bcryptjs`, `class-variance-authority`, `tailwind-merge` |

Requires **Node 20+** and **Docker** (for Postgres).

## 3. How to run locally

```bash
cp .env.example .env        # then fill in the values (see §8)
npm install                 # postinstall runs `prisma generate`
npm run db:up               # start Postgres in Docker
npm run db:push             # apply schema (use this, not migrate, for local)
npm run db:seed             # seed demo user + sample data
npm run dev                 # http://localhost:3000
```

**Demo login:** `demo@nexus.app` / `password123`

Other scripts: `db:studio` (Prisma Studio), `db:reset` (wipe + reseed),
`db:down` (stop Postgres), `typecheck`, `build`, `lint`.

**Always verify with `npm run typecheck` and `npm run build` before declaring done.**

### Gotchas learned the hard way
- **Restart `npm run dev` after every `schema.prisma` change** (and after
  `db:push`). The running server holds an old Prisma client in memory — symptoms
  are `prisma.<model>` being `undefined` for newly added models.
- **Never mix `next build` and `next dev` against the same `.next/`.** It
  corrupts the dir → 500s and 55s compiles. Fix: `rm -rf .next` and restart.
- This is **zsh**, not bash: no `shopt` (use `setopt`), no GNU `timeout`
  (use `curl --max-time`).

## 4. Directory structure

```
prisma/
  schema.prisma          ← single source of truth for the DB (see §6)
  seed.ts                ← demo user + sample data for every module
docs/
  integrations.md        ← how the integration adapter system works
docker-compose.yml       ← Postgres for local dev
uploads/                 ← user file uploads (gitignored, served via API)
public/

src/
  app/
    (auth)/              ← login / register pages (route group, no shell)
    (dashboard)/         ← the authenticated app shell + every module page
      page.tsx           ← home dashboard (widget grid)
      [moduleSlug]/      ← dynamic fallback page for modules w/o a dedicated page
      tasks/ calendar/ notes/ habits/ practice-log/ athletics/
      wellness/ cycle/ finance/ links/ files/   ← per-module pages
      settings/          ← appearance, modules, integrations, profile, notifications
    onboarding/          ← 3-step identity → module-pick → done wizard
    api/                 ← route handlers (REST-ish), one folder per resource (see §5)

  components/
    ui/                  ← shadcn-style primitives (button, dialog, popover, …)
    layout/              ← sidebar, topbar, mobile nav, command palette
    dashboard/           ← home widget grid + per-module dashboard widgets
    modules/<module>/    ← the actual feature UIs (tasks/, calendar/, notes/, …)
    settings/  onboarding/  providers/  theme/

  lib/
    api.ts               ← requireUser() route guard + JSON helpers
    auth/                ← edge-safe auth config + getSessionUser()/getUserId()
    db/                  ← Prisma client singleton
    data/                ← server-side data fetchers (dashboard, habits, user)
    hooks/               ← TanStack Query hooks, one per module (useTasks, useCalendar, …)
    modules/             ← registry.ts (source of truth) + components.ts (dynamic map)
    integrations/        ← registry.ts + adapter.ts (IntegrationClient)
    tasks/               ← NL parse, group, sort, serialize, server helpers
    theme/               ← color presets + hex→rgb-channel helpers
    storage.ts           ← local filesystem upload storage (25 MB cap)
    crypto.ts            ← AES-256-GCM encrypt/decrypt for integration tokens
    utils.ts             ← cn() etc.

  store/                 ← Zustand: useAppStore, useUIStore, useCalendarPrefs
  types/                 ← shared TS types (module, task, calendar, note, …)

  middleware.ts          ← route protection (edge); /api unauth → JSON 401
  auth.ts                ← full NextAuth config (PrismaAdapter + Credentials)
```

## 5. API routes (`src/app/api/*/route.ts`)

REST-ish handlers, **every query scoped by session `userId`** via
`requireUser()`. Collection + `[id]` item pattern throughout:

```
auth/[...nextauth]  auth/register
tasks  tasks/[id]   task-lists  task-lists/[id]   task-tags
calendar  calendar/[id]   calendars  calendars/[id]
notes  notes/[id]   files  files/[id]
habits  habits/[id]  habits/[id]/logs
practice  practice/[id]   repertoire  repertoire/[id]
workouts  workouts/[id]
wellness   cycle
finance  finance/[id]  budgets
links  links/[id]
modules  modules/reorder   onboarding   settings/profile
dashboard/layout
```

## 6. Database schema

Full source: **`prisma/schema.prisma`**. Models:

- **Auth/NextAuth:** `User`, `Account`, `Session`, `VerificationToken`
- **App config:** `UserModule` (per-user enabled modules + order), `Integration`
  (encrypted OAuth tokens)
- **Tasks:** `Task` (recurrence, priority, subtasks via self-relation, estimate),
  `TaskList`, `TaskTag`
- **Calendar:** `EventCalendar` (named, colored, visibility-toggleable category),
  `CalendarEvent` (recurrence, optional `calendarId` → `EventCalendar`)
- **Notes:** `Note` (tree + Tiptap JSON), `Attachment` (also used by Files)
- **Practice:** `PracticeSession`, `RepertoireItem`
- **Athletics:** `Workout`
- **Wellness:** `WellnessLog`, `Habit`, `HabitLog`, `CycleEntry`
- **Finance:** `Expense`, `Budget`
- **Links:** `Link`

Schema notes:
- Prisma `Json` fields need `as unknown as T` casts on read (not `as T`).
- Update FK relations with `{ connect } / { disconnect }`, **not** a raw scalar
  in the `UpdateInput` (e.g. `data.calendar = id ? {connect:{id}} : {disconnect:true}`).
- `CalendarEvent.calendar` is `onDelete: SetNull` so deleting a calendar orphans
  rather than deletes its events.

## 7. Architecture patterns

1. **Module Registry** (`src/lib/modules/registry.ts`) — the single source of
   truth. The sidebar, settings, onboarding, command palette, and the
   `/[moduleSlug]` dynamic route all read from `MODULES`. **Adding a module =
   add an entry here** (+ its page/widget). `registry.ts` is metadata-only (safe
   on the server); React components are code-split via `next/dynamic` in
   `src/lib/modules/components.ts` so nav never bundles module code.
   `recommendedModuleIds()` drives onboarding suggestions from identity tags.

2. **Integration Adapter** (`src/lib/integrations/registry.ts` + `adapter.ts`)
   — `INTEGRATIONS` is the source of truth for connectable services (Canvas,
   Outlook, plus "coming soon" entries). Settings > Integrations renders directly
   from it. Tokens are encrypted at rest with `crypto.ts`. See `docs/integrations.md`.

3. **Theme tokens, always** — Tailwind utilities backed by CSS vars; **never
   hardcode colors**. Tokens: `bg-canvas/panel/inset/surface/accent/accent-muted`,
   `text-fg/muted/faint/accent-contrast`, `border-line/line-strong`. Type scale:
   `text-display/heading/body/small/micro`, `font-data`. Shadows:
   `shadow-card`, `shadow-pop`. A module can override `--color-accent` for its own
   page (e.g. Practice Log violet).

4. **Auth split** — edge-safe base config in `src/lib/auth/config.ts` (used by
   `middleware.ts`); full config with Prisma adapter + Credentials in
   `src/auth.ts`. JWT session strategy.

5. **Data access** — routes use `requireUser()` (`src/lib/api.ts`); server
   components use `getUserId()` / `getSessionUser()`. **Every Prisma query is
   scoped by `userId`.**

6. **Server/client state** — TanStack Query hooks (one per module, in
   `src/lib/hooks`) own server state with optimistic updates; Zustand persisted
   stores own client prefs (`useCalendarPrefs`: week start, 12/24h, default view,
   density, weekends; `useUIStore`; `useAppStore`).

7. **dnd-kit + SSR** — gate `DndContext` behind a `mounted` flag and render a
   static grid first to avoid hydration id mismatches (see `DashboardGrid.tsx`).

## 8. Environment variables

From `.env.example` (copy to `.env`, never commit `.env`):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (matches `docker-compose.yml`) |
| `AUTH_SECRET` | NextAuth v5 signing secret — `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` for local dev behind NextAuth |
| `NEXTAUTH_URL` | App base URL, e.g. `http://localhost:3000` |
| `ENCRYPTION_KEY` | 32-byte base64 AES-256-GCM key for integration tokens — `openssl rand -base64 32` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER` | Microsoft 365 (Outlook) OAuth — fill to enable real Email/Calendar sync |
| `CANVAS_CLIENT_ID` / `_SECRET` | Canvas LMS OAuth2 (institution-specific; base URL set per-user at connect time) |

## 9. Module build status

**Fully built** (rich, dedicated UI + API + hooks + seed data):

| Module | Highlights |
|---|---|
| **Tasks** | Apple-Reminders/TickTick class. NL quick-add parser, expandable composer (notes + inline attribute chips + subtasks), detail panel built on the same chips (Date/Priority/List/Tags/Repeat), grouping (none/priority/date/list), sort, show-completed, bulk actions, recurring tasks, drag reorder. |
| **Calendar** | Google + Apple class. Multiple colored calendars/categories with visibility toggles, mini-month navigator, Day/Week/Month/**Agenda** views, drag-to-create/move/resize, live now-line, recurring events, event search, per-event color override, calendar settings (week start, 12/24h, default view, weekends — persisted), keyboard shortcuts (T/D/W/M/A/←→/C/N). |
| **Notes** | Page tree + Tiptap block editor, attachments. |
| **Habits** | Check-ins, streaks, heatmap. |
| **Practice Log** | Sessions, repertoire, stats (violet accent). |
| **Athletics** | Workouts, stats, PRs. |
| **Mood & Wellness** | Mood/energy/sleep check-in, trends, gratitude/journal (never logged). |
| **Cycle Tracker** | Logging, phases, predictions (private; never logged). |
| **Finance** | Manual expenses + budgets + summary (manual-only — **no bank connection**). |
| **Links & Resources** | Save, collections, search. |
| **Files & Uploads** | Local-fs uploads (PDF/image/text, 25 MB cap), auth+ownership-gated serving. **This is the "GoodNotes" path** — export to PDF and upload (no GoodNotes API exists). |

**Not built / gated on OAuth creds** (fall through to the `[moduleSlug]`
scaffold page, which shows an "integration required" state):

- **Academic Hub** — needs Canvas OAuth (`requiredIntegrations: ["canvas"]`).
- **Email Inbox** — needs Microsoft 365/Outlook OAuth (`requiredIntegrations: ["outlook"]`).

Both have full registry entries and integration adapters; they need real OAuth
app credentials in `.env` to light up.

## 10. Notable decisions & fixes

- **Redirect loop ("too many redirects")** — a stale JWT (valid token, but the
  user was deleted by a reseed) made the dashboard layout redirect to `/login`
  while `middleware.ts` bounced authed users on public pages back to `/`. **Fix:**
  removed the middleware "logged-in → /login → /" bounce; `/login` always renders
  and the session self-heals on re-login. (commit `6169bac`)
- **Nested `<button>` hydration error** in the task attribute chips (a clear
  button inside a `PopoverTrigger` button). **Fix:** restructured `Chip` so
  `PopoverTrigger` wraps only the label button and the clear button is a sibling.
- **GoodNotes "integration"** — there is no GoodNotes API. Decision: ship a
  working **export-to-PDF → upload** flow via the Files module rather than fake an
  integration.
- **Finance is manual-only** by design (spec) — no bank linking.
- **Hosting:** intentionally local-only for now (GitHub repo is source, not a
  deploy). The repo is public; there is no live URL.
- **Privacy invariants:** never log Cycle or Wellness data; encrypt all
  integration tokens; never put personal data in URLs.

## 11. Where things stand / what's next

**Current state:** the Calendar transform + design refresh + Tasks polish cycle
is complete, verified (typecheck + build clean, in-browser checks), and pushed
(latest `main` is `9b3c384`). No task is mid-flight.

**Standing intent:** keep raising the bar on **Tasks** and **Calendar** toward a
"99%-of-my-time" tool, folding in the best of comparable apps. Candidate next
steps (not yet started):

- Calendar: drag events *between* calendars; event quick-peek popover on click
  (instead of opening the full dialog); recurring-event "this event / all events"
  edit choices; `.ics` import/export.
- Tasks: saved smart filters; list drag-reorder.
- Theme: a few preset "looks" the user can switch between.
- Light up **Academic Hub** and **Email Inbox** once OAuth credentials exist.
