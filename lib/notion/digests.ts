import "server-only";
import { notionFetch, notionDataSourceId } from "./client";
import { fetchBlockChildren, plainText, type NotionBlock } from "./blocks";

// Shared by /digest, /digest/[date], and /rss.xml so the three views can
// never show a different set of digests than each other.
export const REVALIDATE_SECONDS = 60 * 60;

interface PageProperty {
  title?: { plain_text: string }[];
  date?: { start: string } | null;
  select?: { name: string } | null;
  checkbox?: boolean;
}

interface DigestPage {
  id: string;
  url: string;
  properties: {
    Name: PageProperty;
    Date: PageProperty;
    Status: PageProperty;
    Public: PageProperty;
  };
}

interface QueryResponse {
  results: DigestPage[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface DigestSummary {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD); also the /digest/[date] slug. */
  date: string;
}

export interface Digest extends DigestSummary {
  blocks: NotionBlock[];
}

function toSummary(page: DigestPage): DigestSummary | null {
  const date = page.properties.Date.date?.start;
  const title = page.properties.Name.title?.map((t) => t.plain_text).join("") ?? "";
  return date && title ? { id: page.id, title, date } : null;
}

/**
 * Published + Public digests, newest first. `dateEquals` narrows the query
 * to a single row so a /digest/[date] page doesn't have to pull (and
 * revalidate) every digest just to find one — that cost would grow with the
 * archive on every ISR tick otherwise.
 */
async function queryDigests(dateEquals?: string): Promise<DigestSummary[]> {
  const filters: Record<string, unknown>[] = [
    { property: "Status", select: { equals: "Published" } },
    { property: "Public", checkbox: { equals: true } },
  ];
  if (dateEquals) {
    filters.push({ property: "Date", date: { equals: dateEquals } });
  }

  const summaries: DigestSummary[] = [];
  let cursor: string | undefined;

  do {
    const page = await notionFetch<QueryResponse>(`/data_sources/${notionDataSourceId()}/query`, {
      revalidate: REVALIDATE_SECONDS,
      body: {
        filter: { and: filters },
        sorts: [{ property: "Date", direction: "descending" }],
        start_cursor: cursor,
        page_size: 100,
      },
    });

    for (const result of page.results) {
      const summary = toSummary(result);
      if (summary) summaries.push(summary);
    }
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return summaries;
}

export async function listPublishedDigests(): Promise<DigestSummary[]> {
  return queryDigests();
}

/**
 * A single digest's full block content by date slug. Null covers both "no
 * digest on that date" and "exists but not Published + Public yet" — the
 * caller (the route) treats both as a 404.
 */
export async function getDigestByDate(date: string): Promise<Digest | null> {
  const [summary] = await queryDigests(date);
  if (!summary) return null;

  const blocks = await fetchBlockChildren(summary.id, REVALIDATE_SECONDS);
  return { ...summary, blocks };
}

export { plainText };
