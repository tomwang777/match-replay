import {
  TRACKED_COMPETITIONS,
  type DailyMatch,
  type DailyMatchStatus,
  type DailyReplayLink,
  type TrackedCompetition,
} from "@/lib/daily-matches";
import { clubNameCn } from "@/lib/club-names-cn";
import { teamNameCn } from "@/lib/team-names-cn";

/**
 * Live fixtures for the "Today's Matches" section, pulled from ESPN's public
 * soccer scoreboard (same source as lib/bracket-fetcher.ts) for a trailing
 * few-day window (see trailingDateRange). The competitions polled come from
 * TRACKED_COMPETITIONS in lib/daily-matches.ts — that's also what
 * DailyMatchList reads to render the competition subtabs, so the two can't
 * drift out of sync.
 *
 * This runs inside a Next.js Server Component with `export const revalidate`
 * set on the page, so Next's Data Cache refreshes it automatically on a
 * schedule — no cron job, background worker, or database required.
 */

const REVALIDATE_SECONDS = 60 * 60 * 24; // 1 day

/**
 * Cap per competition. The UI groups matches by competition with a fold
 * toggle per section (see DailyMatchList), so a busy competition no longer
 * needs a tight cap to avoid crowding out the rest — this just bounds how
 * deep into a single competition's recent history one section can go.
 */
const MAX_PER_LEAGUE = 8;
/** Cap the combined list across all competitions, as a final safety valve. */
const MAX_TOTAL = 60;

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

/** Countries use the country dictionary; clubs use the club dictionary — driven by the competition's entity type, not its category. */
function displayNameCn(competition: TrackedCompetition, displayName: string): string | undefined {
  if (competition.entity === "country") {
    const cn = teamNameCn(displayName);
    return cn === displayName ? undefined : cn;
  }
  return clubNameCn(competition.code, displayName);
}

async function fetchLeagueMatches(competition: TrackedCompetition): Promise<DailyMatch[]> {
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

      // A team name is the one thing we can't render a fallback for; a
      // missing crest gets a generic placeholder instead (see ClubLogo) —
      // some clubs (e.g. newer/rebranded CSL sides) genuinely have no crest
      // asset in ESPN's data, and dropping the whole match would silently
      // hide a real, correctly-dated result.
      if (!home?.displayName || !away?.displayName) {
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
        homeLogo: home.logo ?? "",
        awayTeam: away.displayName,
        awayTeamZh: displayNameCn(competition, away.displayName),
        awayLogo: away.logo ?? "",
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
  const results = await Promise.allSettled(TRACKED_COMPETITIONS.map(fetchLeagueMatches));
  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  all.sort(compareMatches);

  return all.slice(0, MAX_TOTAL);
}
