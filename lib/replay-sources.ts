import type { ReplaySourcesStore } from "@/lib/replay-store-types";

export type MatchReplaySources = {
  cctv: string;
  migu: string;
  youtube: string;
};

type ReplaySourceKey = keyof MatchReplaySources;

const REPLAY_SOURCE_DEFS: { key: ReplaySourceKey; label: string }[] = [
  { key: "cctv", label: "CCTV" },
  { key: "migu", label: "Migu" },
  { key: "youtube", label: "YouTube Highlights" },
];

export function replaySourcesForMatch(
  matchNumber: number,
  store: ReplaySourcesStore,
): { label: string; url: string | null }[] {
  const sources = store[matchNumber];

  return REPLAY_SOURCE_DEFS.map(({ key, label }) => ({
    label,
    url: sources?.[key] ?? null,
  }));
}
