"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  // MatchList tabs
  tabActive: string;
  tabFinished: string;
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
    "All 104 matches from June 11–July 19, 2026 — official draw fixtures with no scores and no spoiler thumbnails. Pick a replay link and watch like it's live.",
  heroCities: "16 cities",
  heroTeams: "48 teams",
  heroSpoilerFree: "Spoiler-free",
  tabActive: "Upcoming & Live",
  tabFinished: "Finished",
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
  footerText: "Replay discovery agent — coming soon",
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
    "2026年6月11日至7月19日全部104场比赛——官方抽签赛程，无比分，无剧透缩略图。选择回放链接，如临现场般观赛。",
  heroCities: "16座城市",
  heroTeams: "48支球队",
  heroSpoilerFree: "无剧透",
  tabActive: "即将 / 进行中",
  tabFinished: "已完赛",
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
  footerText: "回放自动发现 — 即将上线",
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

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "en" || stored === "zh") setLang(stored);
  }, []);

  function toggle() {
    const next: Lang = lang === "en" ? "zh" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
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
