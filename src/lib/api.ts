import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/session";

/** Typed JSON response helper. */
export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function unauthorized() {
  return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Resolve the authenticated user id for an API route. Returns the id, or a
 * ready-to-return 401 Response. Usage:
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.userId is safe to use
 */
export async function requireUser(): Promise<
  { userId: string } | NextResponse
> {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  return { userId };
}
