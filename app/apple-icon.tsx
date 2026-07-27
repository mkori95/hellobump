import { ImageResponse } from "next/og";

// Apple touch icon (used for "Add to Home Screen") — same file-convention
// approach as app/icon.tsx.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          color: "white",
          fontSize: 108,
        }}
      >
        ♥
      </div>
    ),
    { ...size }
  );
}
