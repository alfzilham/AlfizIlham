import 'server-only';
import { db } from './db';

export type SiteSettings = {
  profile: { fullName: string; username: string; email: string; location: string };
  site: { title: string; domain: string };
  notifications: { newMessage: boolean; newFeedback: boolean };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  profile: {
    fullName: 'Alfiz Ilham',
    username: 'alfzilham',
    email: 'alfizilham@gmail.com',
    location: 'Aceh Besar, Aceh, Indonesia',
  },
  site: { title: 'Alfiz Ilham Portfolio', domain: 'alfizilham.my.id' },
  notifications: { newMessage: true, newFeedback: true },
};

type Key = keyof SiteSettings;
const KEYS: Key[] = ['profile', 'site', 'notifications'];

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany({ where: { key: { in: KEYS } } });
  const out = structuredClone(DEFAULT_SETTINGS);
  for (const row of rows) {
    const k = row.key as Key;
    if (row.value && typeof row.value === 'object' && !Array.isArray(row.value)) {
      Object.assign(out[k], row.value);
    }
  }
  return out;
}

export async function saveSettings<K extends Key>(key: K, value: SiteSettings[K]) {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
