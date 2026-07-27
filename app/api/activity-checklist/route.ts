import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBActivityChecklistProgress, type DBPregnancyProfile } from "@/lib/supabase";
import { getLocalDateISO } from "@/lib/timezone";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("timezone")
    .eq("user_id", session.user.id)
    .maybeSingle<Pick<DBPregnancyProfile, "timezone">>();

  const today = getLocalDateISO(profile?.timezone);

  const { data, error } = await admin
    .from("activity_checklist_progress")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("checklist_date", today)
    .maybeSingle<DBActivityChecklistProgress>();

  if (error) {
    return NextResponse.json({ error: "Could not load today's checklist." }, { status: 500 });
  }

  return NextResponse.json({ date: today, checkedItems: data?.checked_items ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { checkedItems } = body ?? {};

  if (!Array.isArray(checkedItems)) {
    return NextResponse.json({ error: "checkedItems must be a list." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("timezone")
    .eq("user_id", session.user.id)
    .maybeSingle<Pick<DBPregnancyProfile, "timezone">>();

  const today = getLocalDateISO(profile?.timezone);

  const { error } = await admin.from("activity_checklist_progress").upsert(
    {
      user_id: session.user.id,
      checklist_date: today,
      checked_items: checkedItems,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,checklist_date" }
  );

  if (error) {
    return NextResponse.json({ error: "Could not save today's checklist." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
