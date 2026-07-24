import {
  MATCH_DURATION_MS,
  worldCup2026Matches,
  getMatchStatus,
  type Match,
} from "@/lib/matches";
import { readBracketResults } from "@/lib/bracket-state";
import { applyBracketToMatches } from "@/lib/bracket-resolver";
import {
  buildCctvCatalog,
  validateCctvUrl,
} from "@/lib/cctv-catalog";
import {
  isMissingCctv,
  isSourceComplete,
  needsReplayDiscovery,
} from "@/lib/replay-helpers";
import {
  clearReplaySource,
  mergeReplaySources,
  readReplaySourcesSync,
  writeReplaySourcesSync,
} from "@/lib/replay-store";
import type { ReplaySourcesStore } from "@/lib/replay-store-types";
import type { MatchReplaySources } from "@/lib/replay-sources";
import { teamNameCn } from "@/lib/team-names-cn";
import { firstMatchingLink, searchWeb } from "@/lib/web-search";

/** Wait after estimated match end before searching (broadcasts need time to publish). */
export const DISCOVERY_DELAY_MS = 30 * 60 * 1000;

/** Process a few matches per run so the API responds before timeout. */
export const MAX_MATCHES_PER_DISCOVER = 6;

type DiscoverResult = {
  discovered: number[];
  skipped: number[];
  failed: number[];
  catalogApplied: number[];
  invalidCctvRemoved: number[];
};

function isKnockoutPlaceholder(team: string): boolean {
  return team.includes("Winner") || team.includes("Loser") || team.includes("3rd");
}

function isReadyForDiscovery(match: Match, now: Date): boolean {
  if (getMatchStatus(match, now) !== "finished") return false;

  const kickoffMs = new Date(match.kickoffAt).getTime();
  if (now.getTime() < kickoffMs + MATCH_DURATION_MS + DISCOVERY_DELAY_MS) {
    return false;
  }

  if (
    isKnockoutPlaceholder(match.homeTeam) ||
    isKnockoutPlaceholder(match.awayTeam)
  ) {
    return false;
  }

  return true;
}

function discoveryPriority(
  match: Match,
  store: ReplaySourcesStore,
): number {
  const sources = store[match.matchNumber];
  if (isMissingCctv(sources)) return 0;
  if (!sources?.migu) return 1;
  if (!sources?.youtube) return 2;
  return 3;
}

export function matchesNeedingDiscovery(
  now = new Date(),
  store = readReplaySourcesSync(),
  matches = applyBracketToMatches(worldCup2026Matches, readBracketResults()),
): Match[] {
  return matches
    .filter(
      (match) =>
        isReadyForDiscovery(match, now) &&
        needsReplayDiscovery(store[match.matchNumber]),
    )
    .sort((a, b) => {
      const priorityDiff =
        discoveryPriority(a, store) - discoveryPriority(b, store);
      if (priorityDiff !== 0) return priorityDiff;

      // Most recently finished first within same priority tier.
      return new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime();
    });
}

/** Bulk-apply CCTV catalog entries for finished matches missing CCTV. */
export function applyCctvCatalog(
  catalog: Map<number, string>,
  store = readReplaySourcesSync(),
  now = new Date(),
): { store: ReplaySourcesStore; applied: number[] } {
  let nextStore = store;
  const applied: number[] = [];

  for (const match of worldCup2026Matches) {
    if (!isReadyForDiscovery(match, now)) continue;
    if (!isMissingCctv(store[match.matchNumber])) continue;

    const cctv = catalog.get(match.matchNumber);
    if (!cctv) continue;

    nextStore = mergeReplaySources(nextStore, match.matchNumber, { cctv });
    applied.push(match.matchNumber);
  }

  return { store: nextStore, applied };
}

/**
 * Remove stored CCTV URLs whose pages no longer resolve (HTTP non-200).
 * Transient errors, rate-limits, and geo-blocks are treated as "keep" so we
 * never drop a link that is actually fine — see {@link validateCctvUrl}.
 */
export async function sanitizeInvalidCctvInStore(
  store = readReplaySourcesSync(),
): Promise<{ store: ReplaySourcesStore; removed: number[] }> {
  let nextStore = store;
  const removed: number[] = [];

  for (const [matchNumberKey, sources] of Object.entries(store)) {
    const matchNumber = Number(matchNumberKey);
    const cctv = sources?.cctv;
    if (!cctv) continue;

    const valid = await validateCctvUrl(cctv);
    if (!valid) {
      nextStore = clearReplaySource(nextStore, matchNumber, "cctv");
      removed.push(matchNumber);
    }
  }

  return { store: nextStore, removed };
}

