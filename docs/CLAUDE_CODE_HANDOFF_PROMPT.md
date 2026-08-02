Paste everything below into Claude Code, run from `/Users/thilanhewage/Documents/Dev/Thilan-Hewage-Blog`.

---

You're building a fresh site for **thilanhewage.com**, Casper's personal blog, currently an empty
repo. Read `docs/SPEC-digest-launch-v1.md` and `docs/ADR-001-notion-access-and-architecture.md`
in this repo first — they're the approved spec and architecture decision for this build. Everything
below expands on them; the docs are the source of truth if anything here is ambiguous.

## Context

Casper's company (HexOrbit) already runs a Daily Research Digest at blog.hexorbit.xyz, sourced
from a Notion database called 🔎 Research Digests (Notion database ID
`3614ed92-d44b-49fd-ab8f-6440064a1f8e`, data source ID `cfbdc68e-09fb-43b5-8c2b-437db02bbd25`).
That site's implementation (`/Users/thilanhewage/Documents/Dev/HexOrbit-Blog`) is a working
reference for the *Notion-querying pattern only* — read `lib/notion/client.ts`, `lib/notion/digests.ts`,
and `lib/notion/blocks.ts` there for the proven approach (thin `fetch` wrapper against the Notion
REST API, version `2025-09-03`, hourly ISR via `revalidate = 3600`, `Status = Published AND
Public = true` filter sorted by `Date` desc). Do **not** copy its visual design, its component
code verbatim, or its repo history — this is a fresh, independent project per ADR-001. No shared
code, no redirects to or from blog.hexorbit.xyz.

## Notion setup (do this first, before writing app code)

1. Create a new Notion integration named something like "thilanhewage.com" (read-only capabilities
   only — content, no insert/update/comment).
2. Share the 🔎 Research Digests database with that new integration (Connections → add it), the same
   one-click step used for the original HexOrbit Blog integration. Do not touch the existing
   "HexOrbit Blog" or "HexOrbit-Hermes" integrations — leave those exactly as they are.
3. Env vars for this project (`.env.local`, gitignored): `NOTION_API_KEY` (the new key),
   `NOTION_DATABASE_ID=3614ed92-d44b-49fd-ab8f-6440064a1f8e`,
   `NOTION_DATA_SOURCE_ID=cfbdc68e-09fb-43b5-8c2b-437db02bbd25`, `SITE_URL=https://thilanhewage.com`.
   Commit only a `.env.example` with no real values, same convention as HexOrbit-Blog.

## Stack & routes

- Next.js (App Router) + TypeScript + React, same major-version family as HexOrbit-Blog unless you
  have a good reason to deviate — flag it if so, don't silently pick something else.
- `output: 'standalone'` for Docker, same reasoning as HexOrbit-Blog (file-tracing avoids the
  `npm ci --omit=dev` pruning bug class).
- Routes:
  - `/digest` — card grid of Published + Public digests, newest first (this replaces what was `/`
    on blog.hexorbit.xyz).
  - `/digest/[date]` — one digest, rendered generically off whatever `heading_2` blocks exist on the
    page (don't hardcode section names — the digest template's sections change over time; the
    HexOrbit-Blog renderer's approach of driving off block structure, not hardcoded text, is worth
    keeping).
  - `/rss.xml` — RSS 2.0 feed, same query, same ISR window as `/digest`.
  - `/` — placeholder personal-blog landing page. Doesn't need real content yet, but should not be
    the digest grid.
  - `/about`, `/posts` — placeholder routes and nav entries, empty/stub content is fine for v1.
- Build-time vs. runtime credentials: remember Notion is queried **during `next build`** to
  prerender `/digest`, `/digest/[date]`, and `/rss.xml` — not just at runtime. If you containerize
  this, the Docker build stage needs `NOTION_API_KEY` etc. as build `ARG`s, not just runtime env
  (see HexOrbit-Blog's Dockerfile/docker-compose.yml for the exact pattern, and its Dev Log entry
  on this — it was a real bug caught late there, don't repeat it).

## Design direction

Modern, personal-site aesthetic — deliberately **not** a copy of HexOrbit's retro-futuristic
phosphor/neon/hex-grid identity (that's reserved as HexOrbit's own house style for HexOrbit
products). Aim for something that reads as Casper's own voice: clean, content-forward, confident
typography, comfortable reading measure for long-form digest text (HexOrbit-Blog settled on ~68ch
— a reasonable starting point, not a hard requirement here). Support light/dark theme via a
`data-theme` attribute set by a blocking inline script before first paint (avoids flash-of-wrong-theme
— same technique as HexOrbit-Blog, `app/layout.tsx`), persisted in `localStorage`. Meet WCAG AA
contrast in both themes and respect `prefers-reduced-motion` throughout.

**Before starting the design work**, check whether these two skills are already installed
(`~/.claude/skills/`, or wherever `skills list` reports from), and if not, install them:
- `ui-ux-pro-max` (nextlevelbuilder/ui-ux-pro-max-skill) — use it to drive the actual visual design
  and layout decisions.
- `impeccable` (pbakaus/impeccable) — use it as the iterative design/critique/polish loop against
  the live local build, the same way it was used on HexOrbit-Blog's redesign pass.

Install via `npx skills add <repo>` if either is missing (same install method used for HexOrbit's
last redesign — see that repo's Dev Log, 2026-07-31 entries, if you want the exact precedent). If a
skill install prompts for consent and the shell is non-interactive, stop and tell Casper rather than
silently proceeding — don't assume `--yes` is safe to pass without him knowing what it's agreeing to.

## Verification bar (same as HexOrbit-Blog's release checklist)

- `tsc --noEmit`, `eslint`, `next build` all clean.
- A real `docker build` + container run against live Notion data, not just `next build` locally —
  this is what caught the build-arg credentials bug on the last project.
- Manual or Playwright smoke test: `/digest` renders current digests, `/digest/[date]` renders a
  full digest's sections, `/rss.xml` validates, light/dark toggle persists across reloads, `/`,
  `/about`, `/posts` all render without errors.
- Basic accessibility pass: contrast ratios on real shipped CSS values (compute them directly if no
  accessibility MCP/tool is wired in — don't fake a tool call), keyboard nav, `prefers-reduced-motion`
  freezes any decorative motion.
- Git: Conventional Commits, PR-based (even if Casper is the only reviewer), one dev log entry per
  session — same format HexOrbit-Blog and the other HexOrbit projects use, so Casper can track this
  build the same way.

## Explicitly not doing in this pass

- No deploy to Hetzner yet — Casper's domain isn't currently visible in his Hetzner dashboard and
  he's waiting on their support to respond. Get everything build/Docker-verified and ready to ship;
  stop short of the actual deploy step until Casper confirms Hetzner access is sorted.
- No redirect logic to or from blog.hexorbit.xyz.
- No real content for `/about` or `/posts` — structure only.
- Don't touch the HexOrbit-Blog repo or its Notion integration as part of this work.

Stop and ask Casper if anything above conflicts with what you find in the repo, or if a decision
isn't yours to make per the Operating Playbook (nothing ships without his sign-off).
