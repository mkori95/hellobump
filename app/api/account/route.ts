import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBUser } from "@/lib/supabase";

// Deletes the account and everything tied to it. Every other table
// references users(id) with `on delete cascade`, so removing this one row
// takes the pregnancy profile (and future appointments/check-ins/chat
// history) with it — no separate cleanup needed.
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body ?? {};

  if (!password) {
    return NextResponse.json(
      { error: "Enter your password to confirm account deletion." },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();
  const { data: user } = await admin
    .from("users")
    .select("password_hash")
    .eq("id", session.user.id)
    .maybeSingle<Pick<DBUser, "password_hash">>();

  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const { error } = await admin.from("users").delete().eq("id", session.user.id);
  if (error) {
    return NextResponse.json({ error: "Could not delete account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
