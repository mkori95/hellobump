import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBAppointment } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("appointments")
    .select("*")
    .eq("user_id", session.user.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .returns<DBAppointment[]>();

  if (error) {
    return NextResponse.json({ error: "Could not load appointments." }, { status: 500 });
  }

  return NextResponse.json({ appointments: data ?? [] });
}

export async function POST(req: Request) {
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
    .insert({
      user_id: session.user.id,
      appointment_date: date,
      appointment_time: time,
      notes: notes || null,
    })
    .select()
    .single<DBAppointment>();

  if (error) {
    return NextResponse.json({ error: "Could not create appointment." }, { status: 500 });
  }

  return NextResponse.json({ appointment: data });
}
