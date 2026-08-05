"use client";

import { useMemo, useState } from "react";
import { DailyMatchCard } from "@/components/DailyMatchCard";
import { useLang } from "@/components/LangContext";
import {
  COMPETITION_CATEGORIES,
  TRACKED_COMPETITIONS,
  type CompetitionCategory,
  type DailyMatch,
} from "@/lib/daily-matches";

type DailyMatchListProps = {
  /** Pre-sorted (live, then upcoming, then most-recently-finished) by the fetcher. */
  matches: DailyMatch[];
};

type CategoryFilter = "All" | CompetitionCategory;

export function DailyMatchList({ matches }: DailyMatchListProps) {
  const { t, lang } = useLang();
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [competition, setCompetition] = useState<string>("All");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const byCategory = useMemo(
    () => (category === "All" ? matches : matches.filter((m) => m.category === category)),
    [matches, category],
  );

  // Every tracked competition in the current category — not just ones with
  // matches today — so e.g. the Premier League and Champions League still
  // show as selectable tabs during the summer break, ready for when their
  // season starts, instead of only appearing once matches exist.
  const availableCompetitions = useMemo(
    () =>
      TRACKED_COMPETITIONS.filter((c) => category === "All" || c.category === category).map(
        (c) => [c.label, c.labelZh] as const,
      ),
    [category],
  );

  const filtered = useMemo(
    () =>
      competition === "All"
        ? byCategory
        : byCategory.filter((m) => m.competition === competition),
    [byCategory, competition],
  );

  // Group the filtered matches into per-competition sections, in the order
  // competitions first appear (already recency-sorted).
  const groups = useMemo(() => {
    const order: string[] = [];
    const byCompetition = new Map<string, { zh: string; matches: DailyMatch[] }>();
    for (const m of filtered) {
      let group = byCompetition.get(m.competition);
      if (!group) {
        group = { zh: m.competitionZh, matches: [] };
        byCompetition.set(m.competition, group);
        order.push(m.competition);
      }
      group.matches.push(m);
    }
    return order.map((en) => ({ en, ...byCompetition.get(en)! }));
  }, [filtered]);

  function categoryLabel(c: CategoryFilter): string {
    if (c === "All") return t.filterAll;
    return t.dailyCategoryLabel[c];
  }

  function selectCategory(c: CategoryFilter) {
    setCategory(c);
    setCompetition("All");
  }

  function toggleFold(competitionEn: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(competitionEn)) next.delete(competitionEn);
      else next.add(competitionEn);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl">
          {t.dailyTitle}
        </h1>
        <p className="mt-4 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm leading-relaxed text-muted">
          {t.dailyHint}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Competition category"
        className="mb-2.5 flex flex-wrap gap-1.5"
      >
        {(["All", ...COMPETITION_CATEGORIES] as CategoryFilter[]).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => selectCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === c
                ? "bg-wc-gold/20 text-wc-gold"
                : "border border-border bg-surface-elevated text-muted hover:text-foreground"
            }`}
          >
            {categoryLabel(c)}
          </button>
        ))}
      </div>

      {/* Per-competition sub-filter — every tracked competition in this category, not just ones with matches today */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <FilterPill active={competition === "All"} onClick={() => setCompetition("All")}>
          {t.dailyFilterAllCompetitions}
        </FilterPill>
        {availableCompetitions.map(([en, zh]) => (
          <FilterPill key={en} active={competition === en} onClick={() => setCompetition(en)}>
            {lang === "zh" ? zh : en}
          </FilterPill>
        ))}
      </div>

      {groups.length > 0 ? (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.en);
            return (
              <div key={group.en}>
                <button
                  type="button"
                  onClick={() => toggleFold(group.en)}
                  aria-expanded={!isCollapsed}
                  className="mb-3 flex w-full items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3.5 py-2 text-left transition-colors hover:border-accent/30"
                >
                  <ChevronIcon collapsed={isCollapsed} />
                  <span className="flex-1 truncate text-sm font-semibold text-foreground">
                    {lang === "zh" ? group.zh : group.en}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums text-muted">
                    {group.matches.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <ul className="flex flex-col gap-5">
                    {group.matches.map((match) => (
                      <li key={match.id}>
                        <DailyMatchCard match={match} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-surface-elevated px-6 py-10 text-center text-sm text-muted">
          {t.dailyEmpty}
        </p>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-wc-gold/20 text-wc-gold"
          : "border border-border bg-surface-elevated text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-muted transition-transform ${collapsed ? "-rotate-90" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
