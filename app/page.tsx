import Link from "next/link";

export default function HomePage() {
  return (
    <div className="hero">
      <h1 className="hero-title">Hi, I&rsquo;m Thilan.</h1>
      <p className="hero-lede">
        This is my personal corner of the internet — still taking shape. For now, the
        research digest I write daily lives here too.
      </p>
      <div className="hero-actions">
        <Link href="/digest" className="button button-primary">
          Read the research digest
        </Link>
        <Link href="/about" className="button button-secondary">
          About me
        </Link>
      </div>
    </div>
  );
}
