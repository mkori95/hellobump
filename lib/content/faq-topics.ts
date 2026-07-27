// Feature 7 ("Ask instead of search"): a fixed, curated list of common
// anxious pregnancy searches. Answers are never hand-written — resolved
// lazily via the fetch-fallback-consolidate-cache pipeline, same as
// symptom_knowledge_base. This taxonomy is just structural metadata (which
// questions exist), not medical content.

export interface FaqTopic {
  topic: string;
  question: string;
}

export const FAQ_TOPICS: FaqTopic[] = [
  { topic: "spotting", question: "Is spotting or light bleeding during pregnancy normal?" },
  { topic: "cramping", question: "Is cramping during pregnancy normal?" },
  { topic: "food_safety", question: "What foods should I avoid during pregnancy?" },
  { topic: "exercise_safety", question: "Is it safe to exercise during pregnancy?" },
  { topic: "sex_during_pregnancy", question: "Is sex safe during pregnancy?" },
];

// Shown as their own standalone tiles on /discover (not folded into the FAQ
// accordion above) — same grounded pipeline, just always-visible content
// rather than a question to tap open.
export const DOOMSCROLL_TOPIC: FaqTopic = {
  topic: "doomscroll_alternatives",
  question: "What are some healthy ways to cope with pregnancy anxiety besides scrolling my phone?",
};

export const WELLNESS_TOPIC: FaqTopic = {
  topic: "relaxation_wellness",
  question: "What relaxation techniques, meditation, or yoga can help during pregnancy?",
};
