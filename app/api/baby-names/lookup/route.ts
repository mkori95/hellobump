import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { findExistingByName, lookupNameMeaning } from "@/lib/baby-names";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Enter a name to look up." }, { status: 400 });
  }

  // Check the shared dataset first — no need to ask the AI anything if it's
  // already there (possibly under a different gender listing).
  const existing = await findExistingByName(name);
  if (existing.length > 0) {
    return NextResponse.json({ type: "existing", matches: existing });
  }

  const suggestion = await lookupNameMeaning(name);
  if (!suggestion) {
    return NextResponse.json({
      type: "not_found",
      error: "Couldn't confidently find a meaning for that name right now.",
    });
  }

  return NextResponse.json({ type: "ai_suggested", suggestion });
}
