import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBChecklistProgress } from "@/lib/supabase";
import { getOrCreateChecklist, type ChecklistType } from "@/lib/content-pipeline";

const CHECKLIST_TYPES: ChecklistType[] = ["hospital_bag", "last_minute_todos", "birth_plan_template"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();

  const [checklists, { data: progress }] = await Promise.all([
    Promise.all(CHECKLIST_TYPES.map((type) => getOrCreateChecklist(type))),
    admin
      .from("checklist_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .returns<DBChecklistProgress[]>(),
  ]);

  const progressByType = new Map((progress ?? []).map((p) => [p.checklist_type, p.checked_items]));

  return NextResponse.json({
    checklists: checklists.map((c, i) => ({
      content: c,
      checklistType: CHECKLIST_TYPES[i],
      checkedItems: progressByType.get(CHECKLIST_TYPES[i]) ?? [],
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { checklistType, checkedItems } = body ?? {};

  if (!CHECKLIST_TYPES.includes(checklistType) || !Array.isArray(checkedItems)) {
    return NextResponse.json({ error: "Invalid checklist update." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from("checklist_progress").upsert(
    {
      user_id: session.user.id,
      checklist_type: checklistType,
      checked_items: checkedItems,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,checklist_type" }
  );

  if (error) {
    return NextResponse.json({ error: "Could not save checklist progress." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
