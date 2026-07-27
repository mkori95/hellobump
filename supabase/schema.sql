-- HelloBump — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Tables are added incrementally as each v1 feature slice is built.
-- Every table (besides `users` itself) carries a `user_id` column from day
-- one so multi-user support later doesn't require a migration, even though
-- this app only has one user today.

-- ── users ────────────────────────────────────────────────────────────────
-- Our own credentials table — NextAuth's Credentials provider authenticates
-- against this directly (bcrypt-hashed passwords), not Supabase Auth.

create table if not exists users (
  id             uuid default gen_random_uuid() primary key,
  full_name      text not null,
  nickname       text not null,
  date_of_birth  date not null,
  email          text unique not null,
  password_hash  text not null,
  created_at     timestamptz default now()
);

create index if not exists users_email_idx on users(email);

alter table users enable row level security;
-- No policies defined on purpose: the anon/authenticated roles get zero
-- access by default under RLS. Only the service_role key (used server-side
-- in the NextAuth authorize() callback and the signup API route) can read
-- or write this table — it bypasses RLS entirely.

-- ── pregnancy_profile ────────────────────────────────────────────────────
-- One row per user. Created by the post-login setup flow; app code enforces
-- one profile per user via the unique constraint on user_id.

create table if not exists pregnancy_profile (
  id                     uuid default gen_random_uuid() primary key,
  user_id                uuid not null references users(id) on delete cascade,
  dating_method          text not null check (dating_method in ('lmp', 'conception', 'due_date')),
  dating_date            date not null,
  due_date               date not null,
  due_date_adjusted      boolean not null default false,
  notify_daily_checkin   boolean not null,
  notify_appointments    boolean not null,
  timezone               text not null,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),
  unique (user_id)
);

create index if not exists pregnancy_profile_user_id_idx on pregnancy_profile(user_id);

alter table pregnancy_profile enable row level security;
-- Same reasoning as `users`: this app has no Supabase-Auth session to key
-- policies off of (auth is handled by NextAuth), so RLS here is default-deny
-- for anon/authenticated. All access goes through API routes that use the
-- service_role client and manually scope every query to the signed-in
-- user's id (from the NextAuth session) — that's where per-user isolation
-- actually happens, not in a Postgres policy.

-- ── appointments ─────────────────────────────────────────────────────────
-- Simple CRUD, no soft-delete/history — deleting a row removes it for good.

