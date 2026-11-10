import { Check, FileText, MessageSquareQuote, Star } from 'lucide-react';
import { db } from '@/lib/db';
import { BarChart, HBars } from '@/components/dashboard/charts';
import { Card, CardHead, Kpi } from '@/components/dashboard/ui';
import { TestimonialManager } from '@/components/dashboard/testimonial-manager';

export const metadata = { title: 'Testimonials' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const [items, keys] = await Promise.all([
    db.testimonial.findMany({ orderBy: { createdAt: 'desc' } }),
    db.apiKey.findMany({ where: { revokedAt: null }, orderBy: { createdAt: 'asc' }, include: { _count: { select: { testimonials: true } } } }),
  ]);
  const approved = items.filter((t) => t.status === 'APPROVED');
  const pending = items.filter((t) => t.status === 'PENDING').length;
  const avg = approved.length ? approved.reduce((s, t) => s + t.rating, 0) / approved.length : 0;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const perMonth = months.map((m) => items.filter((t) => t.createdAt.getFullYear() === m.getFullYear() && t.createdAt.getMonth() === m.getMonth()).length);
  const ratings = [5, 4, 3, 2, 1].map((r) => ({ name: `${r} star${r > 1 ? 's' : ''}`, value: items.filter((t) => t.rating === r).length }));

  return (
    <TestimonialManager
      initialFilter={status === 'pending' ? 'PENDING' : 'all'}
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
          <Kpi label="Total testimonials" value={String(items.length)} icon={<MessageSquareQuote />} />
          <Kpi label="Approved" value={String(approved.length)} icon={<Check />} />
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
