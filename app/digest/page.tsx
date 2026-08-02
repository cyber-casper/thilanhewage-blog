import type { Metadata } from "next";
import { listPublishedDigests, REVALIDATE_SECONDS } from "@/lib/notion/digests";
import { fetchBlockChildren } from "@/lib/notion/blocks";
import { excerptFor, sectionPreviewsFor } from "@/lib/digest-excerpt";
import { DigestCard } from "@/components/DigestCard";

export const metadata: Metadata = { title: "Digest" };
export const revalidate = 3600;

export default async function DigestIndexPage() {
  const digests = await listPublishedDigests();

  const cards = await Promise.all(
    digests.map(async (digest) => {
      const blocks = await fetchBlockChildren(digest.id, REVALIDATE_SECONDS);
      return {
        ...digest,
        excerpt: excerptFor(blocks),
        sections: sectionPreviewsFor(blocks),
      };
    }),
  );

  return (
    <>
      <header className="page-header">
        <h1>Research digest</h1>
        <p className="page-lede">Daily research signal — priority items, market watch, and what&rsquo;s worth knowing.</p>
      </header>

      {cards.length === 0 ? (
        <p className="empty-state">No digests published yet — check back soon.</p>
      ) : (
        <div className="digest-grid">
          {cards.map((card) => (
            <DigestCard
              key={card.id}
              date={card.date}
              title={card.title}
              excerpt={card.excerpt}
              sections={card.sections}
            />
          ))}
        </div>
      )}
    </>
  );
}
