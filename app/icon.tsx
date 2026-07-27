import { ImageResponse } from "next/og";

// Next.js file-convention favicon — auto-wired into <head> with no manual
// <link> tags needed. Generated at build/request time via next/og (Satori),
// so no external image tooling or binary assets required.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EA526C",
          borderRadius: 8,
          color: "white",
          fontSize: 22,
        }}
      >
        ♥
      </div>
    ),
    { ...size }
  );
}
