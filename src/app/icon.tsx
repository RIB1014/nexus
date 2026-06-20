import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// The Orbit app icon — gradient tile with a luminous core, two crossing orbits,
// and satellites. Rendered at build time (no binary asset to maintain).
export default function Icon() {
  return new ImageResponse(<OrbitMark />, { ...size });
}

export function OrbitMark() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "linear-gradient(145deg, #8A93FF 0%, #5B6CF0 52%, #3A45B8 100%)",
      }}
    >
      {/* orbits */}
      <div
        style={{
          position: "absolute",
          width: 360,
          height: 150,
          borderRadius: 9999,
          border: "16px solid rgba(255,255,255,0.92)",
          transform: "rotate(-30deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 360,
          height: 150,
          borderRadius: 9999,
          border: "13px solid rgba(255,255,255,0.6)",
          transform: "rotate(32deg)",
        }}
      />
      {/* satellites */}
      <div style={{ position: "absolute", top: 150, right: 120, width: 52, height: 52, borderRadius: 9999, background: "#fff" }} />
      <div style={{ position: "absolute", bottom: 150, left: 110, width: 34, height: 34, borderRadius: 9999, background: "rgba(255,255,255,0.85)" }} />
      {/* core */}
      <div style={{ width: 132, height: 132, borderRadius: 9999, background: "#fff" }} />
    </div>
  );
}
