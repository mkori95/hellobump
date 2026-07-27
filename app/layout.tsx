import type { Metadata } from "next";
import { Fraunces, Nunito, Quicksand } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { BRAND } from "@/lib/branding";

// Three-font system:
// - Fraunces: headlines/hero moments — the day counter, "Today" card title,
//   page titles. Warm serif display weight with an italic cut for secondary
//   headline text (e.g. the size-comparison line).
// - Nunito: body text — paragraphs, descriptions, card content, chat messages.
// - Quicksand: UI chrome — buttons, nav items, small tags/pills/labels.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-headline",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ui",
});

// Falls back to localhost so metadata resolution never breaks in dev; in
// production this should be the real deployed URL (same value as
// NEXTAUTH_URL, which must be set post-deploy once Vercel assigns one).
const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  keywords: ["pregnancy tracker", "pregnancy app", "pregnancy companion", "baby names"],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${nunito.variable} ${quicksand.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
