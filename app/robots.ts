// app/robots.ts — generates /robots.txt via Next.js Metadata API.
//
// This is a personal, invite-only health app with no domain yet — there's
// no upside to being indexed by search engines and a real downside (a
// pregnancy-tracking app showing up in someone's search results). Disallow
// everything until/unless that changes deliberately.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
