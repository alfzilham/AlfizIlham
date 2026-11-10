import 'server-only';
import { headers } from 'next/headers';
import { db } from './db';

// Fixed-window counter kept in Postgres so every serverless instance shares it.
// If the database is unreachable we fall back to a per-instance memory window
// instead of blocking visitors.
const hits = new Map<string, number[]>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}

/** Returns true when the call is allowed. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + (${windowMs}::int * interval '1 millisecond'))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN now() + (${windowMs}::int * interval '1 millisecond') ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    if (Math.random() < 0.02) {
      void db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {});
    }
    return (rows[0]?.count ?? 1) <= limit;
  } catch {
    return memoryLimit(key, limit, windowMs);
  }
}

export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}
