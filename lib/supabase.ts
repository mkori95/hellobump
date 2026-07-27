// Public client → uses anon key (safe for browser, respects RLS)
// Admin client  → uses service role key (server-only, bypasses RLS)

import { createClient } from "@supabase/supabase-js";

// Falls back to a placeholder so the app can build/run before the Supabase
// project exists — real calls will fail until NEXT_PUBLIC_SUPABASE_URL and
// friends are set in .env.local, but the module won't crash on import.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Next.js's App Router patches the global `fetch` with its own Data Cache
// (persisted to .next/cache, force-cache by default) — and supabase-js uses
// fetch() internally for every query. Without this override, identical
// queries (same URL/params — common for our non-user-specific tables like
// pregnancy_content and symptom_knowledge_base) get silently served a
// stale cached response instead of hitting Postgres, no matter what the
// database actually contains. DB reads must never go through that cache.
function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: "no-store" });
}

// ── Public browser client ────────────────────────────────────────────────
// Safe to use in "use client" components. RLS policies apply.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: noStoreFetch },
});

// ── Server-only admin client ─────────────────────────────────────────────
// Uses service role key — bypasses RLS. NEVER import in client components.
// Needed for auth (looking up credentials before a session exists) and any
// server-side write that isn't scoped to the current user's session.
export function createAdminSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.local (see .env.local.example)"
    );
  }
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  });
}

// ── Database row types ───────────────────────────────────────────────────

export interface DBUser {
  id: string;
  full_name: string;
  nickname: string;
  date_of_birth: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface DBPregnancyProfile {
  id: string;
  user_id: string;
  dating_method: "lmp" | "conception" | "due_date";
  dating_date: string;
  due_date: string;
  due_date_adjusted: boolean;
  notify_daily_checkin: boolean;
  notify_appointments: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface DBAppointment {
  id: string;
  user_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBSymptomKnowledgeBase {
  id: string;
  symptom: string;
  display_name: string;
  is_red_flag: boolean;
  category: "early_pregnancy" | "physical" | "emotional" | null;
  tips: string[];
  red_flag_message: string | null;
  sources_used: string[];
  raw_summary: string | null;
  generated_at: string | null;
  created_at: string;
}

export interface DBSourceContent {
  id: string;
  topic: string;
  source: string;
  raw_content: string | null;
  status: "ok" | "error" | "unavailable";
  error_message: string | null;
  fetched_at: string;
}

export interface DBPregnancyContent {
  id: string;
  week: number;
  size_comparison: string | null;
  baby_development: string[];
  body_changes: string[];
  fun_facts: string[];
  sources_used: string[];
  raw_summary: string | null;
  generated_at: string;
}

export interface DBChecklistGroup {
  category: string;
  items: string[];
}

export interface DBChecklistContent {
  id: string;
  checklist_type: "hospital_bag" | "last_minute_todos" | "birth_plan_template";
  title: string;
  items: string[];
  groups: DBChecklistGroup[];
  sources_used: string[];
  raw_summary: string | null;
  generated_at: string | null;
}

export interface DBChecklistProgress {
  id: string;
  user_id: string;
  checklist_type: string;
  checked_items: string[];
  updated_at: string;
}

export interface DBActivityRecommendationItem {
  label: string;
  description: string;
}

export interface DBActivityContent {
  id: string;
  trimester: 1 | 2 | 3;
  recommendations: string[];
  recommendation_items: DBActivityRecommendationItem[];
  sources_used: string[];
  raw_summary: string | null;
  generated_at: string | null;
}

export interface DBActivityLog {
  id: string;
  user_id: string;
  activity_date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DBFoodRecommendations {
  id: string;
  topic: string;
  recommendations: string[];
  sources_used: string[];
  raw_summary: string | null;
  generated_at: string | null;
}

export interface DBActivityChecklistProgress {
  id: string;
  user_id: string;
  checklist_date: string;
  checked_items: string[];
  updated_at: string;
}

export interface DBDailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  mood_text: string | null;
  symptoms: string[];
  has_red_flag: boolean;
  response_text: string | null;
  sources_used: string[];
  created_at: string;
  updated_at: string;
}

export interface DBChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  has_red_flag: boolean;
  sources_used: string[];
  created_at: string;
}

export interface DBFaqContent {
  id: string;
  topic: string;
  question: string;
  answer: string[];
  sources_used: string[];
  raw_summary: string | null;
  generated_at: string | null;
}

export interface NewsDigestItem {
  title: string;
  summary: string;
}

export interface DBNewsDigest {
  id: string;
  key: string;
  items: NewsDigestItem[];
  sources_used: string[];
  generated_at: string | null;
}

export interface DBBabyName {
  id: string;
  name: string;
  gender: "girl" | "boy" | "unisex";
  origin: string;
  meaning: string;
  style_tags: string[];
  syllables: number | null;
  created_at: string;
}

export interface DBSavedBabyName {
  id: string;
  user_id: string;
  baby_name_id: string;
  created_at: string;
}
