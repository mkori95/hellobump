import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  createAdminSupabase,
  type DBDailyCheckin,
  type DBPregnancyProfile,
  type DBSymptomKnowledgeBase,
} from "@/lib/supabase";
import { getLocalDateISO } from "@/lib/timezone";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { CheckinManager } from "./CheckinManager";

export default async function CheckinPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("timezone")
    .eq("user_id", session.user.id)
    .maybeSingle<Pick<DBPregnancyProfile, "timezone">>();

  if (!profile) {
    redirect("/setup");
  }

  const [{ data: symptoms }, { data: checkins }] = await Promise.all([
    admin
      .from("symptom_knowledge_base")
      .select("symptom, display_name, is_red_flag, category")
      .order("is_red_flag", { ascending: true })
      .order("display_name", { ascending: true })
      .returns<Pick<DBSymptomKnowledgeBase, "symptom" | "display_name" | "is_red_flag" | "category">[]>(),
    admin
      .from("daily_checkins")
      .select("*")
      .eq("user_id", session.user.id)
      .order("checkin_date", { ascending: false })
      .returns<DBDailyCheckin[]>(),
  ]);

  const today = getLocalDateISO(profile.timezone);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Daily Check-in"
          description="A quick, no-pressure way to log how you're feeling — tap a tag or jot a note, and we'll surface warm, grounded tips for anything you flag."
          imageSrc="/images/checkin-hero.png"
          imageAlt="Illustration of a pregnant woman surrounded by mood and symptom thought bubbles"
        />
        <CheckinManager symptoms={symptoms ?? []} initialCheckins={checkins ?? []} today={today} />
      </div>
    </AppShell>
  );
}
