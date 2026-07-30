/**
 * Shared types and presentation helpers for the "Today's Matches" section.
 * The actual data comes from lib/daily-fetcher.ts (live ESPN data, refreshed
 * daily). This module has no server-only dependencies so it can be imported
 * from the client card component too.
 */

export type DailyMatchStatus = "upcoming" | "live" | "finished";

/**
 * Broad grouping used by the competition filter tabs: domestic leagues,
 * continental club cups (UCL, Copa Libertadores, ...), major domestic cups
 * (FA Cup, Copa del Rey, ...), and national-team competitions (Euro, Copa
 * América, ...).
 */
export type CompetitionCategory = "league" | "continental" | "cup" | "national-team";

export type DailyReplayLink = {
  label: string;
  url: string;
};

export type DailyMatch = {
  id: string;
  competition: string;
  competitionZh: string;
  category: CompetitionCategory;
  homeTeam: string;
  /** Curated Chinese name, when the club is in lib/club-names-cn.ts. */
  homeTeamZh?: string;
  homeLogo: string;
  awayTeam: string;
  /** Curated Chinese name, when the club is in lib/club-names-cn.ts. */
  awayTeamZh?: string;
  awayLogo: string;
  /** Match day, ISO yyyy-mm-dd. */
  date: string;
  status: DailyMatchStatus;
  /** Spoiler-free replay links, present only once the match is finished. */
  replays: DailyReplayLink[];
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Formats an ISO date (yyyy-mm-dd) for display in the current language. */
export function formatMatchDate(iso: string, lang: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (lang === "zh") return `${year}年${month}月${day}日`;
  return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
}
