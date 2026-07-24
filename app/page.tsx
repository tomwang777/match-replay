import { MatchList } from "@/components/MatchList";
import { SiteHeader } from "@/components/SiteHeader";
import { Wc26Hero } from "@/components/Wc26Hero";
import { PageFooter } from "@/components/PageFooter";
import { worldCup2026Matches } from "@/lib/matches";
import { applyBracketToMatches } from "@/lib/bracket-resolver";
import type { BracketResults } from "@/lib/bracket-types";
import type { ReplaySourcesStore } from "@/lib/replay-store-types";
import bracketData from "@/data/bracket-results.json";
import replayData from "@/data/replay-sources.json";

// The committed JSON files are the single source of truth for the deployed
// site. Importing them statically (instead of reading from disk at request
// time) guarantees they are bundled and lets this page prerender to static
// HTML — no server, cron, or writable filesystem needed at runtime.
const bracket = bracketData as unknown as BracketResults;
const replayStore = replayData as unknown as ReplaySourcesStore;

// Resolve knockout placeholders ("Match 97 Winner") to real team names once,
// at build time, so every visitor gets the same prerendered page.
const matches = applyBracketToMatches(worldCup2026Matches, bracket);

export default function Home() {
  return (
    <div className="min-h-full bg-surface">
      <SiteHeader />
      <Wc26Hero />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <MatchList matches={matches} replayStore={replayStore} />

        <PageFooter />
      </main>
    </div>
  );
}
