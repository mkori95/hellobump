import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBSymptomKnowledgeBase } from "@/lib/supabase";

// Returns the symptom tag list for the check-in picker UI. Deliberately
// omits `tips`/`red_flag_message` — those are only ever used server-side
// during retrieval, not sent to the client ahead of time.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("symptom_knowledge_base")
    .select("symptom, display_name, is_red_flag")
    .order("is_red_flag", { ascending: true })
    .order("display_name", { ascending: true })
    .returns<Pick<DBSymptomKnowledgeBase, "symptom" | "display_name" | "is_red_flag">[]>();

  if (error) {
    return NextResponse.json({ error: "Could not load symptoms." }, { status: 500 });
  }

  return NextResponse.json({ symptoms: data ?? [] });
}
