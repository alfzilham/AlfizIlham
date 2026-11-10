'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Key, Link2, MessageSquareQuote, Plus, RotateCcw, Star, Trash2, User } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/button';
import { Segmented } from '@/components/ui/field';
import { Card, CardHead, Empty, PageTitle, StatusDot, Thumb } from './ui';
import { RowMenu } from './row-menu';
import { ExportLinks } from './export-links';
import { Pager, SearchBox } from './list-controls';
import { useFeedback } from './feedback';
import { deleteTestimonial, setTestimonialStatus } from '@/app/dashboard/actions';
import { relativeDay } from '@/lib/utils';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TestimonialRow = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  message: string;
  rating: number;
  project: string | null;
  source: string;
  status: Status;
  createdAt: string;
};
type Filter = 'all' | Status;

function Rating({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[13px]" aria-label={`${n} out of 5`}>
      <Star className="size-3.5 text-accent" aria-hidden="true" />
      {n}/5
    </span>
  );
}

export function TestimonialManager({
  items,
  connected,
  kpis,
  charts,
  filter,
  q,
  page,
  pages,
  filtered,
  total,
}: {
  items: TestimonialRow[];
  connected: { id: string; project: string; count: number }[];
  kpis: React.ReactNode;
  charts: React.ReactNode[];
  filter: Filter;
  q: string;
  page: number;
  pages: number;
  filtered: number;
  total: number;
}) {
  const { toast, confirm } = useFeedback();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const rows = items;
  const href = (f: Filter, p = 1) => {
    const sp = new URLSearchParams();
    if (f !== 'all') sp.set('status', f.toLowerCase());
    if (q) sp.set('q', q);
    if (p > 1) sp.set('page', String(p));
    const text = sp.toString();
    return `/dashboard/testimonials${text ? `?${text}` : ''}`;
  };

  const setStatus = (t: TestimonialRow, status: Status) =>
    start(async () => {
      setBusy(t.id);
      const res = await setTestimonialStatus(t.id, status);
      setBusy(null);
      const msg = status === 'APPROVED' ? 'Approved, it now shows on the site' : status === 'REJECTED' ? 'Rejected' : 'Moved back to pending';
      toast(res.ok ? msg : res.message, res.ok ? 'ok' : 'error');
    });

  const remove = async (t: TestimonialRow) => {
    if (!(await confirm({ title: 'Delete this testimonial?', body: `Feedback from ${t.name} is removed for good.`, confirm: 'Delete', danger: true }))) return;
    const res = await deleteTestimonial(t.id);
    toast(res.ok ? 'Testimonial deleted' : res.message, res.ok ? 'ok' : 'error');
  };

  const actions = (t: TestimonialRow) =>
    t.status === 'PENDING' ? (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="primary" loading={busy === t.id} onClick={() => setStatus(t, 'APPROVED')} aria-label={`Approve feedback from ${t.name}`}>
          Approve
        </Button>
        <Button size="sm" onClick={() => setStatus(t, 'REJECTED')} disabled={busy === t.id} aria-label={`Reject feedback from ${t.name}`}>
          Reject
        </Button>
      </div>
    ) : (
      <div className="flex justify-end">
        <RowMenu
          label={`Actions for feedback from ${t.name}`}
          items={[
            t.status === 'APPROVED'
              ? { label: 'Hide from site', icon: <RotateCcw />, onSelect: () => setStatus(t, 'PENDING') }
              : { label: 'Approve', icon: <Star />, onSelect: () => setStatus(t, 'APPROVED') },
            { label: 'Delete', icon: <Trash2 />, onSelect: () => remove(t), danger: true },
          ]}
        />
      </div>
    );

  const who = (t: TestimonialRow) => [t.role, t.company].filter(Boolean).join(', ') || 'Client';

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Testimonials"
        subtitle="Feedback arrives from your connected projects. Approve what appears on the site."
        actions={
          <>
            <ExportLinks kind="testimonials" />
            <LinkButton href="/dashboard/settings?tab=integrations" variant="primary" icon={<Plus className="size-4" aria-hidden="true" />}>
              Connect project
            </LinkButton>
          </>
        }
      />
      {kpis}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_420px]">
        {charts}
        <Card tint className="md:col-span-2 xl:col-span-1">
          <CardHead title="Connected projects" subtitle="Sending feedback through MCP" />
          {connected.length === 0 ? (
            <p className="mb-4 text-sm text-muted">No project is connected yet. Create an API key for a project to start receiving feedback.</p>
          ) : (
            <ul className="mb-4 flex flex-col gap-3">
              {connected.map((c) => (
                <li key={c.id} className="flex items-center gap-3.5 rounded-2xl bg-black/30 p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                  <Thumb>
                    <Link2 />
                  </Thumb>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.project}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {c.count} testimonial{c.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span aria-label="Connected" className="size-2 rounded-full bg-ok" />
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/settings?tab=integrations"
            className="glass-soft flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors hover:bg-white/10"
          >
            <Key className="size-4" aria-hidden="true" /> Manage API keys <ChevronRight className="size-4 text-muted" aria-hidden="true" />
          </Link>
        </Card>
      </div>

      <Card>
        <CardHead
          title="All testimonials"
          subtitle="Approve or reject before publishing"
          right={
            <Segmented
              label="Filter"
              hideLabel
              value={filter}
              onChange={(f) => router.push(href(f), { scroll: false })}
              options={[
                { value: 'all', label: 'All' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          }
        />
        <div className="mb-4 max-w-md">
          <SearchBox action="/dashboard/testimonials" q={q} keep={filter !== 'all' ? { status: filter.toLowerCase() } : undefined} placeholder="Search name, company, message or source" />
        </div>
        {total === 0 ? (
          <Empty
            icon={<MessageSquareQuote />}
            title="No feedback yet"
            body="Feedback sent by your connected projects lands here as pending. The Testimonials section on the site stays hidden until you approve one."
            action={
              <LinkButton href="/dashboard/settings?tab=integrations" variant="primary">
                Set up the MCP connection
              </LinkButton>
            }
          />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{q ? 'No testimonial matches your search.' : 'Nothing in this filter.'}</p>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    <th scope="col" className="pb-3 font-normal">Client</th>
                    <th scope="col" className="hidden pb-3 font-normal lg:table-cell">Message</th>
                    <th scope="col" className="pb-3 font-normal">Source</th>
                    <th scope="col" className="pb-3 font-normal">Rating</th>
                    <th scope="col" className="pb-3 font-normal">Status</th>
                    <th scope="col" className="pb-3 font-normal">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {rows.map((t) => (
                      <motion.tr key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/[0.07] align-middle">
                        <td className="py-3 pr-4">
                          <div className="flex min-w-0 items-center gap-3.5">
                            <Thumb>
                              <User />
                            </Thumb>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{t.name}</span>
                              <span className="mt-0.5 block truncate text-xs text-muted">{who(t)}</span>
                            </span>
                          </div>
                        </td>
                        <td className="hidden max-w-[360px] py-3 pr-4 text-muted lg:table-cell">
                          <p className="line-clamp-2">{t.message}</p>
                        </td>
                        <td className="py-3 pr-4 text-muted">{t.source}</td>
                        <td className="py-3 pr-4">
                          <Rating n={t.rating} />
                        </td>
                        <td className="py-3 pr-4">
                          <StatusDot status={t.status} />
                        </td>
                        <td className="py-3">{actions(t)}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((t) => (
                <li key={t.id} className="flex flex-col gap-3 rounded-2xl bg-black/25 p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
                  <div className="flex items-start gap-3">
                    <Thumb>
                      <User />
                    </Thumb>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{who(t)}</p>
                    </div>
                    <Rating n={t.rating} />
                  </div>
                  <p className="text-sm text-muted">{t.message}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <StatusDot status={t.status} />
                    <span>
                      via {t.source}, {relativeDay(t.createdAt).toLowerCase()}
                    </span>
                  </div>
                  {actions(t)}
                </li>
              ))}
            </ul>
          </>
        )}
        <Pager page={page} pages={pages} total={filtered} hrefFor={(n) => href(filter, n)} />
      </Card>
    </div>
  );
}
