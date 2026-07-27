import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase } from "@/lib/supabase";
import { Footer } from "@/components/Footer";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminSupabase();
  const { data: existingProfile } = await admin
    .from("pregnancy_profile")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (existingProfile) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/baby.svg"
              alt=""
              aria-hidden
              className="mx-auto mb-4 h-32 w-auto"
            />
            <h1 className="font-display text-hero font-semibold">
              Hi {session.user.nickname}, let&apos;s get set up
            </h1>
            <p className="mt-2 text-muted-foreground">
              A few quick questions so we can track your journey accurately.
            </p>
          </div>
          <SetupForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
