import Link from "next/link";
import { Heart } from "lucide-react";
import { BRAND } from "@/lib/branding";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="mb-4 text-center text-xs text-muted-foreground">
          This isn&apos;t a substitute for your doctor&apos;s advice — always check with your provider
          about anything that concerns you.
        </p>

        <div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
          <Link href="/" className="flex items-center gap-1.5 font-display text-base font-semibold text-primary">
            <Heart className="h-4 w-4 fill-primary text-primary" />
            {BRAND.name}
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">© {year} {BRAND.name}</p>
        </div>
      </div>
    </footer>
  );
}
