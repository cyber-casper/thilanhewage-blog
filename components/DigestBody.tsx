import type { ReactNode } from "react";
import type { NotionBlock, RichText as RichTextSegment } from "@/lib/notion/blocks";
import { plainText } from "@/lib/notion/blocks";
import { RichText } from "@/lib/notion/rich-text";

// The digest authoring template leaves a self-referential trace on every
// page; readers of the public site have no use for it. This reflects the
// shared Research Digests data itself, not a styling choice.
const ARCHIVE_FOOTER = /^Archived to Notion:/i;

function listItemRichText(block: NotionBlock): RichTextSegment[] {
  if (block.type === "bulleted_list_item") return block.bulleted_list_item.rich_text;
  if (block.type === "numbered_list_item") return block.numbered_list_item.rich_text;
  return [];
}

function ListItem({ block }: { block: NotionBlock }) {
  const nested = (block.children ?? []).filter(
    (child) => child.type === "bulleted_list_item" || child.type === "numbered_list_item",
  );

  return (
    <li>
      <RichText segments={listItemRichText(block)} />
      {nested.length > 0 && (
        <ul>
          {nested.map((child) => (
            <ListItem key={child.id} block={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Renders a run of sibling blocks, grouping consecutive list items into one
 * <ul>/<ol> the way Notion itself treats them. Any block type outside this
 * switch (tables, embeds, table_of_contents, …) is skipped rather than
 * guessed at — the digest template hasn't used them, and a silent skip is
 * safer than a wrong rendering if one shows up.
 */
function BlockRun({ blocks }: { blocks: NotionBlock[] }) {
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      const listType = block.type;
      const group: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === listType) {
        group.push(blocks[i]);
        i++;
      }
      const items = group.map((item) => <ListItem key={item.id} block={item} />);
      nodes.push(listType === "numbered_list_item" ? <ol key={group[0].id}>{items}</ol> : <ul key={group[0].id}>{items}</ul>);
      continue;
    }

    if (block.type === "paragraph") {
      const text = plainText(block.paragraph.rich_text);
      if (!ARCHIVE_FOOTER.test(text.trim())) {
        nodes.push(
          <p key={block.id}>
            <RichText segments={block.paragraph.rich_text} />
          </p>,
        );
      }
      i++;
      continue;
    }

    if (block.type === "heading_3") {
      nodes.push(
        <h3 key={block.id}>
          <RichText segments={block.heading_3.rich_text} />
        </h3>,
      );
      i++;
      continue;
    }

    if (block.type === "quote") {
      nodes.push(
        <blockquote key={block.id}>
          <RichText segments={block.quote.rich_text} />
        </blockquote>,
      );
      i++;
      continue;
    }

    if (block.type === "code") {
      nodes.push(
        <pre key={block.id}>
          <code>{plainText(block.code.rich_text)}</code>
        </pre>,
      );
      i++;
      continue;
    }

    if (block.type === "divider") {
      nodes.push(<hr key={block.id} />);
      i++;
      continue;
    }

    i++;
  }

  return <>{nodes}</>;
}

function Callout({ block }: { block: Extract<NotionBlock, { type: "callout" }> }) {
  return (
    <div className="callout">
      <p className="callout-lead">
        <RichText segments={block.callout.rich_text} />
      </p>
      <BlockRun blocks={block.children ?? []} />
    </div>
  );
}

/**
 * Groups a digest page's flat block list into sections by whatever
 * heading_2 blocks actually appear — never a hardcoded list of section
 * names, so the layout keeps working as the digest template's section
 * lineup drifts over time. A leading callout (the day's summary) renders
 * ahead of the sections; any other top-level content is skipped.
 */
export function DigestBody({ blocks }: { blocks: NotionBlock[] }) {
  const leadCallout = blocks.find((block) => block.type === "callout");
  const sections: { id: string; heading: RichTextSegment[]; blocks: NotionBlock[] }[] = [];
  let current: (typeof sections)[number] | null = null;

  for (const block of blocks) {
    if (block.type === "heading_1" || block.type === "callout") continue;
    if (block.type === "heading_2") {
      current = { id: block.id, heading: block.heading_2.rich_text, blocks: [] };
      sections.push(current);
      continue;
    }
    current?.blocks.push(block);
  }

  return (
    <div className="digest-body">
      {leadCallout && leadCallout.type === "callout" && <Callout block={leadCallout} />}
      {sections.map((section) => (
        <section key={section.id}>
          <h2>
            <RichText segments={section.heading} />
          </h2>
          <BlockRun blocks={section.blocks} />
        </section>
      ))}
    </div>
  );
}
