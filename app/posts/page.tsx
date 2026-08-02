import type { Metadata } from "next";

export const metadata: Metadata = { title: "Posts" };

export default function PostsPage() {
  return (
    <div className="placeholder-page">
      <h1>Posts</h1>
      <p>Nothing published here yet — longer personal writing will land on this page later.</p>
    </div>
  );
}
