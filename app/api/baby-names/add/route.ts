import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { addCustomName } from "@/lib/baby-names";
import { createAdminSupabase } from "@/lib/supabase";
import { BABY_NAME_STYLE_TAGS } from "@/lib/content/baby-names-seed";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { name, gender, origin, meaning, styleTags, saveToShortlist } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (gender !== "girl" && gender !== "boy" && gender !== "unisex") {
    return NextResponse.json({ error: "Invalid gender." }, { status: 400 });
  }
  if (typeof origin !== "string" || !origin.trim() || typeof meaning !== "string" || !meaning.trim()) {
    return NextResponse.json({ error: "Origin and meaning are required." }, { status: 400 });
  }

  const cleanTags = Array.isArray(styleTags)
    ? styleTags.filter((t): t is string => (BABY_NAME_STYLE_TAGS as readonly string[]).includes(t))
    : [];

  const newName = await addCustomName({ name, gender, origin, meaning, styleTags: cleanTags });
  if (!newName) {
    return NextResponse.json({ error: "Could not save that name." }, { status: 500 });
  }

  if (saveToShortlist) {
    const admin = createAdminSupabase();
    await admin
      .from("saved_baby_names")
      .upsert({ user_id: session.user.id, baby_name_id: newName.id }, { onConflict: "user_id,baby_name_id" });
  }

  return NextResponse.json({ ok: true, name: newName });
}
