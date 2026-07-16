import { TEAM_FLAGS } from "@/lib/team-flags";
import type { Match } from "@/lib/matches";
import type { BracketResults } from "@/lib/bracket-types";

/**
 * Resolves a placeholder like "Match 97 Winner" or "Match 101 Loser" to the
 * real team name using stored bracket results. Returns the original string if
 * the match hasn't been played yet or the result isn't stored.
 */
export function resolveTeam(name: string, results: BracketResults): string {
  const m = name.match(/^Match (\d+) (Winner|Loser)$/);
  if (!m) return name;
  const entry = results[parseInt(m[1])];
  if (!entry) return name;
  return m[2] === "Winner" ? entry.winner : entry.loser;
}

/**
 * Returns a new match array where all "Match X Winner/Loser" placeholders in
 * homeTeam/awayTeam are replaced with real team names from bracket results.
 * Unresolved placeholders are left as-is.
 */
export function applyBracketToMatches(
  matches: Match[],
  results: BracketResults,
): Match[] {
  if (Object.keys(results).length === 0) return matches;
  return matches.map((match) => {
    const homeTeam = resolveTeam(match.homeTeam, results);
    const awayTeam = resolveTeam(match.awayTeam, results);
    if (homeTeam === match.homeTeam && awayTeam === match.awayTeam) return match;
    return {
      ...match,
      homeTeam,
      homeFlag: TEAM_FLAGS[homeTeam] ?? "",
      awayTeam,
      awayFlag: TEAM_FLAGS[awayTeam] ?? "",
    };
  });
}
