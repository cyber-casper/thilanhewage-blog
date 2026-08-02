import { Fragment, type ReactNode } from "react";
import type { RichText as RichTextSegment } from "./blocks";

function withLineBreaks(text: string): ReactNode {
  const lines = text.split("\n");
  if (lines.length === 1) return text;
  return lines.flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));
}

/**
 * Renders Notion rich text runs with their inline annotations. Nesting
 * order (code innermost, link outermost) matches how the marks visually
 * layer regardless of which combination is present.
 */
export function RichText({ segments }: { segments: RichTextSegment[] }) {
  return (
    <>
      {segments.map((segment, i) => {
        let node: ReactNode = withLineBreaks(segment.plain_text);
        if (segment.annotations.code) node = <code>{node}</code>;
        if (segment.annotations.italic) node = <em>{node}</em>;
        if (segment.annotations.bold) node = <strong>{node}</strong>;
        if (segment.annotations.strikethrough) node = <s>{node}</s>;
        if (segment.href) {
          node = (
            <a href={segment.href} target="_blank" rel="noopener noreferrer">
              {node}
            </a>
          );
        }
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}
