import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBActivityLog } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("activity_log")
    .select("*")
    .eq("user_id", session.user.id)
    .order("activity_date", { ascending: false })
    .returns<DBActivityLog[]>();

  if (error) {
    return NextResponse.json({ error: "Could not load activity log." }, { status: 500 });
  }

  return NextResponse.json({ activities: data ?? [] });
}

export async function POST(req: Request) {
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
    .insert({
      user_id: session.user.id,
      activity_date: date,
      description,
    })
    .select()
    .single<DBActivityLog>();

  if (error) {
    return NextResponse.json({ error: "Could not log activity." }, { status: 500 });
  }

  return NextResponse.json({ activity: data });
}
