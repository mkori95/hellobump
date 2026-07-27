import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBChatMessage, type DBPregnancyProfile } from "@/lib/supabase";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { CompanionManager } from "./CompanionManager";

export default async function CompanionPage() {
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

  const { data: messages } = await admin
    .from("chat_messages")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true })
    .returns<DBChatMessage[]>();

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Your Companion"
          description="A friend to talk to about anything — how you're feeling, questions, or just to check in."
          imageSrc="/images/companion-hero.png"
          imageAlt="Illustration of two women talking"
        />
        <CompanionManager initialMessages={messages ?? []} nickname={session.user.nickname} />
      </div>
    </AppShell>
  );
}
