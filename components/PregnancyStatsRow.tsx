import { CalendarDays, Baby, Layers, Hourglass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PregnancyStats } from "@/lib/pregnancy";
import type { LucideIcon } from "lucide-react";

const TRIMESTER_LABEL: Record<1 | 2 | 3, string> = {
  1: "First trimester",
  2: "Second trimester",
  3: "Third trimester",
};

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
        <Icon className="mb-1 h-5 w-5 text-primary" />
        <span className="font-display text-2xl font-semibold text-primary">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

export function PregnancyStatsRow({ stats }: { stats: PregnancyStats }) {
  const daysToGoLabel =
    stats.daysToGo > 0 ? `${stats.daysToGo}` : stats.daysToGo === 0 ? "Today!" : "Past due";
  const weekLabel =
    stats.dayOfWeek === 0 ? `${stats.week} weeks` : `${stats.week} weeks, ${stats.dayOfWeek} day${stats.dayOfWeek === 1 ? "" : "s"}`;

  return (
    <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4">
      <Stat icon={CalendarDays} label="Day" value={`${Math.max(1, stats.daysPregnant)}`} />
      <Stat icon={Baby} label={weekLabel} value={`${stats.week}`} />
      <Stat icon={Layers} label={TRIMESTER_LABEL[stats.trimester]} value={`${stats.trimester}`} />
      <Stat icon={Hourglass} label="Days to go" value={daysToGoLabel} />
    </div>
  );
}
