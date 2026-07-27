import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  createAdminSupabase,
  type DBPregnancyProfile,
  type DBDailyCheckin,
  type DBAppointment,
  type DBActivityLog,
  type DBChatMessage,
} from "@/lib/supabase";
import { getPregnancyStats } from "@/lib/pregnancy";
import { getOrCreatePregnancyContent, getOrCreateFoodRecommendations } from "@/lib/content-pipeline";
import { AppShell } from "@/components/AppShell";
import { PregnancyStatsRow } from "@/components/PregnancyStatsRow";
import { DueDateBanner } from "@/components/DueDateBanner";
import { TodayCard } from "@/components/TodayCard";
import { RecentCheckinCard } from "@/components/RecentCheckinCard";
import { UpcomingAppointmentCard } from "@/components/UpcomingAppointmentCard";
import { RecentActivityCard } from "@/components/RecentActivityCard";
import { FoodTeaserCard } from "@/components/FoodTeaserCard";
import { ChatTeaserCard } from "@/components/ChatTeaserCard";
import { DiscoverTeaserCard } from "@/components/DiscoverTeaserCard";
import { BooksTeaserCard } from "@/components/BooksTeaserCard";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle<DBPregnancyProfile>();

  if (!profile) {
    redirect("/setup");
  }

  const stats = getPregnancyStats(profile.due_date);
  const today = new Date().toISOString().slice(0, 10);

  const [
    content,
    foodRecommendation,
    { data: recentCheckin },
    { data: upcomingAppointment },
    { data: recentActivity },
    { data: lastChatMessage },
  ] = await Promise.all([
    getOrCreatePregnancyContent(stats.week),
    getOrCreateFoodRecommendations(`trimester:${stats.trimester}`, `trimester ${stats.trimester}`),
    admin
      .from("daily_checkins")
      .select("*")
      .eq("user_id", session.user.id)
      .order("checkin_date", { ascending: false })
      .limit(1)
      .maybeSingle<DBDailyCheckin>(),
    admin
      .from("appointments")
      .select("*")
      .eq("user_id", session.user.id)
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(1)
      .maybeSingle<DBAppointment>(),
    admin
      .from("activity_log")
      .select("*")
      .eq("user_id", session.user.id)
      .order("activity_date", { ascending: false })
      .limit(1)
      .maybeSingle<DBActivityLog>(),
    admin
      .from("chat_messages")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<DBChatMessage>(),
  ]);

  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center lg:text-left">
          <h1 className="font-display text-hero font-semibold">
            Good morning, {session.user.nickname}!
          </h1>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex flex-col gap-6 lg:w-1/2">
            <DueDateBanner dueDate={profile.due_date} />
            <PregnancyStatsRow stats={stats} />
            <ChatTeaserCard lastMessage={lastChatMessage ?? null} />
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
              <RecentCheckinCard checkin={recentCheckin ?? null} />
              <UpcomingAppointmentCard appointment={upcomingAppointment ?? null} />
            </div>
          </div>

          <div className="lg:w-1/2">
            {content ? (
              <TodayCard content={content} />
            ) : (
              <Card className="h-full">
                <CardContent className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  Couldn&apos;t load this week&apos;s content right now — try again shortly.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RecentActivityCard activity={recentActivity ?? null} />
          <FoodTeaserCard recommendation={foodRecommendation} />
          <DiscoverTeaserCard />
          <BooksTeaserCard />
        </div>
      </section>
    </AppShell>
  );
}
