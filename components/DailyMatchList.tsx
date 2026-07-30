"use client";

import { DailyMatchCard } from "@/components/DailyMatchCard";
import { useLang } from "@/components/LangContext";
import type { DailyMatch } from "@/lib/daily-matches";

type DailyMatchListProps = {
  /** Pre-sorted (live, then upcoming, then most-recently-finished) by the fetcher. */
  matches: DailyMatch[];
};

export function DailyMatchList({ matches }: DailyMatchListProps) {
  const { t } = useLang();

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

      {matches.length > 0 ? (
        <ul className="flex flex-col gap-5">
          {matches.map((match) => (
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
