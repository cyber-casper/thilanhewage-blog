import "server-only";
import { notionFetch } from "./client";

export type RichText = {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
};

interface BlockBase {
  id: string;
  has_children: boolean;
  children?: NotionBlock[];
}

// Only the block types the digest template is known to use get a typed
// shape; anything else (table_of_contents, embeds, …) still comes through
// at runtime but readers only ever switch on the `type` literals below, so
// an untyped block is simply skipped rather than mis-rendered.
export type NotionBlock = BlockBase &
  (
    | { type: "paragraph"; paragraph: { rich_text: RichText[] } }
    | { type: "heading_1"; heading_1: { rich_text: RichText[] } }
    | { type: "heading_2"; heading_2: { rich_text: RichText[] } }
    | { type: "heading_3"; heading_3: { rich_text: RichText[] } }
    | {
        type: "callout";
        callout: {
          rich_text: RichText[];
          icon: { type: "emoji"; emoji: string } | { type: string } | null;
        };
      }
    | { type: "bulleted_list_item"; bulleted_list_item: { rich_text: RichText[] } }
    | { type: "numbered_list_item"; numbered_list_item: { rich_text: RichText[] } }
    | { type: "quote"; quote: { rich_text: RichText[] } }
    | { type: "divider"; divider: Record<string, never> }
    | { type: "code"; code: { rich_text: RichText[]; language: string } }
  );

interface ListChildrenResponse {
  results: NotionBlock[];
  has_more: boolean;
  next_cursor: string | null;
}

// Notion nests content under these block types (e.g. sub-bullets under a
// bulleted_list_item); everything else is a leaf even when has_children is
// theoretically possible, so there's no point paying for the extra request.
const NESTING_BLOCK_TYPES = new Set([
  "bulleted_list_item",
  "numbered_list_item",
  "callout",
  "quote",
  "toggle",
]);

/**
 * Resolves a block's full (paginated, recursively-nested) children. Used
 * both for a digest page's top-level content and, indirectly, for any
 * nested list/callout content within it.
 */
export async function fetchBlockChildren(
  blockId: string,
  revalidate: number | false,
): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);

    const page = await notionFetch<ListChildrenResponse>(`/blocks/${blockId}/children?${query}`, {
      revalidate,
    });
    blocks.push(...page.results);
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);

  await Promise.all(
    blocks.map(async (block) => {
      if (block.has_children && NESTING_BLOCK_TYPES.has(block.type)) {
        block.children = await fetchBlockChildren(block.id, revalidate);
      }
    }),
  );

  return blocks;
}

export function plainText(richText: RichText[]): string {
  return richText.map((segment) => segment.plain_text).join("");
}
