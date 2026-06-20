import { ImageResponse } from "next/og";
import { OrbitMark } from "./icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon (iOS applies its own rounded mask, so render full-bleed).
export default function AppleIcon() {
  return new ImageResponse(<OrbitMark />, { ...size });
}
