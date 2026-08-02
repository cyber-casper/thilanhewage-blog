# ADR-001: Separate Notion integration + standalone repo for thilanhewage.com

**Date:** 2026-08-01
**Status:** Accepted

**Context:** The Daily Research Digest currently lives only on blog.hexorbit.xyz, sourced from the
🔎 Research Digests Notion database via the read-only "HexOrbit Blog" integration key. Casper wants
the Digest on thilanhewage.com instead, with a clean cutover — no redirects, no shared code with the
HexOrbit repo — and does not want a second, duplicated copy of the digest data.

**Decision:** Build thilanhewage.com as its own Next.js + TypeScript project in a fresh repo, reusing
the *proven pattern* from blog.hexorbit.xyz (thin `fetch` wrapper against the Notion REST API,
API version `2025-09-03`, hourly ISR) but not its code directly — reimplemented in the new repo,
pointed at a **new, separate read-only Notion integration** ("thilanhewage.com" or similar),
connected only to the same underlying 🔎 Research Digests database (not a copy of it). Routes:
`/digest` (index), `/digest/[date]` (detail), `/rss.xml`, with `/` reserved for a future personal
landing page and `/about` + `/posts` scaffolded as empty placeholders.

**Alternatives considered:**
- *Duplicate the Notion database* into one thilanhewage.com owns outright — rejected: creates a
  second source of truth Casper would have to keep in sync by hand, when the actual editorial
  workflow (writing digests) only ever needs one place to publish.
- *Reuse the existing "HexOrbit Blog" integration key* across both sites — rejected: couples two
  independently deployed sites' Notion access to a single credential; rotating or revoking it for
  one site forces action on the other.
- *Share code or a monorepo* between blog.hexorbit.xyz and thilanhewage.com — rejected: the explicit
  goal is a clean, independent cutover with no shared surface between a business property and a
  personal one.

**Consequences:** Two independent Notion integrations now need to be managed (each visible and
individually revocable in the Research Digests database's Connections list). No data migration is
required — turning thilanhewage.com on, and later deleting the Digest routes from blog.hexorbit.xyz,
are both zero-data-loss operations, since Notion remains the single source of truth throughout.
The two sites can diverge freely in design, hosting, and release cadence with no coupling.
