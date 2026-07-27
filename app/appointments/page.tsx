import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBAppointment } from "@/lib/supabase";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { AppointmentsManager } from "./AppointmentsManager";

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();
  const { data: appointments } = await admin
    .from("appointments")
    .select("*")
    .eq("user_id", session.user.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .returns<DBAppointment[]>();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Appointments"
          description="Keep every prenatal visit, scan, and check-up in one place — add an appointment below and we'll keep the list sorted so you always know what's next."
          imageSrc="/images/appointments-hero.png"
          imageAlt="Illustration of a doctor holding an IV stand"
        />

        <AppointmentsManager initialAppointments={appointments ?? []} />
      </div>
    </AppShell>
  );
}
