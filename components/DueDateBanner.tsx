import { CalendarHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DueDateBanner({ dueDate }: { dueDate: string }) {
  const formatted = new Date(`${dueDate}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Card className="border-primary/30 bg-accent">
      <CardContent className="flex items-center gap-3 p-4">
        <CalendarHeart className="h-6 w-6 shrink-0 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Your due date</p>
          <p className="font-display text-lg font-semibold text-accent-foreground">{formatted}</p>
        </div>
      </CardContent>
    </Card>
  );
}
