# ADR-002: thilanhewage.com hosted on the existing Contabo VPS, not a new server

**Date:** 2026-08-02
**Status:** Accepted

**Context:** SPEC v1 assumed deployment to Hetzner, where the domain is registered. On
investigation, thilanhewage.com's Hetzner product turned out to be a shared Web Hosting package
(Apache + WebFTP, Konsole H) — not a Cloud VPS — which can't run the Dockerized Next.js app with
live Notion ISR this project was built as. Casper considered a dedicated Hetzner Cloud VPS, then a
new Contabo VPS (better specs-per-dollar, and Casper already operates Contabo successfully for
HexOrbit's stack), including an option to bundle HexOrbit-Blog onto that new box. After weighing
infra isolation against cost/utilization and migration risk to an already-working production app,
Casper chose to add thilanhewage.com as a new container on the **existing** Contabo VPS that
already runs HexOrbit-Blog, FlowSync, Hermes, Buzz, and monitoring — no new VPS purchased, nothing
else on that box changes.

**Decision:** Deploy thilanhewage.com via the existing VPS's Dockge + Caddy setup, same pattern as
HexOrbit-Blog (`~/stacks/thilanhewage-blog`, joins the shared `web` Docker network, its own Caddy
block). thilanhewage.com's DNS A/AAAA records move from Hetzner's Web Hosting IP to this Contabo
VPS's IP; the domain stays registered at Hetzner. MX/TXT/other DNS record types are left untouched
to avoid breaking any email hosted there.

**Alternatives considered:**
- *Dedicated Hetzner Cloud VPS* — rejected: a second infra provider to operate for one small site,
  no cost advantage over Contabo at comparable specs.
- *New dedicated Contabo VPS, HexOrbit-Blog untouched* — the cleanest separation between personal
  and business infra (Atlas's original recommendation), but Casper judged the added ~$5–7/mo not
  worth it for one lightweight blog given the old VPS has spare capacity.
- *New Contabo VPS hosting both blogs (HexOrbit-Blog moved)* — rejected: migrates an
  already-working production app for no functional gain, and still doesn't fully separate personal
  from business infra either way — gets the downsides of both other options without the upside of
  either.

**Consequences:** thilanhewage.com's infra is no longer isolated from HexOrbit's — a problem on the
shared VPS (resource exhaustion, an outage, a compromised container) can now affect both the
personal site and every HexOrbit service at once, where before this decision they'd have been
independent. Casper accepted this explicitly in exchange for zero additional infra cost and reusing
an already-proven setup. If this stops being acceptable later, moving thilanhewage.com to its own
VPS stays straightforward — it's fully containerized and stateless, Notion is still the only
backing store. The original SPEC's separation goal (repo, Notion integration, no shared code) is
unaffected by this hosting choice; only the physical host is now shared.
