import Link from "next/link";
import { Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DiscoverTeaserCard() {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-peach/60 px-5 py-3">
        <Compass className="h-4 w-4 text-baby-peach-foreground" />
        <p className="font-display text-base font-semibold text-baby-peach-foreground">Discover</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        <p className="text-sm text-muted-foreground">
          Answers to common worries, a calm digest, and a few good books — one stopping point, not a feed.
        </p>
        <Link href="/discover" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto self-start")}>
          Take a look
        </Link>
      </CardContent>
    </Card>
  );
}
