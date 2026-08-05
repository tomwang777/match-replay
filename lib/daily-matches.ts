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
 * (FA Cup, Copa del Rey, ...), national-team competitions (Euro, Copa
 * América, ...), and friendlies (club or international, no official
 * stakes) — often the only action for big clubs/teams outside their
 * competitive windows, e.g. preseason.
 *
 * This is the single source of truth for what categories exist — the type
 * is derived from the array, not the other way round, so adding a new
 * category here (for a genuinely new kind of competition) automatically
 * flows through to the category filter tabs in DailyMatchList and the
 * `dailyCategoryLabel` translation record, both of which iterate/type-check
 * against this array/type rather than keeping their own separate list.
 */
export const COMPETITION_CATEGORIES = [
  "league",
  "continental",
  "cup",
  "national-team",
  "friendly",
] as const;

export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

export type TrackedCompetition = {
  /** ESPN's soccer competition slug, e.g. "eng.1" or "uefa.champions". */
  code: string;
  label: string;
  labelZh: string;
  category: CompetitionCategory;
  /** Whether ESPN's "team" objects here are clubs or national teams — controls which name dictionary to use. */
  entity: "club" | "country";
};

/**
 * Every competition the site tracks, in the order shown in the UI. This is
 * the single source of truth for two independent things: lib/daily-fetcher.ts
 * uses it to know what to poll from ESPN, and DailyMatchList uses it to
 * render a stable set of competition subtabs — including competitions with
 * zero matches right now (e.g. the "big five" European leagues and the UEFA
 * Champions League during their summer break). Without this, those tabs
 * would only appear once matches start, which looks like the site doesn't
 * track them at all.
 */
export const TRACKED_COMPETITIONS: TrackedCompetition[] = [
  // Domestic leagues
  { code: "eng.1", label: "Premier League", labelZh: "英格兰超级联赛", category: "league", entity: "club" },
  { code: "esp.1", label: "La Liga", labelZh: "西甲联赛", category: "league", entity: "club" },
  { code: "ger.1", label: "Bundesliga", labelZh: "德甲联赛", category: "league", entity: "club" },
  { code: "ita.1", label: "Serie A", labelZh: "意甲联赛", category: "league", entity: "club" },
  { code: "fra.1", label: "Ligue 1", labelZh: "法甲联赛", category: "league", entity: "club" },
  { code: "usa.1", label: "MLS", labelZh: "美国职业大联盟", category: "league", entity: "club" },
  { code: "mex.1", label: "Liga MX", labelZh: "墨西哥超级联赛", category: "league", entity: "club" },
  { code: "bra.1", label: "Brasileirão Série A", labelZh: "巴西甲级联赛", category: "league", entity: "club" },
  { code: "arg.1", label: "Liga Profesional (Argentina)", labelZh: "阿根廷甲级联赛", category: "league", entity: "club" },
  { code: "chn.1", label: "Chinese Super League", labelZh: "中国足球超级联赛", category: "league", entity: "club" },
  { code: "jpn.1", label: "J1 League", labelZh: "日职联", category: "league", entity: "club" },
  { code: "ksa.1", label: "Saudi Pro League", labelZh: "沙特职业联赛", category: "league", entity: "club" },

  // Continental club competitions
  { code: "uefa.champions", label: "UEFA Champions League", labelZh: "欧洲冠军联赛", category: "continental", entity: "club" },
  { code: "uefa.europa", label: "UEFA Europa League", labelZh: "欧洲联赛", category: "continental", entity: "club" },
  { code: "afc.champions", label: "AFC Champions League Elite", labelZh: "亚冠精英联赛", category: "continental", entity: "club" },
  { code: "afc.cup", label: "AFC Champions League Two", labelZh: "亚冠联赛精英二级", category: "continental", entity: "club" },
  { code: "caf.champions", label: "CAF Champions League", labelZh: "非洲冠军联赛", category: "continental", entity: "club" },
  { code: "concacaf.champions", label: "Concacaf Champions Cup", labelZh: "中北美洲冠军杯", category: "continental", entity: "club" },
  { code: "conmebol.libertadores", label: "Copa Libertadores", labelZh: "南美解放者杯", category: "continental", entity: "club" },
  { code: "conmebol.sudamericana", label: "Copa Sudamericana", labelZh: "南美杯", category: "continental", entity: "club" },

  // Major domestic cups
  { code: "eng.fa", label: "FA Cup", labelZh: "英格兰足总杯", category: "cup", entity: "club" },
  { code: "esp.copa_del_rey", label: "Copa del Rey", labelZh: "西班牙国王杯", category: "cup", entity: "club" },
  { code: "ger.dfb_pokal", label: "DFB-Pokal", labelZh: "德国杯", category: "cup", entity: "club" },
  { code: "ita.coppa_italia", label: "Coppa Italia", labelZh: "意大利杯", category: "cup", entity: "club" },
  { code: "fra.coupe_de_france", label: "Coupe de France", labelZh: "法国杯", category: "cup", entity: "club" },
  { code: "usa.open", label: "U.S. Open Cup", labelZh: "美国杯", category: "cup", entity: "club" },
  { code: "arg.copa", label: "Copa Argentina", labelZh: "阿根廷杯", category: "cup", entity: "club" },
  { code: "bra.copa_do_brazil", label: "Copa do Brasil", labelZh: "巴西杯", category: "cup", entity: "club" },
  { code: "mex.copa_mx", label: "Copa MX", labelZh: "墨西哥杯", category: "cup", entity: "club" },

  // National-team competitions
  { code: "uefa.euro", label: "UEFA European Championship", labelZh: "欧洲杯", category: "national-team", entity: "country" },
  { code: "uefa.nations", label: "UEFA Nations League", labelZh: "欧洲国家联赛", category: "national-team", entity: "country" },
  { code: "conmebol.america", label: "Copa América", labelZh: "美洲杯", category: "national-team", entity: "country" },
  { code: "caf.nations", label: "Africa Cup of Nations", labelZh: "非洲国家杯", category: "national-team", entity: "country" },
  { code: "afc.asian.cup", label: "AFC Asian Cup", labelZh: "亚洲杯", category: "national-team", entity: "country" },
  { code: "concacaf.gold", label: "Concacaf Gold Cup", labelZh: "中北美洲金杯赛", category: "national-team", entity: "country" },
  { code: "concacaf.nations.league", label: "Concacaf Nations League", labelZh: "中北美洲国家联赛", category: "national-team", entity: "country" },

  // Friendlies — no official stakes, but often the only action for big clubs
  // and national teams outside their competitive windows (e.g. preseason).
  { code: "club.friendly", label: "Club Friendly", labelZh: "俱乐部友谊赛", category: "friendly", entity: "club" },
  { code: "fifa.friendly", label: "International Friendly", labelZh: "国际友谊赛", category: "friendly", entity: "country" },
];

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