const CCTV_SEARCH_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Full-match replay: ≥ 75 minutes, 2026 URL, not a preview or partial-match show. */
function isCctvFullMatchReplay(item: {
  all_title: string;
  durations: number;
  urllink: string;
}): boolean {
  if (item.durations < 4500) return false;
  if (!item.urllink.includes("2026")) return false;
  // Reject preview shows, trailers, and partial-match broadcasts (second-half only).
  const t = item.all_title;
  if (t.includes("前瞻") || t.includes("预告") || t.includes("下半场"))
    return false;
  return true;
}

/**
 * Query CCTV's search API for a full-match replay page.
 * `home` and `away` are Chinese team names used to verify the result title.
 */
async function searchCctvDirectly(
  query: string,
  home: string,
  away: string,
): Promise<string | null> {
  const encoded = encodeURIComponent(query);
  const url =
    `https://search.cctv.com/ifsearch.php?page=1&qtext=${encoded}` +
    `&sort=relevance&pageSize=20&type=video&vtime=3` +
    `&datepid=&channel=&pageflag=&qtext_str=${encoded}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": CCTV_SEARCH_UA,
        Referer: "https://search.cctv.com/",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      list?: { all_title: string; durations: number; urllink: string }[];
    };
    for (const item of data.list ?? []) {
      if (!isCctvFullMatchReplay(item)) continue;
      // Verify the result actually mentions both teams (avoids wrong-match results).
      const t = item.all_title;
      if (t.includes(home) && t.includes(away)) return item.urllink;
    }
  } catch {
    // network error or timeout
  }
  return null;
}

const STAGE_CN: Record<string, string> = {
  "Round of 32": "1/16决赛",
  "Round of 16": "1/8决赛",
  "Quarter-final": "1/4决赛",
  "Semi-final": "半决赛",
  "Third-place play-off": "季军争夺战",
  "Final": "决赛",
};

/** CCTV uses shortened names for some teams that differ from the full Chinese name. */
const CCTV_NAME_OVERRIDE: Record<string, string> = {
  刚果民主共和国: "刚果",
};

function cctvTeamCn(cn: string): string {
  return CCTV_NAME_OVERRIDE[cn] ?? cn;
}

/** Build the CCTV title prefix matching the on-site format, e.g. "[世界杯]A组第1轮" */
function cctvTitlePrefix(match: Match): string {
  const stage = match.stage;

  if (stage.startsWith("Group ")) {
    const group = stage.slice(6); // "A", "B", ...
    const n = match.matchNumber;
    const round = n <= 24 ? "第1轮" : n <= 48 ? "第2轮" : "第3轮";
    return `[世界杯]${group}组${round}`;
  }

  const cn = STAGE_CN[stage];
  return cn ? `[世界杯]${cn}` : `[世界杯]`;
}

/** Highlight clip fallback: any 2026 video ≥ 60s mentioning both teams. */
async function searchCctvHighlight(
  home: string,
  away: string,
): Promise<string | null> {
  for (const query of [
    `世界杯 ${home} ${away} 集锦`,
    `世界杯 ${away} ${home} 集锦`,
    `世界杯 ${home} ${away}`,
    `世界杯 ${away} ${home}`,
  ]) {
    const encoded = encodeURIComponent(query);
    const url =
      `https://search.cctv.com/ifsearch.php?page=1&qtext=${encoded}` +
      `&sort=relevance&pageSize=20&type=video&datepid=&channel=&pageflag=&qtext_str=${encoded}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": CCTV_SEARCH_UA, Referer: "https://search.cctv.com/" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        list?: { all_title: string; durations: number; urllink: string }[];
      };
      for (const item of data.list ?? []) {
        if (!item.urllink.includes("2026")) continue;
        if (item.durations < 60) continue;
        if (item.all_title.includes("前瞻") || item.all_title.includes("预告")) continue;
        const t = item.all_title;
        if (t.includes(home) && t.includes(away)) return item.urllink;
      }
    } catch {
      // network error or timeout
    }
  }
  return null;
}

async function discoverCctvUrl(
  match: Match,
  catalog: Map<number, string>,
): Promise<string | null> {
  const fromCatalog = catalog.get(match.matchNumber);
  if (fromCatalog) return fromCatalog;

  const homeCn = teamNameCn(match.homeTeam);
  const awayCn = teamNameCn(match.awayTeam);
  // Use CCTV-specific abbreviations for teams that differ from the standard CN names.
  const home = cctvTeamCn(homeCn);
  const away = cctvTeamCn(awayCn);
  const prefix = cctvTitlePrefix(match);

  // Try exact title format first (highest precision), then fallback to looser queries.
  for (const query of [
    `${prefix}：${home}VS${away}`,
    `${prefix}：${away}VS${home}`,
    `世界杯 ${home} ${away}`,
    `世界杯 ${away} ${home}`,
  ]) {
    const url = await searchCctvDirectly(query, home, away);
    if (url) return url;
  }

  // No full-match replay found — fall back to highlight clip.
  return searchCctvHighlight(home, away);
}

async function discoverMiguUrl(match: Match): Promise<string | null> {
  const home = teamNameCn(match.homeTeam);
  const away = teamNameCn(match.awayTeam);
  const queries = [
    `site:miguvideo.com 世界杯 ${home} ${away}`,
    `site:miguvideo.com ${home} ${away} 咪咕`,
    `site:miguvideo.com 世界杯 ${home}VS${away}`,
  ];

  for (const query of queries) {
    const links = await searchWeb(query);
    const url = firstMatchingLink(
      links,
      /https?:\/\/www\.miguvideo\.com\/p\/(?:live|detail)\/\d+/i,
    );
    if (url) return url;
  }

  return null;
}

/** Normalise team names for YouTube search (use the common English alias). */
const YOUTUBE_NAME_ALIASES: Record<string, string> = {
  Türkiye: "Turkey",
  "Korea Republic": "South Korea",
  "Ivory Coast": "Ivory Coast",
  "DR Congo": "DR Congo",
  "Bosnia and Herzegovina": "Bosnia",
  "United States": "USA",
};

function youtubeTeamName(team: string): string {
  return YOUTUBE_NAME_ALIASES[team] ?? team;
}

async function discoverYoutubeUrl(match: Match): Promise<string | null> {
  const homeEn = youtubeTeamName(match.homeTeam);
  const awayEn = youtubeTeamName(match.awayTeam);
  const homeCn = teamNameCn(match.homeTeam);
  const awayCn = teamNameCn(match.awayTeam);

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    const queries = [
      `World Cup 2026 ${homeEn} ${awayEn} highlights`,
      `FIFA World Cup 2026 ${homeEn} vs ${awayEn} highlights`,
    ];

    for (const query of queries) {
      const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "8",
        key: apiKey,
      });

      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?${params}`,
        );
        if (!response.ok) continue;

        const data = (await response.json()) as {
          items?: { id?: { videoId?: string }; snippet?: { title?: string } }[];
        };

        for (const item of data.items ?? []) {
          const videoId = item.id?.videoId;
          const title = item.snippet?.title?.toLowerCase() ?? "";
          if (
            videoId &&
            (title.includes("highlight") ||
              title.includes("集锦") ||
              title.includes("精华"))
          ) {
            return `https://www.youtube.com/watch?v=${videoId}`;
          }
        }

        const fallbackId = data.items?.[0]?.id?.videoId;
        if (fallbackId) {
          return `https://www.youtube.com/watch?v=${fallbackId}`;
        }
      } catch {
        // try next query
      }
    }
  }

  // Direct YouTube search — no API key needed
  const ytQueries = [
    `${homeEn} ${awayEn} FIFA World Cup 2026 highlights`,
    `${homeEn} vs ${awayEn} World Cup 2026 highlights`,
    `${homeCn} ${awayCn} 2026世界杯 集锦`,
  ];

  for (const query of ytQueries) {
    const videoId = await searchYoutubeDirectly(query);
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  }

  return null;
}

