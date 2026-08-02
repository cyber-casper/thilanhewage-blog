Run this directly on the Contabo VPS (SSH in first — same box already running HexOrbit-Blog,
FlowSync, Hermes, Buzz, uptime-kuma, Caddy, Dockge, Beszel). Read
`docs/ADR-002-hosting-on-existing-contabo-vps.md` in this repo first for why this box and not a new
one. **Nothing else running on this VPS should be touched, restarted, or reconfigured as part of
this** — this is additive only.

## 1. Get the code onto the VPS
`git clone https://github.com/cyber-casper/thilanhewage-blog.git ~/stacks/thilanhewage-blog` —
matching the `~/stacks/hexorbit-blog` convention already used on this box. (Or import it as a new
Dockge stack pointed at that repo, if that's the easier path.)

## 2. Create the VPS-local `.env`
Never committed — lives only at `~/stacks/thilanhewage-blog/.env`:
```
NOTION_API_KEY=<the thilanhewage.com read-only integration secret>
NOTION_DATABASE_ID=3614ed92-d44b-49fd-ab8f-6440064a1f8e
NOTION_DATA_SOURCE_ID=cfbdc68e-09fb-43b5-8c2b-437db02bbd25
SITE_URL=https://thilanhewage.com
PORT=3000
```

## 3. Deploy via Dockge
`docker-compose.yml` already joins the external `web` network — the same one HexOrbit-Blog,
FlowSync, and Caddy all share. Don't create a second network. Build and start the stack, confirm
`thilanhewage-blog` comes up healthy (`docker ps`, check logs for a clean Next.js start and no
Notion fetch errors — this needs the integration to already be shared with the Research Digests
database, see ADR-001).

## 4. Add a Caddy block
Alongside the existing `blog.hexorbit.xyz` block:
```
thilanhewage.com, www.thilanhewage.com {
    reverse_proxy thilanhewage-blog:3000
}
```
Reload Caddy the same way it was reloaded when the `blog.hexorbit.xyz` block was first added.

## 5. DNS — the actual cutover
thilanhewage.com's DNS is managed in Hetzner's own console (domain is registered *and* was hosted
there). Change the **A record** (and AAAA, if one exists) for `thilanhewage.com` and `www` to point
at this VPS's IP — the same IP `blog.hexorbit.xyz` already resolves to.

**Only touch A/AAAA (and the `www` CNAME, if that's how it's set up).** Do not touch MX, TXT, or any
other record type — if Casper has email on this domain through Hetzner, it needs to keep routing to
Hetzner's mail servers regardless of where the website itself now lives.

DNS propagation isn't instant (minutes to ~48 hours depending on TTL). The domain will keep showing
Hetzner's "Forbidden" Apache page, or a cert warning, until it fully propagates and Caddy issues its
certificate — expected, not a bug.

## 6. Verify
Once DNS resolves to the new IP: `/`, `/digest`, `/digest/[date]`, `/rss.xml`, `/about`, `/posts`
all 200, valid TLS (Caddy auto-issues via Let's Encrypt). Then confirm everything **else** on the
VPS is unaffected — `docker ps` shows the same other containers healthy, no unrelated restarts,
`blog.hexorbit.xyz` still serving normally.

## 7. After it's confirmed live and stable
Decide with Casper whether to keep or cancel the Hetzner Web Hosting package — only relevant once
nothing (e.g. email) still depends on it, and only after this site has been live and stable for a
bit. Don't cancel anything as part of this deploy.
