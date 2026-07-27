// Seed data for the `baby_names` table — a real, hand-curated names dataset,
// NOT AI-generated. Meanings/origins reflect widely-documented etymology
// (the same facts you'd find across baby-name references), not invented
// content. This is structural/reference data exactly like
// SYMPTOM_KNOWLEDGE_BASE's taxonomy — safe to hand-maintain and expand over
// time by adding more entries here.
//
// Seeding itself is lazy: lib/baby-names.ts checks whether `baby_names` is
// empty and upserts this list the first time the Names page is visited,
// matching the "tables stay empty until actually needed" pattern used
// throughout this app. Safe to re-run — upserts on the (name, gender)
// unique key, so editing/adding entries here and revisiting the page keeps
// existing rows in sync without creating duplicates.
//
// styleTags are drawn from a fixed, small taxonomy (BABY_NAME_STYLE_TAGS
// below) so the filter UI can show a bounded set of chips, the same
// approach as the check-in symptom categories.

export type BabyNameGender = "girl" | "boy" | "unisex";

export const BABY_NAME_STYLE_TAGS = [
  "modern",
  "traditional",
  "nature-inspired",
  "short",
  "unisex-friendly",
  "mythological",
  "royal",
  "literary",
  "light-meaning",
  "strong-meaning",
  "floral",
  "celestial",
  "water-related",
  "virtue",
] as const;

export type BabyNameStyleTag = (typeof BABY_NAME_STYLE_TAGS)[number];

export const BABY_NAME_ORIGINS = [
  "Sanskrit",
  "Hindi",
  "Tamil",
  "Hebrew",
  "Greek",
  "Latin",
  "Irish/Celtic",
  "Arabic",
  "Japanese",
  "English",
  "French",
  "Old Norse",
  "Persian",
  "Welsh",
  "Igbo",
  "Swahili",
] as const;

export interface BabyNameSeed {
  name: string;
  gender: BabyNameGender;
  origin: string;
  meaning: string;
  styleTags: BabyNameStyleTag[];
  syllables: number;
}

