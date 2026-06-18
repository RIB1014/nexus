import { auth } from "@/auth";

/** The authenticated user from the session, or null. Server-only. */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * The authenticated user's id, or null. NEVER trust a client-provided userId —
 * always scope queries by this value (row-level security at the query layer).
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
