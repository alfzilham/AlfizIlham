'use server';

import { redirect } from 'next/navigation';
import { checkCredentials, startSession } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function login(_prev: { error: string }, formData: FormData): Promise<{ error: string }> {
  const username = String(formData.get('username') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!username || !password) return { error: 'Enter your username and password.' };

  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}`, 6, 15 * 60 * 1000))) {
    return { error: 'Too many attempts. Wait 15 minutes and try again.' };
  }

  const ok = await checkCredentials(username, password);
  if (!ok) return { error: 'The username or password is not correct.' };

  await startSession(username.trim());
  redirect('/dashboard');
}
