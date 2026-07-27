import Link from "next/link";
import { HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

export const metadata = {
  title: `About — ${BRAND.name}`,
  description: BRAND.description,
};

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Grounded, not guessed",
    body: "Every piece of health content is retrieved from trusted sources like the NHS, Office on Women's Health, and MedlinePlus before it's ever phrased by AI — never invented.",
  },
  {
    icon: HeartHandshake,
    title: "A friend, not a chart",
    body: "Pregnancy trackers can feel clinical. HelloBump is built to feel like a warm check-in from someone who's cheering you on.",
  },
  {
    icon: Users,
    title: "Built for one, made with care",
    body: "HelloBump started as a personal project for someone we love, designed around what actually helps day to day — not a generic feature checklist.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold text-primary">
          {BRAND.name}
        </Link>
        <DarkModeToggle />
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-10 sm:px-6 md:flex-row md:py-16">
          <div className="order-2 flex-1 text-center md:order-1 md:text-left">
            <h1 className="font-display text-hero font-semibold sm:text-4xl">
              About {BRAND.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {BRAND.description}
            </p>
            <div className="mt-6">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
                Get started
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                {BRAND.name} is invite-only right now — you&apos;ll need an invite code to sign up.
              </p>
            </div>
          </div>
          <div className="order-1 w-full max-w-xs shrink-0 md:order-2 md:max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/about-hero.png"
              alt="Illustration of a woman gently holding her pregnant belly"
              className="w-full rounded-3xl object-cover shadow-sm"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <p className="mb-1.5 font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <p>Not a substitute for advice from your doctor or midwife.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
