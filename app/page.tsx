import Link from "next/link";
import { HeartHandshake, MessageCircle, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  {
    icon: HeartHandshake,
    title: "A friend, not a chart",
    body: "Warm daily check-ins and a companion that actually notices how you've been feeling.",
  },
  {
    icon: ShieldCheck,
    title: "Grounded health info",
    body: "Every tip is retrieved from trusted sources like the NHS and MedlinePlus before it's ever phrased.",
  },
  {
    icon: MessageCircle,
    title: "No infinite scroll",
    body: "Every screen has a natural stopping point — this is a companion, not another feed to fall into.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <span className="font-display text-xl font-semibold text-primary">{BRAND.name}</span>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-10 sm:px-6 md:flex-row md:gap-12 md:py-20">
          <div className="order-2 flex-1 text-center md:order-1 md:text-left">
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {BRAND.tagline}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground md:mx-0">
              {BRAND.description}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
                Get started
              </Link>
              <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
                Log in
              </Link>
            </div>
          </div>

          <div className="order-1 w-full max-w-xs shrink-0 md:order-2 md:max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-mother.png"
              alt="Illustration of an expecting mother, little miracle"
              className="w-full rounded-3xl object-cover shadow-md"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 md:pb-24">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <p className="mb-1.5 font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
