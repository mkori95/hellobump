import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/branding";

// Social share preview (link unfurls in iMessage/Slack/WhatsApp etc. don't
// respect robots.txt, so this still matters even while the site itself is
// deliberately kept out of search indexes).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FBEFEA 0%, #FDF8F5 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 72, color: "#EA526C" }}>
          <span>♥</span>
          <span style={{ fontWeight: 700 }}>{BRAND.name}</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#6B5B56" }}>{BRAND.tagline}</div>
      </div>
    ),
    { ...size }
  );
}
