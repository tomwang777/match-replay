import fs from "fs";
import path from "path";
import type { BracketResults } from "@/lib/bracket-types";

const DATA_PATH = path.join(process.cwd(), "data", "bracket-results.json");

export function readBracketResults(): BracketResults {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as BracketResults;
  } catch {
    return {};
  }
}

export function writeBracketResults(results: BracketResults): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(results, null, 2));
}
