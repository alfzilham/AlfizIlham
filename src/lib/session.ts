// Edge safe: used by middleware and by server code.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'aiz_session';
export const SESSION_MAX_AGE = 60 * 60; // 1 hour

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { sub: string; role: 'admin' };

export async function signSession(username: string) {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (payload.role !== 'admin' || typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, role: 'admin' };
  } catch {
    return null;
  }
}
