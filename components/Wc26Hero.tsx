"use client";

import { HostNationsStrip } from "@/components/icons/HostNationsStrip";
import { Wc26Logo } from "@/components/icons/Wc26Logo";
import { useLang } from "@/components/LangContext";

export function Wc26Hero() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden border-b border-border bg-wc-hero">
      <HostNationsStrip />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(90deg, var(--foreground) 1px, transparent 1px),
            linear-gradient(var(--foreground) 1px, transparent 1px)
          `,
          backgroundSize: "12px 12px",
        }}
      />
      <div
        className="pointer-events-none absolute -right-8 top-8 font-display text-[10rem] font-bold leading-none tracking-tighter text-wc-gold/10 sm:text-[14rem]"
        aria-hidden
      >
        26
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">
          <Wc26Logo size="xl" priority />

          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-wc-gold sm:text-sm">
              {t.heroOrg}
            </p>
            <p className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-tight text-foreground sm:text-5xl">
              2026
            </p>
            <p className="mt-2 text-sm font-medium uppercase tracking-widest">
              <span className="text-host-can">Canada</span>
              <span className="text-muted"> · </span>
              <span className="text-host-mex">Mexico</span>
              <span className="text-muted"> · </span>
              <span className="text-host-usa">United States</span>
            </p>
            <p className="mt-1 text-xs italic text-wc-gold/90">{t.heroTagline}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-wc-gold/25 pt-8">
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl">
            {t.heroTitle}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
            {t.heroDesc}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-wider text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/80 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-host-can" aria-hidden />
              {t.heroCities}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/80 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-wc-gold" aria-hidden />
              {t.heroTeams}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/80 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-host-mex" aria-hidden />
              {t.heroSpoilerFree}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
