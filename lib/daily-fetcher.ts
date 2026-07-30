import type {
  DailyMatch,
  DailyMatchStatus,
  DailyReplayLink,
  CompetitionCategory,
} from "@/lib/daily-matches";
import { clubNameCn } from "@/lib/club-names-cn";
import { teamNameCn } from "@/lib/team-names-cn";

/**
 * Live fixtures for the "Today's Matches" section, pulled from ESPN's public
 * soccer scoreboard (same source as lib/bracket-fetcher.ts) for a trailing
 * few-day window (see trailingDateRange).
 *
 * This runs inside a Next.js Server Component with `export const revalidate`
 * set on the page, so Next's Data Cache refreshes it automatically on a
 * schedule — no cron job, background worker, or database required.
 */

const REVALIDATE_SECONDS = 60 * 60 * 24; // 1 day

type Competition = {
  code: string;
  label: string;
  labelZh: string;
  category: CompetitionCategory;
};

const LEAGUES: Competition[] = [
  // Domestic leagues
  { code: "eng.1", label: "Premier League", labelZh: "英格兰超级联赛", category: "league" },
  { code: "esp.1", label: "La Liga", labelZh: "西甲联赛", category: "league" },
  { code: "ger.1", label: "Bundesliga", labelZh: "德甲联赛", category: "league" },
  { code: "ita.1", label: "Serie A", labelZh: "意甲联赛", category: "league" },
  { code: "fra.1", label: "Ligue 1", labelZh: "法甲联赛", category: "league" },
  { code: "usa.1", label: "MLS", labelZh: "美国职业大联盟", category: "league" },
  { code: "mex.1", label: "Liga MX", labelZh: "墨西哥超级联赛", category: "league" },
  { code: "bra.1", label: "Brasileirão Série A", labelZh: "巴西甲级联赛", category: "league" },
  { code: "arg.1", label: "Liga Profesional (Argentina)", labelZh: "阿根廷甲级联赛", category: "league" },
  { code: "chn.1", label: "Chinese Super League", labelZh: "中国足球超级联赛", category: "league" },
  { code: "jpn.1", label: "J1 League", labelZh: "日职联", category: "league" },
  { code: "ksa.1", label: "Saudi Pro League", labelZh: "沙特职业联赛", category: "league" },

  // Continental club competitions
  { code: "uefa.champions", label: "UEFA Champions League", labelZh: "欧洲冠军联赛", category: "continental" },
  { code: "uefa.europa", label: "UEFA Europa League", labelZh: "欧洲联赛", category: "continental" },
  { code: "afc.champions", label: "AFC Champions League Elite", labelZh: "亚冠精英联赛", category: "continental" },
  { code: "afc.cup", label: "AFC Champions League Two", labelZh: "亚冠联赛精英二级", category: "continental" },
  { code: "caf.champions", label: "CAF Champions League", labelZh: "非洲冠军联赛", category: "continental" },
  { code: "concacaf.champions", label: "Concacaf Champions Cup", labelZh: "中北美洲冠军杯", category: "continental" },
  { code: "conmebol.libertadores", label: "Copa Libertadores", labelZh: "南美解放者杯", category: "continental" },
  { code: "conmebol.sudamericana", label: "Copa Sudamericana", labelZh: "南美杯", category: "continental" },

  // Major domestic cups
  { code: "eng.fa", label: "FA Cup", labelZh: "英格兰足总杯", category: "cup" },
  { code: "esp.copa_del_rey", label: "Copa del Rey", labelZh: "西班牙国王杯", category: "cup" },
  { code: "ger.dfb_pokal", label: "DFB-Pokal", labelZh: "德国杯", category: "cup" },
  { code: "ita.coppa_italia", label: "Coppa Italia", labelZh: "意大利杯", category: "cup" },
  { code: "fra.coupe_de_france", label: "Coupe de France", labelZh: "法国杯", category: "cup" },
  { code: "usa.open", label: "U.S. Open Cup", labelZh: "美国杯", category: "cup" },
  { code: "arg.copa", label: "Copa Argentina", labelZh: "阿根廷杯", category: "cup" },
  { code: "bra.copa_do_brazil", label: "Copa do Brasil", labelZh: "巴西杯", category: "cup" },
  { code: "mex.copa_mx", label: "Copa MX", labelZh: "墨西哥杯", category: "cup" },

  // National-team competitions
  { code: "uefa.euro", label: "UEFA European Championship", labelZh: "欧洲杯", category: "national-team" },
  { code: "uefa.nations", label: "UEFA Nations League", labelZh: "欧洲国家联赛", category: "national-team" },
  { code: "conmebol.america", label: "Copa América", labelZh: "美洲杯", category: "national-team" },
  { code: "caf.nations", label: "Africa Cup of Nations", labelZh: "非洲国家杯", category: "national-team" },
  { code: "afc.asian.cup", label: "AFC Asian Cup", labelZh: "亚洲杯", category: "national-team" },
  { code: "concacaf.gold", label: "Concacaf Gold Cup", labelZh: "中北美洲金杯赛", category: "national-team" },
  { code: "concacaf.nations.league", label: "Concacaf Nations League", labelZh: "中北美洲国家联赛", category: "national-team" },
];

