import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function PageHero({
  title,
  description,
  imageSrc,
  imageAlt,
  placeholderIcon: PlaceholderIcon = Sparkles,
}: {
  title: string;
  description: string;
  /** Omit while a real hero image isn't ready yet — a soft icon placeholder
   *  renders in its place instead of a broken <img>. Swap in imageSrc later,
   *  no other changes needed. */
  imageSrc?: string;
  imageAlt?: string;
  placeholderIcon?: LucideIcon;
}) {
  return (
    <section className="flex flex-col items-center gap-4 pb-6 sm:flex-row sm:gap-6">
      <div className="order-2 flex-1 text-center sm:order-1 sm:text-left">
        <h1 className="font-display text-heading font-semibold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="order-1 aspect-square w-full max-w-[140px] shrink-0 overflow-hidden rounded-2xl shadow-sm sm:order-2">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={imageAlt ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-baby-lavender/60">
            <PlaceholderIcon className="h-10 w-10 text-baby-lavender-foreground" />
          </div>
        )}
      </div>
    </section>
  );
}
