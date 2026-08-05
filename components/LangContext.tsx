"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CompetitionCategory } from "@/lib/daily-matches";

export type Lang = "en" | "zh";

type Translations = {
  // SiteHeader
  siteSubtitle: string;
  // Hero
  heroOrg: string;
  heroTagline: string;
  heroTitle: string;
  heroDesc: string;
  heroCities: string;
  heroTeams: string;
  heroSpoilerFree: string;
  // Header section nav
  navWorldCup: string;
  navToday: string;
  // MatchList tabs
  tabActive: string;
  tabFinished: string;
  // Usage hint shown above the match list
  usageHint: string;
  // Daily matches section
  dailyTitle: string;
  dailyHint: string;
  dailyEmpty: string;
  dailyCategoryLabel: Record<CompetitionCategory, string>;
  dailyFilterAllCompetitions: string;
  statusLive: string;
  statusUpcoming: string;
  statusFinished: string;
  // Filters
  filterAll: string;
  filterGroupStage: string;
  filterAllGroups: string;
  filterTeamLabel: string;
  filterAllTeams: string;
  filterClear: string;
  sortNewest: string;
  sortOldest: string;
  sortToggleTitle: string;
  // Empty states
  emptyActive: string;
  emptyFinished: string;
  // MatchCard
  matchLabel: (n: number) => string;
  watchReplay: string;
  replayComingSoon: string;
  replayAfterMatch: string;
  // Stage labels (filter pills + card badge)
  stageLabel: Record<string, string>;
  // Footer
  footerText: string;
  // Donation
  donateHeading: string;
  donateDesc: string;
  donateQrLabel: string;
  donateScanHint: string;
  // Lang toggle
  langToggle: string;
};

const EN: Translations = {
  siteSubtitle: "Spoiler-free replays",
  heroOrg: "FIFA World Cup",
  heroTagline: "We Are 26",
  heroTitle: "Match Replays",
  heroDesc:
    "Every match of the 2026 World Cup, June 11–July 19. We never show scores or spoiler thumbnails — just open a match, pick a link, and watch the full replay as if it were live.",
  heroCities: "16 cities",
  heroTeams: "48 teams",
  heroSpoilerFree: "Spoiler-free",
  navWorldCup: "World Cup",
  navToday: "Today's Matches",
  tabActive: "Upcoming & Live",
  tabFinished: "Finished",
  usageHint:
    "How it works: each match shows only the teams and kickoff time — never the score. Open one and tap a link (CCTV, Migu, or YouTube) to watch the replay.",
  dailyTitle: "Today's Matches",
  dailyHint:
    "The latest results from leagues in season — still spoiler-free, with no scores shown. Pick a link to watch the replay.",
  dailyEmpty: "No matches scheduled for today.",
  dailyCategoryLabel: {
    league: "Leagues",
    continental: "Continental",
    cup: "Domestic Cups",
    "national-team": "National Teams",
    friendly: "Friendlies",
  },
  dailyFilterAllCompetitions: "All Competitions",
  statusLive: "Live",
  statusUpcoming: "Upcoming",
  statusFinished: "Full-time",
  filterAll: "All",
  filterGroupStage: "Group Stage",
  filterAllGroups: "All Groups",
  filterTeamLabel: "Team",
  filterAllTeams: "All Teams",
  filterClear: "Clear",
  sortNewest: "↓ Newest first",
  sortOldest: "↑ Oldest first",
  sortToggleTitle: "Toggle sort order",
  emptyActive: "No upcoming matches right now.",
  emptyFinished: "No matches found.",
  matchLabel: (n) => `World Cup Match #${n}`,
  watchReplay: "Watch Replay",
  replayComingSoon: "Replay link coming soon",
  replayAfterMatch: "Replay links available after the match",
  stageLabel: {
    "Group Stage": "Group Stage",
    "Round of 32": "Round of 32",
    "Round of 16": "Round of 16",
    "Quarter-final": "Quarter-final",
    "Semi-final": "Semi-final",
    "Third-place play-off": "3rd Place",
    Final: "Final",
  },
  footerText:
    "Made by a fan, for fans — no scores, no spoilers. Not affiliated with FIFA or any broadcaster; all replays are hosted on the linked platforms.",
  donateHeading: "Support this project",
  donateDesc: "Keeping replays spoiler-free takes time. If this saved your weekend, your support means a lot.",
  donateQrLabel: "WeChat Pay",
  donateScanHint: "Buy me a coffee ☕",
  langToggle: "中文",
};

