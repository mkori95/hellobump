// Client-safe constants shared between the (server-only) content pipeline
// and UI components. Deliberately has zero imports of its own — cheerio,
// the Anthropic SDK, and the Supabase admin client must never end up in a
// client bundle, so nothing that touches those can live in this file.

export type SourceName = "nhs" | "womenshealth" | "medlineplus" | "icmr_nin";

export const SOURCE_LABELS: Record<SourceName, string> = {
  nhs: "NHS",
  womenshealth: "Office on Women's Health",
  medlineplus: "MedlinePlus",
  icmr_nin: "ICMR-NIN",
};
