import { worldCup2026Matches, type Match } from "@/lib/matches";
import { TEAM_NAMES_CN, teamNameCn } from "@/lib/team-names-cn";
import {
  extractGuidFromHtml,
  fetchCctvPageHtml,
  fetchCctvVideoMeta,
  isHighlightTitle,
  isFullMatchDuration,
  validateCctvReplayUrl,
} from "@/lib/cctv-validation";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 12_000;

const CN_TO_TEAM: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_NAMES_CN).map(([en, cn]) => [cn, en]),
);

// The main sports pages and football sub-section are accessible globally.
// Daily archive pages (sports.cctv.com/YYYY/MM/DD/index.shtml) are geo-blocked.
const STATIC_CATALOG_PAGES = [
  "https://sports.cctv.com/",
  "https://sports.cctv.com/football/index.shtml",
  "https://tv.cctv.com",
  "https://worldcup.cctv.com/2026/index.shtml",
  "https://worldcup.cctv.com/2026/videos/index.shtml",
];

// Match video pages on sports.cctv.com and tv.cctv.com (VIDE prefix on the newer domain)
const VIDEO_LINK_RE =
  /https?:\/\/(?:sports|tv)\.cctv\.com\/\d{4}\/\d{2}\/\d{2}\/VIDE?[^"\s<>]+?\.shtml/gi;

const RELATIVE_VIDEO_RE = /\d{4}\/\d{2}\/\d{2}\/VIDE?[^"\s<>]+?\.shtml/gi;

type CctvCatalog = Map<number, string>;

function decodeCctvHtml(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("gb18030").decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

function catalogPageUrls(_now = new Date()): string[] {
  // Daily archive pages (sports.cctv.com/YYYY/MM/DD/index.shtml) are geo-blocked
  // outside China. Only use the static pages that are globally accessible.
  return [...STATIC_CATALOG_PAGES];
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return "";
    const buffer = await response.arrayBuffer();
    return decodeCctvHtml(buffer);
  } catch {
    return "";
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractVideoUrls(html: string): string[] {
  const absolute = html.match(VIDEO_LINK_RE) ?? [];
  const relative = (html.match(RELATIVE_VIDEO_RE) ?? []).map(
    (path) => `https://sports.cctv.com/${path.replace(/\\/g, "")}`,
  );

  return [...new Set([...absolute, ...relative].map((url) => url.replace(/\\/g, "")))];
}

function parseCctvMatchTeams(title: string): [string, string] | null {
  if (!title.includes("世界杯")) return null;

  const vsMatch = title.match(/([^：:\[\s]+)VS([^：:\[\s]+)/i);
  if (!vsMatch) return null;

  return [vsMatch[1].trim(), vsMatch[2].trim()];
}

function matchNumberFromChineseTeams(homeCn: string, awayCn: string): number | null {
  const homeEn = CN_TO_TEAM[homeCn];
  const awayEn = CN_TO_TEAM[awayCn];
  if (!homeEn || !awayEn) return null;

  const fixture = worldCup2026Matches.find(
    (m) => m.homeTeam === homeEn && m.awayTeam === awayEn,
  );
  if (fixture) return fixture.matchNumber;

  const reversed = worldCup2026Matches.find(
    (m) => m.homeTeam === awayEn && m.awayTeam === homeEn,
  );
  return reversed?.matchNumber ?? null;
}

async function validateAndMapUrl(
  url: string,
  html: string,
): Promise<{ matchNumber: number; url: string } | null> {
  const validation = await validateCctvReplayUrl(url, html);
  if (!validation.valid || !validation.meta) return null;

  const teams = parseCctvMatchTeams(validation.meta.title);
  if (!teams) return null;

  const matchNumber = matchNumberFromChineseTeams(teams[0], teams[1]);
  if (matchNumber === null) return null;

  return { matchNumber, url };
}

/** Run up to `limit` async tasks concurrently from an array of items. */
async function concurrent<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/**
 * Scrape sports.cctv.com listings and map full-match replay pages to FIFA match numbers.
 * Catalog pages are fetched in parallel; video URL validation uses a concurrency pool.
 */
export async function buildCctvCatalog(now = new Date()): Promise<CctvCatalog> {
  const catalog: CctvCatalog = new Map();
  const videoUrls = new Set<string>();

  // Fetch all catalog listing pages in parallel
  const pageUrls = catalogPageUrls(now);
  const pageHtmls = await Promise.allSettled(pageUrls.map((u) => fetchHtml(u)));

  for (const result of pageHtmls) {
    if (result.status !== "fulfilled" || !result.value) continue;
    for (const url of extractVideoUrls(result.value)) {
      videoUrls.add(url);
    }
  }

  // Validate video URLs with controlled concurrency (avoid overwhelming CCTV servers)
  await concurrent([...videoUrls], 10, async (url) => {
    const html = await fetchHtml(url);
    if (!html) return;

    const mapped = await validateAndMapUrl(url, html);
    if (!mapped || catalog.has(mapped.matchNumber)) return;

    catalog.set(mapped.matchNumber, mapped.url);
  });

  return catalog;
}

export async function validateCctvUrl(url: string): Promise<boolean> {
  // Only remove a stored CCTV URL if we can positively confirm the page is gone
  // (non-200 HTTP status). Transient errors, rate-limits, or geo-blocks should not
  // cause removal since the discovery pipeline already pre-filters by duration and
  // team name when adding URLs.
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(12_000),
    });
    return res.ok;
  } catch {
    // Network error or timeout — don't remove (could be transient).
    return true;
  }
}

export function cctvSearchQueries(match: Match): string[] {
  const home = teamNameCn(match.homeTeam);
  const away = teamNameCn(match.awayTeam);

  return [
    `site:sports.cctv.com 世界杯 ${home}VS${away}`,
    `site:sports.cctv.com 世界杯 ${home} ${away}`,
    `site:sports.cctv.com ${home}VS${away} 世界杯`,
  ];
}
