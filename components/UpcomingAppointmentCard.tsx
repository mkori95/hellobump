import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DBAppointment } from "@/lib/supabase";

function formatAppt(date: string, time: string) {
  const d = new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const [h, m] = time.split(":").map(Number);
  const t = new Date();
  t.setHours(h, m, 0, 0);
  return `${d} at ${t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function UpcomingAppointmentCard({ appointment }: { appointment: DBAppointment | null }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-blue/60 px-5 py-3">
        <CalendarDays className="h-4 w-4 text-baby-blue-foreground" />
        <p className="font-display text-base font-semibold text-baby-blue-foreground">Upcoming appointment</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {appointment ? (
          <div className="text-sm">
            <p className="font-medium">{formatAppt(appointment.appointment_date, appointment.appointment_time)}</p>
            {appointment.notes && <p className="mt-1 text-muted-foreground">{appointment.notes}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
        )}
        <Link
          href="/appointments"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto self-start")}
        >
          {appointment ? "View all appointments" : "Add an appointment"}
        </Link>
      </CardContent>
    </Card>
  );
}
