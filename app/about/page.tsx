import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="placeholder-page">
      <h1>About</h1>
      <p>This page is a placeholder — a proper introduction is coming soon.</p>
    </div>
  );
}
