#!/usr/bin/env node
/**
 * Local bootstrap script: fetches CCTV, Migu, and YouTube replay links for all
 * finished World Cup 2026 matches in one shot and writes them to
 * data/replay-sources.json. Run while the dev server is up:
 *   npm run dev      # in one terminal
 *   npm run populate # in another
 *
 * The /api/replays/populate endpoint is development-only, so this cannot run
 * against a production deploy. After populating, commit data/*.json and redeploy.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const headers = {
  "Content-Type": "application/json",
};

async function populate() {
  console.log(`Connecting to ${BASE}/api/replays/populate …`);
  console.log("This may take several minutes — the CCTV catalog covers all days since Jun 11.\n");

  const start = Date.now();

  let res;
  try {
    res = await fetch(`${BASE}/api/replays/populate`, { method: "POST", headers });
  } catch (err) {
    console.error("Failed to reach dev server. Is `npm run dev` running?");
    console.error(err.message);
    process.exit(1);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  const data = await res.json();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const { result, pending, remaining } = data;

  console.log(`Done in ${elapsed}s`);
  console.log(`  Matches with all 3 sources : ${result.discovered.length}`);
  console.log(`  Partial (some sources)     : ${result.skipped.length}`);
  console.log(`  No sources found           : ${result.failed.length}`);
  console.log(`  CCTV from catalog          : ${result.catalogApplied.length}`);
  console.log(`  Bad CCTV links removed     : ${result.invalidCctvRemoved.length}`);
  console.log(`  Started with pending       : ${pending}`);
  console.log(`  Still pending              : ${remaining}`);

  if (remaining > 0) {
    console.log("\nSome matches still need links. Re-run `npm run populate` to retry.");
  } else {
    console.log("\nAll finished matches have replay links!");
  }
  console.log("Commit data/*.json and redeploy to publish the changes.");
}

populate();
