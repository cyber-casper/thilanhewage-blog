# Dev Log

## 2026-08-02 — Initial scaffold

Built the v1 skeleton for thilanhewage.com per `docs/SPEC-digest-launch-v1.md` and
`docs/ADR-001-notion-access-and-architecture.md`.

**Done:**
- Fresh Next.js 16.2.12 / React 19.2.4 / TypeScript project, `output: "standalone"`, same major-version
  family as HexOrbit-Blog (matched deliberately, no deviation).
- Reimplemented (not copied) the proven Notion-querying pattern from HexOrbit-Blog's
  `lib/notion/{client,digests,blocks}.ts`: thin `fetch` wrapper, API version `2025-09-03`, hourly ISR
  (`revalidate = 3600`), `Status = Published AND Public = true` filter sorted by `Date` desc, recursive
  block-children pagination. `lib/digest-excerpt.ts` is a from-scratch generic excerpt/section-preview
  extractor (first non-empty callout/paragraph, `heading_2`-driven — no hardcoded section names, matching
  the spec's "don't hardcode section names" instruction).
- Routes: `/` (placeholder landing, not the digest grid), `/digest` (card grid), `/digest/[date]`
  (generic block-driven article render), `/rss.xml` (RSS 2.0), `/about`, `/posts` (stubs).
- Design: used `ui-ux-pro-max`'s `--design-system` search ("personal blog content-first minimal
  editorial reading") → Swiss Modernism 2.0 / editorial style, Newsreader (serif, headings + long-form
  body) paired with Inter (sans, nav/UI/meta) via `next/font/google`. Deliberately not HexOrbit's
  neon/phosphor/hex-grid identity per spec. Light/dark via `data-theme` set by a blocking inline script
  in `app/layout.tsx` (same flash-prevention technique as HexOrbit-Blog), persisted to `localStorage`.
- Installed the `impeccable` skill (`ui-ux-pro-max` was already present) via `npx skills add
  pbakaus/impeccable -g`. It ran fully non-interactively (detected the agent context and skipped the
  confirmation prompt on its own) — no `--yes` needed, so no consent gate to escalate.
- Accessibility: computed WCAG contrast ratios directly (Python + the standard relative-luminance
  formula, not a fake tool call — no accessibility MCP wired into this environment) for every
  fg/bg, muted-fg/bg, and accent/bg pair in both themes. All text pairs land between 5.8:1 and 19.8:1
  (AA requires 4.5:1); a dedicated `--color-border-strong` token (~3:1) is reserved for interactive
  element outlines, separate from the softer ~1.3:1 decorative divider color, matching WCAG's
  non-text-contrast requirement without darkening every hairline border.
- `tsc --noEmit` and `eslint .` both clean. ESLint caught a real bug in `ThemeToggle.tsx`: calling
  `setState` synchronously inside a `useEffect` body (`react-hooks/set-state-in-effect`) to sync from
  `document.documentElement`'s `data-theme` attribute. Fixed by switching to `useSyncExternalStore`,
  which is the React-blessed way to read external mutable state (the DOM attribute set by the
  pre-hydration inline script) without the cascading-render anti-pattern.
- Dockerfile + docker-compose.yml, mirroring HexOrbit-Blog's build-arg pattern exactly (Notion
  credentials as build `ARG`s, not just runtime env — the bug that was caught late on that project).
  One deliberate deviation: `docker-compose.yml` here publishes port 3000 directly instead of joining
  an external `web` reverse-proxy network, since there's no shared network for this new domain yet and
  no deploy is happening this pass — worth revisiting once the Hetzner reverse-proxy setup exists.
- `npm install`: 3 high-severity advisories (postcss, sharp), both bundled *inside* `next@16.2.12`
  itself, not a dependency we chose. Confirmed HexOrbit-Blog has the identical advisories on the same
  Next version — pre-existing upstream condition, not a regression. `npm audit fix --force`'s suggested
  fix (downgrade to `next@9.3.3`) is not viable and wasn't applied.
- Smoke-tested what's possible without live Notion data: `next dev`, `/`, `/about`, `/posts` all return
  200 with correct markup (nav, theme-toggle aria state, footer RSS link, pre-hydration theme script in
  `<head>`). `/digest` and `/rss.xml` correctly 500 with `Missing required environment variable:
  NOTION_API_KEY` — confirms the app code path is right and the only gap is the credential itself.
  `next build` also confirmed this: compiles and type-checks cleanly, fails exactly at Notion data
  collection for `/digest/[date]`, nowhere else.

**Blocked / needs Casper:**
- **Notion integration + key.** Creating a Notion integration and sharing a database with it are
  Notion-web-UI-only actions (`notion.so/my-integrations` → Connections) — no tool available here can
  do either. Per the spec: create a new read-only integration named something like "thilanhewage.com",
  share it with 🔎 Research Digests, then either paste the Internal Integration Secret into
  `.env.local`'s `NOTION_API_KEY` yourself or hand it to me. Nothing past this point (`next build`
  succeeding, Docker build+run against live data, `/digest` and `/rss.xml` smoke tests, RSS validation)
  can be verified without it.
- **No browser/screenshot tool in this environment.** `impeccable`'s live critique loop and a Playwright
  smoke test both need one, and neither Playwright nor a Chrome DevTools MCP is wired in here. The a11y
  contrast pass was done by direct computation instead (see above), but visual QA (does the type scale
  actually feel right, does the card grid hold up at 375px, etc.) still needs a human look at
  `npm run dev` — or a browser-capable tool added to this environment.

**Not done this session (by design, per spec's "explicitly not doing" list):** no Hetzner deploy, no
redirect logic, no real `/about` or `/posts` content.
