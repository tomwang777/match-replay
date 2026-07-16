import { TEAM_FLAGS } from "@/lib/team-flags";
import { WC26_FIXTURES, type Wc26FixtureRow } from "@/lib/wc26-fixtures";

export type ReplayLink = {
  label: string;
  url: string;
};

export type MatchStatus = "upcoming" | "live" | "finished";

export type Match = {
  id: string;
  matchNumber: number;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  matchTime: string;
  kickoffAt: string;
  stage: string;
  venue: string;
  replays: ReplayLink[];
};

/** Typical match window: 90 min + halftime + stoppage/extra time. */
export const MATCH_DURATION_MS = 105 * 60 * 1000;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function flagFor(team: string): string {
  return TEAM_FLAGS[team] ?? "";
}

/** Kickoff in US Eastern (EDT in Jun–Jul 2026). */
function parseKickoffEt(date: string, timeEt: string): Date {
  return new Date(`${date}T${timeEt}:00-04:00`);
}

function formatKickoff(date: string, timeEt: string, venue: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = timeEt.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const min = minute.toString().padStart(2, "0");

  return `${MONTHS[month - 1]} ${day}, ${year} · ${hour12}:${min} ${period} ET · ${venue}`;
}

function fixtureToMatch(row: Wc26FixtureRow): Match {
  const [matchNumber, date, timeEt, homeTeam, awayTeam, stage, venue] = row;

  const kickoffAt = parseKickoffEt(date, timeEt);

  return {
    id: `wc26-${matchNumber.toString().padStart(3, "0")}`,
    matchNumber,
    homeTeam,
    homeFlag: flagFor(homeTeam),
    awayTeam,
    awayFlag: flagFor(awayTeam),
    matchTime: formatKickoff(date, timeEt, venue),
    kickoffAt: kickoffAt.toISOString(),
    stage,
    venue,
    replays: [],
  };
}

export function getMatchStatus(match: Match, now = new Date()): MatchStatus {
  const kickoffMs = new Date(match.kickoffAt).getTime();
  const nowMs = now.getTime();

  if (nowMs < kickoffMs) return "upcoming";
  if (nowMs < kickoffMs + MATCH_DURATION_MS) return "live";
  return "finished";
}

/**
 * Split matches into active (live + upcoming) and finished groups.
 * Active: live matches first, then upcoming by kickoff (next match at top).
 * Finished: chronological kickoff order (not FIFA match number).
 */
export function partitionMatches(
  matches: Match[],
  now = new Date(),
): { active: Match[]; finished: Match[] } {
  const active: Match[] = [];
  const finished: Match[] = [];

  for (const match of matches) {
    if (getMatchStatus(match, now) === "finished") {
      finished.push(match);
    } else {
      active.push(match);
    }
  }

  const live = active.filter((m) => getMatchStatus(m, now) === "live");
  const upcoming = active.filter((m) => getMatchStatus(m, now) === "upcoming");

  live.sort(
    (a, b) =>
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );
  upcoming.sort(
    (a, b) =>
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );

  finished.sort(
    (a, b) =>
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );

  return { active: [...live, ...upcoming], finished };
}

/** All 104 FIFA World Cup 2026 fixtures (Jun 11 – Jul 19, 2026). */
export const worldCup2026Matches: Match[] = WC26_FIXTURES.map(fixtureToMatch);
