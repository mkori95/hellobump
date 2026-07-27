import Link from "next/link";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/branding";

export const metadata = {
  title: `Terms — ${BRAND.name}`,
  description: `Terms of use for ${BRAND.name}.`,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-6 last:border-0">
      <h2 className="mb-2 text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function TermsPage() {
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
          <h1 className="font-display text-hero font-semibold">Terms</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Last updated: July 2026</p>
        </div>

        <div className="space-y-6">
          <Section title="Medical disclaimer">
            <p>
              {BRAND.name} is provided as a personal, informational tool and is not a medical
              device, a substitute for professional medical advice, diagnosis, or treatment, and is
              not provided by a licensed healthcare service. Always talk to your doctor or midwife
              about your pregnancy and any symptoms you&apos;re experiencing — especially anything
              urgent.
            </p>
            <p>
              Content shown in the app is retrieved from public health sources (such as the NHS,
              Office on Women&apos;s Health, MedlinePlus, and ICMR-NIN) and phrased with AI
              assistance. It is provided as-is, without warranty of accuracy or completeness, and
              should never replace medical care.
            </p>
          </Section>

          <Section title="Access">
            <p>
              {BRAND.name} is currently invite-only. Access may be granted or revoked at any time,
              and the service may change, pause, or be discontinued without notice — it&apos;s a
              personal project, not a commercial product with guaranteed uptime.
            </p>
          </Section>

          <Section title="Your account">
            <p>
              You&apos;re responsible for keeping your login credentials secure and for the accuracy
              of the information you enter. You can delete your account and all associated data at
              any time from Profile → Danger zone.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>
              Use {BRAND.name} for personal, informational, non-commercial purposes only. Don&apos;t
              use it to seek emergency medical care — if something feels urgent, contact your
              doctor, midwife, or local emergency services directly.
            </p>
          </Section>

          <Section title="No warranty">
            <p>
              {BRAND.name} is provided &ldquo;as-is,&rdquo; without warranties of any kind, express
              or implied. We make no guarantees about accuracy, availability, or fitness for a
              particular purpose.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              {BRAND.name} and its creator aren&apos;t liable for any damages arising from your use
              of, or inability to use, the app — including any decisions made based on its content.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              These terms may be updated as the app changes. Continued use after an update means you
              accept the revised terms.
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
