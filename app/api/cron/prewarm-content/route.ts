import { NextResponse } from "next/server";
import {
  getOrCreatePregnancyContent,
  getOrCreateSymptomTips,
  getOrCreateChecklist,
  getOrCreateActivityContent,
  getOrCreateFaqAnswer,
  getOrCreateNewsDigest,
  type ChecklistType,
} from "@/lib/content-pipeline";
import { SYMPTOM_KNOWLEDGE_BASE } from "@/lib/content/symptom-knowledge-base";
import { FAQ_TOPICS, DOOMSCROLL_TOPIC, WELLNESS_TOPIC } from "@/lib/content/faq-topics";

const ALL_FAQ_TOPICS = [...FAQ_TOPICS, DOOMSCROLL_TOPIC, WELLNESS_TOPIC];

const CHECKLIST_TYPES: ChecklistType[] = ["hospital_bag", "last_minute_todos", "birth_plan_template"];
const TRIMESTERS: (1 | 2 | 3)[] = [1, 2, 3];

// Pre-warms pregnancy_content and symptom_knowledge_base ahead of need, so
// nobody ever waits on a cold NHS/womenshealth.gov/MedlinePlus + Claude
// round-trip (observed up to ~11s) on a live page load.
//
// Bounded by design: weeks are capped (extend PREWARM_WEEKS_END to 40 once
// 1st/2nd trimester content is confirmed good), and symptoms come from the
// fixed taxonomy in lib/content/symptom-knowledge-base.ts — never expanded
// automatically from user input (the future chat companion should do a
// one-off lookup for anything outside this list, not grow the table).
//
// Idempotent: getOrCreatePregnancyContent/getOrCreateSymptomTips already
// skip re-fetching when a fresh cache entry exists, so re-running this
// (e.g. a daily Vercel Cron trigger) only does work for what's actually
// missing or stale — a full backfill only really happens once.

const PREWARM_WEEKS_END = 27; // end of 2nd trimester; extend to 40 for 3rd trimester later
const CONCURRENCY = 4;

// Each item commits to its cache table as soon as it succeeds, so if this
// invocation times out mid-run, nothing already-completed is lost — the
// next daily run just picks up whatever's still missing.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number
): Promise<void> {
  let index = 0;
  async function next(): Promise<void> {
    const i = index++;
    if (i >= items.length) return;
    await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn("[prewarm] CRON_SECRET is not set — this endpoint is open. Set it before deploying.");
  }

  const weeks = Array.from({ length: PREWARM_WEEKS_END }, (_, i) => i + 1);
  const symptoms = SYMPTOM_KNOWLEDGE_BASE.filter((s) => !s.isRedFlag);

  const weekResults = { attempted: weeks.length, cached: 0, freshlyGenerated: 0, failed: [] as number[] };
  const symptomResults = { attempted: symptoms.length, cached: 0, freshlyGenerated: 0, failed: [] as string[] };
  const checklistResults = { attempted: CHECKLIST_TYPES.length, cached: 0, freshlyGenerated: 0, failed: [] as string[] };
  const activityResults = { attempted: TRIMESTERS.length, cached: 0, freshlyGenerated: 0, failed: [] as number[] };
  const faqResults = { attempted: ALL_FAQ_TOPICS.length, cached: 0, freshlyGenerated: 0, failed: [] as string[] };
  const newsDigestResult = { attempted: 1, cached: 0, freshlyGenerated: 0, failed: false };

  await runWithConcurrency(
    weeks,
    async (week) => {
      const content = await getOrCreatePregnancyContent(week);
      if (!content) weekResults.failed.push(week);
      else if (content.fromCache) weekResults.cached++;
      else weekResults.freshlyGenerated++;
    },
    CONCURRENCY
  );

  await runWithConcurrency(
    symptoms,
    async (s) => {
      const tips = await getOrCreateSymptomTips(s.symptom, s.displayName);
      if (!tips) symptomResults.failed.push(s.symptom);
      else if (tips.fromCache) symptomResults.cached++;
      else symptomResults.freshlyGenerated++;
    },
    CONCURRENCY
  );

  await runWithConcurrency(
    CHECKLIST_TYPES,
    async (checklistType) => {
      const content = await getOrCreateChecklist(checklistType);
      if (!content) checklistResults.failed.push(checklistType);
      else if (content.fromCache) checklistResults.cached++;
      else checklistResults.freshlyGenerated++;
    },
    CONCURRENCY
  );

  await runWithConcurrency(
    TRIMESTERS,
    async (trimester) => {
      const content = await getOrCreateActivityContent(trimester);
      if (!content) activityResults.failed.push(trimester);
      else if (content.fromCache) activityResults.cached++;
      else activityResults.freshlyGenerated++;
    },
    CONCURRENCY
  );

  await runWithConcurrency(
    ALL_FAQ_TOPICS,
    async (t) => {
      const answer = await getOrCreateFaqAnswer(t.topic, t.question);
      if (!answer) faqResults.failed.push(t.topic);
      else if (answer.fromCache) faqResults.cached++;
      else faqResults.freshlyGenerated++;
    },
    CONCURRENCY
  );

  const newsDigest = await getOrCreateNewsDigest();
  if (!newsDigest) newsDigestResult.failed = true;
  else if (newsDigest.fromCache) newsDigestResult.cached = 1;
  else newsDigestResult.freshlyGenerated = 1;

  return NextResponse.json({
    ok: true,
    weeks: weekResults,
    symptoms: symptomResults,
    checklists: checklistResults,
    activity: activityResults,
    faqs: faqResults,
    newsDigest: newsDigestResult,
  });
}
