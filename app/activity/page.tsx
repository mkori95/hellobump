import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  createAdminSupabase,
  type DBActivityChecklistProgress,
  type DBActivityLog,
  type DBPregnancyProfile,
} from "@/lib/supabase";
import { getPregnancyStats } from "@/lib/pregnancy";
import { getOrCreateActivityContent } from "@/lib/content-pipeline";
import { getLocalDateISO } from "@/lib/timezone";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { ActivityManager } from "./ActivityManager";
import { ActivityRecommendationCard } from "@/components/ActivityRecommendationCard";
import { DailyActivityChecklist } from "@/components/DailyActivityChecklist";

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("due_date, timezone")
    .eq("user_id", session.user.id)
    .maybeSingle<Pick<DBPregnancyProfile, "due_date" | "timezone">>();

  if (!profile) {
    redirect("/setup");
  }

  const stats = getPregnancyStats(profile.due_date);
  const today = getLocalDateISO(profile.timezone);

  const [{ data: activities }, recommendation, { data: checklistProgress }] = await Promise.all([
    admin
      .from("activity_log")
      .select("*")
      .eq("user_id", session.user.id)
      .order("activity_date", { ascending: false })
      .returns<DBActivityLog[]>(),
    getOrCreateActivityContent(stats.trimester),
    admin
      .from("activity_checklist_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("checklist_date", today)
      .maybeSingle<DBActivityChecklistProgress>(),
  ]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Activity & Rest"
          description="Gentle movement matters as much as rest right now — here's what's recommended for your trimester, and a simple way to track what you actually got to today."
          imageSrc="/images/activity-hero.png"
          imageAlt="Illustration of a pregnant woman practicing calm, seated stretches"
        />

        <div className="flex flex-col gap-6">
          <ActivityRecommendationCard recommendation={recommendation} />

          <DailyActivityChecklist
            items={recommendation?.recommendations.map((r) => r.label) ?? []}
            initialCheckedItems={checklistProgress?.checked_items ?? []}
          />

          <ActivityManager initialActivities={activities ?? []} />
        </div>
      </div>
    </AppShell>
  );
}