/** Cap per competition so one busy league (e.g. a full MLS matchday) doesn't crowd out the rest. */
const MAX_PER_LEAGUE = 3;
/** Cap the combined list so the page stays a quick, scannable read. */
const MAX_TOTAL = 24;

/**
 * How many days to look back for recently-finished matches. Some leagues
 * (e.g. the Chinese Super League) play roughly weekly rather than every few
 * days like MLS, so a short window can miss their most recent round
 * entirely — 7 days comfortably covers a full round for every tracked
 * league while still ranking behind fresher results from the sort in
 * compareMatches.
 */
const LOOKBACK_DAYS = 7;

/**
 * Builds an explicit `dates=YYYYMMDD-YYYYMMDD` range covering the last few
 * days through today (UTC). ESPN's scoreboard endpoint, when called with no
 * `dates` param at all, sometimes jumps forward to a league's *next*
 * scheduled matchday when nothing is on today — which could be weeks away
 * for a league between rounds. An explicit trailing window keeps this page
 * anchored to "recent results", matching what "Today's Matches" promises.
 */
function trailingDateRange(daysBack = LOOKBACK_DAYS): string {
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - daysBack);

  return `${fmt(start)}-${fmt(end)}`;
}

// Finished/live matches are what this page is for (they have replay links);
// upcoming fixtures are shown only as filler when a league has nothing recent.
const STATUS_ORDER: Record<DailyMatchStatus, number> = {
  finished: 0,
  live: 1,
  upcoming: 2,
};

/** Most-recently-finished first; then live; then soonest upcoming. */
function compareMatches(a: DailyMatch, b: DailyMatch): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) return byStatus;
  return a.status === "finished"
    ? b.date.localeCompare(a.date) // most recent first
    : a.date.localeCompare(b.date); // soonest first
}

type EspnTeam = { displayName?: string; logo?: string };
type EspnCompetitor = { homeAway?: "home" | "away"; team?: EspnTeam };
type EspnEvent = {
  id?: string;
  date?: string;
  competitions?: Array<{
    status?: { type?: { state?: string; completed?: boolean } };
    competitors?: EspnCompetitor[];
  }>;
};

function statusFromEspn(state: string | undefined, completed: boolean): DailyMatchStatus {
  if (completed) return "finished";
  if (state === "in") return "live";
  return "upcoming";
}

function ytHighlights(query: string): DailyReplayLink {
  return {
    label: "YouTube Highlights",
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  };
}

function ytFullMatch(query: string): DailyReplayLink {
  return {
    label: "Full Match",
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  };
}

/** National-team competitions look up ESPN's "team" name (a country) in the country dictionary; everything else is a club. */
function displayNameCn(competition: Competition, displayName: string): string | undefined {
  if (competition.category === "national-team") {
    const cn = teamNameCn(displayName);
    return cn === displayName ? undefined : cn;
  }
  return clubNameCn(competition.code, displayName);
}

async function fetchLeagueMatches(competition: Competition): Promise<DailyMatch[]> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${competition.code}/scoreboard?dates=${trailingDateRange()}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8_000),
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { events?: EspnEvent[] };
    const matches: DailyMatch[] = [];

    for (const event of data.events ?? []) {
      const comp = event.competitions?.[0];
      const competitors = comp?.competitors ?? [];
      const home = competitors.find((c) => c.homeAway === "home")?.team;
      const away = competitors.find((c) => c.homeAway === "away")?.team;

      // Skip fixtures missing a name or crest — we show club/federation logos,
      // not generic placeholders, so a match without both crests can't render
      // consistently.
      if (!home?.displayName || !home.logo || !away?.displayName || !away.logo) {
        continue;
      }

      const status = statusFromEspn(
        comp?.status?.type?.state,
        Boolean(comp?.status?.type?.completed),
      );

      matches.push({
        id: event.id
          ? `${competition.code}-${event.id}`
          : `${competition.code}-${home.displayName}-${away.displayName}-${event.date}`,
        competition: competition.label,
        competitionZh: competition.labelZh,
        category: competition.category,
        homeTeam: home.displayName,
        homeTeamZh: displayNameCn(competition, home.displayName),
        homeLogo: home.logo,
        awayTeam: away.displayName,
        awayTeamZh: displayNameCn(competition, away.displayName),
        awayLogo: away.logo,
        date: (event.date ?? "").slice(0, 10),
        status,
        replays:
          status === "finished"
            ? [
                ytHighlights(`${home.displayName} ${away.displayName} highlights`),
                ytFullMatch(`${home.displayName} ${away.displayName} full match`),
              ]
            : [],
      });
    }

    // Within the date window, keep the most relevant fixtures for this
    // competition (live/recent/soonest) rather than an arbitrary
    // chronological prefix, since the window can span several days.
    matches.sort(compareMatches);
    return matches.slice(0, MAX_PER_LEAGUE);
  } catch {
    // Network error or timeout — this competition contributes nothing today.
    return [];
  }
}

/** Fetches today's matches across all tracked competitions, live-first then soonest, most-recent-finished last. */
export async function fetchTodaysMatches(): Promise<DailyMatch[]> {
  const results = await Promise.allSettled(LEAGUES.map(fetchLeagueMatches));
  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  all.sort(compareMatches);

  return all.slice(0, MAX_TOTAL);
}
