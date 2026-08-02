/**
 * Formats a bare "YYYY-MM-DD" Notion date property as e.g. "August 2, 2026".
 * Parsed as UTC explicitly — building the Date from local year/month/day
 * parts would shift the displayed day in timezones behind UTC.
 */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
