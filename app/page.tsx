import { MatchList } from "@/components/MatchList";
import { SiteHeader } from "@/components/SiteHeader";
import { Wc26Hero } from "@/components/Wc26Hero";
import { PageFooter } from "@/components/PageFooter";

export default function Home() {
  return (
    <div className="min-h-full bg-surface">
      <SiteHeader />
      <Wc26Hero />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <MatchList />

        <PageFooter />
      </main>
    </div>
  );
}
