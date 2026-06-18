import type { SyncResult } from "@/types/integration";

export type { IntegrationAdapter, SyncResult } from "@/types/integration";

/**
 * Server-side contract a concrete integration client fulfils. The UI metadata
 * lives in registry.ts (IntegrationAdapter); this is the runtime behaviour that
 * connect/sync API routes call into. Each provider implements one of these.
 *
 * See docs/integrations.md for the step-by-step guide to adding a provider.
 */
export interface IntegrationClient {
  /** Begin the OAuth/connect flow — returns a URL to redirect the user to. */
  getAuthorizationUrl(params: {
    userId: string;
    baseUrl?: string;
    redirectUri: string;
  }): Promise<string> | string;

  /** Exchange a callback code for tokens and persist the Integration row. */
  handleCallback(params: {
    userId: string;
    code: string;
    redirectUri: string;
    baseUrl?: string;
  }): Promise<void>;

  /** Pull fresh data for this user. Cached upstream per the spec's SWR rules. */
  sync(userId: string): Promise<SyncResult>;

  /** Revoke + delete the stored Integration row. */
  disconnect(userId: string): Promise<void>;
}
