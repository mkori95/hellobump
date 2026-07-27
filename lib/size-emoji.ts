// Deterministic week -> emoji lookup (spec-provided reference table), used
// alongside the "Today" card's size-comparison text. Keyed by week number
// rather than parsed from Claude's free-text phrase, since that's a lot more
// reliable than trying to match "about the size of a lemon" back to "lemon".
const WEEK_SIZE_EMOJI: Record<number, string> = {
  4: "🌰",
  5: "🌱",
  6: "🫛",
  7: "🫐",
  8: "🍓",
  9: "🍇",
  10: "🍊",
  11: "🍑",
  12: "🍈",
  13: "🍋",
  14: "🍋",
  15: "🍎",
  16: "🥑",
  17: "🥔",
  18: "🫑",
  19: "🍅",
  20: "🍌",
  21: "🥕",
  22: "🥭",
  23: "🥭",
  24: "🌽",
  25: "🥦",
  26: "🥬",
  27: "🥦",
  28: "🍆",
  29: "🎃",
  30: "🥬",
  31: "🥥",
  32: "🎃",
  33: "🍍",
  34: "🍈",
  35: "🍈",
  36: "🥬",
  37: "🥬",
  38: "🌿",
  39: "🍉",
  40: "🎃",
};

const GENERIC_BABY_EMOJI = "👶";

export function getSizeEmoji(week: number): string {
  return WEEK_SIZE_EMOJI[week] ?? GENERIC_BABY_EMOJI;
}
