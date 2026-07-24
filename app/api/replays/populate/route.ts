import {
  discoverAllReplayLinks,
  getReplaySourcesForApi,
  matchesNeedingDiscovery,
} from "@/lib/replay-discovery";
import { worldCup2026Matches } from "@/lib/matches";
import { readBracketResults, writeBracketResults } from "@/lib/bracket-state";
import { applyBracketToMatches } from "@/lib/bracket-resolver";
import { updateBracketResults } from "@/lib/bracket-fetcher";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  // Local bootstrap tool only. Discovery scrapes external sites and writes to
  // the local `data/` directory, which is neither possible nor wanted on the
  // deployed (read-only, static) site. Refresh links locally with
  // `npm run dev` + `npm run populate`, then commit data/*.json and redeploy.
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const storedBracket = readBracketResults();
  const resolvedMatches = applyBracketToMatches(worldCup2026Matches, storedBracket);
  const updatedBracket = await updateBracketResults(resolvedMatches, storedBracket);
  if (updatedBracket !== storedBracket) writeBracketResults(updatedBracket);

  const pending = matchesNeedingDiscovery();
  const result = await discoverAllReplayLinks();

  return Response.json({
    ok: true,
    pending: pending.length,
    remaining: matchesNeedingDiscovery().length,
    result,
    sources: getReplaySourcesForApi(),
    bracket: updatedBracket,
  });
}
