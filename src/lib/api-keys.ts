import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';

export function hashKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

export function generateKey() {
  const key = `mcp_live_${randomBytes(24).toString('base64url')}`;
  const prefix = `${key.slice(0, 13)}...${key.slice(-4)}`;
  return { key, prefix, hash: hashKey(key) };
}

/** Returns the active key record for a bearer token, or null. */
export async function findActiveKey(token: string | null) {
  if (!token || !token.startsWith('mcp_live_')) return null;
  const record = await db.apiKey.findUnique({ where: { hash: hashKey(token) } });
  if (!record || record.revokedAt) return null;
  return record;
}
