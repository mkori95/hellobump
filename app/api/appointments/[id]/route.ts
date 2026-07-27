import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBAppointment } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { date, time, notes } = body ?? {};

  if (!date || !time) {
    return NextResponse.json({ error: "Date and time are required." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("appointments")
    .update({
      appointment_date: date,
      appointment_time: time,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .select()
    .maybeSingle<DBAppointment>();

  if (error) {
    return NextResponse.json({ error: "Could not update appointment." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  return NextResponse.json({ appointment: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("appointments")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Could not delete appointment." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