export const BABY_NAMES_SEED: BabyNameSeed[] = [
  // ── Sanskrit / Hindi ─────────────────────────────────────────────────
  { name: "Aarav", gender: "boy", origin: "Sanskrit", meaning: "peaceful, wise", styleTags: ["modern", "unisex-friendly"], syllables: 2 },
  { name: "Ananya", gender: "girl", origin: "Sanskrit", meaning: "unique, without equal", styleTags: ["modern"], syllables: 3 },
  { name: "Ishaan", gender: "boy", origin: "Sanskrit", meaning: "sun, one who protects", styleTags: ["light-meaning", "traditional"], syllables: 2 },
  { name: "Diya", gender: "girl", origin: "Hindi", meaning: "lamp, light", styleTags: ["short", "light-meaning"], syllables: 2 },
  { name: "Arjun", gender: "boy", origin: "Sanskrit", meaning: "bright, shining, white", styleTags: ["mythological", "traditional", "light-meaning"], syllables: 2 },
  { name: "Kavya", gender: "girl", origin: "Sanskrit", meaning: "poetry", styleTags: ["literary", "modern"], syllables: 2 },
  { name: "Vihaan", gender: "boy", origin: "Sanskrit", meaning: "dawn, beginning of a new day", styleTags: ["modern", "light-meaning"], syllables: 2 },
  { name: "Saanvi", gender: "girl", origin: "Sanskrit", meaning: "goddess Lakshmi, knowledge", styleTags: ["traditional", "modern"], syllables: 2 },
  { name: "Advait", gender: "boy", origin: "Sanskrit", meaning: "unique, non-dual", styleTags: ["modern"], syllables: 2 },
  { name: "Anika", gender: "girl", origin: "Sanskrit", meaning: "grace, sweet-faced", styleTags: ["modern", "virtue"], syllables: 3 },
  { name: "Rohan", gender: "boy", origin: "Sanskrit", meaning: "ascending, rising", styleTags: ["traditional", "unisex-friendly"], syllables: 2 },
  { name: "Priya", gender: "girl", origin: "Sanskrit", meaning: "beloved, dear", styleTags: ["traditional", "virtue"], syllables: 2 },
  { name: "Dhruv", gender: "boy", origin: "Sanskrit", meaning: "fixed, immovable, the pole star", styleTags: ["short", "celestial", "mythological"], syllables: 1 },
  { name: "Kiara", gender: "girl", origin: "Sanskrit", meaning: "dark-haired, bright", styleTags: ["modern"], syllables: 3 },
  { name: "Nikhil", gender: "boy", origin: "Sanskrit", meaning: "whole, complete", styleTags: ["traditional"], syllables: 2 },
  { name: "Aditi", gender: "girl", origin: "Sanskrit", meaning: "boundless, mother of the gods", styleTags: ["mythological", "traditional"], syllables: 3 },
  { name: "Vivaan", gender: "boy", origin: "Sanskrit", meaning: "full of life", styleTags: ["modern", "strong-meaning"], syllables: 2 },
  { name: "Riya", gender: "girl", origin: "Sanskrit", meaning: "singer, graceful", styleTags: ["short", "modern"], syllables: 2 },
  { name: "Kabir", gender: "boy", origin: "Arabic", meaning: "great, powerful", styleTags: ["traditional", "strong-meaning"], syllables: 2 },
  { name: "Anaya", gender: "girl", origin: "Sanskrit", meaning: "caring, compassionate", styleTags: ["modern", "virtue"], syllables: 3 },
  { name: "Reyansh", gender: "boy", origin: "Sanskrit", meaning: "a ray of light, part of the divine", styleTags: ["modern", "light-meaning"], syllables: 2 },
  { name: "Myra", gender: "girl", origin: "Sanskrit", meaning: "prosperous, admirable", styleTags: ["modern", "short"], syllables: 2 },
  { name: "Shaurya", gender: "boy", origin: "Sanskrit", meaning: "bravery, valor", styleTags: ["strong-meaning", "virtue"], syllables: 2 },
  { name: "Ira", gender: "girl", origin: "Sanskrit", meaning: "earth, goddess of speech", styleTags: ["short", "mythological", "nature-inspired"], syllables: 2 },
  { name: "Vedant", gender: "boy", origin: "Sanskrit", meaning: "end of the Vedas, ultimate knowledge", styleTags: ["traditional", "literary"], syllables: 2 },
  { name: "Naina", gender: "girl", origin: "Hindi", meaning: "eyes", styleTags: ["traditional"], syllables: 2 },
  { name: "Lakshmi", gender: "girl", origin: "Sanskrit", meaning: "goddess of prosperity and fortune", styleTags: ["mythological", "traditional"], syllables: 2 },
  { name: "Krishna", gender: "unisex", origin: "Sanskrit", meaning: "black, dark; the god Krishna", styleTags: ["mythological", "traditional"], syllables: 2 },
  { name: "Arya", gender: "unisex", origin: "Sanskrit", meaning: "noble, honorable", styleTags: ["unisex-friendly", "short", "virtue"], syllables: 2 },
  { name: "Veda", gender: "girl", origin: "Sanskrit", meaning: "knowledge, sacred wisdom", styleTags: ["traditional", "short", "literary"], syllables: 2 },
  { name: "Chetan", gender: "boy", origin: "Sanskrit", meaning: "consciousness, spirit", styleTags: ["traditional"], syllables: 2 },
  { name: "Nitya", gender: "girl", origin: "Sanskrit", meaning: "eternal, constant", styleTags: ["traditional", "virtue"], syllables: 2 },
  { name: "Mohan", gender: "boy", origin: "Sanskrit", meaning: "charming, attractive; a name of Krishna", styleTags: ["mythological", "traditional"], syllables: 2 },
  { name: "Radha", gender: "girl", origin: "Sanskrit", meaning: "success, the beloved of Krishna", styleTags: ["mythological", "traditional"], syllables: 2 },
  { name: "Surya", gender: "unisex", origin: "Sanskrit", meaning: "the sun", styleTags: ["celestial", "light-meaning", "unisex-friendly"], syllables: 2 },
  { name: "Tara", gender: "girl", origin: "Sanskrit", meaning: "star", styleTags: ["short", "celestial"], syllables: 2 },
  { name: "Uma", gender: "girl", origin: "Sanskrit", meaning: "tranquility, splendor; a name of the goddess Parvati", styleTags: ["short", "mythological", "traditional"], syllables: 2 },
  { name: "Devansh", gender: "boy", origin: "Sanskrit", meaning: "part of god", styleTags: ["modern", "traditional"], syllables: 2 },
  { name: "Anvi", gender: "girl", origin: "Sanskrit", meaning: "one who seeks, prayer", styleTags: ["short", "modern"], syllables: 2 },
  { name: "Yash", gender: "boy", origin: "Sanskrit", meaning: "fame, glory, success", styleTags: ["short", "strong-meaning"], syllables: 1 },

  // ── Tamil ────────────────────────────────────────────────────────────
  { name: "Kavin", gender: "boy", origin: "Tamil", meaning: "handsome, poet", styleTags: ["short", "literary"], syllables: 2 },
  { name: "Amudha", gender: "girl", origin: "Tamil", meaning: "nectar, sweetness", styleTags: ["traditional"], syllables: 3 },
  { name: "Karthik", gender: "boy", origin: "Tamil", meaning: "son of Shiva, god of war and victory", styleTags: ["mythological", "traditional"], syllables: 2 },
  { name: "Deepa", gender: "girl", origin: "Tamil", meaning: "lamp, light", styleTags: ["light-meaning", "traditional"], syllables: 2 },
  { name: "Ilan", gender: "boy", origin: "Tamil", meaning: "youthful, young", styleTags: ["short", "modern"], syllables: 2 },
  { name: "Meenakshi", gender: "girl", origin: "Tamil", meaning: "fish-eyed, a form of the goddess Parvati", styleTags: ["mythological", "traditional"], syllables: 4 },
  { name: "Kannan", gender: "boy", origin: "Tamil", meaning: "a name of Krishna, dark and beautiful", styleTags: ["mythological", "traditional"], syllables: 2 },
  { name: "Anitha", gender: "girl", origin: "Tamil", meaning: "leader, one without end", styleTags: ["traditional"], syllables: 3 },

  // ── Hebrew ───────────────────────────────────────────────────────────
  { name: "Noah", gender: "boy", origin: "Hebrew", meaning: "rest, comfort", styleTags: ["short", "modern", "virtue"], syllables: 1 },
  { name: "Eli", gender: "boy", origin: "Hebrew", meaning: "ascended, my god", styleTags: ["short", "traditional"], syllables: 2 },
  { name: "Ezra", gender: "unisex", origin: "Hebrew", meaning: "help, helper", styleTags: ["short", "unisex-friendly", "virtue"], syllables: 2 },
  { name: "Miriam", gender: "girl", origin: "Hebrew", meaning: "wished-for child, bitter sea", styleTags: ["traditional", "water-related"], syllables: 3 },
  { name: "Naomi", gender: "girl", origin: "Hebrew", meaning: "pleasantness", styleTags: ["traditional", "virtue"], syllables: 3 },
  { name: "David", gender: "boy", origin: "Hebrew", meaning: "beloved", styleTags: ["traditional", "royal"], syllables: 2 },
  { name: "Sarah", gender: "girl", origin: "Hebrew", meaning: "princess, noblewoman", styleTags: ["traditional", "royal"], syllables: 2 },
  { name: "Rachel", gender: "girl", origin: "Hebrew", meaning: "ewe, one with purity", styleTags: ["traditional"], syllables: 2 },
  { name: "Daniel", gender: "boy", origin: "Hebrew", meaning: "God is my judge", styleTags: ["traditional"], syllables: 3 },
  { name: "Michael", gender: "boy", origin: "Hebrew", meaning: "who is like God", styleTags: ["traditional"], syllables: 2 },
  { name: "Hannah", gender: "girl", origin: "Hebrew", meaning: "grace, favor", styleTags: ["traditional", "short", "virtue"], syllables: 2 },
  { name: "Adam", gender: "boy", origin: "Hebrew", meaning: "of the earth, man", styleTags: ["short", "traditional", "nature-inspired"], syllables: 2 },
  { name: "Eve", gender: "girl", origin: "Hebrew", meaning: "life, living one", styleTags: ["short", "traditional"], syllables: 1 },
  { name: "Samuel", gender: "boy", origin: "Hebrew", meaning: "God has heard", styleTags: ["traditional"], syllables: 3 },
  { name: "Leah", gender: "girl", origin: "Hebrew", meaning: "weary, gazelle", styleTags: ["short", "traditional"], syllables: 2 },
  { name: "Abigail", gender: "girl", origin: "Hebrew", meaning: "my father's joy", styleTags: ["traditional", "virtue"], syllables: 4 },
  { name: "Benjamin", gender: "boy", origin: "Hebrew", meaning: "son of the right hand", styleTags: ["traditional"], syllables: 3 },
  { name: "Gabriel", gender: "boy", origin: "Hebrew", meaning: "God is my strength", styleTags: ["traditional", "strong-meaning"], syllables: 3 },
  { name: "Elijah", gender: "boy", origin: "Hebrew", meaning: "my God is Yahweh", styleTags: ["traditional"], syllables: 3 },
  { name: "Talia", gender: "girl", origin: "Hebrew", meaning: "dew from heaven", styleTags: ["nature-inspired", "celestial"], syllables: 3 },

  // ── Greek ────────────────────────────────────────────────────────────
  { name: "Alexander", gender: "boy", origin: "Greek", meaning: "defender of the people", styleTags: ["traditional", "royal", "strong-meaning"], syllables: 4 },
  { name: "Sophia", gender: "girl", origin: "Greek", meaning: "wisdom", styleTags: ["traditional", "modern", "virtue"], syllables: 3 },
  { name: "Helena", gender: "girl", origin: "Greek", meaning: "light, torch", styleTags: ["traditional", "light-meaning"], syllables: 3 },
  { name: "Theodore", gender: "boy", origin: "Greek", meaning: "gift of God", styleTags: ["traditional"], syllables: 3 },
  { name: "Chloe", gender: "girl", origin: "Greek", meaning: "blooming, fertility", styleTags: ["modern", "floral", "short"], syllables: 2 },
  { name: "Nikolas", gender: "boy", origin: "Greek", meaning: "victory of the people", styleTags: ["traditional", "strong-meaning"], syllables: 3 },
  { name: "Penelope", gender: "girl", origin: "Greek", meaning: "weaver", styleTags: ["mythological", "literary"], syllables: 4 },
  { name: "Zoe", gender: "girl", origin: "Greek", meaning: "life", styleTags: ["short", "modern"], syllables: 2 },
  { name: "Damon", gender: "boy", origin: "Greek", meaning: "to tame, loyal companion", styleTags: ["short", "modern"], syllables: 2 },
  { name: "Athena", gender: "girl", origin: "Greek", meaning: "goddess of wisdom and war", styleTags: ["mythological", "strong-meaning"], syllables: 3 },
  { name: "Iris", gender: "girl", origin: "Greek", meaning: "rainbow; goddess of the rainbow", styleTags: ["short", "mythological", "nature-inspired", "floral"], syllables: 2 },
  { name: "Phoebe", gender: "girl", origin: "Greek", meaning: "bright, radiant, the moon", styleTags: ["mythological", "celestial", "light-meaning"], syllables: 2 },
  { name: "Leon", gender: "boy", origin: "Greek", meaning: "lion", styleTags: ["short", "strong-meaning"], syllables: 2 },
  { name: "Cassia", gender: "girl", origin: "Greek", meaning: "cinnamon, spice tree", styleTags: ["nature-inspired", "modern"], syllables: 3 },

  // ── Latin ────────────────────────────────────────────────────────────
  { name: "Felix", gender: "boy", origin: "Latin", meaning: "happy, fortunate", styleTags: ["short", "virtue"], syllables: 2 },
  { name: "Clara", gender: "girl", origin: "Latin", meaning: "clear, bright", styleTags: ["traditional", "light-meaning"], syllables: 2 },
  { name: "Victor", gender: "boy", origin: "Latin", meaning: "conqueror", styleTags: ["traditional", "strong-meaning"], syllables: 2 },
  { name: "Luna", gender: "girl", origin: "Latin", meaning: "moon", styleTags: ["short", "celestial", "modern"], syllables: 2 },
  { name: "Marcus", gender: "boy", origin: "Latin", meaning: "dedicated to Mars, warrior", styleTags: ["traditional", "strong-meaning"], syllables: 2 },
  { name: "Aurora", gender: "girl", origin: "Latin", meaning: "dawn", styleTags: ["mythological", "celestial", "light-meaning"], syllables: 3 },
  { name: "Julia", gender: "girl", origin: "Latin", meaning: "youthful", styleTags: ["traditional"], syllables: 3 },
  { name: "Silas", gender: "boy", origin: "Latin", meaning: "of the forest", styleTags: ["nature-inspired", "literary"], syllables: 2 },
  { name: "Vera", gender: "girl", origin: "Latin", meaning: "truth", styleTags: ["short", "virtue"], syllables: 2 },
  { name: "Felicity", gender: "girl", origin: "Latin", meaning: "happiness, good fortune", styleTags: ["virtue"], syllables: 4 },
  { name: "Vincent", gender: "boy", origin: "Latin", meaning: "conquering", styleTags: ["traditional", "strong-meaning"], syllables: 2 },
  { name: "Stella", gender: "girl", origin: "Latin", meaning: "star", styleTags: ["short", "celestial", "modern"], syllables: 2 },
  { name: "Magnus", gender: "boy", origin: "Latin", meaning: "great", styleTags: ["strong-meaning", "royal"], syllables: 2 },
  { name: "Lucia", gender: "girl", origin: "Latin", meaning: "light", styleTags: ["light-meaning", "traditional"], syllables: 3 },

  // ── Irish / Celtic ───────────────────────────────────────────────────
  { name: "Liam", gender: "boy", origin: "Irish/Celtic", meaning: "strong-willed warrior, protector", styleTags: ["short", "modern", "strong-meaning"], syllables: 2 },
  { name: "Aoife", gender: "girl", origin: "Irish/Celtic", meaning: "beauty, radiance", styleTags: ["mythological", "modern"], syllables: 2 },
  { name: "Declan", gender: "boy", origin: "Irish/Celtic", meaning: "full of goodness", styleTags: ["traditional", "virtue"], syllables: 2 },
  { name: "Saoirse", gender: "girl", origin: "Irish/Celtic", meaning: "freedom", styleTags: ["modern", "virtue"], syllables: 2 },
  { name: "Finn", gender: "boy", origin: "Irish/Celtic", meaning: "fair, white", styleTags: ["short", "modern", "mythological"], syllables: 1 },
  { name: "Maeve", gender: "girl", origin: "Irish/Celtic", meaning: "she who intoxicates, the intoxicating one", styleTags: ["short", "mythological", "royal"], syllables: 1 },
  { name: "Ronan", gender: "boy", origin: "Irish/Celtic", meaning: "little seal", styleTags: ["modern", "nature-inspired"], syllables: 2 },
  { name: "Niamh", gender: "girl", origin: "Irish/Celtic", meaning: "bright, radiant", styleTags: ["mythological", "light-meaning"], syllables: 1 },
  { name: "Cian", gender: "boy", origin: "Irish/Celtic", meaning: "ancient, enduring", styleTags: ["short", "traditional"], syllables: 1 },
  { name: "Fiona", gender: "girl", origin: "Irish/Celtic", meaning: "fair, white", styleTags: ["traditional"], syllables: 3 },
  { name: "Rory", gender: "unisex", origin: "Irish/Celtic", meaning: "red king", styleTags: ["short", "unisex-friendly", "royal"], syllables: 2 },
  { name: "Brigid", gender: "girl", origin: "Irish/Celtic", meaning: "exalted one, strength", styleTags: ["mythological", "strong-meaning"], syllables: 2 },

  // ── Arabic ───────────────────────────────────────────────────────────
  { name: "Amir", gender: "boy", origin: "Arabic", meaning: "prince, commander", styleTags: ["royal", "short"], syllables: 2 },
  { name: "Layla", gender: "girl", origin: "Arabic", meaning: "night, dark beauty", styleTags: ["modern", "traditional"], syllables: 2 },
  { name: "Zain", gender: "boy", origin: "Arabic", meaning: "grace, beauty", styleTags: ["short", "modern", "virtue"], syllables: 1 },
  { name: "Yasmin", gender: "girl", origin: "Persian", meaning: "jasmine flower", styleTags: ["floral", "nature-inspired"], syllables: 2 },
  { name: "Omar", gender: "boy", origin: "Arabic", meaning: "flourishing, long-lived", styleTags: ["traditional", "short"], syllables: 2 },
  { name: "Amara", gender: "girl", origin: "Igbo", meaning: "grace, mercy; also Sanskrit for eternal/immortal", styleTags: ["modern", "virtue"], syllables: 3 },
  { name: "Malik", gender: "boy", origin: "Arabic", meaning: "king, master", styleTags: ["royal", "short"], syllables: 2 },
  { name: "Nadia", gender: "girl", origin: "Arabic", meaning: "hope, caller", styleTags: ["virtue", "modern"], syllables: 3 },
  { name: "Karim", gender: "boy", origin: "Arabic", meaning: "generous, noble", styleTags: ["virtue", "traditional"], syllables: 2 },
  { name: "Samira", gender: "girl", origin: "Arabic", meaning: "companion in evening talk", styleTags: ["traditional"], syllables: 3 },
  { name: "Adil", gender: "boy", origin: "Arabic", meaning: "just, wise", styleTags: ["short", "virtue"], syllables: 2 },
  { name: "Farah", gender: "girl", origin: "Arabic", meaning: "joy, happiness", styleTags: ["short", "virtue"], syllables: 2 },
  { name: "Rumi", gender: "unisex", origin: "Persian", meaning: "Roman, poetic soul (after the poet Rumi)", styleTags: ["literary", "unisex-friendly", "short"], syllables: 2 },

  // ── Japanese ─────────────────────────────────────────────────────────
  { name: "Haruki", gender: "boy", origin: "Japanese", meaning: "shining, springtime child", styleTags: ["light-meaning", "nature-inspired"], syllables: 3 },
  { name: "Yuki", gender: "unisex", origin: "Japanese", meaning: "snow, happiness", styleTags: ["short", "unisex-friendly", "nature-inspired"], syllables: 2 },
  { name: "Sora", gender: "unisex", origin: "Japanese", meaning: "sky", styleTags: ["short", "unisex-friendly", "nature-inspired", "celestial"], syllables: 2 },
  { name: "Aiko", gender: "girl", origin: "Japanese", meaning: "beloved child", styleTags: ["short", "virtue"], syllables: 3 },
  { name: "Kenji", gender: "boy", origin: "Japanese", meaning: "intelligent second son", styleTags: ["traditional"], syllables: 2 },
  { name: "Sakura", gender: "girl", origin: "Japanese", meaning: "cherry blossom", styleTags: ["floral", "nature-inspired"], syllables: 3 },
  { name: "Ren", gender: "unisex", origin: "Japanese", meaning: "lotus, love", styleTags: ["short", "unisex-friendly", "floral"], syllables: 1 },
  { name: "Emi", gender: "girl", origin: "Japanese", meaning: "beautiful blessing", styleTags: ["short", "virtue"], syllables: 2 },

  // ── English / French / modern ────────────────────────────────────────
  { name: "Harper", gender: "unisex", origin: "English", meaning: "harp player", styleTags: ["modern", "unisex-friendly", "literary"], syllables: 2 },
  { name: "Wesley", gender: "boy", origin: "English", meaning: "western meadow", styleTags: ["traditional", "nature-inspired"], syllables: 2 },
  { name: "Willow", gender: "girl", origin: "English", meaning: "willow tree, gracefulness", styleTags: ["nature-inspired", "modern"], syllables: 2 },
  { name: "Grayson", gender: "boy", origin: "English", meaning: "son of the steward", styleTags: ["modern"], syllables: 2 },
  { name: "Ivy", gender: "girl", origin: "English", meaning: "climbing vine, fidelity", styleTags: ["short", "nature-inspired", "modern"], syllables: 2 },
  { name: "Everly", gender: "girl", origin: "English", meaning: "from the boar meadow", styleTags: ["modern", "nature-inspired"], syllables: 3 },
  { name: "Oliver", gender: "boy", origin: "Latin", meaning: "olive tree, peace", styleTags: ["traditional", "nature-inspired", "virtue"], syllables: 3 },
  { name: "Amelia", gender: "girl", origin: "English", meaning: "work, industrious", styleTags: ["traditional", "modern"], syllables: 4 },
  { name: "Hazel", gender: "girl", origin: "English", meaning: "the hazel tree", styleTags: ["short", "nature-inspired", "modern"], syllables: 2 },
  { name: "Levi", gender: "boy", origin: "Hebrew", meaning: "joined, attached", styleTags: ["short", "traditional"], syllables: 2 },
  { name: "Nora", gender: "girl", origin: "English", meaning: "honor, light", styleTags: ["short", "light-meaning", "traditional"], syllables: 2 },
  { name: "Elliot", gender: "unisex", origin: "English", meaning: "the Lord is my God", styleTags: ["unisex-friendly", "modern"], syllables: 3 },
  { name: "Piper", gender: "girl", origin: "English", meaning: "pipe player", styleTags: ["modern", "short"], syllables: 2 },
  { name: "Mila", gender: "girl", origin: "Slavic", meaning: "gracious, dear", styleTags: ["short", "modern", "virtue"], syllables: 2 },
  { name: "August", gender: "boy", origin: "Latin", meaning: "great, magnificent", styleTags: ["royal", "traditional"], syllables: 2 },
  { name: "Eloise", gender: "girl", origin: "French", meaning: "healthy, wide", styleTags: ["traditional", "literary"], syllables: 3 },
  { name: "Beatrix", gender: "girl", origin: "Latin", meaning: "she who brings happiness", styleTags: ["literary", "virtue"], syllables: 3 },

  // ── Nature-inspired ──────────────────────────────────────────────────
  { name: "River", gender: "unisex", origin: "English", meaning: "flowing water", styleTags: ["unisex-friendly", "nature-inspired", "water-related", "short"], syllables: 2 },
  { name: "Sage", gender: "unisex", origin: "Latin", meaning: "wise, herb of wisdom", styleTags: ["unisex-friendly", "nature-inspired", "short", "virtue"], syllables: 1 },
  { name: "Wren", gender: "girl", origin: "English", meaning: "small songbird", styleTags: ["short", "nature-inspired", "modern"], syllables: 1 },
  { name: "Rowan", gender: "unisex", origin: "Irish/Celtic", meaning: "little red one, rowan tree", styleTags: ["unisex-friendly", "nature-inspired", "modern"], syllables: 2 },
  { name: "Meadow", gender: "girl", origin: "English", meaning: "a field of grass", styleTags: ["nature-inspired", "modern"], syllables: 2 },
  { name: "Skye", gender: "girl", origin: "Scottish", meaning: "sky, the Isle of Skye", styleTags: ["short", "nature-inspired", "celestial"], syllables: 1 },
  { name: "Brooke", gender: "girl", origin: "English", meaning: "small stream", styleTags: ["short", "nature-inspired", "water-related"], syllables: 1 },
  { name: "Jasmine", gender: "girl", origin: "Persian", meaning: "jasmine flower, gift from God", styleTags: ["floral", "nature-inspired"], syllables: 2 },
  { name: "Fern", gender: "girl", origin: "English", meaning: "fern plant", styleTags: ["short", "nature-inspired"], syllables: 1 },
  { name: "Reed", gender: "boy", origin: "English", meaning: "red-haired, river reed", styleTags: ["short", "nature-inspired"], syllables: 1 },
  { name: "Cove", gender: "boy", origin: "English", meaning: "small coastal inlet", styleTags: ["short", "nature-inspired", "water-related", "modern"], syllables: 1 },
  { name: "Ocean", gender: "unisex", origin: "English", meaning: "the vast sea", styleTags: ["unisex-friendly", "nature-inspired", "water-related", "modern"], syllables: 2 },

  // ── Mythological / regal ─────────────────────────────────────────────
  { name: "Odin", gender: "boy", origin: "Old Norse", meaning: "fury, inspiration; chief Norse god", styleTags: ["mythological", "short", "strong-meaning"], syllables: 2 },
  { name: "Freya", gender: "girl", origin: "Old Norse", meaning: "lady; goddess of love and beauty", styleTags: ["mythological", "royal"], syllables: 2 },
  { name: "Apollo", gender: "boy", origin: "Greek", meaning: "god of the sun, music, and prophecy", styleTags: ["mythological", "light-meaning"], syllables: 3 },
  { name: "Isolde", gender: "girl", origin: "Welsh", meaning: "fair lady, beautiful", styleTags: ["mythological", "literary"], syllables: 3 },
  { name: "Orion", gender: "boy", origin: "Greek", meaning: "the hunter, a constellation", styleTags: ["mythological", "celestial"], syllables: 3 },
  { name: "Valentina", gender: "girl", origin: "Latin", meaning: "strong, healthy", styleTags: ["strong-meaning", "royal"], syllables: 4 },
  { name: "Augustus", gender: "boy", origin: "Latin", meaning: "great, venerable", styleTags: ["royal", "traditional"], syllables: 3 },
  { name: "Aria", gender: "girl", origin: "Italian", meaning: "air, melody", styleTags: ["modern", "short", "literary"], syllables: 3 },
  { name: "Thane", gender: "boy", origin: "Scottish", meaning: "chieftain, lord", styleTags: ["royal", "short"], syllables: 1 },
  { name: "Seraphina", gender: "girl", origin: "Hebrew", meaning: "fiery-winged, burning one", styleTags: ["mythological", "royal"], syllables: 4 },

  // ── Swahili / African ────────────────────────────────────────────────
  { name: "Amani", gender: "unisex", origin: "Swahili", meaning: "peace", styleTags: ["unisex-friendly", "virtue", "short"], syllables: 3 },
  { name: "Zuri", gender: "girl", origin: "Swahili", meaning: "beautiful", styleTags: ["short", "modern"], syllables: 2 },
  { name: "Jabari", gender: "boy", origin: "Swahili", meaning: "brave, fearless", styleTags: ["strong-meaning"], syllables: 3 },
  { name: "Imani", gender: "girl", origin: "Swahili", meaning: "faith", styleTags: ["virtue", "modern"], syllables: 3 },
  { name: "Kito", gender: "boy", origin: "Swahili", meaning: "precious jewel", styleTags: ["short", "modern"], syllables: 2 },

  // ── Short / one-syllable across origins ──────────────────────────────
  { name: "Neve", gender: "girl", origin: "Irish/Celtic", meaning: "snow, bright", styleTags: ["short", "light-meaning"], syllables: 1 },
  { name: "Beau", gender: "boy", origin: "French", meaning: "handsome", styleTags: ["short", "modern"], syllables: 1 },
  { name: "Wren", gender: "unisex", origin: "English", meaning: "small songbird", styleTags: ["unisex-friendly", "short", "nature-inspired"], syllables: 1 },
  { name: "Jax", gender: "boy", origin: "English", meaning: "God has been gracious", styleTags: ["short", "modern"], syllables: 1 },
  { name: "Wolf", gender: "boy", origin: "German", meaning: "wolf", styleTags: ["short", "strong-meaning", "nature-inspired"], syllables: 1 },
  { name: "Blaise", gender: "unisex", origin: "Latin", meaning: "lisping, stammering; also 'fire'", styleTags: ["unisex-friendly", "short", "modern"], syllables: 1 },
  { name: "Faye", gender: "girl", origin: "French", meaning: "fairy, loyalty", styleTags: ["short", "mythological"], syllables: 1 },
];
