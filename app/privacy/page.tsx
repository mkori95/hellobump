import Link from "next/link";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/branding";

export const metadata = {
  title: `Privacy — ${BRAND.name}`,
  description: `How ${BRAND.name} handles your data.`,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-6 last:border-0">
      <h2 className="mb-2 text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold text-primary">
          {BRAND.name}
        </Link>
        <DarkModeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-hero font-semibold">Privacy</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Last updated: July 2026</p>
        </div>

        <div className="space-y-6">
          <Section title="What this is">
            <p>
              {BRAND.name} is a small, personal pregnancy-companion app — currently invite-only,
              built for one family rather than the general public. This page explains what happens
              to your data if you use it.
            </p>
          </Section>

          <Section title="Data we collect">
            <p>
              Account details you provide at signup (full name, nickname, date of birth, email,
              password — passwords are hashed and never stored or logged in plain text), and the
              pregnancy-related information you choose to enter: due date and dating method, daily
              check-ins (mood notes and symptoms), appointments, activity logs, chat messages with
              the AI companion, and any names you save in the Baby Names explorer.
            </p>
          </Section>

          <Section title="How your data is used">
            <p>
              Solely to power your own experience of the app — showing your own check-in history,
              personalizing weekly content to your stage of pregnancy, and giving the chat
              companion context about how you&apos;ve recently been feeling. Your data is never
              sold, shared with advertisers, or used to train external AI models.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>This app is built on a small number of infrastructure providers:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">Supabase</span> — hosts the database
                that stores your account and pregnancy data.
              </li>
              <li>
                <span className="font-medium text-foreground">Anthropic (Claude API)</span> — used
                server-side to phrase weekly content, symptom tips, and chat responses. Only the
                specific text needed for that request (e.g. a symptom name or your chat message) is
                sent — never your name, email, or full profile.
              </li>
              <li>
                <span className="font-medium text-foreground">Vercel</span> — hosts the application
                itself.
              </li>
            </ul>
            <p>
              Health/wellness content is also grounded in public sources — NHS, Office on
              Women&apos;s Health, MedlinePlus, and ICMR-NIN — but these are one-way informational
              sources the app reads from; no personal data is ever sent to them.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Just one: a session cookie from NextAuth that keeps you signed in. No analytics,
              advertising, or tracking cookies are used.
            </p>
          </Section>

          <Section title="Data retention & deletion">
            <p>
              You can permanently delete your account at any time from Profile → Danger zone. This
              removes your profile, check-ins, appointments, activity logs, chat history, and saved
              names — it can&apos;t be undone.
            </p>
          </Section>

          <Section title="Children">
            <p>{BRAND.name} is not directed at or intended for use by children.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If this project is ever opened up beyond invite-only personal use, this page will be
              updated with a fuller policy before that happens.
            </p>
          </Section>

          <Section title="Contact">
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="text-primary underline underline-offset-2"
            >
              {BRAND.supportEmail}
            </a>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
