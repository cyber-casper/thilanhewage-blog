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

**Still needed:**
- **No browser/screenshot tool in this environment.** `impeccable`'s live critique loop and a Playwright
  smoke test both need one, and neither Playwright nor a Chrome DevTools MCP is wired in here. The a11y
  contrast pass was done by direct computation instead (see above), but visual QA (does the type scale
  actually feel right, does the card grid hold up at 375px, etc.) still needs a human look at
  `npm run dev` — or a browser-capable tool added to this environment.

**Not done this session (by design, per spec's "explicitly not doing" list):** no Hetzner deploy, no
redirect logic, no real `/about` or `/posts` content.

## 2026-08-02 — Live verification (Notion key provided)

Casper supplied the `thilanhewage.com` integration's `NOTION_API_KEY` in `.env.local`. Completed the
rest of the release checklist against live data.

- `next build` against live Notion: compiles, type-checks, and prerenders cleanly — `/`, `/about`,
  `/posts`, `/digest`, `/rss.xml` static, `/digest/[date]` SSG across 16 published digests
  (`2026-07-15` through `2026-08-02`).
- `docker compose --env-file .env.local build` + `up`: image builds with the Notion build `ARG`s and
  starts, but **every route 500'd** (including the fully-static `/` and the auto-generated 404 page),
  with nothing printed to `docker logs`. Root-caused by comparing a local `node .next/standalone/server.js`
  run (worked fine, same build output) against the container (broken) — the only material difference
  was `HOSTNAME`. Docker auto-injects `HOSTNAME=<container-id>` into every container's environment, and
  Next's standalone `server.js` binds to *that* value instead of all interfaces when it's set, so the
  server was only listening on the container's internal bridge IP (confirmed: `wget localhost:3000`
  failed with connection-refused from *inside* the same container). Fixed with `ENV HOSTNAME=0.0.0.0`
  in the Dockerfile's runtime stage, which takes precedence over Docker's auto-injected value — this is
  the same fix Next's own official Docker example uses, for the same reason.
- Full smoke test against the running container, all against live data: `/` `/about` `/posts` `/digest`
  `/rss.xml` `/digest/2026-08-02` all 200; an unknown path 404s correctly (not 500 — confirms the fix
  didn't just paper over routing). `/rss.xml` parses as well-formed XML (`xml.dom.minidom`), 15 items,
  `<rss version="2.0">` root, correct entity-escaping (including digests whose own content contains
  literal `<b>` text from an older authoring template — rendered as `&lt;b&gt;`, not interpreted as
  markup).
- While checking RSS output, noticed most excerpts were just the callout's label text ("Executive
  signal:") with no actual content. Root cause: the digest template's summary callout holds its real
  content in child bullet blocks, not the callout's own rich text — `DigestBody`'s article renderer
  already recursed into `callout.children` correctly, but `lib/digest-excerpt.ts`'s `excerptFor()` only
  read the callout's own text. Fixed by preferring the joined text of the callout's bulleted/numbered
  children when present, falling back to the callout's own text otherwise. Re-verified: RSS descriptions
  and card-grid excerpts now show real digest content ("Adobe Campaign Classic shipped a CVSS 10
  patch…") instead of a bare label.
- Theme toggle: verified the mechanism by inspecting the rendered HTML (pre-hydration script present in
  `<head>`, correct `aria-pressed`/`aria-label`, `useSyncExternalStore` wiring) — actual click-and-reload
  persistence still needs a human check or a browser tool, per the still-open item above.

Both bugs found this pass (HOSTNAME binding, excerpt-not-descending-into-callout-children) were real,
would have shipped silently, and only surfaced because of the "real Docker build + container run
against live Notion data" step in the verification bar — exactly the kind of thing that check exists
to catch.

## 2026-08-04 — About page copy: verify and ship

`app/about/page.tsx` content was already written (replacing the placeholder) per
`docs/CLAUDE_CODE_PROMPT_about-update.md`; this pass verified and shipped it without rewriting the
copy, per the prompt's explicit scope.

- Pre-flight `git status` turned up more dirty state than the prompt expected: an untracked
  `docs/SPEC-remove-digest-hexorbit-v1.md` (a draft spec for the separate `hexorbit-blog` repo that
  had landed in this one by mistake), `.vscode/extensions.json`, and `graphify-out/` (expected — this
  repo's `AGENTS.md` treats a dirty knowledge graph as normal). Flagged to Casper per the prompt's
  explicit "stop if anything else is dirty" instruction rather than guessing; confirmed scope
  (misplaced spec file deleted, draft doc included in the commit, `.vscode/` left alone) before
  proceeding.
- `tsc --noEmit` hit the exact pre-existing `.next/types/cache-life.d 2.ts` conflict the prompt
  warned about. `rm -rf .next` + re-run came back clean — confirmed stale generated types, not caused
  by the about-page change.
- `eslint` clean. `next build` succeeded in full, including the live Notion-backed `/digest/[date]`
  routes (23 static pages).
- **Closed the "no browser/screenshot tool in this environment" gap** noted in both 2026-08-02
  entries: headless Google Chrome is available locally. `chromium-cli` and Playwright aren't
  installed, and `--blink-settings=preferredColorScheme` (the old flag-based way to force
  light/dark for a screenshot) is dead in this Chrome build — it silently no-ops. Drove Chrome
  directly over the DevTools Protocol instead (`--remote-debugging-port`, raw `WebSocket` from Node,
  no new dependency installed): `Emulation.setEmulatedMedia` with a `prefers-color-scheme` feature
  correctly forces the theme before `Page.navigate`, then `Page.captureScreenshot`. Confirmed via a
  minimal `data:` URL test page that the old flag really does nothing on this Chrome version before
  switching approaches, rather than assuming the null result meant dark mode itself was broken.
- Screenshotted `/about` in both themes: renders correctly, matches the rest of the site's nav/footer
  chrome, theme toggle icon reflects state correctly in both. No new CSS needed or added — the page
  reuses `page-header`/`page-lede`/`digest-body` only.
- Contrast: recomputed WCAG ratios for the `page-lede` muted text (the most contrast-risky token pair
  on this page) directly from `--color-fg-muted`/`--color-bg` — 6.57:1 light, 7.83:1 dark, both clear
  the 4.5:1 AA bar with margin, consistent with the token-level pass from the initial scaffold. Body
  text uses the higher-contrast `--color-fg` token, so it clears by an even wider margin.
  `prefers-reduced-motion` unaffected — this page has no motion and the diff touches no shared CSS/JS.
- Spot-checked `/`, `/posts`, `/digest` still 200 — no regression elsewhere.
- Shipped as one `feat(about)` commit, opened as a PR against `main` for Casper's review — not
  merged. No deploy this pass, per the prompt's explicit scope.
