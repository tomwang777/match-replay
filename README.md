# MatchReplay

A **spoiler-free** football replay directory. Every match shows just the
teams, crest/flag, and kickoff time — **never a score or a spoiler
thumbnail** — with links out to full replays / highlights, so you can watch
as if it were live.

The site has two sections:

- **World Cup** — all 104 fixtures of FIFA World Cup 2026 (Jun 11 – Jul 19,
  2026), grouped into **Upcoming & Live** and **Finished**, filterable by
  stage, group, and team. Replay links: CCTV, Migu, YouTube.
- **Today's Matches** — real, recently-finished results pulled live from 36
  competitions: 12 domestic leagues (Premier League, La Liga, Bundesliga,
  Serie A, Ligue 1, MLS, Liga MX, Brasileirão, Argentine Liga Profesional,
  Chinese Super League, J1 League, Saudi Pro League), 8 continental club
  cups (UEFA Champions League & Europa League, AFC Champions League Elite &
  Two, CAF Champions League, Concacaf Champions Cup, Copa Libertadores &
  Sudamericana), 9 major domestic cups (FA Cup, Copa del Rey, DFB-Pokal,
  Coppa Italia, Coupe de France, U.S. Open Cup, Copa Argentina, Copa do
  Brasil, Copa MX), and 7 national-team tournaments (UEFA Euro & Nations
  League, Copa América, Africa Cup of Nations, AFC Asian Cup, Concacaf Gold
  Cup & Nations League). Filterable by category (Leagues / Continental /
  Domestic Cups / National Teams).

Other features: English / 中文 (515 curated club names + 157 country names),
light / dark theme, both remembered per browser.

## How it's built

**World Cup** is fully static. All match data lives in committed JSON —
[`data/replay-sources.json`](data/replay-sources.json) (replay links per
match number) and [`data/bracket-results.json`](data/bracket-results.json)
(knockout winners/losers, used to resolve bracket placeholders like "Match 97
Winner" into real team names). [`app/page.tsx`](app/page.tsx) imports these at
build time and renders static HTML — no cron, database, or writable
filesystem needed in production.

**Today's Matches** is refreshed automatically once a day using Next.js's
built-in ISR (Incremental Static Regeneration — see `export const revalidate`
in [`app/daily/page.tsx`](app/daily/page.tsx)): Vercel serves the cached page
instantly and revalidates it in the background, so there's still no cron job,
worker, or database to run, and it works the same on Vercel's free Hobby
tier. Fixture data comes live from [ESPN's public soccer API](lib/daily-fetcher.ts).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Refreshing World Cup replay links (local only)

Replay links for the World Cup section are discovered by a local bootstrap
tool that scrapes CCTV / Migu / YouTube. It is **development-only** — the
endpoint returns 404 in production.

```bash
npm run dev      # terminal 1
npm run populate # terminal 2 — writes data/replay-sources.json
```

Then commit the updated `data/*.json` and redeploy. Optional: set
`YOUTUBE_API_KEY` in `.env.local` to improve YouTube results (see `.env.example`).

## Deploying to Vercel

No environment variables or cron setup required:

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new) and deploy.

To publish new World Cup replay links later, run `npm run populate` locally,
commit the changed `data/*.json`, and push. Today's Matches needs no manual
step — it refreshes itself daily.
