import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { suggestBabyNames } from "@/lib/baby-names";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { description, gender } = body ?? {};

  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Describe what you're looking for." }, { status: 400 });
  }

  const genderFilter = gender === "girl" || gender === "boy" || gender === "unisex" ? gender : undefined;

  const result = await suggestBabyNames({ description: description.trim(), genderFilter });
  return NextResponse.json(result);
}
