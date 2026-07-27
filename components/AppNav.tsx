"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/checkin", label: "Check-in" },
  { href: "/companion", label: "Companion" },
  { href: "/appointments", label: "Appointments" },
  { href: "/checklists", label: "Checklists" },
  { href: "/activity", label: "Activity" },
  { href: "/food", label: "Food & Nutrition" },
  { href: "/discover", label: "Discover" },
  { href: "/names", label: "Baby Names" },
  { href: "/profile", label: "Profile" },
];

// Desktop-only horizontal nav — below md, AppShell renders MobileNav's
// hamburger + slide-out drawer instead (a scrollable pill row doesn't work
// well as a primary nav on a phone-width screen).
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 font-ui text-sm md:flex">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
