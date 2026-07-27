import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase } from "@/lib/supabase";

export async function DELETE(_req: Request, { params }: { params: { date: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("daily_checkins")
    .delete()
    .eq("user_id", session.user.id)
    .eq("checkin_date", params.date)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Could not delete check-in." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Check-in not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
