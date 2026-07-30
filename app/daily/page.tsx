import { SiteHeader } from "@/components/SiteHeader";
import { DailyMatchList } from "@/components/DailyMatchList";
import { PageFooter } from "@/components/PageFooter";
import { fetchTodaysMatches } from "@/lib/daily-fetcher";

// Refresh once a day. This is Next.js's built-in ISR (Incremental Static
// Regeneration): Vercel serves the cached page instantly and revalidates it
// in the background once a day, so there's no cron job, worker, or database
// to run — and it works the same on Vercel's free Hobby tier.
export const revalidate = 86400;

export default async function DailyPage() {
  const matches = await fetchTodaysMatches();

  return (
    <div className="min-h-full bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <DailyMatchList matches={matches} />

        <PageFooter />
      </main>
    </div>
  );
}
