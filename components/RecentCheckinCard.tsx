import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DBDailyCheckin } from "@/lib/supabase";

function formatCheckinDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function RecentCheckinCard({ checkin }: { checkin: DBDailyCheckin | null }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-accent/50 px-5 py-3">
        <HeartHandshake className="h-4 w-4 text-primary" />
        <p className="font-display text-base font-semibold text-accent-foreground">Recent check-in</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {checkin ? (
          <div className="text-sm">
            <p className="font-medium">{formatCheckinDate(checkin.checkin_date)}</p>
            {checkin.mood_text && (
              <p className="mt-1 text-muted-foreground">{checkin.mood_text}</p>
            )}
            {checkin.symptoms.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Symptoms logged: {checkin.symptoms.length}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No check-ins yet — log how you&apos;re feeling to start tracking patterns.
          </p>
        )}
        <Link
          href="/checkin"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto self-start")}
        >
          {checkin ? "View check-in history" : "Log a check-in"}
        </Link>
      </CardContent>
    </Card>
  );
}
