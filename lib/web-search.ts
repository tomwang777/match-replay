const SEARCH_TIMEOUT_MS = 12_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function searchWeb(query: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
      },
    );

    if (!response.ok) return [];

    const html = await response.text();
    const links: string[] = [];

    const citeRegex = /<cite[^>]*>([^<]+)</gi;
    let citeMatch;
    while ((citeMatch = citeRegex.exec(html)) !== null) {
      const cite = citeMatch[1].replace(/<[^>]+>/g, "").trim();
      if (cite.startsWith("http")) links.push(cite);
    }

    const hrefRegex = /<a[^>]+href="(https?:\/\/[^"]+)"/gi;
    let hrefMatch;
    while ((hrefMatch = hrefRegex.exec(html)) !== null) {
      links.push(hrefMatch[1]);
    }

    return [...new Set(links)];
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export function firstMatchingLink(links: string[], pattern: RegExp): string | null {
  return links.find((link) => pattern.test(link)) ?? null;
}
