import type { NotionBlock } from "./notion/blocks";
import { plainText } from "./notion/blocks";

function listItemText(block: NotionBlock): string {
  if (block.type === "bulleted_list_item") return plainText(block.bulleted_list_item.rich_text);
  if (block.type === "numbered_list_item") return plainText(block.numbered_list_item.rich_text);
  return "";
}

function blockText(block: NotionBlock): string {
  switch (block.type) {
    case "callout": {
      // The callout's own text is often just a label ("Executive signal:")
      // with the real content one level down as bullet children — prefer
      // those when present, the same way the article body renders them.
      const bulletText = (block.children ?? [])
        .map(listItemText)
        .filter(Boolean)
        .join(" ");
      return bulletText || plainText(block.callout.rich_text);
    }
    case "paragraph":
      return plainText(block.paragraph.rich_text);
    default:
      return "";
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

/**
 * A short plain-text teaser for a digest, shown on the /digest card grid
 * and reused as the RSS <description>. The digest template's opening block
 * changes over time (a summary callout some days, a lead paragraph on
 * others), so this takes whichever leading block actually has text rather
 * than assuming a fixed template shape — see DigestBody for the same
 * reasoning applied to section rendering.
 */
export function excerptFor(blocks: NotionBlock[], maxLength = 200): string {
  for (const block of blocks) {
    const text = blockText(block).trim();
    if (text) return truncate(text, maxLength);
  }
  return "";
}

export interface SectionPreview {
  emoji: string;
  label: string;
}

const LEADING_EMOJI = /^(\p{Extended_Pictographic}️?)\s*(.+)$/u;

/**
 * One glyph per heading_2 section, read straight off each heading's own
 * text — not a hardcoded set of section names — so the card grid's preview
 * keeps working as the digest template's section lineup changes. Headings
 * without a leading emoji are skipped rather than guessed at.
 */
export function sectionPreviewsFor(blocks: NotionBlock[]): SectionPreview[] {
  return blocks
    .filter((block): block is Extract<NotionBlock, { type: "heading_2" }> => block.type === "heading_2")
    .flatMap((block) => {
      const match = plainText(block.heading_2.rich_text).trim().match(LEADING_EMOJI);
      return match ? [{ emoji: match[1], label: match[2] }] : [];
    });
}
