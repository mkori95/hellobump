import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CHECKIN_MODEL } from "@/lib/anthropic";
import { getOrCreateSymptomTips, type SourceName } from "@/lib/content-pipeline";
import { SYMPTOM_KNOWLEDGE_BASE } from "@/lib/content/symptom-knowledge-base";
import type { DBChatMessage, DBDailyCheckin } from "@/lib/supabase";

export interface ChatResult {
  hasRedFlag: boolean;
  responseText: string;
  sourcesUsed: SourceName[];
}

// Free-text symptom matching — the daily check-in RAG uses tag selections,
// but chat is open-ended, so we scan the message for keyword matches
// against the same taxonomy instead. Red flags always short-circuit to the
// fixed safety message; never offered coping tips or AI-generated framing.
function matchSymptoms(message: string) {
  const lower = message.toLowerCase();
  return SYMPTOM_KNOWLEDGE_BASE.filter((entry) => {
    const terms = entry.keywords?.length ? entry.keywords : [entry.displayName.toLowerCase()];
    return terms.some((term) => lower.includes(term.toLowerCase()));
  });
}

function summarizeCheckins(checkins: DBDailyCheckin[]): string {
  if (checkins.length === 0) return "No check-ins logged yet.";
  return checkins
    .map((c) => {
      const parts = [c.checkin_date];
      if (c.mood_text) parts.push(`note: "${c.mood_text}"`);
      if (c.symptoms.length > 0) parts.push(`symptoms: ${c.symptoms.join(", ")}`);
      return `- ${parts.join(" — ")}`;
    })
    .join("\n");
}

export async function buildChatResponse(opts: {
  userMessage: string;
  recentMessages: DBChatMessage[];
  recentCheckins: DBDailyCheckin[];
}): Promise<ChatResult> {
  const { userMessage, recentMessages, recentCheckins } = opts;

  const matched = matchSymptoms(userMessage);
  const redFlags = matched.filter((m) => m.isRedFlag);

  if (redFlags.length > 0) {
    const messages = redFlags.map((r) => r.redFlagMessage).filter(Boolean) as string[];
    return { hasRedFlag: true, responseText: messages.join("\n\n"), sourcesUsed: [] };
  }

  const nonRedFlag = matched.filter((m) => !m.isRedFlag);
  const tipsResults = await Promise.all(
    nonRedFlag.map(async (entry) => ({
      displayName: entry.displayName,
      result: await getOrCreateSymptomTips(entry.symptom, entry.displayName),
    }))
  );

  const groundedTips = tipsResults
    .filter((r) => r.result && r.result.tips.length > 0)
    .map((r) => `${r.displayName}: ${r.result!.tips.join("; ")}`);

  const sourcesUsed = Array.from(
    new Set(tipsResults.flatMap((r) => r.result?.sourcesUsed ?? []))
  ) as SourceName[];

  const checkinSummary = summarizeCheckins(recentCheckins);

  const staticFallback =
    groundedTips.length > 0
      ? `Thanks for sharing. A few things that might help:\n\n${groundedTips.join("\n")}`
      : "Thanks for sharing how you're feeling — I'm here anytime you want to talk it through.";

  const client = getAnthropicClient();
  if (!client) {
    return { hasRedFlag: false, responseText: staticFallback, sourcesUsed };
  }

  // Three distinct cases — never let the model reach for generic health/
  // medical advice on its own, even when nothing tracked matched. Only the
  // "grounded" branch is allowed to state anything resembling a coping tip.
  let groundingInstruction: string;
  if (nonRedFlag.length > 0 && groundedTips.length > 0) {
    groundingInstruction =
      `She mentioned something matching pre-approved coping tips from vetted health sources. Weave these naturally into your reply — do NOT invent any medical advice, tips, or facts beyond what's listed here:\n${groundedTips.join("\n")}`;
  } else if (nonRedFlag.length > 0) {
    groundingInstruction =
      "She mentioned a symptom, but we don't have vetted tips for it cached right now. Acknowledge warmly, do NOT invent or guess any coping tips/remedies yourself, and gently suggest mentioning it to her doctor if it's bothering her.";
  } else {
    groundingInstruction =
      "Nothing in her message matched a tracked symptom. Respond warmly and conversationally. " +
      "This does NOT give you license to offer health/medical/wellness tips, remedies, or advice of your own — if she raises anything medical-adjacent that isn't covered above, acknowledge it warmly without giving advice, and suggest she mention it to her doctor.";
  }

  const systemPrompt =
    "You are a warm, supportive companion for a pregnant user of the HelloBump app — like a friend cheering her on, not a clinical assistant. " +
    "Keep replies conversational and fairly brief (a few sentences, not an essay). " +
    `Her recent daily check-ins (most recent last), for context so you can reference how she's actually been feeling:\n${checkinSummary}\n\n` +
    groundingInstruction +
    "\n\nIf the conversation touches on anything medical/symptom-related, gently note that this isn't a substitute for her doctor's advice. " +
    "Hard rule: never state a health/medical tip, remedy, or fact unless it is explicitly provided above as grounding — general emotional support and casual conversation don't need grounding, specific advice always does.";

  const history: Anthropic.MessageParam[] = recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const message = await client.messages.create({
      model: CHECKIN_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [...history, { role: "user", content: userMessage }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return { hasRedFlag: false, responseText: text || staticFallback, sourcesUsed };
  } catch {
    return { hasRedFlag: false, responseText: staticFallback, sourcesUsed };
  }
}
