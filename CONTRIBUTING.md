# Contributing to Nexus

Nexus is built around a **module registry**: every feature is a self-contained
"module" that registers itself with metadata. The app shell (sidebar, settings,
onboarding, dashboard, command palette) reads from the registry, so **adding a
feature never requires editing the core shell**.

This guide explains how to add a new module.

## The module registry

The registry lives at [`src/lib/modules/registry.ts`](src/lib/modules/registry.ts)
and exports an array of `ModuleDefinition` objects. The shape is defined in
[`src/types/module.ts`](src/types/module.ts):

```ts
interface ModuleDefinition {
  id: string;                 // unique slug, e.g. 'tasks'
  name: string;
  description: string;        // one sentence — shown in onboarding & settings
  icon: LucideIcon;
  category: 'productivity' | 'academic' | 'creative' | 'athletics' | 'wellness';
  defaultEnabled: boolean;
  requiredIntegrations?: string[]; // e.g. ['canvas']
  color?: string;             // optional per-module accent override
  recommendedFor?: string[];  // identity tags that pre-select this module
}
```

Everything that lists, links to, or toggles a module derives from this array:

| Surface | Reads from registry for… |
|---|---|
| Sidebar | enabled modules → nav items |
| Settings → Modules | all modules grouped by category, with toggles |
| Onboarding step 2 | module cards, pre-selected by identity tags |
| Command palette | "Go to <module>" commands |
| Dashboard | which modules can expose a widget |
| `/[moduleSlug]` | resolves the slug to a module |

## Adding a new module

### 1. Register it

Add an entry to the `MODULES` array in `registry.ts`:

```ts
import { Trophy } from "lucide-react";

{
  id: "reading",
  name: "Reading",
  description: "Track books you're reading and capture notes as you go.",
  icon: Trophy,
  category: "academic",
  defaultEnabled: false,
  recommendedFor: ["student"],
}
```

That's enough for the module to appear in onboarding, settings, the sidebar
(once enabled), and the command palette. Its page at `/reading` will render the
scaffolded placeholder until you build the real UI.

### 2. Add a database model (if it stores data)

Add a model to [`prisma/schema.prisma`](prisma/schema.prisma). **Always include a
`userId` and a relation back to `User`** — all data is scoped per-user:

```prisma
model ReadingItem {
  id        String   @id @default(cuid())
  userId    String
  title     String
  // ...
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Then add the inverse relation on `User` and run `npm run db:push` (dev) or
`npm run db:migrate` (to create a migration).

### 3. Add API routes

Create routes under `src/app/api/<module>/`. Every handler must:

- guard with `requireUser()` from [`src/lib/api.ts`](src/lib/api.ts) at the top;
- scope every query by the authenticated `userId` (never trust a client id);
- validate input with Zod;
- return typed JSON with proper status codes.

```ts
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const items = await prisma.readingItem.findMany({ where: { userId: auth.userId } });
  return json({ items });
}
```

### 4. Build the page

Create the real module UI. For now the dynamic route
[`src/app/(dashboard)/[moduleSlug]/page.tsx`](src/app/(dashboard)/[moduleSlug]/page.tsx)
renders a placeholder for every module; as modules are built out they get a
dedicated page wired via `next/dynamic`. Follow the conventions:

- **Server Components by default**; add `"use client"` only where you need
  interactivity.
- Use the shared UI primitives in `src/components/ui/`.
- Use the **theme tokens** (`bg-canvas`, `text-fg`, `border-line`,
  `bg-accent`, …) — never hardcode colors.
- Give the module a warm **empty state** with `<EmptyState />` — never a blank
  page.

### 5. (Optional) Add a dashboard widget

Register a compact widget in
[`src/components/dashboard/widgets.tsx`](src/components/dashboard/widgets.tsx) by
adding an entry to the `WIDGETS` map. It will become pinnable on the home
dashboard automatically.

## Conventions

- **Theme tokens, always.** Every color references a CSS variable via a Tailwind
  utility (`bg-panel`, `text-muted`, `border-line`, `bg-accent-muted`, …). See
  [`src/app/globals.css`](src/app/globals.css) and
  [`src/lib/theme/presets.ts`](src/lib/theme/presets.ts).
- **Voice.** Clear, direct, personal but not cutesy. Never "Oops!"/"Uh oh!".
  Error copy says what happened and how to fix it.
- **No `alert()` / `confirm()` / `prompt()`.** Use a dialog or inline
  confirmation. Destructive actions get a one-step inline confirm.
- **Privacy.** Never log Cycle Tracker or Wellness data to the console or any
  analytics. Those models carry a `sensitiveData` flag — keep them out of any
  aggregation.
- **Row-level security** is enforced at the Prisma query layer, not just the API
  layer. Scope by `userId` in `where`, every time.

## Local development

```bash
npm run db:up      # start Postgres (Docker)
npm run db:push    # sync schema
npm run db:seed    # demo user: demo@nexus.app / password123
npm run dev        # http://localhost:3000
```

See [`README.md`](README.md) for full setup and
[`docs/integrations.md`](docs/integrations.md) for adding integration adapters.
