// Dating-method + due-date math shared by the setup flow and (later) the home page.

export type DatingMethod = "lmp" | "conception" | "due_date";

export const DATING_METHODS: { value: DatingMethod; label: string; dateLabel: string }[] = [
  {
    value: "lmp",
    label: "First day of last period",
    dateLabel: "First day of last period",
  },
  {
    value: "conception",
    label: "Known conception date",
    dateLabel: "Conception date",
  },
  {
    value: "due_date",
    label: "Doctor-confirmed due date",
    dateLabel: "Due date given by your doctor",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Naegele's-rule-style estimate. `dateStr` and the return value are ISO "YYYY-MM-DD". */
export function calculateDueDate(method: DatingMethod, dateStr: string): string {
  switch (method) {
    case "lmp":
      return addDays(dateStr, 280);
    case "conception":
      return addDays(dateStr, 266);
    case "due_date":
      return dateStr;
  }
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`).getTime();
  const to = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((to - from) / DAY_MS);
}

export type Trimester = 1 | 2 | 3;

export interface PregnancyStats {
  daysPregnant: number;
  daysToGo: number;
  week: number;
  dayOfWeek: number; // 0-6, extra days beyond `week` completed weeks (e.g. week 8 + dayOfWeek 2 = "8 weeks 2 days")
  trimester: Trimester;
}

const FULL_TERM_DAYS = 280;

/**
 * `todayISO` defaults to the current date. All math is whole-day, timezone-naive (UTC midnight).
 *
 * `week` = number of *completed* weeks since the last period — the standard
 * clinical convention, verified directly against nhs.uk: their own due-date
 * calculator reports "approximately 8 weeks pregnant" at 58 elapsed days
 * (58 = 8*7 + 2), and their week-by-week guide's "Week 8" article explicitly
 * describes someone who "is 8 weeks pregnant" — i.e. the article-numbering
 * our content pipeline fetches by week uses the exact same convention as the
 * headline stat. Do NOT add +1 here ("the week you're currently living
 * through") — that was a previous bug that showed users a week ahead of
 * their actual gestational age and fetched the wrong NHS week content to
 * match it.
 */
export function getPregnancyStats(dueDateISO: string, todayISO?: string): PregnancyStats {
  const today = todayISO ?? new Date().toISOString().slice(0, 10);
  const daysToGo = daysBetween(today, dueDateISO);
  const daysPregnant = FULL_TERM_DAYS - daysToGo;

  const clampedDays = Math.max(0, daysPregnant);
  const week = Math.max(1, Math.min(42, Math.floor(clampedDays / 7)));
  const dayOfWeek = clampedDays % 7;
  const trimester: Trimester = week <= 12 ? 1 : week <= 27 ? 2 : 3;

  return { daysPregnant, daysToGo, week, dayOfWeek, trimester };
}
