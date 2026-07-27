import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { babyNameId, saved } = body ?? {};

  if (typeof babyNameId !== "string" || typeof saved !== "boolean") {
    return NextResponse.json({ error: "babyNameId and saved are required." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  if (saved) {
    const { error } = await admin
      .from("saved_baby_names")
      .upsert({ user_id: session.user.id, baby_name_id: babyNameId }, { onConflict: "user_id,baby_name_id" });
    if (error) {
      return NextResponse.json({ error: "Could not save that name." }, { status: 500 });
    }
  } else {
    const { error } = await admin
      .from("saved_baby_names")
      .delete()
      .eq("user_id", session.user.id)
      .eq("baby_name_id", babyNameId);
    if (error) {
      return NextResponse.json({ error: "Could not remove that name." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
