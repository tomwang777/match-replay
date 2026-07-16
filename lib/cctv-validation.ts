const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 12_000;

/** Full broadcasts are ~90+ minutes; highlights are usually under 20 minutes. */
export const MIN_FULL_MATCH_DURATION_SEC = 60 * 60;

const HIGHLIGHT_TITLE_KEYWORDS = [
  "集锦",
  "精华",
  "精切",
  "十佳",
  "进球瞬间",
  "精彩瞬间",
  "精彩集锦",
  "短篇",
  "进球集锦",
] as const;

export type CctvVideoMeta = {
  title: string;
  durationSec: number;
  column: string;
  guid: string;
};

export type CctvValidationResult = {
  valid: boolean;
  meta?: CctvVideoMeta;
  reason?: string;
};

function decodeCctvHtml(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("gb18030").decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

export function extractGuidFromHtml(html: string): string | null {
  const match = html.match(/guid\s*=\s*["']([a-f0-9]+)["']/i);
  return match?.[1] ?? null;
}

export function isHighlightTitle(title: string, column = ""): boolean {
  const text = `${title} ${column}`;
  return HIGHLIGHT_TITLE_KEYWORDS.some((keyword) => text.includes(keyword));
}

/** Full-match CCTV pages use a VS headline, e.g. A组第1轮：墨西哥VS南非 */
export function looksLikeFullMatchTitle(title: string): boolean {
  if (!title.includes("世界杯")) return false;
  if (isHighlightTitle(title)) return false;
  return /VS/i.test(title);
}

export function isFullMatchDuration(durationSec: number): boolean {
  return durationSec >= MIN_FULL_MATCH_DURATION_SEC;
}

export async function fetchCctvVideoMeta(guid: string): Promise<CctvVideoMeta | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=${guid}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      ack?: string;
      title?: string;
      column?: string;
      video?: { totalLength?: string };
    };

    if (data.ack !== "yes") return null;

    const durationSec = Number(data.video?.totalLength);
    if (!Number.isFinite(durationSec) || durationSec <= 0) return null;

    return {
      guid,
      title: data.title?.trim() ?? "",
      durationSec,
      column: data.column?.trim() ?? "",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function validateCctvVideoMeta(meta: CctvVideoMeta): CctvValidationResult {
  if (isHighlightTitle(meta.title, meta.column)) {
    return {
      valid: false,
      meta,
      reason: "highlight title or column",
    };
  }

  if (!looksLikeFullMatchTitle(meta.title)) {
    return {
      valid: false,
      meta,
      reason: "title is not a full-match VS headline",
    };
  }

  if (!isFullMatchDuration(meta.durationSec)) {
    return {
      valid: false,
      meta,
      reason: `duration too short (${Math.round(meta.durationSec)}s)`,
    };
  }

  return { valid: true, meta };
}

export async function fetchCctvPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return "";
    const buffer = await response.arrayBuffer();
    return decodeCctvHtml(buffer);
  } catch {
    return "";
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function validateCctvReplayUrl(
  url: string,
  html?: string,
): Promise<CctvValidationResult> {
  const pageHtml = html ?? (await fetchCctvPageHtml(url));
  if (!pageHtml) {
    return { valid: false, reason: "failed to fetch page" };
  }

  const guid = extractGuidFromHtml(pageHtml);
  if (!guid) {
    return { valid: false, reason: "no video guid on page" };
  }

  const meta = await fetchCctvVideoMeta(guid);
  if (!meta) {
    return { valid: false, reason: "failed to fetch video metadata" };
  }

  return validateCctvVideoMeta(meta);
}
