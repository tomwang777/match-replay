"use client";

import type { DailyMatch } from "@/lib/daily-matches";
import { formatMatchDate } from "@/lib/daily-matches";
import { useLang } from "@/components/LangContext";

type DailyMatchCardProps = {
  match: DailyMatch;
};

export function DailyMatchCard({ match }: DailyMatchCardProps) {
  const { t, lang } = useLang();
  const replaysAvailable = match.status === "finished";
  const competition = lang === "zh" ? match.competitionZh : match.competition;
  const homeTeam = lang === "zh" ? (match.homeTeamZh ?? match.homeTeam) : match.homeTeam;
  const awayTeam = lang === "zh" ? (match.awayTeamZh ?? match.awayTeam) : match.awayTeam;

  return (
    <article className="group rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-accent/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-display text-xs font-medium uppercase tracking-wider text-wc-gold">
          {competition}
        </span>
        <StatusBadge status={match.status} />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        <span className="inline-flex items-center gap-2">
          <ClubLogo src={match.homeLogo} alt={match.homeTeam} />
          {homeTeam}
        </span>
        <span className="mx-2 font-normal text-muted">vs</span>
        <span className="inline-flex items-center gap-2">
          <ClubLogo src={match.awayLogo} alt={match.awayTeam} />
          {awayTeam}
        </span>
      </h2>

      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <ClockIcon />
        {formatMatchDate(match.date, lang)}
      </p>

      <div className="mt-5 border-t border-border pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          {t.watchReplay}
        </p>
        {replaysAvailable && match.replays.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {match.replays.map((source) => (
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
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-muted">
            {t.replayAfterMatch}
          </span>
        )}
      </div>
    </article>
  );
}

function ClubLogo({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${alt} crest`}
      width={24}
      height={24}
      loading="lazy"
      className="h-6 w-6 shrink-0 object-contain"
    />
  );
}

function StatusBadge({ status }: { status: DailyMatch["status"] }) {
  const { t } = useLang();

  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
        {t.statusLive}
      </span>
    );
  }

  const label = status === "finished" ? t.statusFinished : t.statusUpcoming;
  return (
    <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">
      {label}
    </span>
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
