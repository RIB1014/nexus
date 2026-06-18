export type IntegrationAuthType = "oauth2" | "apikey" | "basic";

export type IntegrationStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "coming-soon";

export interface SyncResult {
  ok: boolean;
  itemsSynced?: number;
  message?: string;
  syncedAt?: string;
}

/**
 * Every external service implements this common interface so adding a new one
 * is seamless — see docs/integrations.md.
 *
 * The methods here describe the *capabilities*; the concrete client-side and
 * server-side wiring lives alongside each adapter. UI metadata (name, icon,
 * description, permissions) is what the Settings > Integrations page renders.
 */
export interface IntegrationAdapter {
  id: string; // e.g. 'canvas', 'outlook'
  name: string;
  description: string; // what data it accesses, in one sentence
  icon: string; // short label / emoji used by the connection card
  authType: IntegrationAuthType;
  scopes?: string[];
  /** Human-readable permission list shown before connecting. */
  permissions: string[];
  /** Adapters not yet available appear in the UI as "Coming soon". */
  comingSoon?: boolean;
  /** Whether the user must supply a base URL (e.g. institution Canvas domain). */
  requiresBaseUrl?: boolean;
}
