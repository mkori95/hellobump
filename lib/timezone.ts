/** Today's date as "YYYY-MM-DD" in the given IANA timezone (falls back to UTC if invalid/omitted). */
export function getLocalDateISO(timezone?: string): string {
  const tz = timezone || "UTC";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
