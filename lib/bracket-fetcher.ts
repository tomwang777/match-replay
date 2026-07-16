import type { Match } from "@/lib/matches";
import { getMatchStatus } from "@/lib/matches";
import type { BracketResults } from "@/lib/bracket-types";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

/**
 * Maps our canonical team names to the display names ESPN uses where they differ.
 * Only needed for teams that could appear in QF or later rounds.
 */
const ESPN_ALIASES: Record<string, string> = {
  "United States": "United States",
  Türkiye: "Turkey",
  "Korea Republic": "South Korea",
  "Ivory Coast": "Côte d'Ivoire",
  "DR Congo": "Congo DR",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
};

function namesMatch(espn: string, ours: string): boolean {
  const e = espn.toLowerCase();
  const o = ours.toLowerCase();
  const alias = (ESPN_ALIASES[ours] ?? "").toLowerCase();
  return e === o || e.includes(o) || o.includes(e) || (alias.length > 0 && e === alias);
}

/** Maps an ESPN display name back to our canonical fixture name. */
function canonicalize(espnName: string): string {
  const entry = Object.entries(ESPN_ALIASES).find(
    ([, v]) => v.toLowerCase() === espnName.toLowerCase(),
  );
  return entry ? entry[0] : espnName;
}

type EspnCompetitor = {
  winner: boolean;
  team: { displayName: string };
};

type EspnEvent = {
  competitions: Array<{
    status: { type: { completed: boolean } };
    competitors: [EspnCompetitor, EspnCompetitor];
  }>;
};

async function fetchEspnEvents(date: string): Promise<EspnEvent[]> {
  try {
    const res = await fetch(
      `${ESPN_SCOREBOARD}?dates=${date.replace(/-/g, "")}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: EspnEvent[] };
    return data.events ?? [];
  } catch {
    return [];
  }
}

/**
 * Checks each finished knockout match (QF onwards) that has real team names
 * and isn't yet recorded, then fetches the result from ESPN. Returns an
 * updated BracketResults — same object reference if nothing changed.
 */
export async function updateBracketResults(
  resolvedMatches: Match[],
  stored: BracketResults,
): Promise<BracketResults> {
  const now = new Date();

  // Only consider QF and beyond (matches 97+), finished, with real team names, not yet stored
  const toCheck = resolvedMatches.filter(
    (m) =>
      m.matchNumber >= 97 &&
      getMatchStatus(m, now) === "finished" &&
      !m.homeTeam.includes("Winner") &&
      !m.homeTeam.includes("Loser") &&
      !m.awayTeam.includes("Winner") &&
      !m.awayTeam.includes("Loser") &&
      !stored[m.matchNumber],
  );

  if (toCheck.length === 0) return stored;

  // Group by kickoff date so we only call ESPN once per date
  const byDate = new Map<string, Match[]>();
  for (const m of toCheck) {
    const date = m.kickoffAt.slice(0, 10);
    const arr = byDate.get(date) ?? [];
    arr.push(m);
    byDate.set(date, arr);
  }

  let changed = false;
  const updated = { ...stored };

  for (const [date, matches] of byDate) {
    const events = await fetchEspnEvents(date);

    for (const m of matches) {
      for (const event of events) {
        const comp = event.competitions[0];
        if (!comp?.status.type.completed) continue;

        const [c1, c2] = comp.competitors;
        if (!c1 || !c2) continue;

        const n1 = c1.team.displayName;
        const n2 = c2.team.displayName;

        if (!namesMatch(n1, m.homeTeam) && !namesMatch(n2, m.homeTeam)) continue;
        if (!namesMatch(n1, m.awayTeam) && !namesMatch(n2, m.awayTeam)) continue;

        const winnerEspn = c1.winner ? n1 : n2;
        const loserEspn = c1.winner ? n2 : n1;

        updated[m.matchNumber] = {
          winner: canonicalize(winnerEspn),
          loser: canonicalize(loserEspn),
        };
        changed = true;
        break;
      }
    }
  }

  return changed ? updated : stored;
}
