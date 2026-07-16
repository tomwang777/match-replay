"use client";

import { useLang } from "@/components/LangContext";

// Replace with your actual WeChat Pay QR code image URL or a local /public path
const WECHAT_QR_URL = "/wechat-qr.JPG";

export function PageFooter() {
  const { t } = useLang();

  return (
    <footer className="mt-14 border-t border-border pt-10">
      {/* Donation section */}
      <div className="mb-10 flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface-elevated px-6 py-8 text-center sm:px-10">
        <div className="max-w-sm">
          <h2 className="text-base font-semibold text-foreground">
            {t.donateHeading}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {t.donateDesc}
          </p>
        </div>

        {/* WeChat Pay QR card */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-md">
          {/* WeChat green header */}
          <div className="flex items-center justify-center gap-2 bg-[#07C160] px-8 py-3">
            <WeChatIcon />
            <span className="text-sm font-semibold tracking-wide text-white">
              {t.donateQrLabel}
            </span>
          </div>

          {/* QR code — always white background for scannability */}
          <div className="flex items-center justify-center bg-white p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WECHAT_QR_URL}
              alt="WeChat Pay QR code"
              width={160}
              height={160}
              className="block"
            />
          </div>

          {/* Scan hint */}
          <div className="bg-[#f0f0f0] px-6 py-2 text-center text-xs text-[#555]">
            {t.donateScanHint}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="pb-6 text-center text-sm text-muted">{t.footerText}</p>
    </footer>
  );
}

function WeChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 fill-white"
      aria-hidden
    >
      <path d="M9.5 4C5.36 4 2 6.91 2 10.5c0 2.01 1.06 3.8 2.71 4.97l-.71 2.03 2.3-1.15c.67.19 1.4.3 2.2.3.25 0 .5-.01.74-.04A5.2 5.2 0 0 1 8.75 15.5c0-3.31 3.13-6 7-6 .27 0 .54.01.8.04C15.96 6.61 13 4 9.5 4zm-2 4.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      <path d="M15.75 11C12.85 11 10.5 12.96 10.5 15.5S12.85 20 15.75 20c.6 0 1.18-.09 1.72-.24L19.5 21l-.57-1.68C20.17 18.43 21 17.05 21 15.5 21 12.96 18.65 11 15.75 11zM14 14a.75.75 0 1 1 0-1.5A.75.75 0 0 1 14 14zm3.5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
    </svg>
  );
}
