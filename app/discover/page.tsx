import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Palette, Wind } from "lucide-react";
import { createAdminSupabase, type DBPregnancyProfile } from "@/lib/supabase";
import { getOrCreateFaqAnswer, getOrCreateNewsDigest } from "@/lib/content-pipeline";
import { FAQ_TOPICS, DOOMSCROLL_TOPIC, WELLNESS_TOPIC } from "@/lib/content/faq-topics";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { NewsDigestCard } from "@/components/NewsDigestCard";
import { BookRecommendationsCard } from "@/components/BookRecommendationsCard";
import { FaqTileCard } from "@/components/FaqTileCard";
import { FaqAccordion } from "./FaqAccordion";

export default async function DiscoverPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle<Pick<DBPregnancyProfile, "id">>();

  if (!profile) {
    redirect("/setup");
  }

  const [faqs, newsDigest, doomscrollAnswer, wellnessAnswer] = await Promise.all([
    Promise.all(FAQ_TOPICS.map((t) => getOrCreateFaqAnswer(t.topic, t.question))),
    getOrCreateNewsDigest(),
    getOrCreateFaqAnswer(DOOMSCROLL_TOPIC.topic, DOOMSCROLL_TOPIC.question),
    getOrCreateFaqAnswer(WELLNESS_TOPIC.topic, WELLNESS_TOPIC.question),
  ]);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Discover"
          description="Answers to common worries, a calm digest, and a few good books — all in one stopping point, not another feed to scroll."
          imageSrc="/images/hero-mother.png"
          imageAlt="Illustration of a woman reading"
        />

        <div className="flex flex-col gap-6">
          <FaqAccordion faqs={faqs} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FaqTileCard title="Beyond the scroll" icon={Palette} answer={doomscrollAnswer} tint="peach" />
            <FaqTileCard title="Rest & relaxation" icon={Wind} answer={wellnessAnswer} tint="mint" />
          </div>

          <NewsDigestCard digest={newsDigest} />
          <BookRecommendationsCard />
        </div>
      </div>
    </AppShell>
  );
}
