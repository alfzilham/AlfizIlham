import 'server-only';
import { newKey, putObject, publicUrl, storageConfigured } from './storage';

const UA = 'Mozilla/5.0 (compatible; AlfizPortfolioBot/1.0; +https://alfizilham.my.id)';

/** Rejects non http(s) URLs and obvious private hosts so the fetch cannot be pointed inward. */
export function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http and https links are supported.');
  const host = url.hostname.toLowerCase();
  const blocked =
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === '0.0.0.0' ||
    host === '[::1]';
  if (blocked) throw new Error('That address is not reachable from the internet.');
  return url;
}

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': UA, ...(init?.headers ?? {}) } });
  } finally {
    clearTimeout(timer);
  }
}

function findMeta(html: string, names: string[]) {
  for (const name of names) {
    const a = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i').exec(html);
    if (a) return a[1];
    const b = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, 'i').exec(html);
    if (b) return b[1];
  }
  return null;
}

async function findOgImage(pageUrl: URL) {
  const res = await fetchWithTimeout(pageUrl.toString(), 8000, { headers: { accept: 'text/html' } });
  if (!res.ok) return null;
  const html = (await res.text()).slice(0, 400_000);
  const raw = findMeta(html, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']);
  if (!raw) return null;
  return new URL(raw.replace(/&amp;/g, '&'), pageUrl).toString();
}

async function findScreenshot(pageUrl: URL) {
  const api = `https://api.microlink.io/?url=${encodeURIComponent(pageUrl.toString())}&screenshot=true&meta=false&viewport.width=1440&viewport.height=900`;
  const res = await fetchWithTimeout(api, 25000);
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: string; data?: { screenshot?: { url?: string } } };
  return data.status === 'success' ? data.data?.screenshot?.url ?? null : null;
}

/** Copies a remote image into our bucket so the preview does not break when the source changes. */
async function copyToStorage(imageUrl: string) {
  if (!storageConfigured()) return { url: imageUrl, key: null as string | null };
  const res = await fetchWithTimeout(imageUrl, 15000);
  if (!res.ok) throw new Error('Could not download the preview image.');
  const type = (res.headers.get('content-type') ?? 'image/png').split(';')[0].trim();
  if (!type.startsWith('image/')) throw new Error('The preview link is not an image.');
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > 8 * 1024 * 1024) throw new Error('The preview image is larger than 8 MB.');
  const key = newKey('projects', type === 'image/jpg' ? 'image/jpeg' : type);
  await putObject(key, buf, type);
  return { url: publicUrl(key), key };
}

export type PreviewResult = { url: string; key: string | null; source: 'og' | 'screenshot' };

/** og:image first, then a Microlink screenshot. Throws when neither works. */
export async function fetchPreview(liveUrl: string): Promise<PreviewResult> {
  const pageUrl = assertPublicUrl(liveUrl);
  let source: PreviewResult['source'] = 'og';
  let image = await findOgImage(pageUrl).catch(() => null);
  if (!image) {
    source = 'screenshot';
    image = await findScreenshot(pageUrl).catch(() => null);
  }
  if (!image) throw new Error('No preview found for this link. Upload an image instead.');
  const stored = await copyToStorage(image);
  return { ...stored, source };
}
