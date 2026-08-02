import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import type { SectionPreview } from "@/lib/digest-excerpt";

interface DigestCardProps {
  date: string;
  title: string;
  excerpt: string;
  sections: SectionPreview[];
}

export function DigestCard({ date, title, excerpt, sections }: DigestCardProps) {
  return (
    <Link href={`/digest/${date}`} className="digest-card">
      <time className="digest-card-date" dateTime={date}>
        {formatDate(date)}
      </time>
      <h2 className="digest-card-title">{title}</h2>
      {excerpt && <p className="digest-card-excerpt">{excerpt}</p>}
      {sections.length > 0 && (
        <ul className="digest-card-sections" aria-hidden="true">
          {sections.map((section) => (
            <li key={section.label} title={section.label}>
              {section.emoji}
            </li>
          ))}
        </ul>
      )}
      <span className="digest-card-cta">
        Read the digest
        <svg aria-hidden="true" viewBox="0 0 16 16" className="digest-card-cta-arrow">
          <path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" />
        </svg>
      </span>
    </Link>
  );
}
