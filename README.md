# HelloBump

A warm, AI-powered pregnancy companion. Track your journey day by day with
personalized daily insights, symptom-aware tips, appointment reminders, a
friendly chat companion, and a baby name explorer — all designed to replace
anxious late-night searching with calm, trustworthy answers grounded in real
sources (NHS, Office on Women's Health, MedlinePlus, ICMR-NIN).

This is a personal project, currently invite-only.

## Features

- **Home dashboard** — day counter, week, trimester, days-to-go, and a
  "Today" card with baby size comparison, development highlights, and fun
  facts, all sourced and synthesized rather than hand-written
- **Daily check-in** — quick mood/symptom logging with warm, grounded coping
  tips; red-flag symptoms always point straight to "contact your doctor"
- **Chat companion** — a dedicated conversational tab that knows your recent
  check-ins, not a generic chatbot
- **Appointments** — simple CRUD for prenatal visits
- **Checklists** — hospital bag, last-minute to-dos, birth plan template,
  with real checkboxes and progress bars
- **Activity & food** — trimester-appropriate exercise guidance and Indian-
  cuisine-focused nutrition suggestions tied to logged symptoms
- **Discover** — a curated "ask instead of search" FAQ, a calm news digest,
  doomscroll alternatives, and wellness/meditation content
- **Baby Names** — browse/filter a real, curated names dataset by gender,
  origin, and style; get AI-narrowed suggestions from a freeform description;
  save favorites; or ask the companion about a name that isn't in the list
  yet and add it for everyone
- Dark mode, a warm/cheerful design system, and a persistent medical
  disclaimer on every page

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui-style components
- **Database:** Supabase (Postgres + Row Level Security)
- **Auth:** NextAuth v4, Credentials provider (bcrypt-hashed passwords)
- **AI:** Claude API (Anthropic), called server-side only
- **Hosting:** Vercel, with Vercel Cron for a daily content pre-warm job

## How content is sourced

Nearly all factual/medical content (weekly development info, symptom tips,
checklists, activity/food guidance) follows the same pattern: fetch from a
real public source → fall back to the next source if one fails → consolidate
what succeeded via Claude into one warmly-phrased answer → cache it. Nothing
is hand-written or AI-invented without grounding. The one deliberate
exception is the Baby Names "ask the companion" lookup, since name etymology
is general trivia, not medical content — results there are always labeled as
an AI guess and require explicit confirmation before being saved.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in real values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.local.example` for the full list. You'll need:

- A Supabase project (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`) — run `supabase/schema.sql` in the Supabase
  SQL Editor to set up the schema
- `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and `NEXTAUTH_URL`
- `ANTHROPIC_API_KEY` — optional; the app degrades gracefully to plain/raw
  content everywhere if it's missing, it just won't get AI-synthesized
- `CRON_SECRET` (`openssl rand -hex 24`) — protects the pre-warm cron route
- `RESEND_API_KEY` — reserved for future email reminders, not wired up yet
- `NEXT_PUBLIC_SIGNUP_MODE` and `SIGNUP_INVITE_CODE` — signup is invite-only
  by default; set the mode to `open` (and redeploy) to make signup public

## Deployment

Deploys as a standard Next.js app on Vercel. The `vercel.json` cron entry
calls `/api/cron/prewarm-content` daily to keep content caches warm ahead of
need. `app/robots.ts` currently disallows all crawlers, since this is a
personal app without a public domain yet.