create table if not exists appointments (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid not null references users(id) on delete cascade,
  appointment_date   date not null,
  appointment_time   time not null,
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index if not exists appointments_user_id_idx on appointments(user_id);
create index if not exists appointments_date_idx on appointments(user_id, appointment_date, appointment_time);

alter table appointments enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── symptom_knowledge_base ───────────────────────────────────────────────
-- The vetted-content table for the RAG pattern: on a check-in, the app looks
-- up tips for the reported symptoms *before* any AI phrasing happens, and
-- the AI is constrained to only rephrase what's retrieved here — it never
-- invents coping tips. Red-flag rows short-circuit tips entirely in favor
-- of a fixed "contact your doctor" message (that message stays hand-curated
-- — it's a safety directive, not sourced medical content).
--
-- For non-red-flag rows, `tips` is populated lazily by the fetch-fallback-
-- consolidate-cache pipeline (lib/content-pipeline.ts) the first time that
-- symptom is looked up — never hand-written upfront. The row itself (which
-- symptoms exist, display names, red-flag status) is still a small curated
-- taxonomy seed; only the coping-tips *content* is fetched/synthesized.

create table if not exists symptom_knowledge_base (
  id                uuid default gen_random_uuid() primary key,
  symptom           text unique not null,
  display_name      text not null,
  is_red_flag       boolean not null default false,
  category          text check (category in ('early_pregnancy', 'physical', 'emotional')),
  tips              text[] default '{}',
  red_flag_message  text,
  sources_used      text[] default '{}',
  raw_summary       text,
  generated_at      timestamptz,
  created_at        timestamptz default now()
);

-- Adds the pipeline-related columns if this table already existed from an
-- earlier build (safe to re-run; no-ops if the columns are already there).
alter table symptom_knowledge_base add column if not exists sources_used text[] default '{}';
alter table symptom_knowledge_base add column if not exists raw_summary text;
alter table symptom_knowledge_base add column if not exists generated_at timestamptz;
alter table symptom_knowledge_base add column if not exists category text;

alter table symptom_knowledge_base enable row level security;
-- Same default-deny RLS reasoning as the tables above — always read
-- server-side via the service_role client, never queried from the client
-- with the anon key.

-- ── source_content ───────────────────────────────────────────────────────
-- Per-source raw fetch cache for the content pipeline. One row per
-- (topic, source) pair — re-fetching overwrites in place rather than
-- growing an unbounded log. `status` distinguishes a real fetch failure
-- from a source that's simply inapplicable to a given topic (e.g.
-- MedlinePlus has no per-week pregnancy pages), so a silently-broken
-- source can be told apart from an intentionally-skipped one.

create table if not exists source_content (
  id             uuid default gen_random_uuid() primary key,
  topic          text not null,
  source         text not null,
  raw_content    text,
  status         text not null default 'ok' check (status in ('ok', 'error', 'unavailable')),
  error_message  text,
  fetched_at     timestamptz not null default now(),
  unique (topic, source)
);

alter table source_content enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── pregnancy_content ────────────────────────────────────────────────────
-- Consolidated weekly "Today" card content — one row per week, populated
-- lazily by the content pipeline (never hand-written/pre-filled). Stays
-- empty until a given week is actually viewed by someone.

create table if not exists pregnancy_content (
  id                uuid default gen_random_uuid() primary key,
  week              int not null unique,
  size_comparison   text,
  baby_development  text[] default '{}',
  body_changes      text[] default '{}',
  fun_facts         text[] default '{}',
  sources_used      text[] default '{}',
  raw_summary       text,
  generated_at      timestamptz not null default now()
);

alter table pregnancy_content add column if not exists fun_facts text[] default '{}';

alter table pregnancy_content enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── checklist_content ────────────────────────────────────────────────────
-- Consolidated checklists (hospital bag, last-minute to-dos, birth plan
-- template) — same fetch-fallback-consolidate-cache pattern as
-- pregnancy_content, shared across all users, not user-specific. Raw
-- per-source fetches reuse the generic `source_content` table above,
-- keyed by topic e.g. "checklist:hospital_bag".

create table if not exists checklist_content (
  id              uuid default gen_random_uuid() primary key,
  checklist_type  text not null unique check (checklist_type in ('hospital_bag', 'last_minute_todos', 'birth_plan_template')),
  title           text not null,
  items           text[] default '{}',
  groups          jsonb default '[]',
  sources_used    text[] default '{}',
  raw_summary     text,
  generated_at    timestamptz
);

-- Items grouped into subcategories (e.g. "For You" / "For Baby" / "Documents
-- & Essentials" for the hospital bag checklist) instead of one flat list —
-- shape: [{ "category": "...", "items": ["...", ...] }, ...]. The old flat
-- `items` column is kept (unused going forward) rather than migrated in
-- place, since it's simpler and lossless to just add alongside it.
alter table checklist_content add column if not exists groups jsonb default '[]';

alter table checklist_content enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── checklist_progress ───────────────────────────────────────────────────
-- Per-user check-off state, kept separate from the shared checklist_content
-- (whose items text is common to everyone) since which items are checked is
-- inherently user-specific.

create table if not exists checklist_progress (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid not null references users(id) on delete cascade,
  checklist_type  text not null,
  checked_items   text[] default '{}',
  updated_at      timestamptz default now(),
  unique (user_id, checklist_type)
);

alter table checklist_progress enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── activity_content ─────────────────────────────────────────────────────
-- Sourced exercise/rest/stretch guidance, keyed by trimester (changes more
-- by trimester than by individual week) — same fetch-fallback-consolidate-
-- cache pattern, raw fetches reuse `source_content` (topic e.g.
-- "activity:trimester:1").

create table if not exists activity_content (
  id                uuid default gen_random_uuid() primary key,
  trimester         int not null unique check (trimester in (1, 2, 3)),
  recommendations   text[] default '{}',
  recommendation_items jsonb default '[]',
  sources_used      text[] default '{}',
  raw_summary       text,
  generated_at      timestamptz
);

-- Each recommendation as {label, description} — a short checklist-style
-- label (e.g. "Daily walking") plus the full grounded sentence it came from
-- (e.g. "Keep up daily physical activity like walking (30 minutes a day)...").
-- The old flat `recommendations` column is kept (unused going forward)
-- rather than migrated in place, same reasoning as checklist_content.groups.
alter table activity_content add column if not exists recommendation_items jsonb default '[]';

alter table activity_content enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── activity_log ─────────────────────────────────────────────────────────
-- What she actually did (e.g. "20 min walk"), user-logged, simple CRUD like
-- daily_checkins/appointments — no soft-delete/history requirement. Multiple
-- entries per day are allowed (no unique constraint on date), since more
-- than one activity can happen in a day.

create table if not exists activity_log (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid not null references users(id) on delete cascade,
  activity_date  date not null,
  description    text not null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists activity_log_user_id_idx on activity_log(user_id, activity_date);

alter table activity_log enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── food_recommendations ─────────────────────────────────────────────────
-- Indian-food guidance keyed by symptom (e.g. "symptom:nausea") or trimester
-- (e.g. "trimester:2") — same fetch-fallback-consolidate-cache pattern,
-- ICMR-NIN primary / MedlinePlus+OWH secondary. Raw fetches reuse
-- `source_content` (topic e.g. "food:symptom:nausea").

create table if not exists food_recommendations (
  id               uuid default gen_random_uuid() primary key,
  topic            text not null unique,
  recommendations  text[] default '{}',
  sources_used     text[] default '{}',
  raw_summary      text,
  generated_at     timestamptz
);

alter table food_recommendations enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── daily_checkins ───────────────────────────────────────────────────────
-- One row per user per calendar day (in her stored timezone). Editable and
-- deletable, no soft-delete/audit trail per spec — simple CRUD.

create table if not exists daily_checkins (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid not null references users(id) on delete cascade,
  checkin_date   date not null,
  mood_text      text,
  symptoms       text[] default '{}',
  has_red_flag   boolean not null default false,
  response_text  text,
  sources_used   text[] default '{}',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (user_id, checkin_date)
);

alter table daily_checkins add column if not exists sources_used text[] default '{}';

create index if not exists daily_checkins_user_id_idx on daily_checkins(user_id, checkin_date);

alter table daily_checkins enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── activity_checklist_progress ──────────────────────────────────────────
-- Daily check-off state for the trimester-appropriate activity suggestions
-- (the same recommendations shown in activity_content, sourced from the
-- content pipeline — not a separate hand-written list). One row per user
-- per calendar day, so a new day naturally starts with nothing checked —
-- no explicit "reset" job needed, the date itself is the reset boundary.

create table if not exists activity_checklist_progress (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid not null references users(id) on delete cascade,
  checklist_date   date not null,
  checked_items    text[] default '{}',
  updated_at       timestamptz default now(),
  unique (user_id, checklist_date)
);

create index if not exists activity_checklist_progress_user_id_idx on activity_checklist_progress(user_id, checklist_date);

alter table activity_checklist_progress enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── chat_messages ─────────────────────────────────────────────────────────
-- Feature 6: chat companion. Persists full conversation history per user so
-- the companion has continuity across sessions and can be given recent
-- turns as context on each new message.

create table if not exists chat_messages (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  has_red_flag boolean not null default false,
  sources_used text[] default '{}',
  created_at  timestamptz default now()
);

create index if not exists chat_messages_user_id_idx on chat_messages(user_id, created_at);

alter table chat_messages enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── Feature 7: anti-doomscroll layer ─────────────────────────────────────

-- "Ask instead of search" — curated FAQ for common anxious searches, same
-- fetch-fallback-consolidate-cache + RAG pattern as symptom_knowledge_base.
create table if not exists faq_content (
  id             uuid default gen_random_uuid() primary key,
  topic          text not null unique,
  question       text not null,
  answer         text[] default '{}',
  sources_used   text[] default '{}',
  raw_summary    text,
  generated_at   timestamptz
);

alter table faq_content enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- Curated, periodically-refreshed digest — a single row, not a live/infinite
-- feed. `key` is always 'digest'; upserted in place on refresh.
create table if not exists news_digest (
  id             uuid default gen_random_uuid() primary key,
  key            text not null unique default 'digest',
  items          jsonb default '[]',
  sources_used   text[] default '{}',
  generated_at   timestamptz
);

alter table news_digest enable row level security;
-- Same default-deny RLS reasoning as the tables above.

-- ── Feature 8: baby name explorer ────────────────────────────────────────
-- A real, hand-curated names dataset — NOT AI-generated. Seeded once from
-- lib/content/baby-names-seed.json via scripts/seed-baby-names.mjs (safe to
-- re-run: upserts on the (name, gender) unique key). Both the browse/filter
-- UI and the AI-assisted suggestion feature retrieve from this table; Claude
-- only ranks/narrows/phrases a shortlist from rows it's actually given —
-- same retrieve-then-present principle as symptom_knowledge_base, just
-- against a names dataset instead of medical content.

create table if not exists baby_names (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  gender       text not null check (gender in ('girl', 'boy', 'unisex')),
  origin       text not null,
  meaning      text not null,
  style_tags   text[] default '{}',
  syllables    int,
  created_at   timestamptz default now(),
  unique (name, gender)
);

create index if not exists baby_names_gender_idx on baby_names(gender);
create index if not exists baby_names_origin_idx on baby_names(origin);
create index if not exists baby_names_style_tags_idx on baby_names using gin(style_tags);

alter table baby_names enable row level security;
-- Shared reference data (like symptom_knowledge_base), not user-owned. Same
-- default-deny RLS reasoning — app code reads via the service_role client;
-- every user sees the same dataset, so no per-user scoping is needed here.

-- Per-user saved/favorited names shortlist.
create table if not exists saved_baby_names (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid not null references users(id) on delete cascade,
  baby_name_id  uuid not null references baby_names(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (user_id, baby_name_id)
);

create index if not exists saved_baby_names_user_id_idx on saved_baby_names(user_id);

alter table saved_baby_names enable row level security;
-- Same default-deny RLS reasoning as the tables above.
