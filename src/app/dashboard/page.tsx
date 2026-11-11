import Link from 'next/link';
import { Eye, Globe, MessageSquareQuote, Upload, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { getAnalytics, RANGES, type Range } from '@/lib/ga';
import { compact, formatNumber, relativeDay } from '@/lib/utils';
import { AreaChart, BarChart, HBars } from '@/components/dashboard/charts';
import { Card, CardHead, Kpi, NotConfigured, PageTitle, TabLinks, Thumb } from '@/components/dashboard/ui';
import { LinkButton } from '@/components/ui/button';

export const metadata = { title: 'Overview' };

const GA_MISSING = {
  title: 'Google Analytics is not connected',
  body: 'Add GA_PROPERTY_ID, GA_CLIENT_EMAIL and GA_PRIVATE_KEY to the environment to see traffic here.',
};

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: r } = await searchParams;
  const range: Range = RANGES.some((x) => x.id === r) ? (r as Range) : '30d';
  const [ga, pending, pendingCount] = await Promise.all([
    getAnalytics(range),
    db.testimonial.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, take: 4 }),
    db.testimonial.count({ where: { status: 'PENDING' } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Overview"
        subtitle="A summary of traffic, feedback and activity."
        actions={
          <LinkButton href="/dashboard/projects?new=1" variant="primary" icon={<Upload className="size-4" aria-hidden="true" />}>
            Upload project
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:gap-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
          <Kpi label="Visitors" value={ga.configured ? compact(ga.totals.users) : '0'} icon={<Users />} spark={ga.configured ? ga.series.map((s) => s.users) : undefined} />
          <Kpi label="Page views" value={ga.configured ? compact(ga.totals.views) : '0'} icon={<Eye />} spark={ga.configured ? ga.series.map((s) => s.views) : undefined} />
          <Kpi label="Countries" value={ga.configured ? String(ga.totals.countries) : '0'} icon={<Globe />} />
          <Kpi label="Pending feedback" value={String(pendingCount)} icon={<MessageSquareQuote />} />
        </div>

        <Card>
          <CardHead
            title="Total traffic"
            subtitle="Page views over time"
            right={<TabLinks label="Traffic range" active={range} items={RANGES.map((x) => ({ key: x.id, label: x.label, href: `/dashboard?range=${x.id}` }))} />}
          />
          {ga.configured ? (
            <>
              <p className="-mt-1 mb-4 font-display text-4xl font-bold">{formatNumber(ga.totals.views)}</p>
              <AreaChart
                labels={ga.series.map((s) => s.label)}
                series={ga.series.map((s) => s.views)}
                height={230}
                summary={`Page views over the selected range, ${formatNumber(ga.totals.views)} in total.`}
              />
            </>
          ) : (
            <NotConfigured {...GA_MISSING} />
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <Card>
          <CardHead
            title="Live visitors"
            subtitle="Active in the last 30 minutes"
            right={
              <span className="inline-flex items-center gap-2 text-[13px]">
                <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-ok motion-reduce:animate-none" />
                Live
              </span>
            }
          />
          {ga.configured ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[56px] leading-none font-bold">{ga.realtime.active}</span>
                <span className="text-sm text-muted">online now</span>
              </div>
              <div className="mt-6">{ga.realtime.countries.length ? <HBars rows={ga.realtime.countries} /> : <p className="text-sm text-muted">Nobody is on the site right now.</p>}</div>
              {ga.realtime.pages.length > 0 && (
                <>
                  <p className="mt-6 text-[13px] text-muted">Top pages right now</p>
                  <ul className="mt-2">
                    {ga.realtime.pages.map((p) => (
                      <li key={p.name} className="flex justify-between gap-3 border-t border-white/[0.07] py-2.5 text-sm">
                        <span className="truncate font-mono text-[13px]">{p.name}</span>
                        <span className="text-muted">{p.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <NotConfigured {...GA_MISSING} />
          )}
          <LinkButton href="/dashboard/analytics" className="mt-5 w-full">
            Open Analytics
          </LinkButton>
        </Card>

        <Card>
          <CardHead title="Visitors by day" subtitle="Last 7 days" />
          {ga.configured ? (
            <BarChart
              labels={ga.weekdays.map((d) => d.label)}
              values={ga.weekdays.map((d) => d.users)}
              summary={ga.weekdays.map((d) => `${d.label} ${d.users}`).join(', ')}
            />
          ) : (
            <NotConfigured {...GA_MISSING} />
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <section className="acc-surface flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[24px] p-6">
          <div>
            <h2 className="max-w-[14ch] font-display text-[28px] leading-tight font-bold text-white">
              {pendingCount === 0 ? 'No feedback is waiting' : `${pendingCount} testimonial${pendingCount === 1 ? ' is' : 's are'} waiting for review`}
            </h2>
            <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-white/80">
              {pendingCount === 0 ? 'New feedback from your connected projects will appear here.' : 'New feedback from your connected projects needs approval.'}
            </p>
          </div>
          <Link
            href="/dashboard/testimonials?status=pending"
            className="mt-6 inline-flex min-h-12 w-fit items-center rounded-full bg-fg px-7 text-[15px] font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            Review feedback
          </Link>
        </section>

        <Card>
          <CardHead
            title="Pending testimonials"
            subtitle="Latest feedback from your projects"
            right={
              <Link href="/dashboard/testimonials" className="text-[13px] text-accent-soft hover:underline">
                View all
              </Link>
            }
          />
          {pending.length === 0 ? (
            <p className="text-sm text-muted">Nothing is waiting for approval.</p>
          ) : (
            <ul>
              {pending.map((t) => (
                <li key={t.id} className="flex items-center gap-3 border-t border-white/[0.07] py-3 first:border-0">
                  <Thumb size={40}>
                    <MessageSquareQuote />
                  </Thumb>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{[t.name, t.company].filter(Boolean).join(', ')}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      via {t.source}, {relativeDay(t.createdAt).toLowerCase()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
