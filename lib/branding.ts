// Single source of truth for the app's public-facing name and copy.
// Working name — likely to change if/when commercialized, so nothing
// outside this file should hardcode "HelloBump".

export const BRAND = {
  name: "HelloBump",
  shortName: "HelloBump",
  tagline: "Your calm, friendly pregnancy companion",
  description:
    "Track your pregnancy day by day with personalized daily insights, symptom-aware tips, appointment reminders, and a friendly chat companion.",
  // Placeholder inbox — no domain yet. Re-route this to a real address via
  // Resend (or just a personal inbox) once one exists; update in this one
  // place and every page referencing it picks it up automatically.
  supportEmail: "hellobump@support.com",
} as const;
