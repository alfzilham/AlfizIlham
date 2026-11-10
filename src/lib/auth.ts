import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';
import { db } from './db';
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySessionToken } from './session';

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function startSession(username: string) {
  const token = await signSession(username);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** The password set in Settings wins over the one in the environment. */
export async function currentPasswordHash(): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key: 'adminPasswordHash' } });
  if (row && typeof row.value === 'string') return row.value;
  const b64 = process.env.ADMIN_PASSWORD_HASH_B64;
  if (!b64) return null;
  return Buffer.from(b64, 'base64').toString('utf8');
}

let dummyHash: string | undefined;

export async function checkCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME ?? '';
  const hash = await currentPasswordHash();
  // Always run bcrypt so a wrong username takes as long as a wrong password.
  dummyHash ??= await bcrypt.hash('not-the-password', 12);
  const ok = await bcrypt.compare(password, hash ?? dummyHash);
  return Boolean(hash) && ok && expectedUser.length > 0 && safeEqual(username.trim(), expectedUser);
}

export async function setPassword(newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  await db.setting.upsert({
    where: { key: 'adminPasswordHash' },
    update: { value: hash },
    create: { key: 'adminPasswordHash', value: hash },
  });
}
