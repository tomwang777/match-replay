"use client";

import { HostNationsStrip } from "@/components/icons/HostNationsStrip";
import { Wc26Mark } from "@/components/icons/Wc26Mark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { useLang } from "@/components/LangContext";

export function SiteHeader() {
  const { t } = useLang();

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <HostNationsStrip className="h-0.5" />
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Wc26Mark />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold uppercase tracking-wide text-foreground">
              MatchReplay
            </p>
            <p className="truncate text-xs text-muted">
              <span className="text-wc-gold">WC 2026</span>
              <span className="mx-1.5 text-border">·</span>
              {t.siteSubtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
