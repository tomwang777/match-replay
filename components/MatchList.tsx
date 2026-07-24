"use client";

import { useMemo, useState } from "react";
import { MatchCard } from "@/components/MatchCard";
import { partitionMatches, type Match } from "@/lib/matches";
import type { ReplaySourcesStore } from "@/lib/replay-store-types";
import { useLang } from "@/components/LangContext";
import { teamNameCn } from "@/lib/team-names-cn";

const STAGES = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Third-place play-off",
  "Final",
] as const;

type StageFilter = "All" | "Group Stage" | (typeof STAGES)[number];

type Tab = "active" | "finished";

type MatchListProps = {
  /** Matches with knockout placeholders already resolved to real team names. */
  matches: Match[];
  /** Replay links keyed by FIFA match number. */
  replayStore: ReplaySourcesStore;
};

export function MatchList({ matches, replayStore }: MatchListProps) {
  const { t, lang } = useLang();

  const partition = useMemo(() => partitionMatches(matches), [matches]);

  // Land on the tab that has content: "Finished" once the tournament is over.
  const [tab, setTab] = useState<Tab>(
    partition.active.length > 0 ? "active" : "finished",
  );

  // Filters (only applied to the finished tab)
  const [stageFilter, setStageFilter] = useState<StageFilter>("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");
  const [newestFirst, setNewestFirst] = useState(true);

  // Finished matches ordered by user preference
  const finishedOrdered = useMemo(
    () =>
      newestFirst
        ? [...partition.finished].reverse()
        : [...partition.finished],
    [partition.finished, newestFirst],
  );

  // Unique groups present in finished matches
  const finishedGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const m of partition.finished) {
      if (m.stage.startsWith("Group ")) groups.add(m.stage);
    }
    return Array.from(groups).sort();
  }, [partition.finished]);

  // Unique teams present in finished matches, sorted alphabetically
  const finishedTeams = useMemo(() => {
    const teams = new Set<string>();
    for (const m of partition.finished) {
      teams.add(m.homeTeam);
      teams.add(m.awayTeam);
    }
    return Array.from(teams).sort();
  }, [partition.finished]);

  // Apply filters to finished matches
  const filteredFinished = useMemo(() => {
    let list = finishedOrdered;

    if (stageFilter !== "All") {
      if (stageFilter === "Group Stage") {
        list = list.filter((m) => m.stage.startsWith("Group "));
        if (groupFilter !== "All") {
          list = list.filter((m) => m.stage === groupFilter);
        }
      } else {
        list = list.filter((m) => m.stage === stageFilter);
      }
    }

    if (teamFilter !== "All") {
      list = list.filter(
        (m) => m.homeTeam === teamFilter || m.awayTeam === teamFilter,
      );
    }

    return list;
  }, [finishedOrdered, stageFilter, groupFilter, teamFilter]);

  const displayMatches = tab === "active" ? partition.active : filteredFinished;

  // Returns the translated display label for a stage filter pill
  function stageFilterLabel(s: StageFilter): string {
    if (s === "All") return t.filterAll;
    if (s === "Group Stage") return t.filterGroupStage;
    return t.stageLabel[s] ?? s;
  }

  return (
    <div>
      {/* How-to hint for first-time visitors */}
      <p className="mb-4 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm leading-relaxed text-muted">
        {t.usageHint}
      </p>

      {/* Main tabs */}
      <div
        role="tablist"
        aria-label="Match filters"
        className="mb-4 flex gap-2 rounded-xl border border-border bg-surface-elevated p-1"
      >
        <TabButton
          id="tab-active"
          selected={tab === "active"}
          onClick={() => setTab("active")}
          count={partition.active.length}
        >
          {t.tabActive}
        </TabButton>
        <TabButton
          id="tab-finished"
          selected={tab === "finished"}
          onClick={() => setTab("finished")}
          count={partition.finished.length}
        >
          {t.tabFinished}
        </TabButton>
      </div>

      {/* Finished tab filters */}
      {tab === "finished" && (
        <div className="mb-5 flex flex-col gap-3">
          {/* Stage filter + sort toggle */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Group Stage", ...STAGES] as StageFilter[]).map((s) => (
              <FilterPill
                key={s}
                active={stageFilter === s}
                onClick={() => {
                  setStageFilter(s);
                  setGroupFilter("All");
                  setTeamFilter("All");
                }}
              >
                {stageFilterLabel(s)}
              </FilterPill>
            ))}
            <button
              type="button"
              onClick={() => setNewestFirst((v) => !v)}
              className="ml-auto flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
              title={t.sortToggleTitle}
            >
              {newestFirst ? t.sortNewest : t.sortOldest}
            </button>
          </div>

          {/* Group sub-filter */}
          {stageFilter === "Group Stage" && finishedGroups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <FilterPill
                active={groupFilter === "All"}
                onClick={() => setGroupFilter("All")}
              >
                {t.filterAllGroups}
              </FilterPill>
              {finishedGroups.map((g) => (
                <FilterPill
                  key={g}
                  active={groupFilter === g}
                  onClick={() => setGroupFilter(g)}
                >
                  {g}
                </FilterPill>
              ))}
            </div>
          )}

          {/* Team filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="team-filter"
              className="shrink-0 text-xs text-muted"
            >
              {t.filterTeamLabel}
            </label>
            <select
              id="team-filter"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-wc-gold/60"
            >
              <option value="All">{t.filterAllTeams}</option>
              {finishedTeams.map((team) => (
                <option key={team} value={team}>
                  {lang === "zh" ? teamNameCn(team) : team}
                </option>
              ))}
            </select>
            {teamFilter !== "All" && (
              <button
                type="button"
                onClick={() => setTeamFilter("All")}
                className="shrink-0 text-xs text-muted hover:text-foreground"
              >
                {t.filterClear}
              </button>
            )}
          </div>
        </div>
      )}

      {displayMatches.length > 0 ? (
        <ul className="flex flex-col gap-5" role="tabpanel">
          {displayMatches.map((match) => (
            <li key={match.id}>
              <MatchCard
                match={match}
                replayStore={replayStore}
                replaysAvailable={tab === "finished"}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-border bg-surface-elevated px-6 py-10 text-center text-sm text-muted">
          {tab === "active" ? t.emptyActive : t.emptyFinished}
        </p>
      )}
    </div>
  );
}

type TabButtonProps = {
  id: string;
  selected: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
};

function TabButton({ id, selected, onClick, count, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-wc-gold/15 text-wc-gold"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
          selected ? "bg-wc-gold/20 text-wc-gold" : "bg-surface text-muted"
        }`}
      >
        {count}
      </span>
    </button>
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
