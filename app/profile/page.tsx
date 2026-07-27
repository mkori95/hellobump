import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBUser, type DBPregnancyProfile } from "@/lib/supabase";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();

  const [{ data: user }, { data: profile }] = await Promise.all([
    admin
      .from("users")
      .select("full_name, nickname, date_of_birth, email")
      .eq("id", session.user.id)
      .maybeSingle<Pick<DBUser, "full_name" | "nickname" | "date_of_birth" | "email">>(),
    admin
      .from("pregnancy_profile")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle<DBPregnancyProfile>(),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:max-w-screen-lg lg:px-8">
        <PageHero
          title="My Profile"
          description="Update your details, pregnancy dating, and notification preferences — or manage your account below."
          imageSrc="/images/about-hero.png"
          imageAlt="Illustration of a woman gently holding her pregnant belly"
        />
        <ProfileForm user={user} profile={profile} />
      </div>
    </AppShell>
  );
}
