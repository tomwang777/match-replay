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

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
