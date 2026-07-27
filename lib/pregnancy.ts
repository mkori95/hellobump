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
  dayOfWeek: number; // 1-7, day within the current week
  trimester: Trimester;
}

const FULL_TERM_DAYS = 280;

/** `todayISO` defaults to the current date. All math is whole-day, timezone-naive (UTC midnight). */
export function getPregnancyStats(dueDateISO: string, todayISO?: string): PregnancyStats {
  const today = todayISO ?? new Date().toISOString().slice(0, 10);
  const daysToGo = daysBetween(today, dueDateISO);
  const daysPregnant = FULL_TERM_DAYS - daysToGo;

  const clampedDays = Math.max(0, daysPregnant);
  const week = Math.min(42, Math.floor(clampedDays / 7) + 1);
  const dayOfWeek = (clampedDays % 7) + 1;
  const trimester: Trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;

  return { daysPregnant, daysToGo, week, dayOfWeek, trimester };
}
