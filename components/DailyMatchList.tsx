"use client";

import { useMemo, useState } from "react";
import { DailyMatchCard } from "@/components/DailyMatchCard";
import { useLang } from "@/components/LangContext";
import type { CompetitionCategory, DailyMatch } from "@/lib/daily-matches";

type DailyMatchListProps = {
  /** Pre-sorted (live, then upcoming, then most-recently-finished) by the fetcher. */
  matches: DailyMatch[];
};

type CategoryFilter = "All" | CompetitionCategory;

const CATEGORIES: CompetitionCategory[] = ["league", "continental", "cup", "national-team"];

export function DailyMatchList({ matches }: DailyMatchListProps) {
  const { t } = useLang();
  const [category, setCategory] = useState<CategoryFilter>("All");

  const filtered = useMemo(
    () => (category === "All" ? matches : matches.filter((m) => m.category === category)),
    [matches, category],
  );

  // Only offer a category pill if that category actually has matches today.
  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => matches.some((m) => m.category === c)),
    [matches],
  );

  function categoryLabel(c: CategoryFilter): string {
    if (c === "All") return t.filterAll;
    return t.dailyCategoryLabel[c];
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

      {availableCategories.length > 1 && (
        <div
          role="tablist"
          aria-label="Competition category"
          className="mb-5 flex flex-wrap gap-1.5"
        >
          {(["All", ...availableCategories] as CategoryFilter[]).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
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
      )}

      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-5">
          {filtered.map((match) => (
            <li key={match.id}>
              <DailyMatchCard match={match} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-border bg-surface-elevated px-6 py-10 text-center text-sm text-muted">
          {t.dailyEmpty}
        </p>
      )}
    </div>
  );
}
