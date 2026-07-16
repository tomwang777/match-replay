import type { ReplaySourcesStore } from "@/lib/replay-store-types";
import type { MatchReplaySources } from "@/lib/replay-sources";

export function isSourceComplete(
  sources: Partial<MatchReplaySources> | undefined,
): boolean {
  return Boolean(sources?.cctv && sources?.migu && sources?.youtube);
}

export function isMissingCctv(
  sources: Partial<MatchReplaySources> | undefined,
): boolean {
  return !sources?.cctv;
}

export function needsReplayDiscovery(
  sources: Partial<MatchReplaySources> | undefined,
): boolean {
  return isMissingCctv(sources) || !sources?.migu || !sources?.youtube;
}

export function finishedMatchesNeedingReplays(
  finished: { matchNumber: number }[],
  store: ReplaySourcesStore,
): boolean {
  return finished.some((match) =>
    needsReplayDiscovery(store[match.matchNumber]),
  );
}

export function finishedMatchesMissingCctv(
  finished: { matchNumber: number }[],
  store: ReplaySourcesStore,
): boolean {
  return finished.some((match) => isMissingCctv(store[match.matchNumber]));
}
