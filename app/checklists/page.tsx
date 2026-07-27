import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBChecklistProgress, type DBPregnancyProfile } from "@/lib/supabase";
import { getOrCreateChecklist, type ChecklistType } from "@/lib/content-pipeline";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { ChecklistsManager } from "./ChecklistsManager";

const CHECKLIST_TYPES: ChecklistType[] = ["hospital_bag", "last_minute_todos", "birth_plan_template"];

export default async function ChecklistsPage() {
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

  const [checklists, { data: progress }] = await Promise.all([
    Promise.all(CHECKLIST_TYPES.map((type) => getOrCreateChecklist(type))),
    admin
      .from("checklist_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .returns<DBChecklistProgress[]>(),
  ]);

  const progressByType = new Map((progress ?? []).map((p) => [p.checklist_type, p.checked_items]));

  const initialChecklists = checklists.map((content, i) => ({
    checklistType: CHECKLIST_TYPES[i],
    content,
    checkedItems: progressByType.get(CHECKLIST_TYPES[i]) ?? [],
  }));

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="Checklists"
          description="Hospital bag, last-minute to-dos, and your birth plan — sourced from NHS and Office on Women's Health, with a real checkbox for each item."
          imageSrc="/images/checklist-hero.png"
          imageAlt="Illustration of a checklist with a baby icon"
        />
        <ChecklistsManager initialChecklists={initialChecklists} />
      </div>
    </AppShell>
  );
}
