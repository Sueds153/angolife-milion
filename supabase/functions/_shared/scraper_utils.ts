import * as cheerio from "npm:cheerio@1.0.0";

export const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": CHROME_UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
};

export const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function cleanText(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeText(bytes: Uint8Array | ArrayBuffer): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const utf8 = new TextDecoder("utf-8");
  const decoded = utf8.decode(buf);
  if (!decoded.includes("\uFFFD")) return decoded;
  const latin1 = new TextDecoder("windows-1252");
  const alt = latin1.decode(buf);
  return alt.includes("\uFFFD") ? decoded : alt;
}

export function normalizeUrl(raw: string, baseUrl: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return "";
  }
}

export function extractEmail(text: string): string | null {
  const m = EMAIL_REGEX.exec(text || "");
  return m ? m[0] : null;
}

export async function fetchSoup(
  url: string,
  extraHeaders: Record<string, string> = {},
  timeoutMs = 20000,
): Promise<cheerio.CheerioAPI | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...extraHeaders },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const html = decodeText(buf);
    return cheerio.load(html);
  } catch (err) {
    console.error(`Fetch falhou: ${url} | ${String(err)}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        await worker(item);
      }
    },
  );
  await Promise.all(runners);
}

export function makeSummary(text: string, maxLen = 220): string {
  const clean = cleanText(text);
  return clean.length > maxLen ? clean.slice(0, maxLen) + "..." : clean;
}
