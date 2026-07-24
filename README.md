# MatchReplay

A **spoiler-free** replay directory for the FIFA World Cup 2026. It lists every
match with just the teams and kickoff time — **never a score or a spoiler
thumbnail** — and links out to full replays / highlights on CCTV, Migu, and
YouTube, so you can watch as if it were live.

- 104 fixtures (Jun 11 – Jul 19, 2026), grouped into **Upcoming & Live** and **Finished**
- Filter finished matches by stage, group, and team
- English / 中文 and light / dark, remembered per browser
- No scores, no result thumbnails

## How it's built

The deployed site is **fully static**. All match data lives in committed JSON:

- [`data/replay-sources.json`](data/replay-sources.json) — replay links per match number
- [`data/bracket-results.json`](data/bracket-results.json) — knockout winners/losers, used to
  resolve bracket placeholders (e.g. "Match 97 Winner") into real team names

[`app/page.tsx`](app/page.tsx) imports these at build time and renders the page as
static HTML. There is **no cron, no runtime database, and no writable filesystem
requirement** in production.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Refreshing replay links (local only)

Replay links are discovered by a local bootstrap tool that scrapes CCTV / Migu /
YouTube. It is **development-only** — the endpoint returns 404 in production.

```bash
npm run dev      # terminal 1
npm run populate # terminal 2 — writes data/replay-sources.json
```

Then commit the updated `data/*.json` and redeploy. Optional: set
`YOUTUBE_API_KEY` in `.env.local` to improve YouTube results (see `.env.example`).

## Deploying to Vercel

Because the site is static, deployment needs no configuration:

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new) and deploy — no environment
   variables or cron setup required.

To publish new replay links later, run `npm run populate` locally, commit the
changed `data/*.json`, and push.
