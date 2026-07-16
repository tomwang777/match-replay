import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { ReplaySourcesStore } from "@/lib/replay-store-types";
import type { MatchReplaySources } from "@/lib/replay-sources";
import {
  isMissingCctv,
  isSourceComplete,
  needsReplayDiscovery,
} from "@/lib/replay-helpers";

const DATA_DIR = join(process.cwd(), "data");
const DATA_PATH = join(DATA_DIR, "replay-sources.json");

function parseStore(raw: string): ReplaySourcesStore {
  const parsed = JSON.parse(raw) as Record<string, Partial<MatchReplaySources>>;
  const store: ReplaySourcesStore = {};

  for (const [key, value] of Object.entries(parsed)) {
    const matchNumber = Number(key);
    if (!Number.isNaN(matchNumber) && value) {
      store[matchNumber] = value;
    }
  }

  return store;
}

export function readReplaySourcesSync(): ReplaySourcesStore {
  try {
    return parseStore(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function writeReplaySourcesSync(store: ReplaySourcesStore): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const serialized: Record<string, Partial<MatchReplaySources>> = {};
  for (const [matchNumber, sources] of Object.entries(store)) {
    serialized[String(matchNumber)] = sources;
  }

  writeFileSync(DATA_PATH, `${JSON.stringify(serialized, null, 2)}\n`);
}

export function mergeReplaySources(
  store: ReplaySourcesStore,
  matchNumber: number,
  patch: Partial<MatchReplaySources>,
): ReplaySourcesStore {
  const existing = store[matchNumber] ?? {};
  const merged = { ...existing, ...patch };

  if (
    merged.cctv === existing.cctv &&
    merged.migu === existing.migu &&
    merged.youtube === existing.youtube
  ) {
    return store;
  }

  return { ...store, [matchNumber]: merged };
}

export function clearReplaySource(
  store: ReplaySourcesStore,
  matchNumber: number,
  key: keyof MatchReplaySources,
): ReplaySourcesStore {
  const existing = store[matchNumber];
  if (!existing?.[key]) return store;

  const next: Partial<MatchReplaySources> = { ...existing };
  delete next[key];

  if (Object.keys(next).length === 0) {
    const { [matchNumber]: _removed, ...rest } = store;
    return rest;
  }

  return { ...store, [matchNumber]: next };
}
