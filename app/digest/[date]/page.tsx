import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDigestByDate, listPublishedDigests } from "@/lib/notion/digests";
import { DigestBody } from "@/components/DigestBody";
import { formatDate } from "@/lib/format-date";

export const revalidate = 3600;

type DigestPageProps = {
  params: Promise<{ date: string }>;
};

// Pre-renders every digest known at build time; dynamicParams defaults to
// true, so a digest published after the last build still resolves on first
// request and is cached from then on — same ISR window as everything else.
export async function generateStaticParams() {
  const digests = await listPublishedDigests();
  return digests.map((digest) => ({ date: digest.date }));
}

export async function generateMetadata({ params }: DigestPageProps): Promise<Metadata> {
  const { date } = await params;
  const digest = await getDigestByDate(date);
  return digest ? { title: digest.title } : {};
}

export default async function DigestPage({ params }: DigestPageProps) {
  const { date } = await params;
  const digest = await getDigestByDate(date);
  if (!digest) notFound();

  return (
    <article>
      <Link href="/digest" className="digest-back">
        &larr; All digests
      </Link>
      <header className="digest-header">
        <time dateTime={digest.date}>{formatDate(digest.date)}</time>
        <h1>{digest.title}</h1>
      </header>
      <DigestBody blocks={digest.blocks} />
    </article>
  );
}
