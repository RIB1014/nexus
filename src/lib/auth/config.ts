import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Edge-safe base config shared by middleware and the full server config.
// IMPORTANT: no Prisma / bcrypt imports here so it can run in edge middleware.

const microsoftConfigured = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
);

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  // Microsoft is added only when credentials are present. The Credentials
  // provider (email/password) is added in src/auth.ts (Node runtime only).
  providers: microsoftConfigured
    ? [
        MicrosoftEntraID({
          clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
          clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
          issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
          authorization: {
            params: {
              scope:
                "openid profile email offline_access User.Read Mail.Read Calendars.ReadWrite Tasks.ReadWrite",
            },
          },
        }),
      ]
    : [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const isMicrosoftConfigured = microsoftConfigured;
