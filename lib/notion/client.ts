import "server-only";

const API_ROOT = "https://api.notion.com/v1";
const API_VERSION = "2025-09-03";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const notionApiKey = () => env("NOTION_API_KEY");
export const notionDataSourceId = () => env("NOTION_DATA_SOURCE_ID");

type FetchOptions = Omit<RequestInit, "headers" | "body"> & {
  body?: unknown;
  /** Next.js ISR window for this call; `false` opts out of caching entirely. */
  revalidate: number | false;
};

/**
 * Every route that touches Notion goes through here so the auth header,
 * API version, and cache window stay in one place. `revalidate` is required
 * (not defaulted) so a call can't accidentally end up uncached or on the
 * wrong window — see lib/notion/digests.ts for the shared value.
 */
export async function notionFetch<T>(path: string, options: FetchOptions): Promise<T> {
  const { body, revalidate, ...init } = options;

  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    method: init.method ?? (body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${notionApiKey()}`,
      "Notion-Version": API_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Notion API ${response.status} on ${path}: ${detail || response.statusText}`);
  }

  return response.json() as Promise<T>;
}
