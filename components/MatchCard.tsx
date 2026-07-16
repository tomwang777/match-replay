"use client";

import type { Match } from "@/lib/matches";
import { getMatchStatus } from "@/lib/matches";
import type { ReplaySourcesStore } from "@/lib/replay-store-types";
import { replaySourcesForMatch } from "@/lib/replay-sources";
import { useLang } from "@/components/LangContext";
import { teamNameCn } from "@/lib/team-names-cn";

type MatchCardProps = {
  match: Match;
  replayStore: ReplaySourcesStore;
};

export function MatchCard({ match, replayStore }: MatchCardProps) {
  const { t, lang } = useLang();
  const status = getMatchStatus(match);
  const replaysAvailable = status === "finished";
  const sources = replaySourcesForMatch(match.matchNumber, replayStore);

  const stageDisplay = t.stageLabel[match.stage] ?? match.stage;
  const displayName = (team: string) =>
    lang === "zh" ? teamNameCn(team) : team;

  return (
    <article className="group rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-accent/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-display text-xs font-medium uppercase tracking-wider text-wc-gold">
          {t.matchLabel(match.matchNumber)}
        </span>
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">
          {stageDisplay}
        </span>
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        <span className="inline-flex items-center gap-2">
          {displayName(match.homeTeam)} {match.homeFlag}
        </span>
        <span className="mx-2 font-normal text-muted">vs</span>
        <span className="inline-flex items-center gap-2">
          {displayName(match.awayTeam)} {match.awayFlag}
        </span>
      </h2>

      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <ClockIcon />
        {match.matchTime}
      </p>

      <div className="mt-5 border-t border-border pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          {t.watchReplay}
        </p>
        <div className="flex flex-wrap gap-2">
          {sources.map((source) =>
            source.url && replaysAvailable ? (
              <a
                key={source.label}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-wc-gold/15 px-3.5 py-2 text-sm font-medium text-wc-gold transition-colors hover:bg-wc-gold/25"
              >
                {source.label}
                <ExternalLinkIcon />
              </a>
            ) : (
              <span
                key={source.label}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-muted"
                title={
                  replaysAvailable
                    ? t.replayComingSoon
                    : t.replayAfterMatch
                }
              >
                {source.label}
              </span>
            ),
          )}
        </div>
      </div>
    </article>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
