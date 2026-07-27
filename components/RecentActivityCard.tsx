import Link from "next/link";
import { Footprints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DBActivityLog } from "@/lib/supabase";

function formatActivityDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function RecentActivityCard({ activity }: { activity: DBActivityLog | null }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-mint/60 px-5 py-3">
        <Footprints className="h-4 w-4 text-baby-mint-foreground" />
        <p className="font-display text-base font-semibold text-baby-mint-foreground">Recent activity</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {activity ? (
          <div className="text-sm">
            <p className="font-medium">{formatActivityDate(activity.activity_date)}</p>
            <p className="mt-1 text-muted-foreground">{activity.description}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing logged yet — track a walk or stretch to see it here.
          </p>
        )}
        <Link
          href="/activity"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto self-start")}
        >
          {activity ? "View activity log" : "Log an activity"}
        </Link>
      </CardContent>
    </Card>
  );
}
