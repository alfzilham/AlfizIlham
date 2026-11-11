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

/** Identifies an image by its first bytes, so a wrong content-type or an HTML error page cannot slip through. */
function sniffImage(b: Uint8Array): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return 'image/x-icon';
  return null;
}

/** Icon links of a page, best first: apple-touch-icon, then raster icons by size, then ICO. SVG is skipped (not storable). Site-root defaults come last. */
function iconCandidates(html: string, pageUrl: URL) {
  const found: { href: string; score: number }[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = /\brel=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? '';
    const href = /\bhref=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || !/\b(apple-touch-icon(-precomposed)?|icon)\b/.test(rel)) continue;
    if (/\.svg(\?|$)/i.test(href) || /image\/svg/i.test(tag)) continue;
    const size = Number(/\bsizes=["'](\d+)x\d+["']/i.exec(tag)?.[1] ?? 0);
    const base = rel.includes('apple-touch-icon') ? 3000 : /\.ico(\?|$)/i.test(href) ? 1000 : 2000;
    try {
      found.push({ href: new URL(href.replace(/&amp;/g, '&'), pageUrl).toString(), score: base + size });
    } catch {
      /* skip a malformed href */
    }
  }
  const declared = found.sort((a, b) => b.score - a.score).map((f) => f.href);
  const defaults = ['/apple-touch-icon.png', '/favicon.ico'].map((p) => new URL(p, pageUrl.origin).toString());
  return Array.from(new Set([...declared, ...defaults]));
}

/** Copies a remote icon into our bucket. Raster or ICO only, up to 2 MB, checked by content, not by header. */
async function copyIconToStorage(iconUrl: string) {
  assertPublicUrl(iconUrl);
  const res = await fetchWithTimeout(iconUrl, 10000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > 2 * 1024 * 1024) throw new Error('larger than 2 MB');
  const type = sniffImage(buf);
  if (!type) throw new Error('not a PNG, JPG, WEBP, GIF or ICO image');
  if (!storageConfigured()) return { url: iconUrl, key: null as string | null };
  const key = newKey('projects', type);
  await putObject(key, buf, type);
  return { url: publicUrl(key), key };
}

export type IconResult = { url: string; key: string | null; source: 'site' | 'service' };

const short = (u: string) => {
  try {
    const x = new URL(u);
    return `${x.hostname}${x.pathname}`.slice(0, 60);
  } catch {
    return u.slice(0, 60);
  }
};

/** Icon declared by the site first, then a favicon lookup service. Throws with the reason of each failed step. */
export async function fetchIcon(liveUrl: string): Promise<IconResult> {
  const pageUrl = assertPublicUrl(liveUrl);
  const notes: string[] = [];

  let html = '';
  try {
    const res = await fetchWithTimeout(pageUrl.toString(), 8000, { headers: { accept: 'text/html' } });
    if (res.ok) html = (await res.text()).slice(0, 400_000);
    else notes.push(`page returned HTTP ${res.status}`);
  } catch {
    notes.push('page could not be reached');
  }

  for (const candidate of iconCandidates(html, pageUrl).slice(0, 5)) {
    try {
      return { ...(await copyIconToStorage(candidate)), source: 'site' };
    } catch (err) {
      notes.push(`${short(candidate)}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  const service = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=${encodeURIComponent(pageUrl.origin)}&size=128`;
  try {
    return { ...(await copyIconToStorage(service)), source: 'service' };
  } catch (err) {
    notes.push(`favicon service: ${err instanceof Error ? err.message : 'failed'}`);
  }

  console.error('fetchIcon failed', liveUrl, notes);
  throw new Error(`No icon found. ${notes.slice(-3).join('; ')}. Upload an icon instead.`);
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
