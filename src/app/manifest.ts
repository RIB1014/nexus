import type { MetadataRoute } from "next";

// Web App Manifest — makes Orbit installable to the phone home screen as a
// standalone app (Android/Chrome read this; iOS uses the apple-icon + meta).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orbit",
    short_name: "Orbit",
    description: "Your modular productivity home — tasks, calendar, habits, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0f",
    theme_color: "#5b6cf0",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
