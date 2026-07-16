import {
  discoverReplayLinks,
  getReplaySourcesForApi,
  matchesNeedingDiscovery,
} from "@/lib/replay-discovery";
import { worldCup2026Matches } from "@/lib/matches";
import { readBracketResults, writeBracketResults } from "@/lib/bracket-state";
import { applyBracketToMatches } from "@/lib/bracket-resolver";
import { updateBracketResults } from "@/lib/bracket-fetcher";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function handleDiscover() {
  // Resolve bracket state and update from ESPN before replay discovery
  const storedBracket = readBracketResults();
  const resolvedMatches = applyBracketToMatches(worldCup2026Matches, storedBracket);
  const updatedBracket = await updateBracketResults(resolvedMatches, storedBracket);
  if (updatedBracket !== storedBracket) {
    writeBracketResults(updatedBracket);
  }

  const pending = matchesNeedingDiscovery();

  if (pending.length === 0) {
    return Response.json({
      ok: true,
      pending: 0,
      remaining: 0,
      result: { discovered: [], skipped: [], failed: [] },
      sources: getReplaySourcesForApi(),
      bracket: updatedBracket,
    });
  }

  const result = await discoverReplayLinks();
  const remaining = matchesNeedingDiscovery().length;

  return Response.json({
    ok: true,
    pending: pending.length,
    remaining,
    result,
    sources: getReplaySourcesForApi(),
    bracket: updatedBracket,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleDiscover();
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleDiscover();
}
