import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAdminSupabase, type DBChatMessage, type DBDailyCheckin } from "@/lib/supabase";
import { buildChatResponse } from "@/lib/chat-rag";

const HISTORY_CONTEXT_LIMIT = 10;
const CHECKIN_CONTEXT_LIMIT = 5;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("chat_messages")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true })
    .returns<DBChatMessage[]>();

  if (error) {
    return NextResponse.json({ error: "Could not load your conversation." }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json();
  const { message } = body ?? {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const [{ data: recentMessages }, { data: recentCheckins }] = await Promise.all([
    admin
      .from("chat_messages")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_CONTEXT_LIMIT)
      .returns<DBChatMessage[]>(),
    admin
      .from("daily_checkins")
      .select("*")
      .eq("user_id", session.user.id)
      .order("checkin_date", { ascending: false })
      .limit(CHECKIN_CONTEXT_LIMIT)
      .returns<DBDailyCheckin[]>(),
  ]);

  const { data: userMsgRow, error: userInsertError } = await admin
    .from("chat_messages")
    .insert({ user_id: session.user.id, role: "user", content: message.trim() })
    .select()
    .single<DBChatMessage>();

  if (userInsertError || !userMsgRow) {
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }

  const { hasRedFlag, responseText, sourcesUsed } = await buildChatResponse({
    userMessage: message.trim(),
    recentMessages: (recentMessages ?? []).reverse(),
    recentCheckins: recentCheckins ?? [],
  });

  const { data: assistantMsgRow, error: assistantInsertError } = await admin
    .from("chat_messages")
    .insert({
      user_id: session.user.id,
      role: "assistant",
      content: responseText,
      has_red_flag: hasRedFlag,
      sources_used: sourcesUsed,
    })
    .select()
    .single<DBChatMessage>();

  if (assistantInsertError || !assistantMsgRow) {
    return NextResponse.json({ error: "Could not save the reply." }, { status: 500 });
  }

  return NextResponse.json({ userMessage: userMsgRow, assistantMessage: assistantMsgRow });
}
