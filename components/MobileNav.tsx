"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/AppNav";
import { cn } from "@/lib/utils";

// Mobile-only hamburger trigger + slide-out drawer. Sits leftmost in the
// header (before the brand mark) — the horizontal AppNav pill row doesn't
// fit a phone-width screen without becoming an awkward scrollable strip, so
// below md this replaces it entirely (AppNav itself is hidden md:flex).
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal target (document.body) only exists client-side, after mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close the drawer automatically on navigation, and don't leave it open
  // (with the body unscrollable) if the component unmounts mid-open.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawer = open && (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
      <nav className="relative flex h-full w-72 max-w-[80vw] flex-col gap-1 overflow-y-auto bg-background p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-primary">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-2.5 font-ui text-sm font-medium transition-colors",
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
    </div>
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Rendered via portal straight onto <body> — the header uses
          backdrop-blur (a backdrop-filter), which establishes a CSS
          containing block for position: fixed descendants. Without the
          portal, "fixed inset-0" here would be trapped inside the header's
          own bounding box instead of covering the viewport. */}
      {mounted && drawer && createPortal(drawer, document.body)}
    </div>
  );
}
