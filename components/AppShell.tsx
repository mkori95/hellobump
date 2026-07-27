import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { SignOutButton } from "@/components/SignOutButton";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/branding";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/home" className="flex shrink-0 items-center font-display text-xl font-semibold text-primary">
            {BRAND.name}
          </Link>

          <div className="flex-1" />

          <AppNav />

          <div className="ml-2 flex shrink-0 items-center gap-2">
            <DarkModeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
