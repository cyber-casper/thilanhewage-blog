import { listPublishedDigests, REVALIDATE_SECONDS } from "@/lib/notion/digests";
import { fetchBlockChildren } from "@/lib/notion/blocks";
import { excerptFor } from "@/lib/digest-excerpt";

// Classic static + timed-revalidation model, kept in step with
// REVALIDATE_SECONDS (lib/notion/digests.ts) which drives the actual
// per-fetch revalidation — this export needs a statically-analyzable
// literal, so it can't just import that constant.
export const dynamic = "force-static";
export const revalidate = 3600;

const SITE_URL = process.env.SITE_URL ?? "https://thilanhewage.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00Z`).toUTCString();
}

export async function GET() {
  const digests = await listPublishedDigests();

  const items = await Promise.all(
    digests.map(async (digest) => {
      const blocks = await fetchBlockChildren(digest.id, REVALIDATE_SECONDS);
      const excerpt = excerptFor(blocks);
      const link = `${SITE_URL}/digest/${digest.date}`;

      return [
        "    <item>",
        `      <title>${escapeXml(digest.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid>${link}</guid>`,
        `      <pubDate>${toRfc822(digest.date)}</pubDate>`,
        `      <description>${escapeXml(excerpt)}</description>`,
        "    </item>",
      ].join("\n");
    }),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    "    <title>Thilan Hewage — Research Digest</title>",
    `    <link>${SITE_URL}</link>`,
    "    <description>Daily research digest.</description>",
    items.join("\n"),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
