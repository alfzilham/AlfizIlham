import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

export function formatTime(d: Date | string) {
  return timeFmt.format(new Date(d));
}

/** "Today", "Yesterday", "3 days ago", or a date. */
export function relativeDay(d: Date | string) {
  const date = new Date(d);
  const day = 24 * 60 * 60 * 1000;
  const diff = Math.floor((Date.now() - date.getTime()) / day);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(date);
}

export function compact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
