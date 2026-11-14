import 'server-only';
import { unstable_cache } from 'next/cache';
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

const TTL_SECONDS = 120;
const COOLDOWN_MS = 30_000;
const lastGood = new Map<Range, Analytics>();
const failedAt = new Map<Range, number>();
const inflight = new Map<Range, Promise<AnalyticsResult>>();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function fetchAnalytics(range: Range): Promise<Analytics> {
  const property = `properties/${process.env.GA_PROPERTY_ID}`;
  const dateRanges = [{ startDate: START[range], endDate: 'today' }];
  const seriesDim = range === 'today' ? 'hour' : range === '12m' ? 'yearMonth' : 'date';

  // Two batched Core calls plus two Realtime calls: at most 4 requests in flight, well under the 10-concurrent limit.
  const [coreA, coreB, realtime, rtPages] = await Promise.all([
    ga().batchRunReports({
      property,
      requests: [
        { dateRanges, metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' }] },
        {
          dateRanges,
          dimensions: [{ name: seriesDim }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: seriesDim } }],
        },
        { dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }], dimensions: [{ name: 'dayOfWeek' }], metrics: [{ name: 'activeUsers' }] },
        {
          dateRanges,
          dimensions: [{ name: 'country' }, { name: 'countryId' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 50,
        },
        {
          dateRanges,
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 5,
        },
      ],
    }),
    ga().batchRunReports({
      property,
      requests: [
        { dateRanges, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'activeUsers' }] },
        {
          dateRanges,
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'userEngagementDuration' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 6,
        },
      ],
    }),
    ga().runRealtimeReport({
      property,
      dimensions: [{ name: 'country' }, { name: 'countryId' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 6,
    }),
    // Realtime pages are optional (unifiedScreenName is the realtime page dimension).
    ga()
      .runRealtimeReport({
        property,
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 3,
      })
      .catch(() => null),
  ]);
  const [totals, series, weekdays, countries, sources] = coreA[0].reports ?? [];
  const [devices, pages] = coreB[0].reports ?? [];

  const rtRows = (realtime[0].rows ?? []) as Row[];
  const totalRow = (totals?.rows?.[0] ?? {}) as Row;
  const countryRows = (countries?.rows ?? []) as Row[];

  // GA only returns periods that had traffic. Fill the gaps with zeros so the chart always has a full line.
  const fillSeries = (rows: Row[]) => {
    const found = new Map<string, { users: number; views: number }>();
    for (const r of rows) found.set(dim(r, 0), { users: met(r, 0), views: met(r, 1) });
    const keys = new Set<string>(found.keys());
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    if (seriesDim === 'hour') {
      for (let h = 0; h < 24; h++) keys.add(pad(h));
    } else if (seriesDim === 'yearMonth') {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        keys.add(`${d.getFullYear()}${pad(d.getMonth() + 1)}`);
      }
    } else {
      const days = range === '30d' ? 30 : 7;
      for (let i = 0; i < days; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        keys.add(`${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`);
      }
    }
    let sorted = [...keys].sort();
    // The server clock and the GA property can sit in different time zones; keep only the newest N days.
    if (seriesDim === 'date') sorted = sorted.slice(-(range === '30d' ? 30 : 7));
    return sorted.map((key) => ({ key, users: found.get(key)?.users ?? 0, views: found.get(key)?.views ?? 0 }));
  };

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
    series: fillSeries((series?.rows ?? []) as Row[]).map((p) => ({ label: label(p.key), users: p.users, views: p.views })),
    weekdays: (() => {
      const map = new Map<number, number>();
      for (const r of (weekdays?.rows ?? []) as Row[]) map.set(Number(dim(r, 0)), met(r, 0));
      return [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: DAYS[d], users: map.get(d) ?? 0 }));
    })(),
    countries: countryRows.map((r) => ({ name: dim(r, 0), code: dim(r, 1), value: met(r, 0) })),
    sources: ((sources?.rows ?? []) as Row[]).map((r) => ({ name: dim(r, 0), value: met(r, 0) })),
    devices: ((devices?.rows ?? []) as Row[]).map((r) => ({ name: dim(r, 0), value: met(r, 0) })),
    topPages: ((pages?.rows ?? []) as Row[]).map((r) => ({
      path: dim(r, 0),
      views: met(r, 0),
      users: met(r, 1),
      avgTime: met(r, 1) ? met(r, 2) / met(r, 1) : 0,
    })),
  };

  data.realtime.pages = ((rtPages?.[0].rows ?? []) as Row[]).map((r) => ({ name: dim(r, 0), value: met(r, 0) }));
  return data;
}

const FALLBACK: AnalyticsResult = {
  configured: false,
  error: 'Google Analytics did not respond. Check the property ID and service account access.',
};

// Next data cache is shared by every serverless instance, so the dashboard pages do not each spend GA quota.
const cachedAnalytics = unstable_cache(fetchAnalytics, ['ga-analytics-v1'], { revalidate: TTL_SECONDS });

export async function getAnalytics(range: Range = '7d'): Promise<AnalyticsResult> {
  if (!gaConfigured()) return { configured: false };
  const pending = inflight.get(range);
  if (pending) return pending;

  // After a failure, stop hammering GA for a short while and serve the last good data if there is any.
  const failed = failedAt.get(range);
  if (failed && Date.now() - failed < COOLDOWN_MS) return lastGood.get(range) ?? FALLBACK;

  const run = (async (): Promise<AnalyticsResult> => {
    try {
      const data = await cachedAnalytics(range);
      lastGood.set(range, data);
      failedAt.delete(range);
      return data;
    } catch (err) {
      console.error('GA4 request failed', err);
      failedAt.set(range, Date.now());
      return lastGood.get(range) ?? FALLBACK;
    }
  })().finally(() => inflight.delete(range));
  inflight.set(range, run);
  return run;
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
