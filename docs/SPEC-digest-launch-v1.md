# thilanhewage.com — Digest Launch (v1) Spec

**Status:** Draft for Casper's approval (per HexOrbit Operating Playbook §2 — nothing builds until this is approved).
**Owner:** Casper
**Date:** 2026-08-01

**Goal:** Stand up a fresh site at thilanhewage.com that serves the Daily Research Digest currently
published on blog.hexorbit.xyz, reading the same Notion data, so the Digest can be removed from
the HexOrbit company blog with a clean cutover — no redirects from hexorbit.xyz.

**Users:** Casper (editor, via Notion — unchanged workflow) and public readers currently reading
digests on blog.hexorbit.xyz.

**In scope:**
- New standalone Next.js (App Router) + TypeScript project, fresh git repo
  (`/Users/thilanhewage/Documents/Dev/Thilan-Hewage-Blog`), no shared code with the HexOrbit-Blog repo.
- Digest feed at `/digest` (index/grid) and `/digest/[date]` (detail) — same Notion query pattern as
  blog.hexorbit.xyz (`Status = Published AND Public = true`, sorted by `Date` desc), pointed at the
  **existing** 🔎 Research Digests Notion database. No data duplication — Notion stays the one
  source of truth.
- RSS feed at `/rss.xml` for the digest.
- Root `/` reserved as a placeholder personal-blog landing page (not the digest grid).
- Placeholder nav + empty routes for future personal content: `/about`, `/posts` — structure only,
  no real content required for v1.
- Modern UI/UX, deliberately distinct from HexOrbit's retro-futuristic/neon identity (that's reserved
  as HexOrbit's own reusable house style — see Dev Log 2026-07-31). A personal-site aesthetic.
- Light/dark theme, WCAG AA contrast, `prefers-reduced-motion` respected — same bar as the last build.

**Out of scope (this spec):**
- Removing the Digest from blog.hexorbit.xyz — separate follow-up spec, done only after
  thilanhewage.com's digest is live and verified.
- Any redirect from blog.hexorbit.xyz to thilanhewage.com — explicitly not wanted.
- Actual production deploy to Hetzner — blocked until the domain reappears in the Hetzner dashboard
  (ticket open with Hetzner support as of 2026-08-01). Local dev, production build, and Docker
  build/run should all be verified regardless; only the final deploy step waits on Hetzner.
- Real content for the About/Posts placeholders.

**Success metric:** `npm run build` succeeds; `/digest`, `/digest/[date]`, and `/rss.xml` render live
Notion data correctly in local dev and inside a Docker container; `/`, `/about`, `/posts`
placeholders render without errors; passes the same release checklist as prior HexOrbit builds
(Operating Playbook §4.3).

**Dependencies:**
- A new, separate read-only Notion integration scoped to thilanhewage.com (see ADR-001), shared
  only with the Research Digests database.
- Hetzner access resolved before the *deploy* step (not before build/dev).

**Open questions (deferred past v1):**
- Final design/content for the root `/` landing page.
- Whether `/posts` becomes home for non-digest personal writing later, and what Notion shape that
  content type uses (own database vs. reusing the Tech Blogs pattern) — own future spec.
