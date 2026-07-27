import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Returns null when ANTHROPIC_API_KEY isn't set — callers should fall back
 * to a static, non-AI response rather than throw. Server-side only. */
export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Haiku is plenty for warmly rephrasing a short, pre-approved list of tips —
// no heavy reasoning needed, and it keeps per-check-in cost low.
export const CHECKIN_MODEL = "claude-haiku-4-5-20251001";
