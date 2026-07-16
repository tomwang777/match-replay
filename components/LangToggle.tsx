"use client";

import { useLang } from "@/components/LangContext";

export function LangToggle() {
  const { t, toggle } = useLang();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.langToggle}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface-elevated px-3 text-xs font-medium text-muted transition-colors hover:border-wc-gold/50 hover:text-wc-gold"
    >
      {t.langToggle}
    </button>
  );
}
