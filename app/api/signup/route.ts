import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminSupabase } from "@/lib/supabase";
import { isSignupOpen } from "@/lib/signup-mode";

export async function POST(req: Request) {
  const body = await req.json();
  const { fullName, nickname, dateOfBirth, email, password, inviteCode } = body ?? {};

  if (!fullName || !nickname || !dateOfBirth || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Invite-only gate — the real enforcement point (the client-side field is
  // just UX; a request that skips it entirely still hits this check). Fails
  // closed: if signup isn't explicitly opened AND no invite code is
  // configured server-side, nobody can sign up rather than silently letting
  // everyone through.
  if (!isSignupOpen()) {
    const required = process.env.SIGNUP_INVITE_CODE;
    if (!required) {
      return NextResponse.json(
        { error: "Signup isn't open yet — ask for an invite link." },
        { status: 503 }
      );
    }
    if (typeof inviteCode !== "string" || inviteCode.trim() !== required) {
      return NextResponse.json({ error: "That invite code isn't valid." }, { status: 403 });
    }
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return NextResponse.json(
      { error: "Server isn't configured yet — Supabase credentials are missing." },
      { status: 503 }
    );
  }

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error } = await admin.from("users").insert({
    full_name: fullName,
    nickname,
    date_of_birth: dateOfBirth,
    email: normalizedEmail,
    password_hash: passwordHash,
  });

  if (error) {
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
