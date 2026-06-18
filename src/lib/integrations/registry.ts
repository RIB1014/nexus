import type { IntegrationAdapter } from "@/types/integration";

/**
 * The integration registry — single source of truth for connectable services.
 * Settings > Integrations renders directly from this array, so adding a new
 * integration only requires adding an entry here (and its connect/sync routes).
 * See docs/integrations.md.
 */
export const INTEGRATIONS: IntegrationAdapter[] = [
  {
    id: "canvas",
    name: "Canvas LMS",
    description: "Read your courses, assignments, and due dates from your school's Canvas.",
    icon: "🎓",
    authType: "oauth2",
    requiresBaseUrl: true,
    scopes: [
      "url:GET|/api/v1/courses",
      "url:GET|/api/v1/assignments",
      "url:GET|/api/v1/calendar_events",
    ],
    permissions: [
      "View your active courses",
      "View assignments and your submission status",
      "View assignment due dates as calendar events",
    ],
  },
  {
    id: "outlook",
    name: "Microsoft 365 (Outlook)",
    description: "Access your Outlook mail and calendar, and create events from Nexus.",
    icon: "📧",
    authType: "oauth2",
    scopes: [
      "offline_access",
      "User.Read",
      "Mail.Read",
      "Calendars.ReadWrite",
      "Tasks.ReadWrite",
    ],
    permissions: [
      "Read your profile and email address",
      "Read your mail",
      "Read and create calendar events",
      "Read and import your To Do tasks",
    ],
  },
  // --- Coming soon (visible, not connectable) ----------------------------
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync events from your Google Calendar alongside everything else.",
    icon: "📅",
    authType: "oauth2",
    comingSoon: true,
    permissions: ["Read and write calendar events"],
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Log what you were listening to during a practice session.",
    icon: "🎧",
    authType: "oauth2",
    comingSoon: true,
    permissions: ["Read your recently played tracks"],
  },
  {
    id: "notion",
    name: "Notion Import",
    description: "Bring your existing Notion pages into Nexus Notes.",
    icon: "📝",
    authType: "oauth2",
    comingSoon: true,
    permissions: ["Read pages you share with Nexus"],
  },
  {
    id: "apple-health",
    name: "Apple Health",
    description: "Import workouts and activity from an Apple Health export file.",
    icon: "❤️",
    authType: "apikey",
    comingSoon: true,
    permissions: ["Read an exported Health archive you upload"],
  },
  {
    id: "strava",
    name: "Strava",
    description: "Pull in your runs and rides for the Athletics module.",
    icon: "🚴",
    authType: "oauth2",
    comingSoon: true,
    permissions: ["Read your activities"],
  },
];

export const INTEGRATION_MAP: Record<string, IntegrationAdapter> =
  Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i]));

export function getIntegration(id: string): IntegrationAdapter | undefined {
  return INTEGRATION_MAP[id];
}