const YOUTUBE_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Scrapes YouTube's search results page and returns the first video ID that
 * matches a video result (the "thumbnail" suffix distinguishes video hits from
 * playlists and channel cards).
 */
async function searchYoutubeDirectly(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      {
        headers: { "User-Agent": YOUTUBE_USER_AGENT },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/"videoId":"([A-Za-z0-9_-]{11})","thumbnail"/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

async function discoverSourcesForMatch(
  match: Match,
  existing: Partial<MatchReplaySources> | undefined,
  cctvCatalog: Map<number, string>,
): Promise<Partial<MatchReplaySources>> {
  // Fetch all three sources in parallel — each is independent
  const [cctv, migu, youtube] = await Promise.all([
    existing?.cctv ? Promise.resolve(null) : discoverCctvUrl(match, cctvCatalog),
    existing?.migu ? Promise.resolve(null) : discoverMiguUrl(match),
    existing?.youtube ? Promise.resolve(null) : discoverYoutubeUrl(match),
  ]);

  const patch: Partial<MatchReplaySources> = {};
  if (cctv) patch.cctv = cctv;
  if (migu) patch.migu = migu;
  if (youtube) patch.youtube = youtube;
  return patch;
}

export async function discoverReplayLinks(
  now = new Date(),
): Promise<DiscoverResult> {
  let store = readReplaySourcesSync();

  const sanitizeResult = await sanitizeInvalidCctvInStore(store);
  store = sanitizeResult.store;

  const cctvCatalog = await buildCctvCatalog();

  const catalogResult = applyCctvCatalog(cctvCatalog, store, now);
  store = catalogResult.store;

  const result: DiscoverResult = {
    discovered: [],
    skipped: [],
    failed: [],
    catalogApplied: catalogResult.applied,
    invalidCctvRemoved: sanitizeResult.removed,
  };

  if (
    sanitizeResult.removed.length > 0 ||
    catalogResult.applied.length > 0
  ) {
    writeReplaySourcesSync(store);
  }

  const pending = matchesNeedingDiscovery(now, store).slice(
    0,
    MAX_MATCHES_PER_DISCOVER,
  );

  if (pending.length === 0) {
    return result;
  }

  for (const match of pending) {
    const existing = store[match.matchNumber];
    const patch = await discoverSourcesForMatch(match, existing, cctvCatalog);

    if (Object.keys(patch).length === 0) {
      result.failed.push(match.matchNumber);
      continue;
    }

    store = mergeReplaySources(store, match.matchNumber, patch);

    if (isSourceComplete(store[match.matchNumber])) {
      result.discovered.push(match.matchNumber);
    } else {
      result.skipped.push(match.matchNumber);
    }
  }

  if (
    result.discovered.length > 0 ||
    result.skipped.length > 0 ||
    catalogResult.applied.length > 0 ||
    sanitizeResult.removed.length > 0
  ) {
    writeReplaySourcesSync(store);
  }

  return result;
}

/**
 * Bulk variant of discoverReplayLinks — processes ALL pending matches with no
 * cap, using parallel batches. Intended for local bootstrap runs only.
 * Writes the store to disk after each batch so progress is never lost.
 */
export async function discoverAllReplayLinks(
  now = new Date(),
  batchSize = 8,
): Promise<DiscoverResult> {
  let store = readReplaySourcesSync();

  const sanitizeResult = await sanitizeInvalidCctvInStore(store);
  store = sanitizeResult.store;

  const cctvCatalog = await buildCctvCatalog();

  const catalogResult = applyCctvCatalog(cctvCatalog, store, now);
  store = catalogResult.store;

  const result: DiscoverResult = {
    discovered: [],
    skipped: [],
    failed: [],
    catalogApplied: catalogResult.applied,
    invalidCctvRemoved: sanitizeResult.removed,
  };

  if (sanitizeResult.removed.length > 0 || catalogResult.applied.length > 0) {
    writeReplaySourcesSync(store);
  }

  const pending = matchesNeedingDiscovery(now, store);
  if (pending.length === 0) return result;

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);

    const batchPatches = await Promise.all(
      batch.map((match) =>
        discoverSourcesForMatch(match, store[match.matchNumber], cctvCatalog),
      ),
    );

    for (let j = 0; j < batch.length; j++) {
      const match = batch[j];
      const patch = batchPatches[j];

      if (Object.keys(patch).length === 0) {
        result.failed.push(match.matchNumber);
        continue;
      }

      store = mergeReplaySources(store, match.matchNumber, patch);

      if (isSourceComplete(store[match.matchNumber])) {
        result.discovered.push(match.matchNumber);
      } else {
        result.skipped.push(match.matchNumber);
      }
    }

    writeReplaySourcesSync(store);
  }

  return result;
}

export function getReplaySourcesForApi(): ReplaySourcesStore {
  return readReplaySourcesSync();
}
