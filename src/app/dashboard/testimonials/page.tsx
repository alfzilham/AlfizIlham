import { Check, FileText, MessageSquareQuote, Star } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { BarChart, HBars } from '@/components/dashboard/charts';
import { Card, CardHead, Kpi } from '@/components/dashboard/ui';
import { TestimonialManager } from '@/components/dashboard/testimonial-manager';

export const metadata = { title: 'Testimonials' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PAGE_SIZE = 20;
const STATUS = { pending: 'PENDING', approved: 'APPROVED', rejected: 'REJECTED' } as const;

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const { status, q: rawQ, page: rawPage } = await searchParams;
  const statusFilter = status && status in STATUS ? STATUS[status as keyof typeof STATUS] : undefined;
  const q = (rawQ ?? '').trim().slice(0, 80);
  const where: Prisma.TestimonialWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { role: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
            { message: { contains: q, mode: 'insensitive' } },
            { source: { contains: q, mode: 'insensitive' } },
            { project: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const filtered = await db.testimonial.count({ where });
  const pages = Math.max(1, Math.ceil(filtered / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1));

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const [items, total, byStatus, byRating, recent, avgRow, keys] = await Promise.all([
    db.testimonial.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.testimonial.count(),
    db.testimonial.groupBy({ by: ['status'], _count: { _all: true } }),
    db.testimonial.groupBy({ by: ['rating'], _count: { _all: true } }),
    db.testimonial.findMany({ where: { createdAt: { gte: months[0] } }, select: { createdAt: true } }),
    db.testimonial.aggregate({ where: { status: 'APPROVED' }, _avg: { rating: true } }),
    db.apiKey.findMany({ where: { revokedAt: null }, orderBy: { createdAt: 'asc' }, include: { _count: { select: { testimonials: true } } } }),
  ]);
  const count = (st: string) => byStatus.find((r) => r.status === st)?._count._all ?? 0;
  const approved = count('APPROVED');
  const pending = count('PENDING');
  const avg = avgRow._avg.rating ?? 0;
  const perMonth = months.map((m) => recent.filter((t) => t.createdAt.getFullYear() === m.getFullYear() && t.createdAt.getMonth() === m.getMonth()).length);
  const ratings = [5, 4, 3, 2, 1].map((r) => ({ name: `${r} star${r > 1 ? 's' : ''}`, value: byRating.find((x) => x.rating === r)?._count._all ?? 0 }));

  return (
    <TestimonialManager
      filter={statusFilter ?? 'all'}
      q={q}
      page={page}
      pages={pages}
      filtered={filtered}
      total={total}
      items={items.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        company: t.company,
        message: t.message,
        rating: t.rating,
        project: t.project,
        source: t.source,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      }))}
      connected={keys.map((k) => ({ id: k.id, project: k.project, count: k._count.testimonials }))}
      kpis={
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          <Kpi label="Total testimonials" value={String(total)} icon={<MessageSquareQuote />} />
          <Kpi label="Approved" value={String(approved)} icon={<Check />} />
          <Kpi label="Pending" value={String(pending)} icon={<FileText />} />
          <Kpi label="Average rating" value={avg ? `${avg.toFixed(1)}/5` : 'None yet'} icon={<Star />} />
        </div>
      }
      charts={[
        <Card key="received">
          <CardHead title="Testimonials received" subtitle="Received per month" />
          <BarChart labels={months.map((m) => MONTHS[m.getMonth()])} values={perMonth} summary={months.map((m, i) => `${MONTHS[m.getMonth()]} ${perMonth[i]}`).join(', ')} />
        </Card>,
        <Card key="ratings">
          <CardHead title="Rating distribution" subtitle="Across all testimonials" />
          <HBars rows={ratings} format={(n) => String(n)} />
        </Card>,
      ]}
    />
  );
}
