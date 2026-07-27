// Feature 7: curated pregnancy book list. This is genuinely editorial
// content (hand-picked, well-known titles), not sourced/generated — unlike
// everything else in this app, a curated reading list doesn't need RAG
// grounding, it's just a list. Each links out to the Fulton County Public
// Library catalog (no login/credential handling in the app, per spec).

export interface BookRecommendation {
  title: string;
  author: string;
  blurb: string;
}

export const BOOK_RECOMMENDATIONS: BookRecommendation[] = [
  {
    title: "What to Expect When You're Expecting",
    author: "Heidi Murkoff",
    blurb: "The classic week-by-week reference most people reach for first.",
  },
  {
    title: "Expecting Better",
    author: "Emily Oster",
    blurb: "An economist digs into the actual data behind common pregnancy rules.",
  },
  {
    title: "Ina May's Guide to Childbirth",
    author: "Ina May Gaskin",
    blurb: "A warm, midwife's-eye view of labor and birth.",
  },
  {
    title: "The Mama Natural Week-by-Week Guide to Pregnancy and Childbirth",
    author: "Genevieve Howland",
    blurb: "A natural-leaning week-by-week guide with a big community following.",
  },
  {
    title: "Cribsheet",
    author: "Emily Oster",
    blurb: "The follow-up to Expecting Better, covering the first years after birth.",
  },
  {
    title: "The Fourth Trimester",
    author: "Kimberly Ann Johnson",
    blurb: "A gentle guide to healing and adjusting in the months after birth.",
  },
];

const FCPL_SEARCH_BASE = "https://fulcolibrary.bibliocommons.com/v2/search";

export function fulcoLibraryUrl(title: string): string {
  const params = new URLSearchParams({ query: title, searchType: "smart" });
  return `${FCPL_SEARCH_BASE}?${params.toString()}`;
}
