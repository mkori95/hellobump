import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBPregnancyProfile } from "@/lib/supabase";
import { getPregnancyStats } from "@/lib/pregnancy";
import { getOrCreateFoodRecommendations } from "@/lib/content-pipeline";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { FoodRecommendationCard } from "@/components/FoodRecommendationCard";

export default async function FoodPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("due_date")
    .eq("user_id", session.user.id)
    .maybeSingle<Pick<DBPregnancyProfile, "due_date">>();

  if (!profile) {
    redirect("/setup");
  }

  const stats = getPregnancyStats(profile.due_date);
  const recommendation = await getOrCreateFoodRecommendations(
    `trimester:${stats.trimester}`,
    `trimester ${stats.trimester}`
  );

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Food & Nutrition"
          description="Foods that fit where you are right now, plus gentle Indian remedies for whatever you've been feeling — grounded in official nutrition guidance, not guesswork."
          imageSrc="/images/food-hero.png"
          imageAlt="Illustration of a pregnant woman with fresh fruits and vegetables"
        />

        <FoodRecommendationCard recommendation={recommendation} />
      </div>
    </AppShell>
  );
}
