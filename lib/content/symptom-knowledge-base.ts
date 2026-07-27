// Seed data for the `symptom_knowledge_base` table — but only the taxonomy
// (which symptoms exist, their display names, and which are red flags) and
// the fixed red-flag safety messages. That's structural/safety metadata,
// not medical content, so it's fine to hand-maintain.
//
// Coping tips for non-red-flag symptoms are deliberately NOT seeded here —
// they're populated lazily by the fetch-fallback-consolidate-cache pipeline
// (lib/content-pipeline.ts) from NHS/womenshealth.gov/MedlinePlus the first
// time each symptom is looked up, never hand-written upfront.
//
// `keywords` are used for free-text matching (the chat companion, section 6)
// since chat messages aren't tag selections — a few natural phrasings per
// symptom, not exhaustive. Falls back to displayName if omitted.

export type SymptomCategory = "early_pregnancy" | "physical" | "emotional";

export const SYMPTOM_CATEGORY_LABELS: Record<SymptomCategory, string> = {
  early_pregnancy: "Early Pregnancy",
  physical: "Physical",
  emotional: "Emotional",
};

export interface SymptomKnowledgeEntry {
  symptom: string;
  displayName: string;
  isRedFlag: boolean;
  redFlagMessage?: string;
  category?: SymptomCategory;
  keywords?: string[];
}

export const SYMPTOM_KNOWLEDGE_BASE: SymptomKnowledgeEntry[] = [
  {
    symptom: "nausea",
    displayName: "Nausea / morning sickness",
    isRedFlag: false,
    category: "early_pregnancy",
    keywords: ["nausea", "nauseous", "morning sickness", "throwing up", "vomiting", "queasy"],
  },
  {
    symptom: "fatigue",
    displayName: "Fatigue",
    isRedFlag: false,
    category: "early_pregnancy",
    keywords: ["fatigue", "exhausted", "tired", "no energy", "worn out", "sleepy", "drained"],
  },
  {
    symptom: "frequent_urination",
    displayName: "Frequent urination",
    isRedFlag: false,
    category: "early_pregnancy",
    keywords: ["frequent urination", "peeing a lot", "peeing all the time", "bathroom a lot"],
  },
  {
    symptom: "heartburn",
    displayName: "Heartburn / indigestion",
    isRedFlag: false,
    category: "physical",
    keywords: ["heartburn", "indigestion", "acid reflux"],
  },
  {
    symptom: "constipation",
    displayName: "Constipation",
    isRedFlag: false,
    category: "physical",
    keywords: ["constipated", "constipation", "can't go", "can't poop"],
  },
  {
    symptom: "back_pain",
    displayName: "Back pain",
    isRedFlag: false,
    category: "physical",
    keywords: ["back pain", "backache", "my back hurts"],
  },
  {
    symptom: "headaches",
    displayName: "Headaches",
    isRedFlag: false,
    category: "physical",
    keywords: ["headache", "head hurts", "migraine"],
  },
  {
    symptom: "swelling",
    displayName: "Mild swelling (feet/ankles)",
    isRedFlag: false,
    category: "physical",
    keywords: ["swelling", "swollen feet", "swollen ankles", "puffy feet"],
  },
  {
    symptom: "leg_cramps",
    displayName: "Leg cramps",
    isRedFlag: false,
    category: "physical",
    keywords: ["leg cramps", "cramping legs", "charley horse"],
  },
  {
    symptom: "trouble_sleeping",
    displayName: "Trouble sleeping",
    isRedFlag: false,
    category: "physical",
    keywords: ["can't sleep", "trouble sleeping", "insomnia", "not sleeping well"],
  },
  {
    symptom: "round_ligament_pain",
    displayName: "Round ligament pain",
    isRedFlag: false,
    category: "physical",
    keywords: ["round ligament", "sharp pain in my side", "groin pain"],
  },
  {
    symptom: "mood_swings",
    displayName: "Mood swings",
    isRedFlag: false,
    category: "emotional",
    keywords: ["mood swings", "so emotional", "crying a lot", "irritable", "anxious", "overwhelmed"],
  },
  {
    symptom: "heavy_bleeding",
    displayName: "Heavy vaginal bleeding",
    isRedFlag: true,
    redFlagMessage:
      "Heavy vaginal bleeding should always be checked by your doctor right away — please contact your provider or seek emergency care now rather than waiting.",
    keywords: ["heavy bleeding", "bleeding a lot", "soaking through", "lots of blood"],
  },
  {
    symptom: "severe_abdominal_pain",
    displayName: "Severe abdominal pain",
    isRedFlag: true,
    redFlagMessage:
      "Severe or persistent abdominal pain needs prompt medical attention — please contact your doctor or seek emergency care now rather than waiting.",
    keywords: ["severe pain", "severe abdominal pain", "sharp stomach pain", "intense pain", "excruciating"],
  },
  {
    symptom: "reduced_fetal_movement",
    displayName: "Reduced or no fetal movement",
    isRedFlag: true,
    redFlagMessage:
      "A noticeable reduction in your baby's movement should be checked right away — please contact your doctor or midwife now, even if it's outside office hours.",
    keywords: ["baby not moving", "no movement", "reduced movement", "hasn't moved", "haven't felt the baby"],
  },
  {
    symptom: "severe_headache_vision",
    displayName: "Severe headache with vision changes",
    isRedFlag: true,
    redFlagMessage:
      "A severe headache combined with vision changes (blurring, spots, flashing) can be a sign of a serious condition — please contact your doctor or seek emergency care now.",
    keywords: ["severe headache", "blurry vision", "seeing spots", "vision changes", "flashing lights"],
  },
  {
    symptom: "high_fever",
    displayName: "High fever",
    isRedFlag: true,
    redFlagMessage:
      "A high fever during pregnancy should be checked promptly — please contact your doctor or seek care now rather than waiting it out.",
    keywords: ["high fever", "really hot", "burning up", "temperature of 103", "temperature of 104"],
  },
  {
    symptom: "fluid_leaking",
    displayName: "Fluid leaking",
    isRedFlag: true,
    redFlagMessage:
      "Fluid leaking can be a sign your water has broken — please contact your doctor or midwife right away, even if you're not sure.",
    keywords: ["water broke", "fluid leaking", "leaking fluid", "water is leaking"],
  },
  {
    symptom: "fainting_dizziness",
    displayName: "Fainting or severe dizziness",
    isRedFlag: true,
    redFlagMessage:
      "Fainting or severe dizziness should be checked promptly — please contact your doctor now, and sit or lie down safely in the meantime.",
    keywords: ["fainted", "fainting", "passed out", "severe dizziness", "very dizzy", "about to pass out"],
  },
  {
    symptom: "chest_pain_breathing",
    displayName: "Chest pain or difficulty breathing",
    isRedFlag: true,
    redFlagMessage:
      "Chest pain or difficulty breathing needs immediate medical attention — please seek emergency care now.",
    keywords: ["chest pain", "can't breathe", "trouble breathing", "difficulty breathing", "short of breath"],
  },
];