const ZH: Translations = {
  siteSubtitle: "无剧透回放",
  heroOrg: "FIFA 世界杯",
  heroTagline: "We Are 26",
  heroTitle: "赛事回放",
  heroDesc:
    "2026世界杯全部比赛，6月11日至7月19日。绝不显示比分，也没有剧透缩略图——打开比赛，选一个链接，如临现场般观看完整回放。",
  heroCities: "16座城市",
  heroTeams: "48支球队",
  heroSpoilerFree: "无剧透",
  navWorldCup: "世界杯",
  navToday: "今日比赛",
  tabActive: "即将 / 进行中",
  tabFinished: "已完赛",
  usageHint:
    "使用方法：每场比赛只显示球队和开赛时间，绝不显示比分。打开比赛，点击任意链接（央视 / 咪咕 / YouTube）即可观看回放。",
  dailyTitle: "今日比赛",
  dailyHint:
    "当季各大联赛的最新赛果——同样无剧透，不显示比分。点击任意链接即可观看回放。",
  dailyEmpty: "今天暂无比赛安排。",
  dailyCategoryLabel: {
    league: "联赛",
    continental: "洲际赛事",
    cup: "国内杯赛",
    "national-team": "国家队赛事",
    friendly: "友谊赛",
  },
  dailyFilterAllCompetitions: "所有赛事",
  statusLive: "进行中",
  statusUpcoming: "即将开始",
  statusFinished: "已结束",
  filterAll: "全部",
  filterGroupStage: "小组赛",
  filterAllGroups: "所有小组",
  filterTeamLabel: "球队",
  filterAllTeams: "所有球队",
  filterClear: "清除",
  sortNewest: "↓ 最新优先",
  sortOldest: "↑ 最早优先",
  sortToggleTitle: "切换排序",
  emptyActive: "暂无即将进行的比赛。",
  emptyFinished: "未找到比赛。",
  matchLabel: (n) => `世界杯第 ${n} 场`,
  watchReplay: "观看回放",
  replayComingSoon: "回放链接即将上线",
  replayAfterMatch: "比赛结束后提供回放链接",
  stageLabel: {
    "Group Stage": "小组赛",
    "Round of 32": "1/16决赛",
    "Round of 16": "1/8决赛",
    "Quarter-final": "1/4决赛",
    "Semi-final": "半决赛",
    "Third-place play-off": "季军赛",
    Final: "决赛",
  },
  footerText:
    "球迷为球迷制作 —— 无比分，无剧透。本站与国际足联及各转播方无隶属关系，回放均托管于所链接的平台。",
  donateHeading: "支持本项目",
  donateDesc: "维护无剧透回放需要付出时间和精力。如果这个网站帮到了你，欢迎扫码支持 🙏",
  donateQrLabel: "微信支付",
  donateScanHint: "助力我去看下一届世界杯 💪",
  langToggle: "English",
};

export const TRANSLATIONS: Record<Lang, Translations> = { en: EN, zh: ZH };

type LangContextValue = {
  lang: Lang;
  t: Translations;
  toggle: () => void;
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  t: EN,
  toggle: () => {},
});

// Language preference lives in localStorage. useSyncExternalStore reads it
// without a setState-in-effect and keeps every subscriber in sync on toggle.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getLangSnapshot(): Lang {
  return localStorage.getItem("lang") === "zh" ? "zh" : "en";
}

function getServerLangSnapshot(): Lang {
  return "en";
}

function persistLang(lang: Lang) {
  localStorage.setItem("lang", lang);
  for (const listener of listeners) listener();
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(
    subscribe,
    getLangSnapshot,
    getServerLangSnapshot,
  );

  function toggle() {
    persistLang(lang === "en" ? "zh" : "en");
  }

  return (
    <LangContext.Provider value={{ lang, t: TRANSLATIONS[lang], toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
