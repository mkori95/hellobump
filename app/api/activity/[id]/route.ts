import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBActivityLog } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { date, description } = body ?? {};

  if (!date || !description) {
    return NextResponse.json({ error: "Date and description are required." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("activity_log")
    .update({
      activity_date: date,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .select()
    .maybeSingle<DBActivityLog>();

  if (error) {
    return NextResponse.json({ error: "Could not update activity." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  return NextResponse.json({ activity: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("activity_log")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Could not delete activity." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
