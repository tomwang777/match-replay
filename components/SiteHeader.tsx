"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HostNationsStrip } from "@/components/icons/HostNationsStrip";
import { Wc26Mark } from "@/components/icons/Wc26Mark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { useLang } from "@/components/LangContext";

export function SiteHeader() {
  const { t } = useLang();
  const pathname = usePathname();

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
            <p className="truncate text-xs text-muted">{t.siteSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pb-2.5 sm:px-6"
      >
        <NavTab href="/" active={pathname === "/"}>
          {t.navWorldCup}
        </NavTab>
        <NavTab href="/daily" active={pathname === "/daily"}>
          {t.navToday}
        </NavTab>
      </nav>
    </header>
  );
}

function NavTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-wc-gold/20 text-wc-gold"
          : "border border-border bg-surface-elevated text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
