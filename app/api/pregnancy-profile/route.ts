import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBPregnancyProfile } from "@/lib/supabase";
import { DATING_METHODS, type DatingMethod } from "@/lib/pregnancy";

const VALID_METHODS = DATING_METHODS.map((m) => m.value);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("pregnancy_profile")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle<DBPregnancyProfile>();

  return NextResponse.json({ profile: data ?? null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const {
    datingMethod,
    datingDate,
    dueDate,
    dueDateAdjusted,
    notifyDailyCheckin,
    notifyAppointments,
    timezone,
  } = body ?? {};

  if (!VALID_METHODS.includes(datingMethod as DatingMethod)) {
    return NextResponse.json({ error: "Invalid dating method." }, { status: 400 });
  }
  if (!datingDate || !dueDate) {
    return NextResponse.json({ error: "Missing date." }, { status: 400 });
  }
  if (typeof notifyDailyCheckin !== "boolean" || typeof notifyAppointments !== "boolean") {
    return NextResponse.json(
      { error: "Please answer both notification questions." },
      { status: 400 }
    );
  }
  if (!timezone) {
    return NextResponse.json({ error: "Missing time zone." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return NextResponse.json(
      { error: "Server isn't configured yet — Supabase credentials are missing." },
      { status: 503 }
    );
  }

  const { error } = await admin.from("pregnancy_profile").upsert(
    {
      user_id: session.user.id,
      dating_method: datingMethod,
      dating_date: datingDate,
      due_date: dueDate,
      due_date_adjusted: !!dueDateAdjusted,
      notify_daily_checkin: notifyDailyCheckin,
      notify_appointments: notifyAppointments,
      timezone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Could not save your pregnancy profile." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
