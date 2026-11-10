import { Activity, ArrowDown, Eye, Timer, Users } from 'lucide-react';
import { formatDuration, getAnalytics, RANGES, type Range } from '@/lib/ga';
import { compact, formatNumber } from '@/lib/utils';
import { AreaChart, BarChart, Donut, HBars } from '@/components/dashboard/charts';
import { Card, CardHead, Kpi, NotConfigured, PageTitle, TabLinks } from '@/components/dashboard/ui';

export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: r } = await searchParams;
  const range: Range = RANGES.some((x) => x.id === r) ? (r as Range) : '7d';
  const ga = await getAnalytics(range);
  const tabs = <TabLinks label="Date range" active={range} items={RANGES.map((x) => ({ key: x.id, label: x.label, href: `/dashboard/analytics?range=${x.id}` }))} />;

  if (!ga.configured) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle title="Analytics" subtitle="Visitor insights from Google Analytics." actions={tabs} />
        <Card>
          <NotConfigured
            title={ga.error ? 'Google Analytics did not respond' : 'Google Analytics is not connected'}
            body={
              ga.error ??
              'Create a service account in Google Cloud, give its email Viewer access to your GA4 property, then set GA_PROPERTY_ID, GA_CLIENT_EMAIL and GA_PRIVATE_KEY. The tracking tag uses NEXT_PUBLIC_GA_MEASUREMENT_ID.'
            }
          />
        </Card>
      </div>
    );
  }

  const devTotal = ga.devices.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Analytics" subtitle="Visitor insights from Google Analytics." actions={tabs} />

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
        <Kpi label="Online now" value={String(ga.realtime.active)} icon={<Activity />} />
        <Kpi label="Visitors" value={formatNumber(ga.totals.users)} icon={<Users />} spark={ga.series.map((s) => s.users)} />
        <Kpi label="Page views" value={formatNumber(ga.totals.views)} icon={<Eye />} spark={ga.series.map((s) => s.views)} />
        <Kpi label="Avg. session" value={formatDuration(ga.totals.avgSession)} icon={<Timer />} />
        <Kpi label="Bounce rate" value={`${Math.round(ga.totals.bounceRate * 100)}%`} icon={<ArrowDown />} />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHead
            title="Visitors and page views"
            subtitle={RANGES.find((x) => x.id === range)?.label}
            right={
              <div className="flex gap-5 text-[13px] text-muted">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full bg-accent-soft" />
                  Visitors
                </span>
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="w-3.5 border-t-2 border-dotted border-white/70" />
                  Page views
                </span>
              </div>
            }
          />
          <AreaChart
            labels={ga.series.map((s) => s.label)}
            series={ga.series.map((s) => s.users)}
            second={ga.series.map((s) => s.views)}
            height={300}
            summary={`${formatNumber(ga.totals.users)} visitors and ${formatNumber(ga.totals.views)} page views in the selected range.`}
          />
        </Card>
        <Card>
          <CardHead title="Live visitors" subtitle="Active in the last 30 minutes" />
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[56px] leading-none font-bold">{ga.realtime.active}</span>
            <span className="text-sm text-muted">online now</span>
          </div>
          <div className="mt-6">{ga.realtime.countries.length ? <HBars rows={ga.realtime.countries} /> : <p className="text-sm text-muted">Nobody is on the site right now.</p>}</div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr]">
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHead title="Country counter" subtitle={`${ga.totals.countries} countries reached`} />
          {ga.countries.length ? <HBars rows={ga.countries.slice(0, 8)} format={formatNumber} /> : <p className="text-sm text-muted">No visits yet.</p>}
        </Card>
        <Card>
          <CardHead title="Traffic sources" subtitle="Where visitors come from" />
          {ga.sources.length ? (
            <Donut parts={ga.sources} center={compact(ga.sources.reduce((s, x) => s + x.value, 0))} sub="sessions" size={150} />
          ) : (
            <p className="text-sm text-muted">No sessions yet.</p>
          )}
        </Card>
        <Card>
          <CardHead title="Devices" subtitle="Share of visitors" />
          <BarChart
            labels={ga.devices.map((d) => d.name.charAt(0).toUpperCase() + d.name.slice(1))}
            values={ga.devices.map((d) => Math.round((d.value / devTotal) * 100))}
            height={150}
            summary={ga.devices.map((d) => `${d.name} ${Math.round((d.value / devTotal) * 100)}%`).join(', ')}
          />
        </Card>
      </div>

      <Card>
        <CardHead title="Top pages" subtitle="Most visited in this range" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[13px] text-muted">
                <th scope="col" className="pb-3 font-normal">Page</th>
                <th scope="col" className="pb-3 text-right font-normal">Views</th>
                <th scope="col" className="pb-3 text-right font-normal">Visitors</th>
                <th scope="col" className="pb-3 text-right font-normal">Avg. time</th>
              </tr>
            </thead>
            <tbody>
              {ga.topPages.map((p) => (
                <tr key={p.path} className="border-t border-white/[0.07]">
                  <td className="py-3.5 font-mono text-[13px]">{p.path}</td>
                  <td className="py-3.5 text-right">{formatNumber(p.views)}</td>
                  <td className="py-3.5 text-right text-muted">{formatNumber(p.users)}</td>
                  <td className="py-3.5 text-right text-muted">{formatDuration(p.avgTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
