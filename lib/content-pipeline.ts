// Multi-source fetch → fallback → consolidate → cache pipeline, shared by
// the weekly "Today" card (pregnancy_content) and the symptom coping-tips
// knowledge base (symptom_knowledge_base). Nothing here is hand-written
// medical content — it's fetched from NHS/womenshealth.gov/MedlinePlus and
// synthesized by Claude, grounded only in what was actually fetched.

import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminSupabase } from "@/lib/supabase";
import { getAnthropicClient, CHECKIN_MODEL } from "@/lib/anthropic";
import { SOURCE_LABELS, type SourceName } from "@/lib/content-sources";
import { getSizeEmoji } from "@/lib/size-emoji";

export type { SourceName } from "@/lib/content-sources";

const UA = "Mozilla/5.0 (compatible; HelloBumpBot/1.0; personal-use pregnancy app)";
const FETCH_TIMEOUT_MS = 8000;
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

// ── Low-level fetch + clean ─────────────────────────────────────────────

async function fetchAndClean(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, form, noscript, iframe").remove();
    $("[class*='header'], [class*='footer'], [class*='cookie'], [class*='skip-link'], [class*='breadcrumb']").remove();
    const main = $("main").length ? $("main") : $("body");
    const text = main.text().replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
    if (!text || text.length < 200) throw new Error("Extracted content too short — page structure may have changed");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Per-source cache (source_content table) ─────────────────────────────

async function getOrFetchSource(
  admin: ReturnType<typeof createAdminSupabase>,
  topic: string,
  source: SourceName,
  fetchFn: () => Promise<string>
): Promise<string | null> {
  const { data: cached } = await admin
    .from("source_content")
    .select("*")
    .eq("topic", topic)
    .eq("source", source)
    .maybeSingle();

  if (cached?.status === "ok" && cached.raw_content) {
    return cached.raw_content as string;
  }

  try {
    const raw = await fetchFn();
    await admin.from("source_content").upsert(
      { topic, source, raw_content: raw, status: "ok", error_message: null, fetched_at: new Date().toISOString() },
      { onConflict: "topic,source" }
    );
    return raw;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[content-pipeline] fetch failed: topic=${topic} source=${source}: ${message}`);
    await admin.from("source_content").upsert(
      { topic, source, raw_content: null, status: "error", error_message: message, fetched_at: new Date().toISOString() },
      { onConflict: "topic,source" }
    );
    return null;
  }
}

async function markUnavailable(
  admin: ReturnType<typeof createAdminSupabase>,
  topic: string,
  source: SourceName,
  reason: string
) {
  await admin.from("source_content").upsert(
    { topic, source, raw_content: null, status: "unavailable", error_message: reason, fetched_at: new Date().toISOString() },
    { onConflict: "topic,source" }
  );
}

// ── Source URL builders ──────────────────────────────────────────────────

function nhsWeekUrl(week: number): string {
  const trimesterSlug = week <= 12 ? "1st-trimester" : week <= 27 ? "2nd-trimester" : "3rd-trimester";
  return `https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/${trimesterSlug}/week-${week}/`;
}

function weekToTrimester(week: number): 1 | 2 | 3 {
  return week <= 12 ? 1 : week <= 28 ? 2 : 3;
}

const WOMENSHEALTH_STAGES_URL = "https://www.womenshealth.gov/pregnancy/youre-pregnant-now-what/stages-pregnancy";
const WOMENSHEALTH_DISCOMFORTS_URL =
  "https://www.womenshealth.gov/pregnancy/youre-pregnant-now-what/body-changes-and-discomforts";
const MEDLINEPLUS_PREGNANCY_OVERVIEW_URL = "https://medlineplus.gov/pregnancy.html";
const MEDLINEPLUS_SYMPTOMS_OVERVIEW_URL = "https://medlineplus.gov/ency/patientinstructions/000583.htm";

// Covers both exercise and nutrition guidance in one page — reused as a
// shared secondary source for both activity_content and food_recommendations
// rather than fetched twice under different topics.
const WOMENSHEALTH_WELLNESS_URL =
  "https://www.womenshealth.gov/pregnancy/youre-pregnant-now-what/staying-healthy-and-safe";
const NHS_EXERCISE_URL = "https://www.nhs.uk/pregnancy/keeping-well/exercise/";

// Dedicated NHS pages for feature 7's FAQ topics — used as the tertiary/
// specific source, same role NHS plays for symptom tips. Falls back to the
// shared MedlinePlus/OWH overview pages (primary/secondary) when a topic
// has no dedicated page here.
const NHS_FAQ_URLS: Record<string, string | undefined> = {
  spotting: "https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/",
  cramping: "https://www.nhs.uk/pregnancy/common-symptoms/stomach-pain/",
  food_safety: "https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/",
  exercise_safety: NHS_EXERCISE_URL,
  sex_during_pregnancy: "https://www.nhs.uk/pregnancy/keeping-well/sex/",
  doomscroll_alternatives: "https://www.nhs.uk/pregnancy/keeping-well/mental-health/",
  relaxation_wellness: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/",
};

// Per-topic override for the OWH/MedlinePlus "secondary" source — only set
// when the shared discomforts-overview page (the default secondary for
// every other FAQ topic) wouldn't actually cover the subject. Falls back to
// WOMENSHEALTH_DISCOMFORTS_URL when not listed here.
const OWH_FAQ_URLS: Record<string, string | undefined> = {
  doomscroll_alternatives: "https://www.womenshealth.gov/mental-health/good-mental-health/stress-and-your-health",
  relaxation_wellness: "https://www.womenshealth.gov/mental-health/good-mental-health/stress-and-your-health",
};

// A stable, general NHS pregnancy hub — used as one of the two sources for
// the periodically-refreshed news digest (feature 7). Not a live news feed;
// just a real, reputable page consolidated into a few non-alarmist blurbs.
const NHS_PREGNANCY_HUB_URL = "https://www.nhs.uk/pregnancy/";

// ICMR-NIN's dietary guidelines are only published as a PDF. fetchAndClean
// only handles HTML via cheerio, so this will typically fail cleanly (no
// usable extracted text) and fall through to the secondary source below —
// acceptable for v1 rather than adding a PDF-parsing dependency for one source.
const ICMR_NIN_DIETARY_GUIDELINES_URL = "https://nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf";

const CHECKLIST_SOURCES: Record<
  "hospital_bag" | "last_minute_todos" | "birth_plan_template",
  { title: string; nhsUrl?: string; owhUrl?: string; categories: string[] }
> = {
  hospital_bag: {
    title: "Hospital Bag Checklist",
    nhsUrl: "https://www.nhs.uk/pregnancy/labour-and-birth/preparing-for-the-birth/pack-your-bag-for-labour/",
    categories: ["For You", "For Baby", "Documents & Essentials"],
  },
  last_minute_todos: {
    title: "Last-Minute To-Dos",
    owhUrl: "https://www.womenshealth.gov/pregnancy/getting-ready-baby/last-minute-dos",
    categories: ["Hospital Prep", "Birth Plan & Care Team", "Contacts & Logistics"],
  },
  birth_plan_template: {
    title: "Birth Plan Template",
    nhsUrl:
      "https://www.nhs.uk/best-start-in-life/pregnancy/preparing-for-labour-and-birth/what-to-include-in-your-birth-plan/",
    categories: ["Where & How", "Who's Present", "Pain Management & Positions"],
  },
};

// NHS has individual pages for some, but not all, common symptoms. Where
// there's no dedicated page, we mark that source unavailable for this
// symptom rather than fetch something unrelated.
const NHS_SYMPTOM_SLUGS: Record<string, string | undefined> = {
  nausea: "vomiting-and-morning-sickness",
  fatigue: "tiredness",
  heartburn: "indigestion-and-heartburn",
  back_pain: "back-pain",
  headaches: "headaches",
  swelling: "swollen-ankles-feet-and-fingers",
  trouble_sleeping: "tiredness",
};

// ── Claude consolidation ─────────────────────────────────────────────────

function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate.trim()) as T;
  } catch (err) {
    console.error(
      "[content-pipeline] Failed to parse Claude JSON response:",
      err instanceof Error ? err.message : err,
      "\n--- raw text (first 500 chars) ---\n",
      text.slice(0, 500)
    );
    return null;
  }
}

async function callClaude(prompt: string): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;
  try {
    const message = await client.messages.create({
      model: CHECKIN_MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  } catch (err) {
    console.error("[content-pipeline] Claude call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

interface WeeklySynthesis {
  sizeComparison: string;
  babyDevelopment: string[];
  bodyChanges: string[];
  funFacts: string[];
}

async function consolidateWeekly(
  week: number,
  sources: { source: SourceName; text: string }[]
): Promise<{ synthesis: WeeklySynthesis | null; rawSummary: string | null }> {
  const combined = sources.map((s) => `--- Source: ${SOURCE_LABELS[s.source]} ---\n${s.text.slice(0, 6000)}`).join("\n\n");
  const rawSummary = sources[0].text.slice(0, 600);

  const prompt =
    `Combined source material about week ${week} of pregnancy, from official health sources:\n\n${combined}\n\n` +
    `Synthesize this into a single warm, encouraging JSON object with keys:\n` +
    `- "sizeComparison": ONLY the object itself, e.g. "a lemon" — NOT a full sentence, and do NOT include words like "about the size of" or "the size of" (the app adds that wording itself). Only if mentioned in the sources — omit or use "" if not mentioned.\n` +
    `- "babyDevelopment": array of 2-4 short bullet strings about what's developing with the baby this week\n` +
    `- "bodyChanges": array of 2-4 short bullet strings about changes/symptoms for the mother this week\n` +
    `- "funFacts": array of 2-3 short, delightful "did you know" style pointers specific to this week (e.g. "did you know your baby can now hear your voice") — lighter and more fun than the development bullets, but still grounded in the source material\n` +
    `Base every fact ONLY on the provided source material — never add anything not grounded in it. ` +
    `Adapt any UK-specific terms to US equivalents (e.g. "GP" -> "doctor", "midwife" can stay). ` +
    `Respond with ONLY the JSON object, no markdown fences, no other text.`;

  const text = await callClaude(prompt);
  if (!text) return { synthesis: null, rawSummary };

  const parsed = extractJson<WeeklySynthesis>(text);
  return { synthesis: parsed, rawSummary };
}

async function consolidateSymptomTips(
  displayName: string,
  sources: { source: SourceName; text: string }[]
): Promise<{ tips: string[] | null; rawSummary: string | null }> {
  const combined = sources.map((s) => `--- Source: ${SOURCE_LABELS[s.source]} ---\n${s.text.slice(0, 6000)}`).join("\n\n");
  const rawSummary = sources[0].text.slice(0, 600);

  const prompt =
    `Combined source material from official health sources, which may cover many pregnancy symptoms:\n\n${combined}\n\n` +
    `Find the parts specifically about "${displayName}" and extract 3-5 short, warm, practical coping tips as a JSON object: {"tips": ["...", "..."]}. ` +
    `Base every tip ONLY on what's actually in the source material for this specific symptom — never invent tips not grounded in it. ` +
    `If the sources don't actually cover "${displayName}", respond with {"tips": []}. ` +
    `Adapt any UK-specific terms to US equivalents (e.g. "GP" -> "doctor"). ` +
    `Respond with ONLY the JSON object, no markdown fences, no other text.`;

  const text = await callClaude(prompt);
  if (!text) return { tips: null, rawSummary };

  const parsed = extractJson<{ tips: string[] }>(text);
  return { tips: parsed?.tips ?? null, rawSummary };
}

// ── Public entry point: weekly "Today" card content ─────────────────────

export interface PregnancyContentResult {
  week: number;
  sizeComparison: string | null;
  sizeEmoji: string;
  babyDevelopment: string[];
  bodyChanges: string[];
  funFacts: string[];
  rawSummary: string | null;
  sourcesUsed: SourceName[];
  generatedAt: string;
  isRawFallback: boolean;
  fromCache: boolean;
}

function isFresh(generatedAt: string, windowMs: number = SIX_MONTHS_MS): boolean {
  return Date.now() - new Date(generatedAt).getTime() < windowMs;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getOrCreatePregnancyContent(week: number): Promise<PregnancyContentResult | null> {
  const admin = createAdminSupabase();

  const { data: cached } = await admin.from("pregnancy_content").select("*").eq("week", week).maybeSingle();
  if (cached && isFresh(cached.generated_at)) {
    return mapPregnancyRow(cached, true);
  }

  const trimester = weekToTrimester(week);
  const successfulSources: { source: SourceName; text: string }[] = [];

  const nhsText = await getOrFetchSource(admin, `week:${week}`, "nhs", () => fetchAndClean(nhsWeekUrl(week)));
  if (nhsText) successfulSources.push({ source: "nhs", text: nhsText });

  const whText = await getOrFetchSource(admin, `trimester:${trimester}`, "womenshealth", () =>
    fetchAndClean(WOMENSHEALTH_STAGES_URL)
  );
  if (whText) successfulSources.push({ source: "womenshealth", text: whText });

  // MedlinePlus has no per-week granularity — only used as a generic tertiary
  // fallback, and only fetched if the more specific sources above failed.
  if (successfulSources.length === 0) {
    const mpText = await getOrFetchSource(admin, "pregnancy_general_overview", "medlineplus", () =>
      fetchAndClean(MEDLINEPLUS_PREGNANCY_OVERVIEW_URL)
    );
    if (mpText) successfulSources.push({ source: "medlineplus", text: mpText });
  } else {
    await markUnavailable(admin, "pregnancy_general_overview", "medlineplus", "Only used when higher-priority sources fail");
  }

  if (successfulSources.length === 0) {
    if (cached) return mapPregnancyRow(cached, true); // stale cache beats nothing
    return null; // total failure, no cache — caller shows "couldn't load"
  }

  const { synthesis, rawSummary } = await consolidateWeekly(week, successfulSources);
  const sourcesUsed = successfulSources.map((s) => s.source);

  const { data: saved, error } = await admin
    .from("pregnancy_content")
    .upsert(
      {
        week,
        size_comparison: cleanSizeComparison(synthesis?.sizeComparison || null),
        baby_development: synthesis?.babyDevelopment ?? [],
        body_changes: synthesis?.bodyChanges ?? [],
        fun_facts: synthesis?.funFacts ?? [],
        raw_summary: synthesis ? null : rawSummary,
        sources_used: sourcesUsed,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "week" }
    )
    .select()
    .single();

  if (error || !saved) {
    if (cached) return mapPregnancyRow(cached, true);
    return null;
  }
  return mapPregnancyRow(saved, false);
}

// The UI renders "About the size of {sizeComparison}" — strip any redundant
// leading "(about) the size of" the model (or an already-cached row from
// before this fix) might have included, so it never doubles up.
function cleanSizeComparison(value: string | null): string | null {
  if (!value) return value;
  const cleaned = value.replace(/^\s*(about\s+)?the\s+size\s+of\s+/i, "").trim();
  return cleaned || null;
}

function mapPregnancyRow(
  row: {
    week: number;
    size_comparison: string | null;
    baby_development: string[];
    body_changes: string[];
    fun_facts: string[] | null;
    raw_summary: string | null;
    sources_used: string[];
    generated_at: string;
  },
  fromCache: boolean
): PregnancyContentResult {
  return {
    week: row.week,
    sizeComparison: cleanSizeComparison(row.size_comparison),
    sizeEmoji: getSizeEmoji(row.week),
    babyDevelopment: row.baby_development ?? [],
    bodyChanges: row.body_changes ?? [],
    funFacts: row.fun_facts ?? [],
    rawSummary: row.raw_summary,
    sourcesUsed: (row.sources_used ?? []) as SourceName[],
    generatedAt: row.generated_at,
    isRawFallback: !!row.raw_summary,
    fromCache,
  };
}

// ── Public entry point: symptom coping tips ─────────────────────────────

export interface SymptomTipsResult {
  tips: string[];
  rawSummary: string | null;
  sourcesUsed: SourceName[];
  generatedAt: string;
  isRawFallback: boolean;
  fromCache: boolean;
}

export async function getOrCreateSymptomTips(
  symptom: string,
  displayName: string
): Promise<SymptomTipsResult | null> {
  const admin = createAdminSupabase();

  const { data: kbRow } = await admin
    .from("symptom_knowledge_base")
    .select("*")
    .eq("symptom", symptom)
    .maybeSingle();

  if (!kbRow || kbRow.is_red_flag) return null; // red flags never go through this pipeline

  if (kbRow.tips?.length > 0 && kbRow.generated_at && isFresh(kbRow.generated_at)) {
    return {
      tips: kbRow.tips,
      rawSummary: kbRow.raw_summary ?? null,
      sourcesUsed: (kbRow.sources_used ?? []) as SourceName[],
      generatedAt: kbRow.generated_at,
      isRawFallback: !!kbRow.raw_summary,
      fromCache: true,
    };
  }

  const successfulSources: { source: SourceName; text: string }[] = [];

  const mpText = await getOrFetchSource(admin, "pregnancy_symptoms_overview", "medlineplus", () =>
    fetchAndClean(MEDLINEPLUS_SYMPTOMS_OVERVIEW_URL)
  );
  if (mpText) successfulSources.push({ source: "medlineplus", text: mpText });

  const whText = await getOrFetchSource(admin, "pregnancy_symptoms_overview", "womenshealth", () =>
    fetchAndClean(WOMENSHEALTH_DISCOMFORTS_URL)
  );
  if (whText) successfulSources.push({ source: "womenshealth", text: whText });

  const nhsSlug = NHS_SYMPTOM_SLUGS[symptom];
  if (nhsSlug) {
    const nhsText = await getOrFetchSource(admin, `symptom:${symptom}`, "nhs", () =>
      fetchAndClean(`https://www.nhs.uk/pregnancy/common-symptoms/${nhsSlug}/`)
    );
    if (nhsText) successfulSources.push({ source: "nhs", text: nhsText });
  } else {
    await markUnavailable(admin, `symptom:${symptom}`, "nhs", "No dedicated NHS page for this symptom");
  }

  if (successfulSources.length === 0) {
    if (kbRow.tips?.length > 0) {
      return {
        tips: kbRow.tips,
        rawSummary: kbRow.raw_summary ?? null,
        sourcesUsed: (kbRow.sources_used ?? []) as SourceName[],
        generatedAt: kbRow.generated_at,
        isRawFallback: !!kbRow.raw_summary,
        fromCache: true,
      };
    }
    return null;
  }

  const { tips, rawSummary } = await consolidateSymptomTips(displayName, successfulSources);
  const sourcesUsed = successfulSources.map((s) => s.source);
  const generatedAt = new Date().toISOString();

  await admin
    .from("symptom_knowledge_base")
    .update({
      tips: tips ?? [],
      raw_summary: tips ? null : rawSummary,
      sources_used: sourcesUsed,
      generated_at: generatedAt,
    })
    .eq("symptom", symptom);

  return {
    tips: tips ?? [],
    rawSummary: tips ? null : rawSummary,
    sourcesUsed,
    generatedAt,
    isRawFallback: !tips,
    fromCache: false,
  };
}

// ── Public entry point: checklists ──────────────────────────────────────

export type ChecklistType = "hospital_bag" | "last_minute_todos" | "birth_plan_template";

export interface ChecklistGroup {
  category: string;
  items: string[];
}

export interface ChecklistResult {
  checklistType: ChecklistType;
  title: string;
  groups: ChecklistGroup[];
  rawSummary: string | null;
  sourcesUsed: SourceName[];
  generatedAt: string | null;
  isRawFallback: boolean;
  fromCache: boolean;
}

async function consolidateChecklist(
  title: string,
  categories: string[],
  sources: { source: SourceName; text: string }[]
): Promise<{ groups: ChecklistGroup[] | null; rawSummary: string | null }> {
  const combined = sources.map((s) => `--- Source: ${SOURCE_LABELS[s.source]} ---\n${s.text.slice(0, 6000)}`).join("\n\n");
  const rawSummary = sources[0].text.slice(0, 600);
  const categoryList = categories.map((c) => `"${c}"`).join(", ");

  const prompt =
    `Combined source material about "${title}" from official health sources:\n\n${combined}\n\n` +
    `Extract a concrete, actionable checklist, grouped into these exact categories: ${categoryList}. ` +
    `Respond as a JSON object: {"groups": [{"category": "...", "items": ["...", "..."]}, ...]}, ` +
    `with one entry per category listed above, in that order. ` +
    `2-6 short items per category, each a single concrete thing to pack/do/decide. ` +
    `Base every item ONLY on the provided source material — never invent items not grounded in it. ` +
    `If a category has nothing relevant in the source material, give it an empty items array rather than inventing items. ` +
    `Adapt any UK-specific terms to US equivalents (e.g. "GP" -> "doctor"). ` +
    `Respond with ONLY the JSON object, no markdown fences, no other text.`;

  const text = await callClaude(prompt);
  if (!text) return { groups: null, rawSummary };

  const parsed = extractJson<{ groups: ChecklistGroup[] }>(text);
  return { groups: parsed?.groups ?? null, rawSummary };
}

export async function getOrCreateChecklist(checklistType: ChecklistType): Promise<ChecklistResult | null> {
  const admin = createAdminSupabase();
  const config = CHECKLIST_SOURCES[checklistType];

  const { data: cached } = await admin
    .from("checklist_content")
    .select("*")
    .eq("checklist_type", checklistType)
    .maybeSingle();

  if (cached && cached.generated_at && isFresh(cached.generated_at) && cached.groups?.length > 0) {
    return mapChecklistRow(cached, true);
  }

  const successfulSources: { source: SourceName; text: string }[] = [];
  const topic = `checklist:${checklistType}`;

  if (config.nhsUrl) {
    const nhsText = await getOrFetchSource(admin, topic, "nhs", () => fetchAndClean(config.nhsUrl!));
    if (nhsText) successfulSources.push({ source: "nhs", text: nhsText });
  } else {
    await markUnavailable(admin, topic, "nhs", "No dedicated NHS page for this checklist");
  }

  if (config.owhUrl) {
    const owhText = await getOrFetchSource(admin, topic, "womenshealth", () => fetchAndClean(config.owhUrl!));
    if (owhText) successfulSources.push({ source: "womenshealth", text: owhText });
  } else {
    await markUnavailable(admin, topic, "womenshealth", "No dedicated OWH page for this checklist");
  }

  if (successfulSources.length === 0) {
    if (cached) return mapChecklistRow(cached, true);
    return null;
  }

  const { groups, rawSummary } = await consolidateChecklist(config.title, config.categories, successfulSources);
  const sourcesUsed = successfulSources.map((s) => s.source);
  const generatedAt = new Date().toISOString();

  const { data: saved, error } = await admin
    .from("checklist_content")
    .upsert(
      {
        checklist_type: checklistType,
        title: config.title,
        groups: groups ?? [],
        raw_summary: groups ? null : rawSummary,
        sources_used: sourcesUsed,
        generated_at: generatedAt,
      },
      { onConflict: "checklist_type" }
    )
    .select()
    .single();

  if (error || !saved) {
    if (cached) return mapChecklistRow(cached, true);
    return null;
  }
  return mapChecklistRow(saved, false);
}

function mapChecklistRow(
  row: {
    checklist_type: ChecklistType;
    title: string;
    groups: ChecklistGroup[] | null;
    raw_summary: string | null;
    sources_used: string[];
    generated_at: string | null;
  },
  fromCache: boolean
): ChecklistResult {
  return {
    checklistType: row.checklist_type,
    title: row.title,
    groups: row.groups ?? [],
    rawSummary: row.raw_summary,
    sourcesUsed: (row.sources_used ?? []) as SourceName[],
    generatedAt: row.generated_at,
    isRawFallback: !!row.raw_summary,
    fromCache,
  };
}

// ── Public entry point: activity/exercise guidance (by trimester) ───────

export interface ActivityRecommendationItem {
  label: string;
  description: string;
}

export interface ActivityContentResult {
  trimester: 1 | 2 | 3;
  recommendations: ActivityRecommendationItem[];
  rawSummary: string | null;
  sourcesUsed: SourceName[];
  generatedAt: string | null;
  isRawFallback: boolean;
  fromCache: boolean;
}

async function consolidateActivity(
  trimester: 1 | 2 | 3,
  sources: { source: SourceName; text: string }[]
): Promise<{ recommendations: ActivityRecommendationItem[] | null; rawSummary: string | null }> {
  const combined = sources.map((s) => `--- Source: ${SOURCE_LABELS[s.source]} ---\n${s.text.slice(0, 6000)}`).join("\n\n");
  const rawSummary = sources[0].text.slice(0, 600);

  const prompt =
    `Combined source material about exercise, rest, and activity during pregnancy, from official health sources:\n\n${combined}\n\n` +
    `Extract 4-6 activity recommendations specific to trimester ${trimester} of pregnancy, as a JSON object: ` +
    `{"recommendations": [{"label": "...", "description": "..."}, ...]}. ` +
    `Each "label" is a SHORT checklist-style label (2-4 words), like "Light stretches", "20-30 min walk", "Pelvic floor exercises", "Rest breaks", "Prenatal yoga", "Swimming". ` +
    `Each "description" is the full warm, practical sentence explaining that recommendation (1-2 sentences), grounded in the source material. ` +
    `Base every item ONLY on activities actually mentioned in the provided source material — never invent one not grounded in it. ` +
    `Respond with ONLY the JSON object, no markdown fences, no other text.`;

  const text = await callClaude(prompt);
  if (!text) return { recommendations: null, rawSummary };

  const parsed = extractJson<{ recommendations: ActivityRecommendationItem[] }>(text);
  return { recommendations: parsed?.recommendations ?? null, rawSummary };
}

export async function getOrCreateActivityContent(trimester: 1 | 2 | 3): Promise<ActivityContentResult | null> {
  const admin = createAdminSupabase();

  const { data: cached } = await admin
    .from("activity_content")
    .select("*")
    .eq("trimester", trimester)
    .maybeSingle();

  if (cached && cached.generated_at && isFresh(cached.generated_at) && cached.recommendation_items?.length > 0) {
    return mapActivityRow(cached, true);
  }

  const successfulSources: { source: SourceName; text: string }[] = [];

  const nhsText = await getOrFetchSource(admin, "pregnancy_exercise_overview", "nhs", () =>
    fetchAndClean(NHS_EXERCISE_URL)
  );
  if (nhsText) successfulSources.push({ source: "nhs", text: nhsText });

  const owhText = await getOrFetchSource(admin, "pregnancy_wellness_overview", "womenshealth", () =>
    fetchAndClean(WOMENSHEALTH_WELLNESS_URL)
  );
  if (owhText) successfulSources.push({ source: "womenshealth", text: owhText });

  if (successfulSources.length === 0) {
    const mpText = await getOrFetchSource(admin, "pregnancy_general_overview", "medlineplus", () =>
      fetchAndClean(MEDLINEPLUS_PREGNANCY_OVERVIEW_URL)
    );
    if (mpText) successfulSources.push({ source: "medlineplus", text: mpText });
  } else {
    await markUnavailable(admin, "pregnancy_general_overview", "medlineplus", "Only used when higher-priority sources fail");
  }

  if (successfulSources.length === 0) {
    if (cached) return mapActivityRow(cached, true);
    return null;
  }

  const { recommendations, rawSummary } = await consolidateActivity(trimester, successfulSources);
  const sourcesUsed = successfulSources.map((s) => s.source);
  const generatedAt = new Date().toISOString();

  const { data: saved, error } = await admin
    .from("activity_content")
    .upsert(
      {
        trimester,
        recommendation_items: recommendations ?? [],
        raw_summary: recommendations ? null : rawSummary,
        sources_used: sourcesUsed,
        generated_at: generatedAt,
      },
      { onConflict: "trimester" }
    )
    .select()
    .single();

  if (error || !saved) {
    if (cached) return mapActivityRow(cached, true);
    return null;
  }
  return mapActivityRow(saved, false);
}

function mapActivityRow(
  row: {
    trimester: 1 | 2 | 3;
    recommendation_items: ActivityRecommendationItem[] | null;
    raw_summary: string | null;
    sources_used: string[];
    generated_at: string | null;
  },
  fromCache: boolean
): ActivityContentResult {
  return {
    trimester: row.trimester,
    recommendations: row.recommendation_items ?? [],
    rawSummary: row.raw_summary,
    sourcesUsed: (row.sources_used ?? []) as SourceName[],
    generatedAt: row.generated_at,
    isRawFallback: !!row.raw_summary,
    fromCache,
  };
}

// ── Public entry point: Indian-food recommendations ─────────────────────
// Keyed by an arbitrary topic string — either `symptom:<symptom>` (surfaced
// alongside check-in coping tips) or `trimester:<1|2|3>` (surfaced on the
// home page). ICMR-NIN primary, OWH/MedlinePlus secondary.

export interface FoodRecommendationsResult {
  topic: string;
  recommendations: string[];
  rawSummary: string | null;
  sourcesUsed: SourceName[];
  generatedAt: string | null;
  isRawFallback: boolean;
  fromCache: boolean;
}

async function consolidateFoodRecommendations(
  displayLabel: string,
  sources: { source: SourceName; text: string }[]
): Promise<{ recommendations: string[] | null; rawSummary: string | null }> {
  const combined = sources.map((s) => `--- Source: ${SOURCE_LABELS[s.source]} ---\n${s.text.slice(0, 6000)}`).join("\n\n");
  const rawSummary = sources[0].text.slice(0, 600);

  const prompt =
    `Combined source material about pregnancy nutrition from official health sources:\n\n${combined}\n\n` +
    `Focused on "${displayLabel}", suggest Indian foods/remedies that fit the general nutrition guidance above ` +
    `(e.g. ginger tea for nausea, khichdi for easy digestion) as a JSON object: {"recommendations": ["...", "..."]}. ` +
    `3-5 short, warm, practical suggestions. Base every suggestion on general nutrition principles actually present ` +
    `in the source material (e.g. bland/easy-to-digest foods, iron-rich foods, hydration) — never invent a specific ` +
    `medical claim not grounded in it. If the sources don't give enough to go on, respond with {"recommendations": []}. ` +
    `Respond with ONLY the JSON object, no markdown fences, no other text.`;

  const text = await callClaude(prompt);
  if (!text) return { recommendations: null, rawSummary };

  const parsed = extractJson<{ recommendations: string[] }>(text);
  return { recommendations: parsed?.recommendations ?? null, rawSummary };
}

export async function getOrCreateFoodRecommendations(
  topic: string,
  displayLabel: string
): Promise<FoodRecommendationsResult | null> {
  const admin = createAdminSupabase();

  const { data: cached } = await admin.from("food_recommendations").select("*").eq("topic", topic).maybeSingle();
  if (cached && cached.generated_at && isFresh(cached.generated_at)) {
    return mapFoodRow(cached, true);
  }

  const successfulSources: { source: SourceName; text: string }[] = [];
  const sourceTopic = `food:${topic}`;

  const icmrText = await getOrFetchSource(admin, sourceTopic, "icmr_nin", () =>
    fetchAndClean(ICMR_NIN_DIETARY_GUIDELINES_URL)
  );
  if (icmrText) successfulSources.push({ source: "icmr_nin", text: icmrText });

  const owhText = await getOrFetchSource(admin, "pregnancy_wellness_overview", "womenshealth", () =>
    fetchAndClean(WOMENSHEALTH_WELLNESS_URL)
  );
  if (owhText) successfulSources.push({ source: "womenshealth", text: owhText });

  if (successfulSources.length === 0) {
    const mpText = await getOrFetchSource(admin, "pregnancy_general_overview", "medlineplus", () =>
      fetchAndClean(MEDLINEPLUS_PREGNANCY_OVERVIEW_URL)
    );
    if (mpText) successfulSources.push({ source: "medlineplus", text: mpText });
  }

  if (successfulSources.length === 0) {
    if (cached) return mapFoodRow(cached, true);
    return null;
  }

  const { recommendations, rawSummary } = await consolidateFoodRecommendations(displayLabel, successfulSources);
  const sourcesUsed = successfulSources.map((s) => s.source);
  const generatedAt = new Date().toISOString();

  const { data: saved, error } = await admin
    .from("food_recommendations")
    .upsert(
      {
        topic,
        recommendations: recommendations ?? [],
        raw_summary: recommendations ? null : rawSummary,
        sources_used: sourcesUsed,
        generated_at: generatedAt,
      },
      { onConflict: "topic" }
    )
    .select()
    .single();

  if (error || !saved) {
    if (cached) return mapFoodRow(cached, true);
    return null;
  }
  return mapFoodRow(saved, false);
}

function mapFoodRow(
  row: {
    topic: string;
    recommendations: string[];
    raw_summary: string | null;
    sources_used: string[];
    generated_at: string | null;
  },
  fromCache: boolean
): FoodRecommendationsResult {
  return {
    topic: row.topic,
    recommendations: row.recommendations ?? [],
    rawSummary: row.raw_summary,
    sourcesUsed: (row.sources_used ?? []) as SourceName[],
    generatedAt: row.generated_at,
    isRawFallback: !!row.raw_summary,
    fromCache,
  };
}

// ── Public entry point: FAQ ("ask instead of search") ───────────────────
// Same vetted-content-first pattern and source priority as symptom tips:
// MedlinePlus primary, OWH secondary, NHS tertiary (per-topic dedicated
// page where one exists).

export interface FaqAnswerResult {
  topic: string;
  question: string;
  answer: string[];
  rawSummary: string | null;
  sourcesUsed: SourceName[];
  generatedAt: string | null;
  isRawFallback: boolean;
  fromCache: boolean;
}

async function consolidateFaqAnswer(
  question: string,
  sources: { source: SourceName; text: string }[]
): Promise<{ answer: string[] | null; rawSummary: string | null }> {
  const combined = sources.map((s) => `--- Source: ${SOURCE_LABELS[s.source]} ---\n${s.text.slice(0, 6000)}`).join("\n\n");
  const rawSummary = sources[0].text.slice(0, 600);

  const prompt =
    `Combined source material from official health sources:\n\n${combined}\n\n` +
    `Answer this specific question, in a warm and reassuring (non-alarmist) tone: "${question}". ` +
    `Respond as a JSON object: {"answer": ["...", "..."]} — 2-4 short paragraphs/bullets covering what's normal, ` +
    `what might need attention, and when to contact a doctor, in that order where relevant. ` +
    `Base every statement ONLY on the provided source material — never invent anything not grounded in it. ` +
    `Adapt any UK-specific terms to US equivalents (e.g. "GP" -> "doctor"). ` +
    `Respond with ONLY the JSON object, no markdown fences, no other text.`;

  const text = await callClaude(prompt);
  if (!text) return { answer: null, rawSummary };

  const parsed = extractJson<{ answer: string[] }>(text);
  return { answer: parsed?.answer ?? null, rawSummary };
}

export async function getOrCreateFaqAnswer(topic: string, question: string): Promise<FaqAnswerResult | null> {
  const admin = createAdminSupabase();

  const { data: cached } = await admin.from("faq_content").select("*").eq("topic", topic).maybeSingle();
  if (cached && cached.generated_at && isFresh(cached.generated_at) && cached.answer?.length > 0) {
    return mapFaqRow(cached, true);
  }

  const successfulSources: { source: SourceName; text: string }[] = [];
  const sourceTopic = `faq:${topic}`;

  const mpText = await getOrFetchSource(admin, "pregnancy_symptoms_overview", "medlineplus", () =>
    fetchAndClean(MEDLINEPLUS_SYMPTOMS_OVERVIEW_URL)
  );
  if (mpText) successfulSources.push({ source: "medlineplus", text: mpText });

  const owhOverrideUrl = OWH_FAQ_URLS[topic];
  const owhText = await getOrFetchSource(
    admin,
    owhOverrideUrl ? `faq_owh:${topic}` : "pregnancy_discomforts_overview",
    "womenshealth",
    () => fetchAndClean(owhOverrideUrl ?? WOMENSHEALTH_DISCOMFORTS_URL)
  );
  if (owhText) successfulSources.push({ source: "womenshealth", text: owhText });

  const nhsUrl = NHS_FAQ_URLS[topic];
  if (nhsUrl) {
    const nhsText = await getOrFetchSource(admin, sourceTopic, "nhs", () => fetchAndClean(nhsUrl));
    if (nhsText) successfulSources.push({ source: "nhs", text: nhsText });
  } else {
    await markUnavailable(admin, sourceTopic, "nhs", "No dedicated NHS page for this FAQ topic");
  }

  if (successfulSources.length === 0) {
    if (cached) return mapFaqRow(cached, true);
    return null;
  }

  const { answer, rawSummary } = await consolidateFaqAnswer(question, successfulSources);
  const sourcesUsed = successfulSources.map((s) => s.source);
  const generatedAt = new Date().toISOString();

  const { data: saved, error } = await admin
    .from("faq_content")
    .upsert(
      {
        topic,
        question,
        answer: answer ?? [],
        raw_summary: answer ? null : rawSummary,
        sources_used: sourcesUsed,
        generated_at: generatedAt,
      },
      { onConflict: "topic" }
    )
    .select()
    .single();

  if (error || !saved) {
    if (cached) return mapFaqRow(cached, true);
    return null;
  }
  return mapFaqRow(saved, false);
}

function mapFaqRow(
  row: {
    topic: string;
    question: string;
    answer: string[];
    raw_summary: string | null;
    sources_used: string[];
    generated_at: string | null;
  },
  fromCache: boolean
): FaqAnswerResult {
  return {
    topic: row.topic,
    question: row.question,
    answer: row.answer ?? [],
    rawSummary: row.raw_summary,
    sourcesUsed: (row.sources_used ?? []) as SourceName[],
    generatedAt: row.generated_at,
    isRawFallback: !!row.raw_summary,
    fromCache,
  };
}

// ── Public entry point: curated news digest ─────────────────────────────
// A single cached row, refreshed periodically (7-day freshness window,
// shorter than the 6-month window used for evergreen content) — not a
// live feed. Consolidated from real source pages into a few short,
// non-alarmist blurbs; never invented headlines.

export interface NewsDigestResultItem {
  title: string;
  summary: string;
}

export interface NewsDigestResult {
  items: NewsDigestResultItem[];
  rawSummary: string | null;
  sourcesUsed: SourceName[];
  generatedAt: string | null;
  isRawFallback: boolean;
  fromCache: boolean;
}

async function consolidateNewsDigest(
  sources: { source: SourceName; text: string }[]
): Promise<{ items: NewsDigestResultItem[] | null; rawSummary: string | null }> {
  const combined = sources.map((s) => `--- Source: ${SOURCE_LABELS[s.source]} ---\n${s.text.slice(0, 6000)}`).join("\n\n");
  const rawSummary = sources[0].text.slice(0, 600);

  const prompt =
    `Combined source material about pregnancy from official health sources:\n\n${combined}\n\n` +
    `Extract 3-4 short, interesting, reassuring (non-alarmist) pregnancy-related pointers as a JSON object: ` +
    `{"items": [{"title": "...", "summary": "..."}, ...]}. ` +
    `Each "title" is a short punchy headline (5-8 words), each "summary" is 1-2 warm sentences. ` +
    `Base everything ONLY on the provided source material — never invent a fact, statistic, or claim not grounded in it. ` +
    `Avoid anything alarmist or anxiety-inducing — this is meant to feel calm and reassuring, not urgent. ` +
    `Respond with ONLY the JSON object, no markdown fences, no other text.`;

  const text = await callClaude(prompt);
  if (!text) return { items: null, rawSummary };

  const parsed = extractJson<{ items: NewsDigestResultItem[] }>(text);
  return { items: parsed?.items ?? null, rawSummary };
}

export async function getOrCreateNewsDigest(): Promise<NewsDigestResult | null> {
  const admin = createAdminSupabase();

  const { data: cached } = await admin.from("news_digest").select("*").eq("key", "digest").maybeSingle();
  if (cached && cached.generated_at && isFresh(cached.generated_at, SEVEN_DAYS_MS) && cached.items?.length > 0) {
    return mapNewsDigestRow(cached, true);
  }

  const successfulSources: { source: SourceName; text: string }[] = [];

  const nhsText = await getOrFetchSource(admin, "pregnancy_hub_digest", "nhs", () =>
    fetchAndClean(NHS_PREGNANCY_HUB_URL)
  );
  if (nhsText) successfulSources.push({ source: "nhs", text: nhsText });

  const mpText = await getOrFetchSource(admin, "pregnancy_general_overview", "medlineplus", () =>
    fetchAndClean(MEDLINEPLUS_PREGNANCY_OVERVIEW_URL)
  );
  if (mpText) successfulSources.push({ source: "medlineplus", text: mpText });

  if (successfulSources.length === 0) {
    if (cached) return mapNewsDigestRow(cached, true);
    return null;
  }

  const { items } = await consolidateNewsDigest(successfulSources);
  const sourcesUsed = successfulSources.map((s) => s.source);
  const generatedAt = new Date().toISOString();

  const { data: saved, error } = await admin
    .from("news_digest")
    .upsert(
      {
        key: "digest",
        items: items ?? [],
        sources_used: sourcesUsed,
        generated_at: generatedAt,
      },
      { onConflict: "key" }
    )
    .select()
    .single();

  if (error || !saved) {
    if (cached) return mapNewsDigestRow(cached, true);
    return null;
  }
  return mapNewsDigestRow(saved, false);
}

function mapNewsDigestRow(
  row: { items: NewsDigestResultItem[] | null; sources_used: string[]; generated_at: string | null },
  fromCache: boolean
): NewsDigestResult {
  const items = row.items ?? [];
  return {
    items,
    rawSummary: null,
    sourcesUsed: (row.sources_used ?? []) as SourceName[],
    generatedAt: row.generated_at,
    isRawFallback: items.length === 0,
    fromCache,
  };
}
