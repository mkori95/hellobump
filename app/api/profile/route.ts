import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBUser } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data: user } = await admin
    .from("users")
    .select("full_name, nickname, date_of_birth, email")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, nickname, dateOfBirth, email, currentPassword, newPassword } = body ?? {};

  if (!fullName || !nickname || !dateOfBirth || !email) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const normalizedEmail = String(email).toLowerCase().trim();

  const update: Partial<DBUser> = {
    full_name: fullName,
    nickname,
    date_of_birth: dateOfBirth,
    email: normalizedEmail,
  };

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Enter your current password to set a new one." },
        { status: 400 }
      );
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const { data: user } = await admin
      .from("users")
      .select("password_hash")
      .eq("id", session.user.id)
      .maybeSingle<Pick<DBUser, "password_hash">>();

    const valid = user && (await bcrypt.compare(currentPassword, user.password_hash));
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    update.password_hash = await bcrypt.hash(newPassword, 10);
  }

  if (normalizedEmail !== session.user.email) {
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Another account already uses that email." },
        { status: 409 }
      );
    }
  }

  const { error } = await admin.from("users").update(update).eq("id", session.user.id);

  if (error) {
    return NextResponse.json({ error: "Could not update your profile." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
