import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CHECKIN_MODEL } from "@/lib/anthropic";
import { createAdminSupabase, type DBBabyName } from "@/lib/supabase";
import { BABY_NAMES_SEED, BABY_NAME_STYLE_TAGS, type BabyNameGender } from "@/lib/content/baby-names-seed";

// Lazy seed, same "tables stay empty until actually needed" pattern used
// throughout this app: check once whether `baby_names` has any rows, and if
// not, upsert the full curated dataset. Safe to call on every page load —
// it's a single cheap count query after the first visit, and the upsert
// itself is idempotent on the (name, gender) unique key, so editing entries
// in baby-names-seed.ts and revisiting the page keeps things in sync without
// creating duplicates.
export async function ensureBabyNamesSeeded(): Promise<void> {
  const admin = createAdminSupabase();
  const { count, error: countError } = await admin
    .from("baby_names")
    .select("*", { count: "exact", head: true });

  if (countError) return;
  if (count && count > 0) return;

  const rows = BABY_NAMES_SEED.map((n) => ({
    name: n.name,
    gender: n.gender,
    origin: n.origin,
    meaning: n.meaning,
    style_tags: n.styleTags,
    syllables: n.syllables,
  }));

  await admin.from("baby_names").upsert(rows, { onConflict: "name,gender" });
}

export async function getAllBabyNames(): Promise<DBBabyName[]> {
  const admin = createAdminSupabase();
  const { data } = await admin.from("baby_names").select("*").order("name", { ascending: true });
  return data ?? [];
}

export async function getSavedNameIds(userId: string): Promise<string[]> {
  const admin = createAdminSupabase();
  const { data } = await admin.from("saved_baby_names").select("baby_name_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.baby_name_id);
}

export interface NameSuggestion {
  name: string;
  id: string;
  meaning: string;
  origin: string;
  gender: string;
  styleTags: string[];
  why: string;
}

export interface SuggestNamesResult {
  suggestions: NameSuggestion[];
  isFallback: boolean;
}

// Very small keyword scorer used only to narrow the ~180-name dataset down
// to a manageable candidate pool before it goes to Claude — this keeps the
// prompt compact and cheap. It is NOT the final ranking; Claude does the
// actual matching against the user's freeform description, but only ever
// picks from names it was actually given (checked below), never inventing.
function scoreCandidate(desc: string, row: DBBabyName): number {
  const haystack = `${row.name} ${row.origin} ${row.meaning} ${row.style_tags.join(" ")}`.toLowerCase();
  const words = desc
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2);
  let score = 0;
  for (const w of words) {
    if (haystack.includes(w)) score += 1;
  }
  return score;
}

