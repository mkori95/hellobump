import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBDailyCheckin, type DBPregnancyProfile, type DBSymptomKnowledgeBase } from "@/lib/supabase";
import { getLocalDateISO } from "@/lib/timezone";
import { buildCheckinResponse } from "@/lib/checkin-rag";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("daily_checkins")
    .select("*")
    .eq("user_id", session.user.id)
    .order("checkin_date", { ascending: false })
    .returns<DBDailyCheckin[]>();

  if (error) {
    return NextResponse.json({ error: "Could not load check-ins." }, { status: 500 });
  }

  return NextResponse.json({ checkins: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { moodText, symptoms, date } = body ?? {};

  if (!Array.isArray(symptoms)) {
    return NextResponse.json({ error: "Symptoms must be a list." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("pregnancy_profile")
    .select("timezone")
    .eq("user_id", session.user.id)
    .maybeSingle<Pick<DBPregnancyProfile, "timezone">>();

  const checkinDate = date || getLocalDateISO(profile?.timezone);

  const { data: knowledgeBase } = await admin
    .from("symptom_knowledge_base")
    .select("*")
    .returns<DBSymptomKnowledgeBase[]>();

  const { hasRedFlag, responseText, sourcesUsed, foodRecommendations } = await buildCheckinResponse({
    moodText: moodText ?? "",
    selectedSymptoms: symptoms,
    knowledgeBase: knowledgeBase ?? [],
  });

  const { data, error } = await admin
    .from("daily_checkins")
    .upsert(
      {
        user_id: session.user.id,
        checkin_date: checkinDate,
        mood_text: moodText || null,
        symptoms,
        has_red_flag: hasRedFlag,
        response_text: responseText,
        sources_used: sourcesUsed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,checkin_date" }
    )
    .select()
    .single<DBDailyCheckin>();

  if (error) {
    return NextResponse.json({ error: "Could not save your check-in." }, { status: 500 });
  }

  return NextResponse.json({ checkin: data, foodRecommendations });
}
