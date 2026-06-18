# Adding an integration adapter

Nexus talks to external services (Canvas, Outlook, …) through a common
**integration adapter** pattern. Like modules, integrations are driven by a
registry, so the Settings → Integrations UI and the onboarding connect step pick
up new providers automatically.

## The two halves of an integration

1. **UI metadata** — what the connection card renders (name, icon, description,
   permissions, scopes). Lives in
   [`src/lib/integrations/registry.ts`](../src/lib/integrations/registry.ts) and
   conforms to the `IntegrationAdapter` interface in
   [`src/types/integration.ts`](../src/types/integration.ts).

2. **Runtime client** — the server-side behaviour (OAuth handshake, token
   refresh, data sync). Conforms to the `IntegrationClient` interface in
   [`src/lib/integrations/adapter.ts`](../src/lib/integrations/adapter.ts) and is
   invoked by the connect/sync API routes.

```ts
// UI metadata (registry.ts)
interface IntegrationAdapter {
  id: string;                  // 'canvas', 'outlook', …
  name: string;
  description: string;
  icon: string;                // emoji / short label for the card
  authType: 'oauth2' | 'apikey' | 'basic';
  scopes?: string[];
  permissions: string[];       // human-readable list shown before connecting
  comingSoon?: boolean;        // render as "Coming soon", not connectable
  requiresBaseUrl?: boolean;   // user supplies a base URL (e.g. Canvas domain)
}

// Runtime behaviour (adapter.ts)
interface IntegrationClient {
  getAuthorizationUrl(params): Promise<string> | string;
  handleCallback(params): Promise<void>;
  sync(userId: string): Promise<SyncResult>;
  disconnect(userId: string): Promise<void>;
}
```

## Adding a provider

### 1. Register the UI metadata

Add an entry to the `INTEGRATIONS` array in `registry.ts`:

```ts
{
  id: "google-calendar",
  name: "Google Calendar",
  description: "Sync events from your Google Calendar.",
  icon: "📅",
  authType: "oauth2",
  scopes: ["https://www.googleapis.com/auth/calendar.events"],
  permissions: ["Read and write calendar events"],
}
```

The card now appears in Settings → Integrations. Mark it `comingSoon: true`
while you build the runtime — it renders as a disabled "Coming soon" card (this
is how Google Calendar, Spotify, Notion, Apple Health, and Strava currently
appear).

### 2. Implement the runtime client

Create `src/lib/integrations/<provider>.ts` implementing `IntegrationClient`:

```ts
import type { IntegrationClient } from "@/lib/integrations/adapter";
import { prisma } from "@/lib/db/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export const googleCalendarClient: IntegrationClient = {
  getAuthorizationUrl({ userId, redirectUri }) {
    // Build the provider's OAuth consent URL.
  },
  async handleCallback({ userId, code, redirectUri }) {
    // Exchange `code` for tokens, then persist an Integration row with the
    // tokens ENCRYPTED at rest:
    await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: "google-calendar" } },
      create: {
        userId,
        provider: "google-calendar",
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        status: "connected",
      },
      update: { accessToken: encrypt(accessToken), status: "connected" },
    });
  },
  async sync(userId) {
    // Decrypt the token, fetch fresh data, upsert into the relevant models.
    // Honor the SWR cache windows: 15 min for assignments, 5 min for calendar.
  },
  async disconnect(userId) {
    await prisma.integration.delete({
      where: { userId_provider: { userId, provider: "google-calendar" } },
    });
  },
};
```

### 3. Add connect / callback / sync routes

Create API routes under `src/app/api/integrations/<provider>/`:

- `connect/route.ts` — calls `getAuthorizationUrl` and redirects the user.
- the OAuth callback (handled via NextAuth or a dedicated route) calls
  `handleCallback`.
- `sync/route.ts` — guards with `requireUser()` then calls `sync(userId)`.

### 4. Flip off `comingSoon`

Remove `comingSoon: true` from the registry entry. The connection card's
**Connect** button becomes live and the status badge reflects the stored
`Integration.status` (green = connected, gray = disconnected, red = error).

## Token storage & security

- **Tokens are always encrypted at rest** with AES-256-GCM via
  [`src/lib/crypto.ts`](../src/lib/crypto.ts) (`encrypt` / `decrypt`). The key
  comes from the `ENCRYPTION_KEY` env var. Never store a raw token.
- The `Integration` model is unique per `(userId, provider)` and carries
  `status`, `lastSyncedAt`, `errorMessage`, and a `metadata` JSON blob (used for
  e.g. the Canvas base URL or the connected account email).
- Refresh tokens automatically and update `status` to `error` with an
  `errorMessage` if a sync fails, so the UI can surface it.

## Provider notes

- **Canvas** — REST API v1, institution-specific base URL (`requiresBaseUrl`).
  The user enters their school's Canvas domain at connect time; store it in
  `Integration.metadata.canvasBaseUrl`.
- **Microsoft / Outlook** — Microsoft Graph via the Microsoft Identity Platform.
  The provider is wired into NextAuth in
  [`src/lib/auth/config.ts`](../src/lib/auth/config.ts) and activates when
  `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` are set.