// Retrieve-then-present: score every row against her freeform description,
// take the top candidates (plus a random top-up if scoring was too sparse
// so Claude always has enough to choose from), then ask Claude to pick a
// short shortlist ONLY from those candidates. Anything Claude returns that
// doesn't match a candidate id we actually sent is dropped server-side —
// same defensive-grounding principle as the red-flag/knowledge-base RAG
// pattern used for symptom tips and the chat companion.
export async function suggestBabyNames(opts: {
  description: string;
  genderFilter?: "girl" | "boy" | "unisex";
}): Promise<SuggestNamesResult> {
  const { description, genderFilter } = opts;
  const allNames = await getAllBabyNames();

  const pool = genderFilter ? allNames.filter((n) => n.gender === genderFilter || n.gender === "unisex") : allNames;

  const scored = pool
    .map((row) => ({ row, score: scoreCandidate(description, row) }))
    .sort((a, b) => b.score - a.score);

  const topScored = scored.filter((s) => s.score > 0).slice(0, 25);
  const fillerNeeded = Math.max(0, 20 - topScored.length);
  const filler = scored.filter((s) => s.score === 0).slice(0, fillerNeeded);
  const candidates = [...topScored, ...filler].map((s) => s.row).slice(0, 30);

  const fallback: SuggestNamesResult = {
    isFallback: true,
    suggestions: candidates.slice(0, 6).map((c) => ({
      id: c.id,
      name: c.name,
      meaning: c.meaning,
      origin: c.origin,
      gender: c.gender,
      styleTags: c.style_tags,
      why: `${c.origin} name meaning "${c.meaning}."`,
    })),
  };

  const client = getAnthropicClient();
  if (!client || candidates.length === 0) return fallback;

  try {
    const candidateBlock = candidates
      .map((c, i) => `${i + 1}. ${c.name} (${c.gender}, ${c.origin}) — means "${c.meaning}"; tags: ${c.style_tags.join(", ")}`)
      .join("\n");

    const message = await client.messages.create({
      model: CHECKIN_MODEL,
      max_tokens: 600,
      system:
        "You help a pregnant user find baby names. You will be given a numbered list of candidate names " +
        "with their real meaning/origin/tags, and her freeform description of what she's looking for. " +
        "Pick 5-8 names from the list that best fit her description — you must ONLY choose from the numbered " +
        "list, never invent a name that isn't in it. Respond with strict JSON only, no prose outside the JSON: " +
        '{"picks": [{"number": <the list number>, "why": "<one short warm sentence on why it fits>"}]}',
      messages: [
        {
          role: "user",
          content: `Her description: "${description}"\n\nCandidate names:\n${candidateBlock}`,
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]) as { picks?: { number: number; why: string }[] };
    if (!parsed.picks || !Array.isArray(parsed.picks)) return fallback;

    const suggestions: NameSuggestion[] = [];
    for (const pick of parsed.picks) {
      const candidate = candidates[pick.number - 1];
      if (!candidate) continue; // guards against a hallucinated/out-of-range number
      suggestions.push({
        id: candidate.id,
        name: candidate.name,
        meaning: candidate.meaning,
        origin: candidate.origin,
        gender: candidate.gender,
        styleTags: candidate.style_tags,
        why: typeof pick.why === "string" && pick.why.trim() ? pick.why.trim() : `${candidate.origin} name meaning "${candidate.meaning}."`,
      });
    }

    if (suggestions.length === 0) return fallback;
    return { suggestions, isFallback: false };
  } catch {
    return fallback;
  }
}

// ── "Can't find a name? Ask the companion" ──────────────────────────────
// Unlike suggestBabyNames (retrieve-then-present against the existing
// dataset), this is the one place in the app where the AI is asked to
// produce genuinely new information rather than rephrase/rank sourced
// content — there's nothing to retrieve for a name that isn't in the
// database yet. That's an acceptable exception here specifically because
// name etymology is general-knowledge trivia, not medical/safety content —
// it doesn't carry the same grounding requirement as pregnancy or symptom
// content elsewhere in this app. The result is always labeled as an AI
// guess in the UI, and nothing is written to the shared `baby_names` table
// until the user explicitly reviews and confirms it via addCustomName.

export interface NameLookupSuggestion {
  name: string;
  recognized: boolean;
  meaning: string;
  origin: string;
  gender: BabyNameGender;
  styleTags: string[];
}

export async function findExistingByName(name: string): Promise<DBBabyName[]> {
  const admin = createAdminSupabase();
  const { data } = await admin.from("baby_names").select("*").ilike("name", name.trim());
  return data ?? [];
}

export async function lookupNameMeaning(name: string): Promise<NameLookupSuggestion | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const message = await client.messages.create({
      model: CHECKIN_MODEL,
      max_tokens: 300,
      system:
        "You help identify the likely meaning and origin of a baby name that isn't in a curated database yet, " +
        "using your general knowledge of name etymology. Be honest about uncertainty — if you don't recognize " +
        `the name or aren't reasonably confident, set "recognized" to false rather than guessing confidently. ` +
        `Only choose styleTags (0-3) from this fixed list: ${BABY_NAME_STYLE_TAGS.join(", ")}. ` +
        'Respond with strict JSON only, no prose outside it: {"recognized": true|false, "meaning": "...", ' +
        '"origin": "...", "gender": "girl"|"boy"|"unisex", "styleTags": ["..."]}',
      messages: [{ role: "user", content: `Name: "${name.trim()}"` }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      recognized?: boolean;
      meaning?: string;
      origin?: string;
      gender?: string;
      styleTags?: string[];
    };

    if (!parsed.recognized || !parsed.meaning || !parsed.origin) return null;

    const gender: BabyNameGender =
      parsed.gender === "girl" || parsed.gender === "boy" || parsed.gender === "unisex" ? parsed.gender : "unisex";

    // Drop any tag that isn't in our fixed taxonomy — same defensive
    // grounding principle used everywhere else the AI's output feeds a UI.
    const styleTags = (parsed.styleTags ?? []).filter((t): t is (typeof BABY_NAME_STYLE_TAGS)[number] =>
      (BABY_NAME_STYLE_TAGS as readonly string[]).includes(t)
    );

    return {
      name: name.trim(),
      recognized: true,
      meaning: parsed.meaning,
      origin: parsed.origin,
      gender,
      styleTags,
    };
  } catch {
    return null;
  }
}

export async function addCustomName(entry: {
  name: string;
  gender: BabyNameGender;
  origin: string;
  meaning: string;
  styleTags: string[];
}): Promise<DBBabyName | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("baby_names")
    .upsert(
      {
        name: entry.name.trim(),
        gender: entry.gender,
        origin: entry.origin.trim(),
        meaning: entry.meaning.trim(),
        style_tags: entry.styleTags,
      },
      { onConflict: "name,gender" }
    )
    .select()
    .single<DBBabyName>();

  if (error) return null;
  return data;
}
