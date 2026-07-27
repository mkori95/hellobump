import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CHECKIN_MODEL } from "@/lib/anthropic";
import { getOrCreateSymptomTips, getOrCreateFoodRecommendations, type SourceName } from "@/lib/content-pipeline";
import type { DBSymptomKnowledgeBase } from "@/lib/supabase";

export interface FoodRecommendationGroup {
  displayName: string;
  recommendations: string[];
}

export interface CheckinResult {
  hasRedFlag: boolean;
  responseText: string;
  sourcesUsed: SourceName[];
  foodRecommendations: FoodRecommendationGroup[];
}

// Retrieval-first: look up matching knowledge-base rows before any AI call.
// Red flags short-circuit straight to a fixed safety message — no coping
// tips are ever offered alongside them. For everything else, tips come from
// the fetch-fallback-consolidate-cache pipeline (lib/content-pipeline.ts),
// not hand-written content — the AI here only rephrases what that pipeline
// already retrieved/synthesized, warmly and in the context of today's note.
export async function buildCheckinResponse(opts: {
  moodText: string;
  selectedSymptoms: string[];
  knowledgeBase: DBSymptomKnowledgeBase[];
}): Promise<CheckinResult> {
  const { moodText, selectedSymptoms, knowledgeBase } = opts;
  const matched = knowledgeBase.filter((k) => selectedSymptoms.includes(k.symptom));

  const redFlags = matched.filter((k) => k.is_red_flag);
  if (redFlags.length > 0) {
    const messages = redFlags.map((r) => r.red_flag_message).filter(Boolean) as string[];
    return { hasRedFlag: true, responseText: messages.join("\n\n"), sourcesUsed: [], foodRecommendations: [] };
  }

  const nonRedFlag = matched.filter((k) => !k.is_red_flag);
  if (nonRedFlag.length === 0) {
    return {
      hasRedFlag: false,
      sourcesUsed: [],
      foodRecommendations: [],
      responseText: moodText.trim()
        ? "Thanks for checking in today — noted. Take care of yourself, and reach out to your doctor if anything feels off."
        : "Thanks for checking in today!",
    };
  }

  const [results, foodResults] = await Promise.all([
    Promise.all(
      nonRedFlag.map(async (row) => ({
        displayName: row.display_name,
        result: await getOrCreateSymptomTips(row.symptom, row.display_name),
      }))
    ),
    Promise.all(
      nonRedFlag.map(async (row) => ({
        displayName: row.display_name,
        result: await getOrCreateFoodRecommendations(`symptom:${row.symptom}`, row.display_name),
      }))
    ),
  ]);

  const tipGroups = results
    .filter((r) => r.result && r.result.tips.length > 0)
    .map((r) => ({ displayName: r.displayName, tips: r.result!.tips }));

  const foodRecommendations = foodResults
    .filter((r) => r.result && r.result.recommendations.length > 0)
    .map((r) => ({ displayName: r.displayName, recommendations: r.result!.recommendations }));

  const sourcesUsed = Array.from(
    new Set([
      ...results.flatMap((r) => r.result?.sourcesUsed ?? []),
      ...foodResults.flatMap((r) => r.result?.sourcesUsed ?? []),
    ])
  ) as SourceName[];

  if (tipGroups.length === 0) {
    return {
      hasRedFlag: false,
      sourcesUsed,
      foodRecommendations,
      responseText:
        "Thanks for checking in today. I couldn't find specific tips for that right now — if it's bothering you, it's worth mentioning to your doctor.",
    };
  }

  const staticFallback = buildStaticTipsResponse(tipGroups);

  const client = getAnthropicClient();
  if (!client) {
    return { hasRedFlag: false, responseText: staticFallback, sourcesUsed, foodRecommendations };
  }

  try {
    const tipsBlock = tipGroups
      .map((g) => `${g.displayName}:\n${g.tips.map((t) => `- ${t}`).join("\n")}`)
      .join("\n\n");

    const message = await client.messages.create({
      model: CHECKIN_MODEL,
      max_tokens: 400,
      system:
        "You are a warm, supportive companion for a pregnant user checking in about how she feels today. " +
        "You will be given a set of pre-approved coping tips for her reported symptoms. " +
        "Rephrase ONLY those tips in a warm, encouraging tone — do not add any new medical advice, " +
        "tips, or facts that aren't in the list provided, and don't speculate about diagnoses. " +
        "Keep it brief: a short warm intro plus the tips as a compact list. " +
        "If her note mentions something outside the provided tips, acknowledge it warmly without " +
        "giving new medical advice, and gently suggest mentioning it to her doctor if it seems relevant.",
      messages: [
        {
          role: "user",
          content: `How she said she's feeling today: "${moodText || "(no notes provided)"}"\n\nPre-approved tips for her reported symptoms:\n${tipsBlock}`,
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return { hasRedFlag: false, responseText: text || staticFallback, sourcesUsed, foodRecommendations };
  } catch {
    return { hasRedFlag: false, responseText: staticFallback, sourcesUsed, foodRecommendations };
  }
}

function buildStaticTipsResponse(tipGroups: { displayName: string; tips: string[] }[]): string {
  const lines = tipGroups.map((g) => `${g.displayName}:\n${g.tips.map((t) => `- ${t}`).join("\n")}`);
  return `Thanks for checking in today. A few gentle things that might help:\n\n${lines.join("\n\n")}`;
}
