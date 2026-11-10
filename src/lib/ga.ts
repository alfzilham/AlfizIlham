import 'server-only';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export type Range = 'today' | '7d' | '30d' | '12m';
export const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '12m', label: '12 months' },
];

const START: Record<Range, string> = { today: 'today', '7d': '6daysAgo', '30d': '29daysAgo', '12m': '364daysAgo' };

export type NamedValue = { name: string; code?: string; value: number };
export type Analytics = {
  configured: true;
  realtime: { active: number; countries: NamedValue[]; pages: NamedValue[] };
  totals: { users: number; views: number; avgSession: number; bounceRate: number; countries: number };
  series: { label: string; users: number; views: number }[];
  weekdays: { label: string; users: number }[];
  countries: NamedValue[];
  sources: NamedValue[];
  devices: NamedValue[];
  topPages: { path: string; views: number; users: number; avgTime: number }[];
};
export type AnalyticsResult = Analytics | { configured: false; error?: string };

export function gaConfigured() {
  return Boolean(process.env.GA_PROPERTY_ID && process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY);
}

let client: BetaAnalyticsDataClient | null = null;
function ga() {
  if (!client) {
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  }
  return client;
}

type Row = { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null };
const dim = (r: Row, i: number) => r.dimensionValues?.[i]?.value ?? '';
const met = (r: Row, i: number) => Number(r.metricValues?.[i]?.value ?? 0);

const cache = new Map<string, { at: number; data: Analytics }>();
const TTL = 60_000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getAnalytics(range: Range = '7d'): Promise<AnalyticsResult> {
  if (!gaConfigured()) return { configured: false };
  const hit = cache.get(range);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const property = `properties/${process.env.GA_PROPERTY_ID}`;
  const dateRanges = [{ startDate: START[range], endDate: 'today' }];
  const seriesDim = range === 'today' ? 'hour' : range === '12m' ? 'yearMonth' : 'date';

  try {
    const [realtime, totals, series, weekdays, countries, sources, devices, pages] = await Promise.all([
      ga().runRealtimeReport({
        property,
        dimensions: [{ name: 'country' }, { name: 'countryId' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 6,
      }),
      ga().runReport({
        property,
        dateRanges,
        metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' }],
      }),
      ga().runReport({
        property,
        dateRanges,
        dimensions: [{ name: seriesDim }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: seriesDim } }],
      }),
      ga().runReport({
        property,
        dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'dayOfWeek' }],
        metrics: [{ name: 'activeUsers' }],
      }),
      ga().runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'country' }, { name: 'countryId' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 50,
      }),
      ga().runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      }),
      ga().runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
      }),
      ga().runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'userEngagementDuration' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 6,
      }),
    ]);

    const rtRows = (realtime[0].rows ?? []) as Row[];
    const totalRow = (totals[0].rows?.[0] ?? {}) as Row;
    const countryRows = (countries[0].rows ?? []) as Row[];

    const label = (raw: string) => {
      if (seriesDim === 'hour') return `${raw}:00`;
      if (seriesDim === 'yearMonth') return MONTHS[Number(raw.slice(4, 6)) - 1] ?? raw;
      return `${raw.slice(6, 8)} ${MONTHS[Number(raw.slice(4, 6)) - 1] ?? ''}`;
    };

    const data: Analytics = {
      configured: true,
      realtime: {
        active: rtRows.reduce((s, r) => s + met(r, 0), 0),
        countries: rtRows.map((r) => ({ name: dim(r, 0), code: dim(r, 1), value: met(r, 0) })),
        pages: [],
      },
      totals: {
        users: met(totalRow, 0),
        views: met(totalRow, 1),
        avgSession: met(totalRow, 2),
        bounceRate: met(totalRow, 3),
        countries: countryRows.length,
      },
      series: ((series[0].rows ?? []) as Row[]).map((r) => ({ label: label(dim(r, 0)), users: met(r, 0), views: met(r, 1) })),
      weekdays: (() => {
        const map = new Map<number, number>();
        for (const r of (weekdays[0].rows ?? []) as Row[]) map.set(Number(dim(r, 0)), met(r, 0));
        return [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: DAYS[d], users: map.get(d) ?? 0 }));
      })(),
      countries: countryRows.map((r) => ({ name: dim(r, 0), code: dim(r, 1), value: met(r, 0) })),
      sources: ((sources[0].rows ?? []) as Row[]).map((r) => ({ name: dim(r, 0), value: met(r, 0) })),
      devices: ((devices[0].rows ?? []) as Row[]).map((r) => ({ name: dim(r, 0), value: met(r, 0) })),
      topPages: ((pages[0].rows ?? []) as Row[]).map((r) => ({
        path: dim(r, 0),
        views: met(r, 0),
        users: met(r, 1),
        avgTime: met(r, 1) ? met(r, 2) / met(r, 1) : 0,
      })),
    };

    // Realtime pages need a separate call (unifiedScreenName is the realtime page dimension).
    try {
      const [rtPages] = await ga().runRealtimeReport({
        property,
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 3,
      });
      data.realtime.pages = ((rtPages.rows ?? []) as Row[]).map((r) => ({ name: dim(r, 0), value: met(r, 0) }));
    } catch {
      /* optional */
    }

    cache.set(range, { at: Date.now(), data });
    return data;
  } catch (err) {
    console.error('GA4 request failed', err);
    return { configured: false, error: 'Google Analytics did not respond. Check the property ID and service account access.' };
  }
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
