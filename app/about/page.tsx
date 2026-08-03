import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article>
      <header className="page-header">
        <h1>About</h1>
        <p className="page-lede">
          I&rsquo;m Casper — building HexOrbit, studying toward Azure AZ-900 and AZ-104, and
          writing here about what changes when AI stops being a talking point and starts being
          leverage.
        </p>
      </header>

      <div className="digest-body">
        <p>
          I spent a long time with ideas I couldn&rsquo;t get out of my head and into the world.
          Not because the ideas were bad — because turning &ldquo;I have an idea&rdquo; into
          something real took more hours, more skills, and more patience than I had to spend
          alone. That gap is most of why this site exists as late as it does.
        </p>
        <p>
          What changed is AI. Not as a buzzword — as leverage. I run a small, self-hosted
          infrastructure practice: agents I&rsquo;ve built and deployed myself, containerized
          with Docker, Caddy, and Dockge on my own VPS, debugged live until they passed health
          checks rather than patched around. I&rsquo;m building an all-in-one workplace app on
          Claude Cowork, wiring up MCP servers and working through the same kind of
          infrastructure decisions — cloud-routed versus local, one environment versus
          another — that used to be the wall between an idea and a shipped thing. This site is
          the plainest proof of that: a personal blog, live, with its own Notion-backed content
          pipeline, built and deployed end to end in a matter of days.
        </p>
        <p>
          HexOrbit is where the same instinct runs at studio scale. It&rsquo;s not one product —
          it&rsquo;s a handful of tools, a research digest pipeline, and a site or two, all
          running on infrastructure I operate myself. I write a spec before I build, a decision
          record when a choice has real tradeoffs, and a dev log after — even when I&rsquo;m the
          only one who has to read it. That&rsquo;s not process for its own sake. It&rsquo;s a
          habit built to outlast being a team of one.
        </p>
        <p>
          I debug by isolating problems, not guessing at them. I&rsquo;ll reverse a tooling
          decision the moment it stops working rather than defend it because I already committed
          to it. And I&rsquo;d rather hear &ldquo;I don&rsquo;t know&rdquo; than a
          plausible-sounding answer — from a person or from an AI — which is part of why I push
          the tools I use to be specific instead of complimentary.
        </p>
        <p>
          None of this — the agents, the workplace app, this blog — would exist on this timeline
          without AI doing the work that used to be the bottleneck between me and finishing
          something. I think it&rsquo;s time more of us said that plainly instead of downplaying
          it. AI didn&rsquo;t hand me my ideas. It gave me a way to actually build them.
        </p>
      </div>
    </article>
  );
}
