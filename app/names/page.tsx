import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBPregnancyProfile } from "@/lib/supabase";
import { ensureBabyNamesSeeded, getAllBabyNames, getSavedNameIds } from "@/lib/baby-names";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { NamesManager } from "./NamesManager";

export default async function NamesPage() {
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

  await ensureBabyNamesSeeded();

  const [names, savedIds] = await Promise.all([getAllBabyNames(), getSavedNameIds(session.user.id)]);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Baby Names"
          description="Browse names by style, origin, and meaning, describe what you're looking for and get a curated shortlist, and save your favorites as you go."
          imageSrc="/images/baby_names.png"
          imageAlt="Illustration of a woman shrugging next to a question mark, thinking about baby names"
        />
        <NamesManager initialNames={names} initialSavedIds={savedIds} />
      </div>
    </AppShell>
  );
}
