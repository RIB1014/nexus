import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

// Routes that don't require a session.
const PUBLIC_PATHS = ["/login", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  const isApi = nextUrl.pathname.startsWith("/api");

  if (!isLoggedIn && !isPublic) {
    // APIs get a clean JSON 401; pages get sent to the login screen.
    if (isApi) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("from", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // NOTE: we intentionally do NOT redirect logged-in users away from /login.
  // The edge middleware can't verify the session's user still exists in the DB;
  // if it doesn't (e.g. after a DB reseed), the dashboard layout redirects to
  // /login while a middleware bounce back to / would create an infinite loop.
  // Letting /login always render breaks that loop; signing in overwrites the
  // stale cookie, so the session self-heals.

  return NextResponse.next();
});

export const config = {
  // Run on everything except Next internals, the auth API, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
